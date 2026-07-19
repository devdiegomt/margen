import { db, now } from '../db/db';
import { supabase } from './supabase';

/** camelCase <-> snake_case, para no mantener mapeos a mano por tabla. */
const toSnake = (obj: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`),
      v === undefined ? null : v,
    ])
  );

const toCamel = (obj: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(obj)
      .filter(([k]) => k !== 'user_id' && k !== 'synced_at')
      .map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v ?? undefined])
  );

const TABLES = ['books', 'notes', 'pendings', 'sessions'] as const;
type TableName = (typeof TABLES)[number];

const localTable = (name: TableName) => db.table(name);

/** Campo que decide qué filas locales están "sucias" desde el último push. */
const changeField: Record<TableName, string> = {
  books: 'updatedAt',
  notes: 'updatedAt',
  pendings: 'updatedAt',
  sessions: 'endedAt', // inmutables: solo se crean
};

const EPOCH = '1970-01-01T00:00:00.000Z';

async function getMeta() {
  return (await db.meta.get('sync')) ?? { key: 'sync', lastPulledAt: EPOCH, lastPushedAt: EPOCH };
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

/**
 * Push/pull con last-write-wins por updatedAt.
 * - Push: filas locales modificadas desde el último push.
 * - Pull: filas remotas con synced_at posterior al último pull (cursor del servidor).
 * - Merge: gana el updatedAt más reciente; los tombstones también viajan.
 */
export async function syncNow(): Promise<SyncResult> {
  if (!supabase) throw new Error('Supabase no está configurado (revisa las variables VITE_SUPABASE_*).');
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Inicia sesión para sincronizar.');

  const meta = await getMeta();
  const syncStart = now();
  let pushed = 0;
  let pulled = 0;
  let maxSyncedAt = meta.lastPulledAt;

  for (const name of TABLES) {
    // ---- PUSH ----
    const field = changeField[name];
    const dirty = await localTable(name)
      .filter(row => (row[field] ?? EPOCH) > meta.lastPushedAt)
      .toArray();

    if (dirty.length > 0) {
      const { error } = await supabase.from(name).upsert(dirty.map(toSnake));
      if (error) throw new Error(`Error subiendo ${name}: ${error.message}`);
      pushed += dirty.length;
    }

    // ---- PULL ----
    const { data: remote, error: pullError } = await supabase
      .from(name)
      .select('*')
      .gt('synced_at', meta.lastPulledAt);
    if (pullError) throw new Error(`Error bajando ${name}: ${pullError.message}`);

    for (const raw of remote ?? []) {
      const syncedAt = raw.synced_at as string;
      if (syncedAt > maxSyncedAt) maxSyncedAt = syncedAt;

      const incoming = toCamel(raw) as { id: string; updatedAt?: string };
      const local = await localTable(name).get(incoming.id);
      const localClock = (local?.[changeField[name]] as string | undefined) ?? EPOCH;
      const remoteClock = (incoming.updatedAt as string | undefined) ?? (incoming as never)['endedAt'] ?? EPOCH;

      if (!local || remoteClock > localClock) {
        await localTable(name).put(incoming);
        pulled += 1;
      }
    }
  }

  await db.meta.put({ key: 'sync', lastPulledAt: maxSyncedAt, lastPushedAt: syncStart });
  return { pushed, pulled };
}
