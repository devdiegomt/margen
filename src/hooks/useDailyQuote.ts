import { useEffect, useState } from 'react';
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

/**
 * La fecha local como estado reactivo.
 * En una PWA instalada el proceso sigue vivo de un día para otro, así que sin esto
 * la cita se calcularía una sola vez y no cambiaría nunca de día.
 */
function useLocalDate(): string {
  const [date, setDate] = useState(todayLocal);

  useEffect(() => {
    const check = () => {
      const now = todayLocal();
      setDate(prev => (prev === now ? prev : now));
    };

    // al volver a la app (lo más habitual en móvil)
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    // y una red de seguridad si la app queda abierta cruzando la medianoche
    const interval = window.setInterval(check, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
      window.clearInterval(interval);
    };
  }, []);

  return date;
}

export interface DailyQuote {
  note: Note;
  book: Book | undefined;
}

export function useDailyQuote(): DailyQuote | null | undefined {
  const today = useLocalDate();

  return useLiveQuery(async () => {
    const notes = await db.notes.filter(n => !n.deletedAt).toArray();
    if (notes.length === 0) return null;

    // preferimos citas textuales; si no hay, cualquier nota con contenido
    const pool = notes.filter(n => n.type === 'cita' && n.quote);
    const candidates = pool.length > 0 ? pool : notes.filter(n => n.content);
    if (candidates.length === 0) return null;

    // orden estable por id: así el índice diario no depende del orden de la query
    candidates.sort((a, b) => a.id.localeCompare(b.id));
    const pick = candidates[hashString(today) % candidates.length];

    const book = await db.books.get(pick.bookId);
    return { note: pick, book };
    // 'today' como dependencia: al cambiar el día, se recalcula
  }, [today]);
}
