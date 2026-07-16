import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export interface DayStat {
  date: string; // YYYY-MM-DD local
  label: string; // "lun", "mar"…
  count: number;
}

function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useSessions() {
  return useLiveQuery(async () => {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const all = await db.sessions.toArray();
    const recent = all.filter(s => new Date(s.endedAt) >= since);

    // últimos 7 días, hoy al final
    const days: DayStat[] = [];
    const fmt = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: key, label: fmt.format(d), count: 0 });
    }
    for (const s of recent) {
      const key = localDate(s.endedAt);
      const day = days.find(d => d.date === key);
      if (day) day.count += 1;
    }

    const today = days[days.length - 1].count;
    const week = recent.length;
    const weekMinutes = Math.round(recent.reduce((acc, s) => acc + s.durationMs, 0) / 60000);
    const total = all.length;

    return { days, today, week, weekMinutes, total };
  }, []);
}
