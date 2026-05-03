import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { db } from '../db.js';
import { HttpError } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '8h' });
}

router.post('/login', (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(body.email.toLowerCase());

    if (!user || !bcrypt.compareSync(body.password, user.password_hash)) {
      throw new HttpError(401, 'Invalid email or password.');
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    next(error.name === 'ZodError' ? new HttpError(400, 'Enter a valid email and password.') : error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
