import { forwardRef, useEffect, useRef, useState } from 'react';
import { usePomodoro } from './PomodoroContext';

const SEEN_KEY = 'margen:pomodoro-explained';
const WORK_MS = 25 * 60 * 1000;

function format(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const InfoPanel = forwardRef<HTMLDivElement, { onClose: () => void }>(
  function InfoPanel({ onClose }, ref) {
    return (
      <div className="pomo-info" ref={ref} role="dialog" aria-label="Sesiones de lectura">
        <button className="pomo-info__close" onClick={onClose} aria-label="Cerrar">×</button>
        <h3>Sesiones de lectura</h3>
        <p>
          Un temporizador para leer sin interrupciones:{' '}
          <strong>25 minutos de lectura</strong> y luego <strong>5 de descanso</strong>.
          Al terminar cada bloque suena un aviso y empieza el siguiente solo.
        </p>
        <p className="pomo-info__foot">
          Sirve para entrar en ritmo cuando cuesta arrancar. Puedes pausarlo o saltarlo
          cuando quieras, y en <strong>Enfoque</strong> ves cuánto has leído esta semana.
        </p>
      </div>
    );
  }
);

export function PomodoroWidget() {
  const { phase, running, remainingMs, cycles, start, pause, reset, skip } = usePomodoro();
  const [showInfo, setShowInfo] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // La primera vez se explica solo; después queda a un clic en "?"
  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) {
      setShowInfo(true);
      localStorage.setItem(SEEN_KEY, '1');
    }
  }, []);

  useEffect(() => {
    if (!showInfo) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowInfo(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowInfo(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showInfo]);

  const info = (
    <>
      <button
        className="pomo-info-btn"
        onClick={() => setShowInfo(v => !v)}
        aria-label="Qué es esto"
        title="Qué es esto"
      >
        ?
      </button>
      {showInfo && <InfoPanel ref={panelRef} onClose={() => setShowInfo(false)} />}
    </>
  );

  // ---- En reposo: una invitación, no un cronómetro sin contexto ----
  const idle = !running && phase === 'trabajo' && remainingMs === WORK_MS;
  if (idle) {
    return (
      <div className="pomo-wrap">
        <button className="pomo-start" onClick={start}>
          <span aria-hidden="true">▶</span> Leer 25 min
        </button>
        {info}
      </div>
    );
  }

  // ---- Corriendo o pausado ----
  return (
    <div className="pomo-wrap">
      <div className={`pomo pomo--${phase} ${running ? 'is-running' : ''}`}>
        <span className="pomo__dot" aria-hidden="true" />
        <span className="pomo__label">{phase === 'trabajo' ? 'Leyendo' : 'Descanso'}</span>
        <span className="pomo__time">{format(remainingMs)}</span>
        {running ? (
          <button className="pomo__btn" onClick={pause} aria-label="Pausar" title="Pausar">⏸</button>
        ) : (
          <button className="pomo__btn" onClick={start} aria-label="Continuar" title="Continuar">▶</button>
        )}
        <button className="pomo__btn" onClick={reset} aria-label="Reiniciar" title="Reiniciar">↺</button>
        <button
          className="pomo__btn"
          onClick={skip}
          aria-label={phase === 'trabajo' ? 'Saltar al descanso' : 'Saltar a leer'}
          title={phase === 'trabajo' ? 'Saltar al descanso' : 'Saltar a leer'}
        >
          ⏭
        </button>
        {cycles > 0 && (
          <span className="pomo__cycles" title={`${cycles} sesiones completadas`}>{cycles}</span>
        )}
      </div>
      {info}
    </div>
  );
}
