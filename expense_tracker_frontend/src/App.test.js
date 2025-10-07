import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { getApi } from './api/client';

test('renders dashboard heading by default route', () => {
  render(<App />);
  const heading = screen.getByText(/Dashboard/i);
  expect(heading).toBeInTheDocument();
});

test('api client exposes baseURL and mock flag', () => {
  const api = getApi();
  // If no env is set in test, it should be mock mode
  expect(typeof api.isMock).toBe('boolean');
  expect(api.baseURL === '' || typeof api.baseURL === 'string').toBeTruthy();
});

test('dashboard shows loading states and then charts/insights placeholders', async () => {
  render(<App />);
  // Loading indicators
  expect(screen.getAllByText(/Loading...|Checking API/i).length).toBeGreaterThan(0);
  // Wait for mock data to populate
  await waitFor(() => {
    expect(screen.getByText(/Spending by Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Income vs Expense/i)).toBeInTheDocument();
  });
  // Insight cards show present
  expect(screen.getByText(/Net \(current period\)/i)).toBeInTheDocument();
});
