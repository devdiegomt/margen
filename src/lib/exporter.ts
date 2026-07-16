import { db } from '../db/db';
import type { Book, Note } from '../db/types';

const TYPE_LABEL: Record<string, string> = { idea: 'Idea', cita: 'Cita', reflexion: 'Reflexión' };

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

/** Descarga un blob como archivo, sin librerías. */
export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Markdown legible de un libro con sus notas. */
export function bookToMarkdown(book: Book, notes: Note[]): { filename: string; content: string } {
  const lines: string[] = [];
  lines.push(`# ${book.title}`);
  if (book.author) lines.push(`*${book.author}*`);
  lines.push('');
  lines.push(`> Estado: ${book.status} · Exportado el ${fmtDate(new Date().toISOString())} desde Margen`);
  lines.push('');

  const ordered = [...notes].sort((a, b) => (a.page ?? Infinity) - (b.page ?? Infinity) || a.createdAt.localeCompare(b.createdAt));

  for (const n of ordered) {
    const meta = [TYPE_LABEL[n.type], n.page ? `pág. ${n.page}` : null, fmtDate(n.createdAt)]
      .filter(Boolean)
      .join(' · ');
    lines.push(`## ${meta}`);
    lines.push('');
    if (n.type === 'cita' && n.quote) {
      lines.push(`> ${n.quote.replace(/\n/g, '\n> ')}`);
      lines.push('');
    }
    if (n.content) {
      lines.push(n.content);
      lines.push('');
    }
    if (n.tags.length) {
      lines.push(n.tags.map(t => `#${t}`).join(' '));
      lines.push('');
    }
  }

  return { filename: `${slug(book.title)}.md`, content: lines.join('\n') };
}

export interface BackupFile {
  app: 'margen';
  version: 1 | 2;
  exportedAt: string;
  books: Book[];
  notes: Note[];
  pendings: unknown[];
  sessions?: unknown[]; // desde version 2
}

/** Respaldo completo en JSON. */
export async function exportJSON(): Promise<{ filename: string; content: string }> {
  const [books, notes, pendings, sessions] = await Promise.all([
    db.books.toArray(),
    db.notes.toArray(),
    db.pendings.toArray(),
    db.sessions.toArray(),
  ]);
  const backup: BackupFile = {
    app: 'margen',
    version: 2,
    exportedAt: new Date().toISOString(),
    books,
    notes,
    pendings,
    sessions,
  };
  const date = new Date().toISOString().slice(0, 10);
  return { filename: `margen-respaldo-${date}.json`, content: JSON.stringify(backup, null, 2) };
}

/**
 * Importa un respaldo. Estrategia merge (bulkPut): los IDs existentes se
 * actualizan, los nuevos se agregan, y nada se borra.
 */
export async function importJSON(raw: string): Promise<{ books: number; notes: number; pendings: number }> {
  let data: BackupFile;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (data.app !== 'margen' || !Array.isArray(data.books) || !Array.isArray(data.notes)) {
    throw new Error('El archivo no parece un respaldo de Margen.');
  }
  await db.transaction('rw', db.books, db.notes, db.pendings, db.sessions, async () => {
    await db.books.bulkPut(data.books);
    await db.notes.bulkPut(data.notes);
    await db.pendings.bulkPut((data.pendings ?? []) as never[]);
    await db.sessions.bulkPut((data.sessions ?? []) as never[]);
  });
  return { books: data.books.length, notes: data.notes.length, pendings: (data.pendings ?? []).length };
}
