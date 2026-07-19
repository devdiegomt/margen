import Dexie, { type Table } from 'dexie';
import type { Book, Note, Pending, Session, Meta } from './types';

class MargenDB extends Dexie {
  books!: Table<Book, string>;
  notes!: Table<Note, string>;
  pendings!: Table<Pending, string>;
  sessions!: Table<Session, string>;
  meta!: Table<Meta, string>;

  constructor() {
    super('margen');
    this.version(1).stores({
      books: 'id, status, title, createdAt',
      notes: 'id, bookId, type, createdAt, *tags',
      pendings: 'id, done, bookId, createdAt',
    });
    // v2: fecha límite en pendientes + sesiones de pomodoro
    this.version(2).stores({
      pendings: 'id, done, bookId, createdAt, dueAt',
      sessions: 'id, startedAt',
    });
    // v3: sync — updatedAt en pendings (para LWW) + estado de sincronización
    this.version(3)
      .stores({ meta: 'key' })
      .upgrade(tx =>
        tx.table('pendings').toCollection().modify(p => {
          if (!p.updatedAt) p.updatedAt = p.completedAt ?? p.createdAt;
        })
      );
  }
}

export const db = new MargenDB();

export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
