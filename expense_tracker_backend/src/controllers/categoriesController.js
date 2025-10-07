import { z } from 'zod';
import { query } from '../db/pg.js';

// Query validation schema for categories listing
const listQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  user_id: z.string().uuid().optional(),
  include_defaults: z.coerce.boolean().optional() // when true, include global defaults (user_id NULL)
});

/**
 * PUBLIC_INTERFACE
 * listCategories - returns categories optionally filtered by type and/or user, ordered by name asc.
 * Query params:
 *  - type: 'income' | 'expense' (optional)
 *  - user_id: UUID of user (optional)
 *  - include_defaults: boolean (optional; default true if user_id is provided)
 */
export async function listCategories(req, res, next) {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() });
    const { type, user_id, include_defaults } = parsed.data;

    const clauses = [];
    const params = [];
    let i = 1;

    // Filter by type if provided
    if (type) {
      clauses.push(`c.type = $${i++}`);
      params.push(type);
    }

    // Determine user/default logic
    // If user_id present and include_defaults !== false -> include both the user's categories and defaults
    // Else if user_id present and include_defaults === false -> only user's categories
    // Else if no user_id -> include global defaults only
    if (user_id) {
      if (include_defaults === false) {
        clauses.push(`c.user_id = $${i++}`);
        params.push(user_id);
      } else {
        // include both
        clauses.push(`(c.user_id = $${i++} OR c.user_id IS NULL)`);
        params.push(user_id);
      }
    } else {
      clauses.push('c.user_id IS NULL');
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `
      SELECT c.id, c.user_id, c.name, c.type, c.icon, c.is_default
      FROM public.categories c
      ${where}
      ORDER BY c.name ASC
    `;
    const r = await query(sql, params);
    res.json(r.rows || []);
  } catch (e) {
    next(e);
  }
}
