# Vercel Deployment Guide

This project is configured to deploy both frontend and backend to Vercel as a monorepo.

## Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`)
- GitHub account with this repository pushed
- OpenAI API key for LLM responses

## Deployment Steps

### 1. Connect Your Repository to Vercel

Option A: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration

Option B: Using Vercel CLI
```bash
vercel
```
Follow the prompts to connect your repository.

### 2. Configure Environment Variables

In the Vercel dashboard for your project, go to Settings → Environment Variables and add:

**For Backend (Server):**
- `CLIENT_ORIGIN`: Your frontend URL (e.g., `https://your-project.vercel.app`)
- `JWT_SECRET`: A long random string for JWT signing (generate one with: `openssl rand -base64 32`)
- `DB_PATH`: `./src/data/evalops.db`
- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_MODEL`: `gpt-4o-mini`

**For Frontend (Client):**
- `VITE_API_URL`: Your backend API URL (e.g., `https://your-project.vercel.app/api`)

### 3. Deploy

```bash
# Deploy with Vercel CLI
vercel --prod

# Or push to GitHub and auto-deploy from Vercel
git push origin main
```

## Monorepo Structure

The project uses Vercel's monorepo support:
- `/client` - React frontend (built with Vite)
- `/server` - Node.js Express backend (serverless functions)
- `/vercel.json` - Root configuration routing requests between frontend and backend

## Important Notes

### Database Persistence
SQLite databases stored in Vercel's `/tmp` directory are **ephemeral** and cleared between deployments. For production:
- Use a persistent database (PostgreSQL, MongoDB, etc.)
- Or implement daily backups to external storage

### File Storage
- Max function execution time: 60 seconds (Hobby) or 900 seconds (Pro)
- Temporary storage: `/tmp` (cleared between requests)

### Cost Considerations
- Vercel Hobby tier: Free for frontend + serverless functions
- Function invocations included in free tier

## Troubleshooting

### Build Fails
```bash
# Check logs in Vercel dashboard or CLI
vercel logs
```

### API Not Responding
1. Verify environment variables are set in Vercel dashboard
2. Check that `CLIENT_ORIGIN` matches your frontend URL
3. Review function logs: Dashboard → Deployments → Function Logs

### CORS Errors
Update the `CLIENT_ORIGIN` environment variable to match your frontend domain.

## Local Testing

Before deploying, test locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Run development server
npm run dev

# Test with Vercel locally (simulates production)
vercel dev
```

## Database Migration to Production

To use a persistent database instead of SQLite:

1. Replace `db.js` to use a cloud database (PostgreSQL, MongoDB, etc.)
2. Update `DB_PATH` environment variable or database URL
3. Run migrations before deployment

Example for PostgreSQL:
```javascript
// server/src/db-postgres.js
import pg from 'pg';

export const initDb = async () => {
  const client = new pg.Client(process.env.DATABASE_URL);
  await client.connect();
  return client;
};
```

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Node.js on Vercel](https://vercel.com/docs/concepts/functions/serverless-functions/node)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
