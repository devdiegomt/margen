const LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  leyendo: 'Leyendo',
  terminado: 'Terminado',
  idea: 'Idea',
  cita: 'Cita',
  reflexion: 'Reflexión',
};

export function Badge({ kind }: { kind: string }) {
  return <span className={`badge badge--${kind}`}>{LABELS[kind] ?? kind}</span>;
}
