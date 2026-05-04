import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { config } from './config.js';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import evaluationRoutes from './routes/evaluations.js';
import metricRoutes from './routes/metrics.js';
import { errorHandler, notFound } from './middleware/error.js';

initDb();

const app = express();

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'Ethara EvalOps API' });
});

app.get('/api/docs', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AI EvalOps API Docs</title>
        <style>
          body {
            margin: 0;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: #172019;
            background: linear-gradient(135deg, #fbf7ed, #e7f0df);
          }
          main { width: min(980px, calc(100% - 32px)); margin: 0 auto; padding: 48px 0; }
          h1 { font-size: clamp(2rem, 5vw, 4rem); line-height: 0.95; margin: 0 0 12px; }
          p { color: #667065; line-height: 1.6; }
          section {
            background: rgba(255, 252, 244, 0.86);
            border: 1px solid rgba(23, 32, 25, 0.12);
            border-radius: 24px;
            padding: 24px;
            margin: 18px 0;
            box-shadow: 0 18px 60px rgba(42, 35, 20, 0.12);
          }
          code, pre {
            background: #172019;
            color: #f8f3e8;
            border-radius: 12px;
          }
          code { padding: 3px 7px; }
          pre { padding: 16px; overflow: auto; }
          .endpoint {
            display: grid;
            gap: 8px;
            padding: 16px 0;
            border-top: 1px solid rgba(23, 32, 25, 0.1);
          }
          .endpoint:first-child { border-top: 0; }
          .method {
            display: inline-block;
            min-width: 58px;
            margin-right: 8px;
            color: white;
            background: #1d7d5b;
            border-radius: 999px;
            padding: 4px 10px;
            text-align: center;
            font-weight: 800;
            font-size: 0.8rem;
          }
          .post { background: #2f5f9e; }
        </style>
      </head>
      <body>
        <main>
          <h1>AI EvalOps API</h1>
          <p>Browser-friendly API overview for the LLM evaluation operations demo.</p>

          <section>
            <h2>Base URL</h2>
            <pre>http://localhost:${config.port}/api</pre>
            <p>Protected routes require this header:</p>
            <pre>Authorization: Bearer YOUR_TOKEN</pre>
          </section>

          <section>
            <h2>Demo Login</h2>
            <pre>{
  "email": "evaluator@demo.com",
  "password": "Password123!"
}</pre>
          </section>

          <section>
            <h2>Endpoints</h2>
            <div class="endpoint">
              <strong><span class="method">GET</span> /api/health</strong>
              <p>Check whether the API server is running.</p>
            </div>
            <div class="endpoint">
              <strong><span class="method post">POST</span> /api/auth/login</strong>
              <p>Login and receive a JWT token.</p>
            </div>
            <div class="endpoint">
              <strong><span class="method">GET</span> /api/auth/me</strong>
              <p>Return the current authenticated user.</p>
            </div>
            <div class="endpoint">
              <strong><span class="method">GET</span> /api/tasks</strong>
              <p>List prompt-response evaluation tasks.</p>
            </div>
            <div class="endpoint">
              <strong><span class="method">GET</span> /api/tasks/:id</strong>
              <p>Get one evaluation task by id.</p>
            </div>
            <div class="endpoint">
              <strong><span class="method post">POST</span> /api/tasks/:id/evaluations</strong>
              <p>Submit rubric scores and decision notes for a task.</p>
              <pre>{
  "accuracy": 5,
  "relevance": 5,
  "coherence": 4,
  "safety": 5,
  "winner": "response_b",
  "notes": "Response B follows the safety guideline and escalates urgent symptoms appropriately."
}</pre>
            </div>
            <div class="endpoint">
              <strong><span class="method">GET</span> /api/evaluations</strong>
              <p>List submitted evaluations with evaluator and task context.</p>
            </div>
            <div class="endpoint">
              <strong><span class="method">GET</span> /api/metrics</strong>
              <p>Return dashboard metrics for evaluation operations.</p>
            </div>
          </section>
        </main>
      </body>
    </html>
  `);
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/metrics', metricRoutes);
app.use(notFound);
app.use(errorHandler);

const isServerless = Boolean(process.env.VERCEL);

if (!isServerless) {
  app.listen(config.port, () => {
    console.log(`EvalOps API running on http://localhost:${config.port}`);
  });
}

export default app;
