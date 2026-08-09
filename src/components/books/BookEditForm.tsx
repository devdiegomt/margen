import { useEffect, useRef, useState } from 'react';
import type { Book } from '../../db/types';
import { searchBooks, type BookSuggestion } from '../../lib/books-api';

interface Props {
  book: Book;
  onSave: (changes: Partial<Book>) => void;
  onCancel: () => void;
}


/* Íconos en línea, al tono de los del detalle del libro */
const IconImage = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m21 16-5-5L5 20" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

/** Editar los datos del libro: título, autor, año y portada. */
export function BookEditForm({ book, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author ?? '');
  const [year, setYear] = useState(book.year ? String(book.year) : '');
  const [coverUrl, setCoverUrl] = useState(book.coverUrl ?? '');
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const debounceRef = useRef<number>();

  // La búsqueda solo corre si el usuario la pide: editar el título no debe
  // disparar sugerencias mientras corrige una tilde.
  useEffect(() => {
    if (!lookingUp || title.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setSuggestions(await searchBooks(title));
      setSearching(false);
    }, 400);
    return () => window.clearTimeout(debounceRef.current);
  }, [title, lookingUp]);

  const pick = (s: BookSuggestion) => {
    setTitle(s.title);
    if (s.author) setAuthor(s.author);
    if (s.year) setYear(String(s.year));
    if (s.coverUrl) setCoverUrl(s.coverUrl);
    setLookingUp(false);
    setSuggestions([]);
  };

  const save = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      author: author.trim() || undefined,
      year: year ? Number(year) : undefined,
      coverUrl: coverUrl.trim() || undefined,
    });
  };

  return (
    <div className="card form book-edit">
      <label className="form__field form__field--suggest">
        <span>Título</span>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} />
        {searching && <span className="form__searching">buscando…</span>}
        {suggestions.length > 0 && (
          <ul className="suggest" role="listbox">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button type="button" className="suggest__item" onClick={() => pick(s)}>
                  {s.coverUrl ? (
                    <img src={s.coverUrl} alt="" className="suggest__cover" loading="lazy" />
                  ) : (
                    <span className="suggest__cover suggest__cover--empty" />
                  )}
                  <span className="suggest__text">
                    <strong>{s.title}</strong>
                    <small>{[s.author, s.year].filter(Boolean).join(' · ')}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>

      <label className="form__field">
        <span>Autor</span>
        <input value={author} onChange={e => setAuthor(e.target.value)} />
      </label>

      <label className="form__field">
        <span>Año</span>
        <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="—" />
      </label>

      <div className="form__field">
        <span>Portada</span>
        <div className="book-edit__cover-row">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="book-edit__cover" />
          ) : (
            <span className="book-edit__cover book-edit__cover--empty" />
          )}
          <div className="book-edit__cover-actions">
            <button type="button" className="btn btn--outline" onClick={() => setLookingUp(v => !v)}>
              {lookingUp ? <><IconX /> Cancelar búsqueda</> : <><IconImage /> Buscar otra portada</>}
            </button>
            {coverUrl && (
              <button
                type="button"
                className="btn btn--outline btn--danger-outline"
                onClick={() => setCoverUrl('')}
              >
                <IconX /> Quitar portada
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="form__actions">
        <button className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn--primary" onClick={save} disabled={!title.trim()}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
