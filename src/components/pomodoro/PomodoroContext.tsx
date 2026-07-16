import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { db, now, uid } from '../../db/db';

export type Phase = 'trabajo' | 'descanso';

const DURATIONS: Record<Phase, number> = {
  trabajo: 25 * 60 * 1000,
  descanso: 5 * 60 * 1000,
};

interface PomodoroState {
  phase: Phase;
  running: boolean;
  remainingMs: number;
  cycles: number; // pomodoros de trabajo completados
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void; // saltar a la siguiente fase
}

const Ctx = createContext<PomodoroState | null>(null);

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* sin audio disponible */
  }
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('trabajo');
  const [cycles, setCycles] = useState(0);
  // endsAt: timestamp de fin cuando corre; null cuando está pausado
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState<number>(DURATIONS.trabajo);
  const [, forceTick] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const running = endsAt !== null;
  const remainingMs = running ? Math.max(0, endsAt - Date.now()) : pausedRemaining;

  const advancePhase = useCallback((from: Phase, completed: boolean) => {
    const next: Phase = from === 'trabajo' ? 'descanso' : 'trabajo';
    if (from === 'trabajo' && completed) {
      setCycles(c => c + 1);
      // registrar la sesión completada (sin await: no bloquea la UI)
      const endedAt = now();
      db.sessions.add({
        id: uid(),
        startedAt: new Date(Date.now() - DURATIONS.trabajo).toISOString(),
        endedAt,
        durationMs: DURATIONS.trabajo,
      });
    }
    setPhase(next);
    // la siguiente fase arranca sola
    setEndsAt(Date.now() + DURATIONS[next]);
    setPausedRemaining(DURATIONS[next]);
  }, []);

  // Tick: se calcula contra Date.now(), así no se desfasa si la pestaña pierde foco
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      if (endsAt !== null && Date.now() >= endsAt) {
        beep();
        advancePhase(phase, true);
      } else {
        forceTick(t => t + 1);
      }
    }, 500);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, endsAt, phase, advancePhase]);

  // Título de la pestaña como recordatorio ambiente
  useEffect(() => {
    if (running) {
      const m = Math.floor(remainingMs / 60000);
      const s = Math.floor((remainingMs % 60000) / 1000);
      document.title = `${m}:${String(s).padStart(2, '0')} · ${phase === 'trabajo' ? 'Enfoque' : 'Descanso'} — Margen`;
    } else {
      document.title = 'Margen — notas de lectura';
    }
  });

  const start = useCallback(() => setEndsAt(Date.now() + pausedRemaining), [pausedRemaining]);
  const pause = useCallback(() => {
    if (endsAt !== null) {
      setPausedRemaining(Math.max(0, endsAt - Date.now()));
      setEndsAt(null);
    }
  }, [endsAt]);
  const reset = useCallback(() => {
    setEndsAt(null);
    setPausedRemaining(DURATIONS[phase]);
  }, [phase]);
  const skip = useCallback(() => advancePhase(phase, false), [advancePhase, phase]);

  const value = useMemo(
    () => ({ phase, running, remainingMs, cycles, start, pause, reset, skip }),
    [phase, running, remainingMs, cycles, start, pause, reset, skip]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePomodoro() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePomodoro debe usarse dentro de PomodoroProvider');
  return ctx;
}
