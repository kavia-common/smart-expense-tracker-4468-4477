import request from 'supertest';
import app from '../src/app.js';

// Mock DB layer to avoid real Postgres during CI smoke tests
jest.unstable_mockModule('../src/db/pg.js', () => {
  return {
    query: jest.fn(async (sql, params) => {
      // Minimal in-memory behavior for transactions CRUD
      if (sql.startsWith('INSERT INTO public.transactions')) {
        return { rows: [{
          id: '00000000-0000-0000-0000-000000000001',
          ...paramsToTx(params)
        }] };
      }
      if (sql.startsWith('UPDATE public.transactions')) {
        return { rows: [{
          id: params.at(-1),
          // we don't simulate fields, just echo back
          updated: true
        }] };
      }
      if (sql.startsWith('DELETE FROM public.transactions')) {
        return { rowCount: 1 };
      }
      if (sql.includes('FROM public.transactions') && sql.includes('GROUP BY 1')) {
        return { rows: [{ period: '2024-01-01', income: 0, expense: 0 }] };
      }
      if (sql.includes('FROM public.transactions')) {
        return { rows: [] };
      }
      // budgets
      if (sql.startsWith('SELECT b.*')) {
        return { rows: [{ id: 'b1', user_id: 'u', category_id: 'c', month: '2024-01-01', limit_amount: 100, spent: 0 }] };
      }
      if (sql.startsWith('INSERT INTO public.budgets')) {
        return { rows: [{ id: 'b2', user_id: params[0], category_id: params[1], month: params[2], limit_amount: params[3] }] };
      }
      if (sql.startsWith('UPDATE public.budgets')) {
        return { rows: [{ id: params.at(-1) }] };
      }
      if (sql.startsWith('DELETE FROM public.budgets')) {
        return { rowCount: 1 };
      }
      // goals
      if (sql.startsWith('SELECT * FROM public.goals')) {
        return { rows: [] };
      }
      if (sql.startsWith('INSERT INTO public.goals')) {
        return { rows: [{ id: 'g1', user_id: params[0], name: params[1], target_amount: params[2], current_amount: params[3], target_date: params[4] }] };
      }
      if (sql.startsWith('UPDATE public.goals')) {
        return { rows: [{ id: params.at(-1) }] };
      }
      if (sql.startsWith('DELETE FROM public.goals')) {
        return { rowCount: 1 };
      }
      // reports
      if (sql.includes('FROM public.categories')) {
        return { rows: [{ categoryName: 'Food & Dining', total: 123.45, currency: 'USD' }] };
      }
      if (sql.includes('GROUP BY 1') && sql.includes("to_char(date_trunc('month'"))) {
        return { rows: [
          { period: '2025-01', income: 5500, expense: 3200, net: 2300 }
        ] };
      }
      return { rows: [] };
    })
  };
});

function paramsToTx(params) {
  const [user_id, account_id, category_id, amount, direction, description, transaction_date] = params;
  return { user_id, account_id, category_id, amount, direction, description, transaction_date };
}

describe('Health', () => {
  it('GET /health -> ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('Transactions basic flows', () => {
  it('GET /transactions with default pagination', async () => {
    const res = await request(app).get('/transactions');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /transactions with invalid body -> 400', async () => {
    const res = await request(app).post('/transactions').send({ foo: 'bar' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /transactions valid -> 201', async () => {
    const payload = {
      user_id: '11111111-1111-1111-1111-111111111111',
      amount: 12.34,
      direction: 'outflow',
      transaction_date: '2024-01-15'
    };
    const res = await request(app).post('/transactions').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.user_id).toBe(payload.user_id);
  });

  it('PUT /transactions/:id invalid id -> 400', async () => {
    const res = await request(app).put('/transactions/not-a-uuid').send({ amount: 99 });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE /transactions/:id -> 200', async () => {
    const res = await request(app).delete('/transactions/00000000-0000-0000-0000-000000000001');
    expect(res.statusCode).toBe(200);
    expect(res.body.deleted).toBe(1);
  });

  it('GET /transactions/summary default -> 200', async () => {
    const res = await request(app).get('/transactions/summary');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Budgets and Goals endpoints responses', () => {
  it('GET /budgets -> 200', async () => {
    const res = await request(app).get('/budgets');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body[0]) {
      expect(typeof res.body[0].budget_overrun).toBe('boolean');
    }
  });

  it('POST /goals invalid -> 400', async () => {
    const res = await request(app).post('/goals').send({ name: '' });
    expect(res.statusCode).toBe(400);
  });

  it('GET /reports/spending-by-category -> 200 and items', async () => {
    const res = await request(app).get('/reports/spending-by-category');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body[0]) {
      expect(res.body[0]).toHaveProperty('categoryName');
      expect(res.body[0]).toHaveProperty('total');
      expect(res.body[0]).toHaveProperty('currency');
    }
  });

  it('GET /reports/spending-by-category with quarter range and pagination -> 200', async () => {
    const res = await request(app).get('/reports/spending-by-category?range=quarter&limit=10&offset=0');
    expect(res.statusCode).toBe(200);
  });

  it('GET /reports/spending-by-category invalid range -> 400', async () => {
    const res = await request(app).get('/reports/spending-by-category?range=year');
    expect(res.statusCode).toBe(400);
  });

  it('GET /reports/income-vs-expense -> 200 and list', async () => {
    const res = await request(app).get('/reports/income-vs-expense');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body[0]) {
      expect(res.body[0]).toHaveProperty('period');
      expect(res.body[0]).toHaveProperty('income');
      expect(res.body[0]).toHaveProperty('expense');
      expect(res.body[0]).toHaveProperty('net');
    }
  });

  it('GET /reports/income-vs-expense with from/to -> 200', async () => {
    const res = await request(app).get('/reports/income-vs-expense?from=2025-01-01&to=2025-02-01');
    expect(res.statusCode).toBe(200);
  });

  it('GET /reports/income-vs-expense invalid range -> 400', async () => {
    const res = await request(app).get('/reports/income-vs-expense?range=week');
    expect(res.statusCode).toBe(400);
  });

  it('GET /reports/alerts -> 200 []', async () => {
    const res = await request(app).get('/reports/alerts');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
