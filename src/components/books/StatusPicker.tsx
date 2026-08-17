import type { BookStatus } from '../../db/types';

interface Props {
  value: BookStatus;
  onChange: (status: BookStatus) => void;
}

/* Íconos que refuerzan el significado de cada estado */
const sv = {
  viewBox: '0 0 24 24',
  width: 15,
  height: 15,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const IconQueue = () => (
  <svg {...sv}><path d="M12 6v12" /><path d="M6 12h12" /></svg>
);
const IconReading = () => (
  <svg {...sv}>
    <path d="M3 5.5h6a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H3Z" />
    <path d="M21 5.5h-6a3 3 0 0 0-3 3V20a2.5 2.5 0 0 1 2.5-2.5H21Z" />
  </svg>
);
const IconDone = () => (
  <svg {...sv}><path d="m5 13 4 4L19 7" /></svg>
);

const OPTIONS: { value: BookStatus; label: string; Icon: () => JSX.Element }[] = [
  { value: 'pendiente', label: 'En la fila', Icon: IconQueue },
  { value: 'leyendo', label: 'Leyendo', Icon: IconReading },
  { value: 'terminado', label: 'Terminado', Icon: IconDone },
];

/** Selector de estado en segmentos, en vez del <select> nativo del sistema. */
export function StatusPicker({ value, onChange }: Props) {
  return (
    <div className="status-picker" role="radiogroup" aria-label="Estado del libro">
      {OPTIONS.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          className={`status-picker__opt status-picker__opt--${v} ${
            value === v ? 'is-active' : ''
          }`}
          onClick={() => onChange(v)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
