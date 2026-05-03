# AI Evaluator and Quality Console

A full-stack LLM evaluation operations demo for post-training workflows. Evaluators can generate two model responses from a user prompt, compare Response A and Response B, score them with a rubric, and save the result as preference-style training data.

## Features

- JWT login with seeded evaluator accounts
- Four evaluation queues: Healthcare Safety, Policy Evaluation, Financial Reasoning, Code Helpfulness
- OpenAI-powered generation of Response A and Response B
- Rubric scoring for accuracy, relevance, coherence, and safety
- Winner selection: Response A, Response B, or tie
- SQLite persistence for users, tasks, and evaluations
- Training-data export with chosen and rejected responses
- Dashboard metrics for completed/open tasks and quality score

## Tech Stack

- Frontend: React, Vite, JavaScript, CSS
- Backend: Node.js, Express
- Database: SQLite using Node's built-in `node:sqlite`
- Auth: JWT and bcrypt password hashing
- AI: OpenAI Responses API
- Validation: Zod

## Demo Accounts

```text
Evaluator
email: evaluator@demo.com
password: Password123!

Quality Lead
email: lead@demo.com
password: Password123!
```

## Project Structure

```text
.
+-- client/
|   +-- src/
|   |   +-- components/
|   |   +-- services/
|   |   +-- styles/
|   |   +-- App.jsx
|   |   +-- main.jsx
|   +-- .env.example
|   +-- package.json
|   +-- vercel.json
+-- server/
|   +-- src/
|   |   +-- data/
|   |   +-- middleware/
|   |   +-- routes/
|   |   +-- config.js
|   |   +-- db.js
|   |   +-- index.js
|   +-- .env.example
|   +-- package.json
+-- render.yaml
+-- package.json
+-- README.md
```

## Local Setup

Install dependencies:

```bash
npm run install:all
```

Create env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Set your server env values:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
DB_PATH=./src/data/evalops.db
OPENAI_API_KEY=replace-with-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

Run both apps:

```bash
npm run dev
```

On Windows PowerShell, use:

```powershell
.\run-dev.ps1
```

Open:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000/api/health
API Docs: http://localhost:5000/api/docs
```

## Main Workflow

1. Login as an evaluator.
2. Choose one queue type.
3. Enter a user prompt.
4. The backend calls OpenAI and generates Response A and Response B.
5. The generated pair is saved as a task in SQLite.
6. The evaluator selects the better response and gives rubric scores.
7. The evaluation is saved as training data.

## API Endpoints

Public:

```http
GET /api/health
GET /api/docs
POST /api/auth/login
```

Protected with `Authorization: Bearer <token>`:

```http
GET /api/auth/me
GET /api/tasks
GET /api/tasks/:id
POST /api/tasks/generate
POST /api/tasks/:id/evaluations
GET /api/evaluations
GET /api/evaluations/training-data
GET /api/metrics
```

Generate responses:

```http
POST /api/tasks/generate
```

```json
{
  "domain": "Code Helpfulness",
  "prompt": "Explain why my Express route receives undefined req.body."
}
```

Submit evaluation:

```http
POST /api/tasks/1/evaluations
```

```json
{
  "accuracy": 5,
  "relevance": 5,
  "coherence": 4,
  "safety": 5,
  "winner": "response_b",
  "notes": "Response B gives clearer and safer debugging steps."
}
```

## Database

SQLite file:

```text
server/src/data/evalops.db
```

Tables:

```text
users
tasks
evaluations
```

The database file is ignored by Git. It is created automatically when the server starts.

## Deployment

Recommended live demo setup:

- Backend: Render
- Frontend: Vercel
- Source code: GitHub

### Backend on Render

1. Push this repository to GitHub.
2. In Render, create a new Blueprint or Web Service from the repo.
3. Use the included `render.yaml`, or set:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Set backend environment variables:

```env
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
JWT_SECRET=generate-a-long-random-secret
DB_PATH=./src/data/evalops.db
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
NODE_VERSION=24
```

5. After deploy, test:

```text
https://your-render-service.onrender.com/api/health
```

### Frontend on Vercel

1. Import the same GitHub repo in Vercel.
2. Set Root Directory to `client`.
3. Vercel should use:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Set frontend environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

5. Redeploy the frontend.
6. Update Render `CLIENT_ORIGIN` to the final Vercel URL and redeploy the backend.

## Security Notes

- Never commit `server/.env`.
- Never expose `OPENAI_API_KEY` in frontend code.
- If an API key was pasted publicly, revoke it and create a new one.
- SQLite is good for a lightweight demo. For production multi-user usage, migrate to PostgreSQL.

## Assignment Talking Points

- Built a full-stack AI evaluation workflow.
- Generated dynamic A/B model responses from user prompts.
- Collected rubric scores and winner labels.
- Stored chosen/rejected examples for training data.
- Used protected API routes and JWT authentication.
- Kept OpenAI secrets on the backend only.
