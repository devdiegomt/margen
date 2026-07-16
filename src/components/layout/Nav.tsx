import { NavLink } from 'react-router-dom';
import { PomodoroWidget } from '../pomodoro/PomodoroWidget';

export function Nav() {
  return (
    <header className="nav">
      <NavLink to="/" className="nav__brand">
        Margen<span className="nav__brand-dot">.</span>
      </NavLink>
      <PomodoroWidget />
      <nav className="nav__links">
        <NavLink to="/" end>Biblioteca</NavLink>
        <NavLink to="/pendientes">Pendientes</NavLink>
      </nav>
    </header>
  );
}
