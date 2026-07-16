import { usePomodoro } from './PomodoroContext';

function format(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function PomodoroWidget() {
  const { phase, running, remainingMs, cycles, start, pause, reset, skip } = usePomodoro();

  return (
    <div className={`pomo pomo--${phase} ${running ? 'is-running' : ''}`}>
      <span className="pomo__dot" aria-hidden="true" />
      <span className="pomo__label">{phase === 'trabajo' ? 'Enfoque' : 'Descanso'}</span>
      <span className="pomo__time">{format(remainingMs)}</span>
      {running ? (
        <button className="pomo__btn" onClick={pause} aria-label="Pausar">⏸</button>
      ) : (
        <button className="pomo__btn" onClick={start} aria-label="Iniciar">▶</button>
      )}
      <button className="pomo__btn" onClick={reset} aria-label="Reiniciar">↺</button>
      <button className="pomo__btn" onClick={skip} aria-label="Saltar fase">⏭</button>
      {cycles > 0 && (
        <span className="pomo__cycles" title={`${cycles} pomodoros completados`}>
          {cycles}
        </span>
      )}
    </div>
  );
}
