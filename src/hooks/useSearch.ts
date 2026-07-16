import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export function useSearch(query: string, tag: string) {
  const results = useLiveQuery(async () => {
    const q = query.trim().toLowerCase();
    if (!q && !tag) return [];

    // el tag usa el índice multi-entry; el texto se filtra en memoria
    // (a escala personal — miles de notas — esto es instantáneo)
    let collection = tag
      ? db.notes.where('tags').equals(tag)
      : db.notes.toCollection();

    if (q) {
      collection = collection.filter(
        n =>
          n.content.toLowerCase().includes(q) ||
          (n.quote ?? '').toLowerCase().includes(q)
      );
    }
    const notes = await collection.toArray();
    return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [query, tag]);

  const allTags = useLiveQuery(async () => {
    const keys = await db.notes.orderBy('tags').uniqueKeys();
    return keys as string[];
  }, []);

  return { results, allTags };
}
