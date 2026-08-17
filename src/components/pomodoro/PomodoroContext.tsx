import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { db, now, uid } from '../../db/db';
import {
  STATE_KEY,
  loadSettings,
  saveSettings,
  type PomodoroSettings,
} from '../../lib/pomodoro-settings';

export type Phase = 'trabajo' | 'descanso';

/** Lo que persistimos para sobrevivir a que el sistema descargue la app. */
interface PersistedState {
  phase: Phase;
  endsAt: number | null;
  pausedRemaining: number;
  cycles: number;
  cyclesDate: string; // los ciclos se cuentan por día
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

interface PomodoroState {
  phase: Phase;
  running: boolean;
  remainingMs: number;
  cycles: number;
  settings: PomodoroSettings;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  updateSettings: (next: PomodoroSettings) => void;
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
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings);

  const durations = useMemo(
    () => ({
      trabajo: settings.workMin * 60_000,
      descanso: settings.breakMin * 60_000,
    }),
    [settings]
  );

  // Estado inicial restaurado: si el sistema descargó la app mientras corría,
  // el temporizador retoma donde iba (endsAt es un timestamp absoluto).
  const restored = useRef(loadState()).current;
  const sameDay = restored?.cyclesDate === todayKey();

  const [phase, setPhase] = useState<Phase>(restored?.phase ?? 'trabajo');
  const [cycles, setCycles] = useState(sameDay ? (restored?.cycles ?? 0) : 0);
  const [endsAt, setEndsAt] = useState<number | null>(restored?.endsAt ?? null);
  const [pausedRemaining, setPausedRemaining] = useState<number>(
    restored?.pausedRemaining ?? durations.trabajo
  );
  const [, forceTick] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const running = endsAt !== null;
  const remainingMs = running ? Math.max(0, endsAt - Date.now()) : pausedRemaining;

  // Persistimos en cada cambio relevante
  useEffect(() => {
    const state: PersistedState = {
      phase,
      endsAt,
      pausedRemaining,
      cycles,
      cyclesDate: todayKey(),
    };
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [phase, endsAt, pausedRemaining, cycles]);

  const advancePhase = useCallback(
    (from: Phase, completed: boolean) => {
      const next: Phase = from === 'trabajo' ? 'descanso' : 'trabajo';
      if (from === 'trabajo' && completed) {
        setCycles(c => c + 1);
        const endedAt = now();
        db.sessions.add({
          id: uid(),
          startedAt: new Date(Date.now() - durations.trabajo).toISOString(),
          endedAt,
          durationMs: durations.trabajo,
        });
      }
      setPhase(next);
      setEndsAt(Date.now() + durations[next]);
      setPausedRemaining(durations[next]);
    },
    [durations]
  );

  // Tick contra Date.now(): no se desfasa aunque el navegador congele los timers
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

  // Al volver a la app, recalculamos de inmediato en vez de esperar al siguiente tick
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (endsAt !== null && Date.now() >= endsAt) {
        advancePhase(phase, true);
      } else {
        forceTick(t => t + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [endsAt, phase, advancePhase]);

  useEffect(() => {
    if (running) {
      const m = Math.floor(remainingMs / 60000);
      const s = Math.floor((remainingMs % 60000) / 1000);
      document.title = `${m}:${String(s).padStart(2, '0')} · ${
        phase === 'trabajo' ? 'Leyendo' : 'Descanso'
      } — Margen`;
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
    setPausedRemaining(durations[phase]);
  }, [durations, phase]);

  const skip = useCallback(() => advancePhase(phase, false), [advancePhase, phase]);

  const updateSettings = useCallback(
    (next: PomodoroSettings) => {
      setSettings(next);
      saveSettings(next);
      // si está en reposo, el nuevo valor se aplica ya; si corre, al siguiente ciclo
      setEndsAt(current => {
        if (current !== null) return current;
        setPausedRemaining(
          (phase === 'trabajo' ? next.workMin : next.breakMin) * 60_000
        );
        return null;
      });
    },
    [phase]
  );

  const value = useMemo(
    () => ({
      phase,
      running,
      remainingMs,
      cycles,
      settings,
      start,
      pause,
      reset,
      skip,
      updateSettings,
    }),
    [phase, running, remainingMs, cycles, settings, start, pause, reset, skip, updateSettings]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// El hook vive junto a su contexto a propósito.
// eslint-disable-next-line react-refresh/only-export-components
export function usePomodoro() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePomodoro debe usarse dentro de PomodoroProvider');
  return ctx;
}
