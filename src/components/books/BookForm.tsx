import { useEffect, useRef, useState } from 'react';
import type { BookStatus } from '../../db/types';
import { searchBooks, type BookSuggestion } from '../../lib/books-api';

interface Props {
  onSubmit: (data: {
    title: string;
    author?: string;
    status: BookStatus;
    coverUrl?: string;
    year?: number;
  }) => void;
  onCancel: () => void;
}

export function BookForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('leyendo');
  const [picked, setPicked] = useState<BookSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number>();

  // Autocompletado con debounce; si el usuario ya eligió, no volvemos a buscar
  useEffect(() => {
    if (picked || title.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const results = await searchBooks(title);
      setSuggestions(results);
      setSearching(false);
    }, 400);
    return () => window.clearTimeout(debounceRef.current);
  }, [title, picked]);

  const pick = (s: BookSuggestion) => {
    setPicked(s);
    setTitle(s.title);
    if (s.author) setAuthor(s.author);
    setSuggestions([]);
  };

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      author: author.trim() || undefined,
      status,
      coverUrl: picked?.coverUrl,
      year: picked?.year,
    });
  };

  return (
    <div className="card form">
      <label className="form__field form__field--suggest">
        <span>Título</span>
        <input
          autoFocus
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            setPicked(null);
          }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Empieza a escribir y te sugerimos…"
        />
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
                    <small>
                      {[s.author, s.year].filter(Boolean).join(' · ')}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>
      <label className="form__field">
        <span>Autor</span>
        <input
          value={author}
          onChange={e => setAuthor(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Se completa solo al elegir una sugerencia"
        />
      </label>
      <label className="form__field">
        <span>Estado</span>
        <select value={status} onChange={e => setStatus(e.target.value as BookStatus)}>
          <option value="leyendo">Leyendo</option>
          <option value="pendiente">Pendiente</option>
          <option value="terminado">Terminado</option>
        </select>
      </label>
      <div className="form__actions">
        <button className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn--primary" onClick={submit} disabled={!title.trim()}>
          Agregar libro
        </button>
      </div>
    </div>
  );
}
