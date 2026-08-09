import { NavLink } from 'react-router-dom';
import { PomodoroWidget } from '../pomodoro/PomodoroWidget';
import { SyncIndicator } from './SyncIndicator';

/* ---- Íconos (SVG en línea, sin dependencias) ---- */
const sv = {
  viewBox: '0 0 24 24',
  width: 21,
  height: 21,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const IconLibrary = () => (
  <svg {...sv}>
    <path d="M4 4v16" /><path d="M8.5 4v16" /><path d="M13 4v16" /><path d="m17 5.5 3.2 15" />
  </svg>
);
const IconCheck = () => (
  <svg {...sv}>
    <path d="M4 7h9" /><path d="M4 17h9" /><path d="m16 5 2 2 3.5-3.5" /><path d="m16 15 2 2 3.5-3.5" />
  </svg>
);
const IconSearch = () => (
  <svg {...sv}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
const IconChart = () => (
  <svg {...sv}>
    <path d="M4 20h16" /><path d="M7.5 20v-6" /><path d="M12 20V5" /><path d="M16.5 20v-9" />
  </svg>
);
const IconGear = () => (
  <svg {...sv}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6" />
  </svg>
);

const LINKS = [
  { to: '/', label: 'Biblioteca', end: true, Icon: IconLibrary },
  { to: '/pendientes', label: 'Pendientes', end: false, Icon: IconCheck },
  { to: '/buscar', label: 'Buscar', end: false, Icon: IconSearch },
  { to: '/enfoque', label: 'Enfoque', end: false, Icon: IconChart },
  { to: '/datos', label: 'Datos', end: false, Icon: IconGear },
];

export function Nav({ syncing = false }: { syncing?: boolean }) {
  return (
    <>
      {/* Barra superior: marca + temporizador. En móvil es la única fila. */}
      <header className="nav">
        <NavLink to="/" className="nav__brand">
          Margen<span className="nav__brand-dot">.</span>
          <SyncIndicator running={syncing} />
        </NavLink>

        <nav className="nav__links">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </nav>

        <PomodoroWidget />
      </header>

      {/* Pestañas inferiores: solo en móvil, al alcance del pulgar */}
      <nav className="tabbar" aria-label="Navegación principal">
        {LINKS.map(({ to, label, end, Icon }) => (
          <NavLink key={to} to={to} end={end} className="tabbar__item">
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
