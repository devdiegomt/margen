import { syncNow } from './sync';
import { supabase } from './supabase';

/**
 * Envoltura de syncNow con las protecciones que un sync automático necesita:
 * - un solo sync a la vez (si ya hay uno corriendo, se reutiliza)
 * - no intenta nada sin sesión o sin conexión
 * - throttle: no repite antes de MIN_INTERVAL salvo que se fuerce
 */

const MIN_INTERVAL_MS = 60_000;

let inFlight: Promise<void> | null = null;
let lastRun = 0;

export type SyncState = 'idle' | 'syncing' | 'done' | 'offline' | 'error';

type Listener = (state: SyncState) => void;
const listeners = new Set<Listener>();

function emit(state: SyncState) {
  for (const l of listeners) l(state);
}

export function onSyncState(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function autoSync({ force = false } = {}): Promise<void> {
  if (!supabase) return;
  if (inFlight) return inFlight;
  if (!navigator.onLine) {
    emit('offline');
    return;
  }
  if (!force && Date.now() - lastRun < MIN_INTERVAL_MS) return;

  const { data } = await supabase.auth.getSession();
  if (!data.session) return; // sin sesión, la app sigue siendo 100% local

  emit('syncing');
  inFlight = syncNow()
    .then(() => {
      lastRun = Date.now();
      emit('done');
    })
    .catch(err => {
      console.warn('auto-sync falló', err);
      emit('error');
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
