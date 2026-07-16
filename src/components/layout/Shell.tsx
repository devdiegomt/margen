import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';
import { PomodoroProvider } from '../pomodoro/PomodoroContext';

export function Shell() {
  return (
    <PomodoroProvider>
      <div className="shell">
        <Nav />
        <main className="shell__main">
          <Outlet />
        </main>
      </div>
    </PomodoroProvider>
  );
}
