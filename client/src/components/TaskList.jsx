export function TaskList({ tasks, selectedTask, onSelect }) {
  return (
    <aside className="task-list">
      <div className="section-title">
        <span>Evaluation Queue</span>
        <b>{tasks.filter((task) => !task.evaluation_id).length} open</b>
      </div>

      {tasks.map((task) => (
        <button
          className={`task-card ${selectedTask?.id === task.id ? 'active' : ''}`}
          key={task.id}
          onClick={() => onSelect(task)}
        >
          <span className={`priority ${task.priority}`}>{task.priority}</span>
          <h3>{task.domain}</h3>
          <p>{task.prompt}</p>
          <small>{task.evaluation_id ? 'Evaluated' : 'Needs review'}</small>
        </button>
      ))}
    </aside>
  );
}
