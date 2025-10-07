import db from '../db/pg.js';

/**
 * PUBLIC_INTERFACE
 * listAccounts - Return accounts for the authenticated user
 */
export async function listAccounts(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const sql = `
      SELECT id, institution, account_name, last4, type, balance, currency
      FROM accounts
      WHERE user_id = $1
      ORDER BY account_name ASC
    `;
    const result = await db.query(sql, [userId]);
    return res.json(result.rows);
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
