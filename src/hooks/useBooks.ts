import { useLiveQuery } from 'dexie-react-hooks';
import { db, now, uid } from '../db/db';
import type { Book, BookStatus } from '../db/types';

export function useBooks() {
  const books = useLiveQuery(
    () => db.books.orderBy('createdAt').reverse().filter(b => !b.deletedAt).toArray(),
    []
  );

  const addBook = (data: { title: string; author?: string; status: BookStatus; coverUrl?: string; year?: number }) =>
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

  // Borrado suave: tombstone que el sync propaga a otros dispositivos
  const deleteBook = async (id: string) => {
    const ts = now();
    await db.transaction('rw', db.books, db.notes, db.pendings, async () => {
      await db.notes.where('bookId').equals(id).modify({ deletedAt: ts, updatedAt: ts });
      await db.pendings.where('bookId').equals(id).modify({ deletedAt: ts, updatedAt: ts });
      await db.books.update(id, { deletedAt: ts, updatedAt: ts });
    });
  };

  return { books, addBook, updateBook, setStatus, deleteBook };
}

export function useBook(id: string) {
  // undefined = cargando, null = no existe (o borrado)
  return useLiveQuery(async () => {
    const b = await db.books.get(id);
    return b && !b.deletedAt ? b : null;
  }, [id]);
}
