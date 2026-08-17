/** Ajustes del temporizador de lectura, en minutos. */
export interface PomodoroSettings {
  workMin: number;
  breakMin: number;
}

export const DEFAULT_SETTINGS: PomodoroSettings = { workMin: 25, breakMin: 5 };
export const WORK_OPTIONS = [15, 20, 25, 30, 45, 50, 60];
export const BREAK_OPTIONS = [3, 5, 10, 15];

export const SETTINGS_KEY = 'margen:pomodoro-settings';
export const STATE_KEY = 'margen:pomodoro-state';

export function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PomodoroSettings>;
    return {
      workMin: parsed.workMin ?? DEFAULT_SETTINGS.workMin,
      breakMin: parsed.breakMin ?? DEFAULT_SETTINGS.breakMin,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(next: PomodoroSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento bloqueado */
  }
}
