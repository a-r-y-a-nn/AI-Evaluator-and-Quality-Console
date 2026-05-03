import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db.js';
import { HttpError } from './error.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(new HttpError(401, 'Missing authorization token.'));

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.sub);
    if (!user) return next(new HttpError(401, 'User no longer exists.'));
    req.user = user;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token.'));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission for this action.'));
    next();
  };
}
