import { useEffect, useRef, useState } from 'react';
import { usePomodoro } from './PomodoroContext';

const SEEN_KEY = 'margen:pomodoro-explained';
const WORK_MS = 25 * 60 * 1000;

function format(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function PomodoroWidget() {
  const { phase, running, remainingMs, cycles, start, pause, reset, skip } = usePomodoro();
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const idle = !running && phase === 'trabajo' && remainingMs === WORK_MS;

  // La primera vez abrimos el panel con la explicación desplegada
  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) {
      setOpen(true);
      setShowHelp(true);
      localStorage.setItem(SEEN_KEY, '1');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="pomo-wrap" ref={wrapRef}>
      {/* Disparador compacto: una sola parada táctil */}
      <button
        className={`pomo-trigger pomo-trigger--${phase} ${running ? 'is-running' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={idle ? 'Iniciar sesión de lectura' : 'Temporizador de lectura'}
      >
        {idle ? (
          <>
            <span aria-hidden="true">▶</span>
            <span className="pomo-trigger__text">Leer 25 min</span>
          </>
        ) : (
          <>
            <span className="pomo__dot" aria-hidden="true" />
            <span className="pomo-trigger__text">
              {phase === 'trabajo' ? 'Leyendo' : 'Descanso'}
            </span>
            <span className="pomo-trigger__time">{format(remainingMs)}</span>
          </>
        )}
      </button>

      {open && (
        <div className="pomo-panel" role="dialog" aria-label="Sesión de lectura">
          <button className="pomo-panel__close" onClick={() => setOpen(false)} aria-label="Cerrar">×</button>

          <span className="pomo-panel__phase">
            {phase === 'trabajo' ? 'Sesión de lectura' : 'Descanso'}
          </span>
          <span className="pomo-panel__time">{format(remainingMs)}</span>

          <div className="pomo-panel__controls">
            {running ? (
              <button className="btn btn--ghost" onClick={pause}>⏸ Pausar</button>
            ) : (
              <button className="btn btn--primary" onClick={start}>
                ▶ {idle ? 'Empezar' : 'Continuar'}
              </button>
            )}
            <button className="btn btn--ghost" onClick={reset}>↺ Reiniciar</button>
            <button className="btn btn--ghost" onClick={skip}>
              ⏭ {phase === 'trabajo' ? 'Ir al descanso' : 'Volver a leer'}
            </button>
          </div>

          {cycles > 0 && (
            <p className="pomo-panel__cycles">
              <strong>{cycles}</strong> {cycles === 1 ? 'sesión completada' : 'sesiones completadas'}
            </p>
          )}

          <button className="pomo-panel__help-toggle" onClick={() => setShowHelp(v => !v)}>
            {showHelp ? 'Ocultar' : '¿Qué es esto?'}
          </button>

          {showHelp && (
            <div className="pomo-panel__help">
              <p>
                Un temporizador para leer sin interrupciones:{' '}
                <strong>25 minutos de lectura</strong> y luego <strong>5 de descanso</strong>.
                Al terminar cada bloque suena un aviso y empieza el siguiente solo.
              </p>
              <p>
                Sirve para entrar en ritmo cuando cuesta arrancar. En <strong>Enfoque</strong>{' '}
                ves cuánto has leído esta semana.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
