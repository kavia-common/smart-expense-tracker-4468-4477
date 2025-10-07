import jwt from 'jsonwebtoken';

/**
 * PUBLIC_INTERFACE
 * authMiddleware - Express middleware to verify Bearer JWT using HS256 and attach req.user
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch (_err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export default authMiddleware;
