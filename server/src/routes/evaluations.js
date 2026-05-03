import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const evaluations = db.prepare(`
    SELECT e.*, t.domain, t.prompt, u.name AS evaluator_name
    FROM evaluations e
    JOIN tasks t ON t.id = e.task_id
    JOIN users u ON u.id = e.user_id
    ORDER BY e.created_at DESC
  `).all();

  res.json({ evaluations });
});

router.get('/training-data', requireAuth, (req, res) => {
  const examples = db.prepare(`
    SELECT
      e.id AS evaluation_id,
      t.id AS task_id,
      t.domain,
      t.prompt,
      t.guideline,
      CASE
        WHEN e.winner = 'response_a' THEN t.response_a
        WHEN e.winner = 'response_b' THEN t.response_b
        ELSE NULL
      END AS chosen_response,
      CASE
        WHEN e.winner = 'response_a' THEN t.response_b
        WHEN e.winner = 'response_b' THEN t.response_a
        ELSE NULL
      END AS rejected_response,
      t.response_a,
      t.response_b,
      e.winner,
      e.accuracy,
      e.relevance,
      e.coherence,
      e.safety,
      e.notes,
      e.created_at
    FROM evaluations e
    JOIN tasks t ON t.id = e.task_id
    ORDER BY e.created_at DESC
  `).all();

  res.json({ examples });
});

export default router;
