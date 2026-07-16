import { useLiveQuery } from 'dexie-react-hooks';
import { db, now, uid } from '../db/db';
import type { Book, BookStatus } from '../db/types';

export function useBooks() {
  const books = useLiveQuery(() => db.books.orderBy('createdAt').reverse().toArray(), []);

  const addBook = (data: { title: string; author?: string; status: BookStatus }) =>
    db.books.add({
      ...data,
      id: uid(),
      startedAt: data.status === 'leyendo' ? now() : undefined,
      createdAt: now(),
      updatedAt: now(),
    });

  const updateBook = (id: string, changes: Partial<Book>) =>
    db.books.update(id, { ...changes, updatedAt: now() });

  const setStatus = (book: Book, status: BookStatus) =>
    updateBook(book.id, {
      status,
      startedAt: status === 'leyendo' && !book.startedAt ? now() : book.startedAt,
      finishedAt: status === 'terminado' ? now() : undefined,
    });

  const deleteBook = async (id: string) => {
    await db.transaction('rw', db.books, db.notes, db.pendings, async () => {
      await db.notes.where('bookId').equals(id).delete();
      await db.pendings.where('bookId').equals(id).delete();
      await db.books.delete(id);
    });
  };

  return { books, addBook, updateBook, setStatus, deleteBook };
}

export function useBook(id: string) {
  // undefined = cargando, null = no existe
  return useLiveQuery(async () => (await db.books.get(id)) ?? null, [id]);
}
