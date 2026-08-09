import { NavLink } from 'react-router-dom';
import { PomodoroWidget } from '../pomodoro/PomodoroWidget';
import { SyncIndicator } from './SyncIndicator';

export function Nav({ syncing = false }: { syncing?: boolean }) {
  return (
    <header className="nav">
      <NavLink to="/" className="nav__brand">
        Margen<span className="nav__brand-dot">.</span>
        <SyncIndicator running={syncing} />
      </NavLink>
      <PomodoroWidget />
      <nav className="nav__links">
        <NavLink to="/" end>Biblioteca</NavLink>
        <NavLink to="/pendientes">Pendientes</NavLink>
        <NavLink to="/buscar">Buscar</NavLink>
        <NavLink to="/enfoque">Enfoque</NavLink>
        <NavLink to="/datos">Datos</NavLink>
      </nav>
    </header>
  );
}
