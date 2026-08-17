import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBook, useBooks } from '../hooks/useBooks';
import { useNotes } from '../hooks/useNotes';
import { NoteEditor } from '../components/notes/NoteEditor';
import { NoteList } from '../components/notes/NoteList';
import { bookToMarkdown, download } from '../lib/exporter';
import { Rating } from '../components/books/Rating';
import { BookEditForm } from '../components/books/BookEditForm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusPicker } from '../components/books/StatusPicker';


/* Íconos en línea para las acciones del libro */
const IconPencil = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const IconDownload = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 20h16" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
  </svg>
);

export function BookDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const book = useBook(id);
  const { setStatus, updateBook, deleteBook } = useBooks();
  const { notes, addNote, updateNote, deleteNote } = useNotes(id);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

      {editing ? (
        <BookEditForm
          book={book}
          onCancel={() => setEditing(false)}
          onSave={async changes => {
            await updateBook(book.id, changes);
            setEditing(false);
          }}
        />
      ) : (
        <header className="book-header">
          {book.coverUrl && <img src={book.coverUrl} alt="" className="book-header__cover" />}
          <div className="book-header__info">
            <h1 className="book-header__title">{book.title}</h1>
            {book.author && (
              <p className="book-header__author">
                {book.author}{book.year ? ` · ${book.year}` : ''}
              </p>
            )}
            <Rating
              value={book.rating}
              onChange={r => updateBook(book.id, { rating: r || undefined })}
            />
            <StatusPicker value={book.status} onChange={next => setStatus(book, next)} />
          </div>
          <div className="book-header__actions">
            <button className="btn btn--outline" onClick={() => setEditing(true)}>
              <IconPencil /> Editar
            </button>
            <button
              className="btn btn--outline"
              onClick={() => {
                const { filename, content } = bookToMarkdown(book, notes ?? []);
                download(filename, content, 'text/markdown');
              }}
              title="Descarga un archivo de texto con todas tus notas de este libro"
            >
              <IconDownload /> Descargar notas
            </button>

            <button
              className="btn btn--outline btn--danger-outline"
              onClick={() => setConfirmingDelete(true)}
            >
              <IconTrash /> Eliminar
            </button>
          </div>
        </header>
      )}

      <NoteEditor onSubmit={addNote} />
      <NoteList notes={notes ?? []} book={book} onDelete={deleteNote} onUpdate={updateNote} />

      <ConfirmDialog
        open={confirmingDelete}
        title={`¿Eliminar "${book.title}"?`}
        description={`Se eliminarán también sus ${notes?.length ?? 0} ${(notes?.length ?? 0) === 1 ? 'nota' : 'notas'}. No podrás recuperarlas.`}
        confirmLabel="Eliminar libro"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={async () => {
          setConfirmingDelete(false);
          await deleteBook(book.id);
          navigate('/');
        }}
      />
    </div>
  );
}
