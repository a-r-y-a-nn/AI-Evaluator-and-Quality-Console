import { Activity, BarChart3, CheckCircle2, ShieldCheck } from 'lucide-react';

export function MetricsGrid({ metrics }) {
  const cards = [
    { label: 'Open Tasks', value: metrics.openTasks, icon: Activity, tone: 'amber' },
    { label: 'Completed', value: metrics.completedTasks, icon: CheckCircle2, tone: 'green' },
    { label: 'Avg Quality', value: metrics.avgQualityScore || '0', icon: BarChart3, tone: 'blue' },
    { label: 'High Priority', value: metrics.highPriorityTasks, icon: ShieldCheck, tone: 'red' },
  ];

  return (
    <section className="metrics-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className={`metric-card ${card.tone}`} key={card.label}>
            <Icon size={22} />
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        );
      })}
    </section>
  );
}
