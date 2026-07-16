/** Fecha local de hoy como 'YYYY-MM-DD' (sin trampas de zona horaria vía toISOString). */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type DueState = 'vencido' | 'hoy' | 'proximo';

export function dueState(dueAt: string): DueState {
  const today = todayLocal();
  if (dueAt < today) return 'vencido';
  if (dueAt === today) return 'hoy';
  return 'proximo';
}

export function formatDue(dueAt: string): string {
  const state = dueState(dueAt);
  if (state === 'hoy') return 'Hoy';
  const [y, m, d] = dueAt.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const label = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(date);
  return state === 'vencido' ? `Venció ${label}` : label;
}
