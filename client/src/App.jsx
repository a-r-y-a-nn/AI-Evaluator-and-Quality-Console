import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, LogOut, Sparkles } from 'lucide-react';
import { api } from './services/api.js';
import { MetricsGrid } from './components/MetricsGrid.jsx';
import { TaskList } from './components/TaskList.jsx';
import { EvaluationPanel } from './components/EvaluationPanel.jsx';

const demoCredentials = {
  email: 'evaluator@demo.com',
  password: 'Password123!',
};

const evaluationDomains = [
  'Healthcare Safety',
  'Policy Evaluation',
  'Financial Reasoning',
  'Code Helpfulness',
];

export default function App() {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem('evalops-auth');
    return raw ? JSON.parse(raw) : null;
  });
  const [loginForm, setLoginForm] = useState(demoCredentials);
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [generationForm, setGenerationForm] = useState({ domain: 'Code Helpfulness', prompt: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedId) || tasks.find((task) => !task.evaluation_id) || tasks[0],
    [tasks, selectedId]
  );

  async function loadWorkspace(token = auth?.token) {
    if (!token) return;
    setStatus((current) => ({ ...current, loading: true, error: '' }));

    try {
      const [taskData, metricData, evaluationData] = await Promise.all([
        api('/tasks', { token }),
        api('/metrics', { token }),
        api('/evaluations', { token }),
      ]);

      setTasks(taskData.tasks);
      setMetrics(metricData.metrics);
      setEvaluations(evaluationData.evaluations);
      if (!selectedId && taskData.tasks.length) setSelectedId(taskData.tasks[0].id);
      setStatus((current) => ({ ...current, loading: false }));
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, [auth?.token]);

  async function handleLogin(event) {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });
      localStorage.setItem('evalops-auth', JSON.stringify(data));
      setAuth(data);
      setStatus({ loading: false, error: '', success: 'Signed in. Evaluation queue loaded.' });
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  }

  async function handleSubmit(taskId, form) {
    setSubmitting(true);
    setStatus({ loading: false, error: '', success: '' });

    try {
      await api(`/tasks/${taskId}/evaluations`, {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify(form),
      });
      setStatus({ loading: false, error: '', success: 'Evaluation submitted and metrics refreshed.' });
      await loadWorkspace(auth.token);
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateTask(event) {
    event.preventDefault();
    setGenerating(true);
    setStatus({ loading: false, error: '', success: '' });

    try {
      const data = await api('/tasks/generate', {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify(generationForm),
      });
      setTasks((current) => [data.task, ...current]);
      setSelectedId(data.task.id);
      setGenerationForm((current) => ({ ...current, prompt: '' }));
      setStatus({ loading: false, error: '', success: 'Generated two responses. Review the new task and choose the better answer.' });
      await loadWorkspace(auth.token);
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' });
    } finally {
      setGenerating(false);
    }
  }

  function logout() {
    localStorage.removeItem('evalops-auth');
    setAuth(null);
    setTasks([]);
    setMetrics(null);
    setEvaluations([]);
  }

  if (!auth) {
    return (
      <main className="login-page">
        <section className="hero-card">
          <div className="brand-mark"><BrainCircuit size={32} /></div>
          <p className="eyebrow">Full-stack assignment demo</p>
          <h1>LLM Evaluation Ops for post-training teams</h1>
          <p className="hero-copy">
            A compact workflow for RLHF/SFT-style response evaluation, rubric scoring, quality review, and operational metrics.
          </p>
        </section>

        <form className="login-card" onSubmit={handleLogin}>
          <h2>Evaluator Login</h2>
          <p>Use the seeded demo account to explore the live workflow.</p>
          <label>Email<input value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} /></label>
          <label>Password<input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} /></label>
          {status.error && <div className="alert error">{status.error}</div>}
          <button className="primary-button" disabled={status.loading}>{status.loading ? 'Signing in...' : 'Sign in'}</button>
          <small>Demo: evaluator@demo.com / Password123!</small>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow"> AI Evaluator and Operations</p>
          <h1>AI Evaluator and Quality Console</h1>
        </div>
        <div className="user-pill">
          <span>{auth.user.name}</span>
          <button onClick={logout}><LogOut size={16} /> Logout</button>
        </div>
      </header>

      {metrics && <MetricsGrid metrics={metrics} />}
      {status.error && <div className="alert error">{status.error}</div>}
      {status.success && <div className="alert success">{status.success}</div>}

      <form className="generator-panel" onSubmit={handleGenerateTask}>
        <div>
          <div className="section-title">
            <span>Generate Evaluation Pair</span>
            <Sparkles size={18} />
          </div>
          <p>Choose a queue type and enter the user prompt. OpenAI creates Response A and B, then the evaluator label becomes training data.</p>
        </div>
        <label>
          Queue type
          <select
            value={generationForm.domain}
            onChange={(event) => setGenerationForm({ ...generationForm, domain: event.target.value })}
          >
            {evaluationDomains.map((domain) => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </label>
        <label>
          User input
          <textarea
            value={generationForm.prompt}
            onChange={(event) => setGenerationForm({ ...generationForm, prompt: event.target.value })}
            placeholder="Ask a question or describe the user request to generate two responses..."
            rows="3"
          />
        </label>
        <button className="primary-button" disabled={generating || generationForm.prompt.trim().length < 12}>
          {generating ? 'Generating...' : 'Generate responses'}
        </button>
      </form>

      <div className="workspace-grid">
        <TaskList tasks={tasks} selectedTask={selectedTask} onSelect={(task) => setSelectedId(task.id)} />
        <EvaluationPanel task={selectedTask} submitting={submitting} onSubmit={handleSubmit} />
      </div>

      <section className="review-feed">
        <div className="section-title">
          <span>Recent Quality Reviews</span>
          <b>{evaluations.length} submitted</b>
        </div>
        {evaluations.slice(0, 5).map((evaluation) => (
          <article key={evaluation.id}>
            <strong>{evaluation.domain}</strong>
            <span>{evaluation.evaluator_name} selected {evaluation.winner.replace('_', ' ')}</span>
            <p>{evaluation.notes}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
