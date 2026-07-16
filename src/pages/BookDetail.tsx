import { useNavigate, useParams } from 'react-router-dom';
import { useBook, useBooks } from '../hooks/useBooks';
import { useNotes } from '../hooks/useNotes';
import { NoteEditor } from '../components/notes/NoteEditor';
import { NoteList } from '../components/notes/NoteList';
import type { BookStatus } from '../db/types';
import { bookToMarkdown, download } from '../lib/exporter';

export function BookDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const book = useBook(id);
  const { setStatus, deleteBook } = useBooks();
  const { notes, addNote, updateNote, deleteNote } = useNotes(id);

  if (book === undefined) return null; // cargando
  if (book === null) {
    return (
      <div className="page">
        <p>Este libro no existe. <a href="/">Volver a la biblioteca</a>.</p>
      </div>
    );
  }

  return (
    <div className="page page--detail">
      <button className="back" onClick={() => navigate('/')}>← Biblioteca</button>

      <header className="book-header">
        <div>
          <h1 className="book-header__title">{book.title}</h1>
          {book.author && <p className="book-header__author">{book.author}</p>}
        </div>
        <div className="book-header__actions">
          <button
            className="btn btn--ghost"
            onClick={() => {
              const { filename, content } = bookToMarkdown(book, notes ?? []);
              download(filename, content, 'text/markdown');
            }}
          >
            Exportar .md
          </button>
          <select
            value={book.status}
            onChange={e => setStatus(book, e.target.value as BookStatus)}
            aria-label="Estado del libro"
          >
            <option value="pendiente">Pendiente</option>
            <option value="leyendo">Leyendo</option>
            <option value="terminado">Terminado</option>
          </select>
          <button
            className="btn btn--danger-ghost"
            onClick={async () => {
              if (confirm(`¿Eliminar "${book.title}" y todas sus notas?`)) {
                await deleteBook(book.id);
                navigate('/');
              }
            }}
          >
            Eliminar
          </button>
        </div>
      </header>

      <NoteEditor onSubmit={addNote} />
      <NoteList notes={notes ?? []} onDelete={deleteNote} onUpdate={updateNote} />
    </div>
  );
}
