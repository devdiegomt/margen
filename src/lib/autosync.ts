import { db } from '../db/db';
import { supabase } from './supabase';
import { isApplyingRemote, syncNow } from './sync';

type Listener = (running: boolean) => void;

let timer: number | undefined;
let running = false;
let pending = false;
let hooksReady = false;
const listeners = new Set<Listener>();

const DEBOUNCE_MS = 4000;

export function onSyncStateChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(value: boolean) {
  running = value;
  listeners.forEach(fn => fn(value));
}

/** Sincroniza si se puede; nunca lanza (esto corre en segundo plano). */
export async function syncSafely(): Promise<void> {
  if (running) {
    pending = true; // llegó un cambio mientras sincronizábamos: repetimos al terminar
    return;
  }
  if (!supabase || !navigator.onLine) return;

  const { data } = await supabase.auth.getSession();
  if (!data.session) return; // sin sesión, la app sigue siendo 100% local

  emit(true);
  try {
    await syncNow();
  } catch (err) {
    console.warn('auto-sync falló, se reintentará', err);
  } finally {
    emit(false);
    if (pending) {
      pending = false;
      void syncSafely();
    }
  }
}

/**
 * Agenda una sincronización con debounce, para no disparar una por tecla.
 * Ignora las escrituras que vienen del propio pull: si no, cada bajada
 * agendaría una sincronización extra que no tiene nada que hacer.
 */
export function scheduleSync(): void {
  if (isApplyingRemote()) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncSafely(), DEBOUNCE_MS);
}

/**
 * Engancha los hooks de Dexie: cualquier escritura local agenda un sync.
 * Se registra una sola vez por sesión.
 */
export function registerAutoSyncHooks(): void {
  if (hooksReady) return;
  hooksReady = true;

  for (const table of [db.books, db.notes, db.pendings, db.sessions]) {
    table.hook('creating', () => { scheduleSync(); });
    table.hook('updating', () => { scheduleSync(); });
    table.hook('deleting', () => { scheduleSync(); });
  }
}
