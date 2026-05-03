import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { db } from '../db.js';
import { HttpError } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const evaluationSchema = z.object({
  accuracy: z.number().int().min(1).max(5),
  relevance: z.number().int().min(1).max(5),
  coherence: z.number().int().min(1).max(5),
  safety: z.number().int().min(1).max(5),
  winner: z.enum(['response_a', 'response_b', 'tie']),
  notes: z.string().min(12).max(1200),
});

const evaluationDomains = [
  'Healthcare Safety',
  'Policy Evaluation',
  'Financial Reasoning',
  'Code Helpfulness',
];

const generateTaskSchema = z.object({
  prompt: z.string().trim().min(12).max(2000),
  domain: z.enum(evaluationDomains).default('Code Helpfulness'),
});

const generatedTaskFormat = {
  type: 'json_schema',
  name: 'generated_evaluation_task',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      domain: { type: 'string' },
      prompt: { type: 'string' },
      response_a: { type: 'string' },
      response_b: { type: 'string' },
      guideline: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
    required: ['domain', 'prompt', 'response_a', 'response_b', 'guideline', 'priority'],
    additionalProperties: false,
  },
};

function extractOutputText(response) {
  if (response.output_text) return response.output_text;

  return response.output
    ?.flatMap((item) => item.content || [])
    .filter((content) => content.type === 'output_text' && content.text)
    .map((content) => content.text)
    .join('\n');
}

async function createOpenAiEvaluationTask({ prompt, domain }) {
  if (!config.openaiApiKey) {
    throw new HttpError(500, 'OPENAI_API_KEY is not configured on the server.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openaiModel,
      instructions: [
        'Create an LLM evaluation task for a human reviewer.',
        'Return JSON only in the requested schema.',
        'Generate two different candidate answers to the user prompt.',
        'Make both responses plausible, but include meaningful quality differences so a reviewer can choose the better answer.',
        'Do not include unsafe instructions. For unsafe user prompts, make the safer answer refuse and redirect appropriately.',
      ].join(' '),
      input: `Domain: ${domain}\nUser prompt to answer: ${prompt}`,
      text: { format: generatedTaskFormat },
      max_output_tokens: 1200,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new HttpError(response.status, payload.error?.message || 'OpenAI request failed.');
  }

  const outputText = extractOutputText(payload);
  if (!outputText) throw new HttpError(502, 'OpenAI returned an empty response.');

  return generatedTaskSchema.extend({
    response_a: z.string().min(1),
    response_b: z.string().min(1),
    guideline: z.string().min(1),
    priority: z.enum(['low', 'medium', 'high']),
  }).parse(JSON.parse(outputText));
}

router.get('/', requireAuth, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, e.id AS evaluation_id
    FROM tasks t
    LEFT JOIN evaluations e ON e.task_id = t.id AND e.user_id = ?
    ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.created_at DESC
  `).all(req.user.id);

  res.json({ tasks });
});

router.post('/generate', requireAuth, async (req, res, next) => {
  try {
    const body = generateTaskSchema.parse(req.body);
    const generated = await createOpenAiEvaluationTask(body);

    const insert = db.prepare(`
      INSERT INTO tasks (domain, prompt, response_a, response_b, guideline, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      generated.domain.trim(),
      generated.prompt.trim(),
      generated.response_a.trim(),
      generated.response_b.trim(),
      generated.guideline.trim(),
      generated.priority
    );

    const task = db.prepare('SELECT *, NULL AS evaluation_id FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ task });
  } catch (error) {
    next(error.name === 'ZodError' ? new HttpError(400, 'Enter a prompt of at least 12 characters.') : error);
  }
});

router.get('/:id', requireAuth, (req, res, next) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return next(new HttpError(404, 'Task not found.'));
  res.json({ task });
});

router.post('/:id/evaluations', requireAuth, (req, res, next) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) throw new HttpError(404, 'Task not found.');

    const existing = db.prepare('SELECT id FROM evaluations WHERE task_id = ? AND user_id = ?').get(task.id, req.user.id);
    if (existing) throw new HttpError(409, 'You have already evaluated this task.');

    const body = evaluationSchema.parse(req.body);

    const insert = db.prepare(`
      INSERT INTO evaluations (task_id, user_id, accuracy, relevance, coherence, safety, winner, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      task.id,
      req.user.id,
      body.accuracy,
      body.relevance,
      body.coherence,
      body.safety,
      body.winner,
      body.notes.trim()
    );

    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('completed', task.id);
    const evaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ evaluation });
  } catch (error) {
    next(error.name === 'ZodError' ? new HttpError(400, 'Scores must be 1-5 and notes must explain the decision.') : error);
  }
});

export default router;
