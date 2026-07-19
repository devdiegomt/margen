import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/books/BookCard';
import { BookForm } from '../components/books/BookForm';
import { EmptyState } from '../components/ui/EmptyState';
import type { BookStatus } from '../db/types';

const SECTIONS: { status: BookStatus; title: string }[] = [
  { status: 'leyendo', title: 'Leyendo ahora' },
  { status: 'pendiente', title: 'En la fila' },
  { status: 'terminado', title: 'Terminados' },
];

export function Library() {
  const { books, addBook } = useBooks();
  const [showForm, setShowForm] = useState(false);

  const counts = useLiveQuery(async () => {
    const map: Record<string, number> = {};
    await db.notes.each(n => {
      if (!n.deletedAt) map[n.bookId] = (map[n.bookId] ?? 0) + 1;
    });
    return map;
  }, []);

  if (!books) return null;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Biblioteca</h1>
        <button className="btn btn--primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cerrar' : '+ Nuevo libro'}
        </button>
      </div>

      {showForm && (
        <BookForm
          onSubmit={async data => {
            await addBook(data);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {books.length === 0 && !showForm && (
        <EmptyState
          title="Tu biblioteca está vacía"
          hint="Agrega el libro que estás leyendo y empieza a tomar notas."
        />
      )}

      {SECTIONS.map(({ status, title }) => {
        const group = books.filter(b => b.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status} className="library-section">
            <h2 className="library-section__title">{title}</h2>
            <div className="book-grid">
              {group.map(b => (
                <BookCard key={b.id} book={b} noteCount={counts?.[b.id] ?? 0} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
