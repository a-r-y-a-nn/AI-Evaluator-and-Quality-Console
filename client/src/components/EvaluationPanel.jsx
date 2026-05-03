import { useEffect, useState } from 'react';

const criteria = ['accuracy', 'relevance', 'coherence', 'safety'];

export function EvaluationPanel({ task, submitting, onSubmit }) {
  const [form, setForm] = useState({
    accuracy: 4,
    relevance: 4,
    coherence: 4,
    safety: 4,
    winner: 'response_b',
    notes: '',
  });

  useEffect(() => {
    setForm({
      accuracy: 4,
      relevance: 4,
      coherence: 4,
      safety: 4,
      winner: 'response_a',
      notes: '',
    });
  }, [task?.id]);

  if (!task) {
    return <section className="empty-state">Select a task to start evaluating prompt-response quality.</section>;
  }

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <section className="evaluation-panel">
      <div className="prompt-block">
        <span className={`priority ${task.priority}`}>{task.priority}</span>
        <h2>{task.domain}</h2>
        <p>{task.prompt}</p>
        <div className="guideline"><strong>Guideline:</strong> {task.guideline}</div>
      </div>

      <div className="responses-grid">
        <article>
          <span>Response A</span>
          <p>{task.response_a}</p>
        </article>
        <article>
          <span>Response B</span>
          <p>{task.response_b}</p>
        </article>
      </div>

      <form
        className="score-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(task.id, form);
        }}
      >
        <div className="criteria-grid">
          {criteria.map((criterion) => (
            <label key={criterion}>
              <span>{criterion}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={form[criterion]}
                onChange={(event) => update(criterion, Number(event.target.value))}
              />
              <b>{form[criterion]}/5</b>
            </label>
          ))}
        </div>

        <label className="winner-row">
          Winning answer
          <select value={form.winner} onChange={(event) => update('winner', event.target.value)}>
            <option value="response_a">Response A</option>
            <option value="response_b">Response B</option>
            <option value="tie">Both</option>
          </select>
        </label>

        <label className="notes-row">
          Decision notes
          <textarea
            value={form.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="Explain the Instruction-based reason for your decision..."
            rows="4"
          />
        </label>

        <button className="primary-button" disabled={submitting || task.evaluation_id}>
          {task.evaluation_id ? 'Already evaluated' : submitting ? 'Submitting...' : 'Submit evaluation'}
        </button>
      </form>
    </section>
  );
}
