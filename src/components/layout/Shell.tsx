import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';
import { PomodoroProvider } from '../pomodoro/PomodoroContext';
import { useAutoSync } from '../../hooks/useAutoSync';

export function Shell() {
  const syncing = useAutoSync();

  return (
    <PomodoroProvider>
      <div className="shell">
        <Nav syncing={syncing} />
        <main className="shell__main">
          <Outlet />
        </main>
      </div>
    </PomodoroProvider>
  );
}
