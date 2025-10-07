import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/pg.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// PUBLIC_INTERFACE
// register - Register a new user; returns minimal user object
export async function register(req, res) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const { email, password, name } = parsed.data;

    // Unique email
    const existing = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertSql = `
      INSERT INTO users (email, password_hash, name, notification_preferences)
      VALUES ($1, $2, $3, COALESCE($4::jsonb, '{}'::jsonb))
      RETURNING id, email, name, notification_preferences
    `;
    const result = await db.query(insertSql, [email, passwordHash, name, JSON.stringify({})]);
    const user = result.rows[0];

    return res.status(201).json({ user });
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUBLIC_INTERFACE
// login - Verify credentials and return { token, user }
export async function login(req, res) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;

    const userSql = `
      SELECT id, email, name, password_hash, notification_preferences
      FROM users
      WHERE email = $1
      LIMIT 1
    `;
    const result = await db.query(userSql, [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const userRow = result.rows[0];
    const match = await bcrypt.compare(password, userRow.password_hash || '');
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    const token = jwt.sign({ id: userRow.id, email: userRow.email }, secret, {
      algorithm: 'HS256',
      expiresIn,
    });

    const user = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      notification_preferences: userRow.notification_preferences || {},
    };

    return res.status(200).json({ token, user });
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
