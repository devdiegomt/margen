import { useEffect, useState } from 'react';
import { onSyncStateChange, registerAutoSyncHooks, syncSafely } from '../lib/autosync';

/**
 * Sincroniza sin que el usuario tenga que pedirlo:
 * al abrir la app, al volver a ella, al recuperar conexión y tras cada cambio local.
 */
export function useAutoSync(): boolean {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    registerAutoSyncHooks();
    const unsubscribe = onSyncStateChange(setRunning);

    // al abrir
    void syncSafely();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncSafely();
    };
    const onOnline = () => void syncSafely();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    // red de seguridad: cada 10 min con la app abierta
    const interval = window.setInterval(() => void syncSafely(), 10 * 60 * 1000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.clearInterval(interval);
    };
  }, []);

  return running;
}
