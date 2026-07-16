import Dexie, { type Table } from 'dexie';
import type { Book, Note, Pending } from './types';

class MargenDB extends Dexie {
  books!: Table<Book, string>;
  notes!: Table<Note, string>;
  pendings!: Table<Pending, string>;

  constructor() {
    super('margen');
    this.version(1).stores({
      books: 'id, status, title, createdAt',
      notes: 'id, bookId, type, createdAt, *tags',
      pendings: 'id, done, bookId, createdAt',
    });
  }
}

export const db = new MargenDB();

export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
