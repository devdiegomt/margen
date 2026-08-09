import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export function useSearch(query: string, tag: string) {
  const results = useLiveQuery(async () => {
    const q = query.trim().toLowerCase();
    if (!q && !tag) return [];

    // Nota: no usamos el índice multi-entry para filtrar por tag.
    // El IndexedDB de Safari tiene problemas conocidos recorriendo índices
    // multiEntry, y a escala personal el filtrado en memoria es instantáneo.
    let collection = db.notes.toCollection().filter(n => !n.deletedAt);

    if (tag) {
      collection = collection.filter(n => n.tags.includes(tag));
    }

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
    try {
      // Recolectamos los tags recorriendo las notas, sin depender del índice.
      const set = new Set<string>();
      await db.notes.each(n => {
        if (!n.deletedAt) n.tags.forEach(t => set.add(t));
      });
      return [...set].sort((a, b) => a.localeCompare(b, 'es'));
    } catch (err) {
      console.warn('No se pudieron leer los tags', err);
      return [] as string[];
    }
  }, []);

  return { results, allTags };
}
