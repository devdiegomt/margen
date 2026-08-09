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

/** PostgREST corta en 1000 filas: pedimos de a menos y paginamos explícitamente. */
const PULL_PAGE = 500;
/** Lotes de subida, para no armar payloads gigantes en la primera sincronización. */
const PUSH_CHUNK = 200;

async function getMeta() {
  return (await db.meta.get('sync')) ?? { key: 'sync', lastPulledAt: EPOCH, lastPushedAt: EPOCH };
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

/** Marca que las escrituras que siguen vienen del pull, no del usuario. */
let applyingRemote = false;
export function isApplyingRemote(): boolean {
  return applyingRemote;
}

/**
 * Push/pull con last-write-wins por updatedAt.
 * - Push: filas locales modificadas desde el último push, en lotes.
 * - Pull: filas remotas con synced_at posterior al último pull, paginando por synced_at.
 * - Merge: gana el updatedAt más reciente; los tombstones también viajan.
 *
 * Nota: el reloj de conflictos es el del dispositivo. Un equipo con la hora mal
 * configurada gana los conflictos hasta que se corrija.
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
    // ---------- PUSH ----------
    const field = changeField[name];
    const dirty = await localTable(name)
      .filter(row => (row[field] ?? EPOCH) > meta.lastPushedAt)
      .toArray();

    for (let i = 0; i < dirty.length; i += PUSH_CHUNK) {
      const chunk = dirty.slice(i, i + PUSH_CHUNK);
      const { error } = await supabase.from(name).upsert(chunk.map(toSnake));
      if (error) throw new Error(`Error subiendo ${name}: ${error.message}`);
      pushed += chunk.length;
    }

    // ---------- PULL (paginado) ----------
    // Ordenamos por synced_at y avanzamos el cursor página a página: así el cursor
    // nunca se adelanta a filas que todavía no bajamos.
    let cursor = meta.lastPulledAt;
    for (;;) {
      const { data: remote, error: pullError } = await supabase
        .from(name)
        .select('*')
        .gt('synced_at', cursor)
        .order('synced_at', { ascending: true })
        .limit(PULL_PAGE);
      if (pullError) throw new Error(`Error bajando ${name}: ${pullError.message}`);

      const rows = remote ?? [];
      if (rows.length === 0) break;

      applyingRemote = true;
      try {
        for (const raw of rows) {
          const syncedAt = raw.synced_at as string;
          if (syncedAt > cursor) cursor = syncedAt;
          if (syncedAt > maxSyncedAt) maxSyncedAt = syncedAt;

          const incoming = toCamel(raw) as { id: string; updatedAt?: string; endedAt?: string };
          const local = await localTable(name).get(incoming.id);
          const localClock = (local?.[field] as string | undefined) ?? EPOCH;
          const remoteClock = incoming.updatedAt ?? incoming.endedAt ?? EPOCH;

          if (!local || remoteClock > localClock) {
            await localTable(name).put(incoming);
            pulled += 1;
          }
        }
      } finally {
        applyingRemote = false;
      }

      if (rows.length < PULL_PAGE) break; // última página
    }
  }

  await db.meta.put({ key: 'sync', lastPulledAt: maxSyncedAt, lastPushedAt: syncStart });
  return { pushed, pulled };
}
