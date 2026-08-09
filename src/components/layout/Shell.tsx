import { Outlet, useLocation } from 'react-router-dom';
import { Nav } from './Nav';
import { PomodoroProvider } from '../pomodoro/PomodoroContext';
import { useAutoSync } from '../../hooks/useAutoSync';
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export function Shell() {
  const syncing = useAutoSync();
  const location = useLocation();
  useKeyboardOpen();

  return (
    <PomodoroProvider>
      <div className="shell">
        <Nav syncing={syncing} />
        <main className="shell__main">
          {/* key por ruta: al navegar, un error de una pantalla no bloquea las demás */}
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </PomodoroProvider>
  );
}
