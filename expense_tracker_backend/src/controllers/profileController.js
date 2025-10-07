import { z } from 'zod';
import db from '../db/pg.js';

const updateProfileSchema = z.object({
  name: z.string().min(1),
  notificationPreferences: z.record(z.any()).optional(),
});

// PUBLIC_INTERFACE
// getProfile - Get current user's profile
export async function getProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const sql = `
      SELECT id, email, name, notification_preferences
      FROM users
      WHERE id = $1
      LIMIT 1
    `;
    const result = await db.query(sql, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const row = result.rows[0];
    return res.json({
      id: row.id,
      email: row.email,
      name: row.name,
      notification_preferences: row.notification_preferences || {},
    });
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUBLIC_INTERFACE
// updateProfile - Update current user's profile
export async function updateProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const { name, notificationPreferences } = parsed.data;

    const sql = `
      UPDATE users
      SET name = $2,
          notification_preferences = COALESCE($3::jsonb, notification_preferences),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, name, notification_preferences
    `;
    const result = await db.query(sql, [
      userId,
      name,
      notificationPreferences ? JSON.stringify(notificationPreferences) : null,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const row = result.rows[0];
    return res.json({
      id: row.id,
      email: row.email,
      name: row.name,
      notification_preferences: row.notification_preferences || {},
    });
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
