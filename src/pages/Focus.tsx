import { useSessions } from '../hooks/useSessions';
import { EmptyState } from '../components/ui/EmptyState';

export function Focus() {
  const stats = useSessions();
  if (!stats) return null;

  const max = Math.max(1, ...stats.days.map(d => d.count));

  return (
    <div className="page">
      <div className="page__header">
        <h1>Enfoque</h1>
      </div>

      {stats.total === 0 ? (
        <EmptyState
          title="Todavía no has completado pomodoros"
          hint="Inicia el temporizador en la barra superior. Cada ciclo de 25 minutos completado se registra aquí."
        />
      ) : (
        <>
          <div className="stats-row">
            <div className="stat card">
              <span className="stat__value">{stats.today}</span>
              <span className="stat__label">hoy</span>
            </div>
            <div className="stat card">
              <span className="stat__value">{stats.week}</span>
              <span className="stat__label">últimos 7 días</span>
            </div>
            <div className="stat card">
              <span className="stat__value">{stats.weekMinutes}</span>
              <span className="stat__label">min enfocado esta semana</span>
            </div>
            <div className="stat card">
              <span className="stat__value">{stats.total}</span>
              <span className="stat__label">total histórico</span>
            </div>
          </div>

          <div className="card week-chart" role="img" aria-label={`Pomodoros por día en la última semana: ${stats.days.map(d => `${d.label} ${d.count}`).join(', ')}`}>
            {stats.days.map(d => (
              <div key={d.date} className="week-chart__col">
                <span className="week-chart__count">{d.count > 0 ? d.count : ''}</span>
                <div
                  className={`week-chart__bar ${d.count > 0 ? 'has-value' : ''}`}
                  style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
                />
                <span className="week-chart__label">{d.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
