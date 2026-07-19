import { useLiveQuery } from 'dexie-react-hooks';
import { db, now, uid } from '../db/db';

export function usePendings() {
  const pendings = useLiveQuery(
    () => db.pendings.orderBy('createdAt').reverse().filter(p => !p.deletedAt).toArray(),
    []
  );

  const addPending = (content: string, bookId?: string, dueAt?: string) =>
    db.pendings.add({ id: uid(), content, bookId, dueAt, done: 0, createdAt: now(), updatedAt: now() });

  const togglePending = (id: string, done: 0 | 1) =>
    db.pendings.update(id, {
      done: done === 1 ? 0 : 1,
      completedAt: done === 1 ? undefined : now(),
      updatedAt: now(),
    });

  const deletePending = (id: string) =>
    db.pendings.update(id, { deletedAt: now(), updatedAt: now() });

  return { pendings, addPending, togglePending, deletePending };
}
