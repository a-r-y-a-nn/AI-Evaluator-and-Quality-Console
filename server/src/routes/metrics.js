import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const taskStats = db.prepare(`
    SELECT
      COUNT(*) AS total_tasks,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
      SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) AS high_priority_tasks
    FROM tasks
  `).get();

  const scoreStats = db.prepare(`
    SELECT
      ROUND(AVG((accuracy + relevance + coherence + safety) / 4.0), 2) AS avg_quality_score,
      COUNT(*) AS total_evaluations
    FROM evaluations
  `).get();

  const byDomain = db.prepare(`
    SELECT t.domain, COUNT(e.id) AS evaluations
    FROM tasks t
    LEFT JOIN evaluations e ON e.task_id = t.id
    GROUP BY t.domain
    ORDER BY evaluations DESC, t.domain ASC
  `).all();

  res.json({
    metrics: {
      totalTasks: taskStats.total_tasks || 0,
      completedTasks: taskStats.completed_tasks || 0,
      openTasks: (taskStats.total_tasks || 0) - (taskStats.completed_tasks || 0),
      highPriorityTasks: taskStats.high_priority_tasks || 0,
      totalEvaluations: scoreStats.total_evaluations || 0,
      avgQualityScore: scoreStats.avg_quality_score || 0,
      byDomain,
    },
  });
});

export default router;
