import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { todayLocal } from '../lib/dates';
import type { Book, Note } from '../db/types';

/** Hash simple y determinista: misma fecha + mismas notas = misma cita todo el día. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface DailyQuote {
  note: Note;
  book: Book | undefined;
}

export function useDailyQuote(): DailyQuote | null | undefined {
  return useLiveQuery(async () => {
    const notes = await db.notes.filter(n => !n.deletedAt).toArray();
    if (notes.length === 0) return null;

    // preferimos citas textuales; si no hay, cualquier nota con contenido
    const pool = notes.filter(n => n.type === 'cita' && n.quote);
    const candidates = pool.length > 0 ? pool : notes.filter(n => n.content);
    if (candidates.length === 0) return null;

    // orden estable por id para que el índice diario no dependa del orden de la query
    candidates.sort((a, b) => a.id.localeCompare(b.id));
    const pick = candidates[hashString(todayLocal()) % candidates.length];

    const book = await db.books.get(pick.bookId);
    return { note: pick, book };
  }, []);
}
