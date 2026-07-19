import { useLiveQuery } from 'dexie-react-hooks';
import { db, now, uid } from '../db/db';
import type { Note } from '../db/types';

export function useNotes(bookId: string) {
  const notes = useLiveQuery(
    () => db.notes.where('bookId').equals(bookId).filter(n => !n.deletedAt).sortBy('createdAt').then(n => n.reverse()),
    [bookId]
  );

  const addNote = (data: Pick<Note, 'type' | 'content'> & { quote?: string; page?: number; tags?: string[] }) =>
    db.notes.add({
      ...data,
      bookId,
      tags: data.tags ?? [],
      id: uid(),
      createdAt: now(),
      updatedAt: now(),
    });

  const updateNote = (id: string, changes: Partial<Pick<Note, 'content' | 'quote' | 'page' | 'tags'>>) =>
    db.notes.update(id, { ...changes, updatedAt: now() });

  const deleteNote = (id: string) =>
    db.notes.update(id, { deletedAt: now(), updatedAt: now() });

  return { notes, addNote, updateNote, deleteNote };
}
