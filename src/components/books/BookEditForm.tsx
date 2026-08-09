import { useState } from 'react';
import type { Book } from '../../db/types';

interface Props {
  book: Book;
  onSave: (changes: { title: string; author?: string; year?: number; coverUrl?: string }) => void;
  onCancel: () => void;
}

/** Corrige los datos de un libro cuando el autocompletado no acertó. */
export function BookEditForm({ book, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author ?? '');
  const [year, setYear] = useState(book.year ? String(book.year) : '');
  const [coverUrl, setCoverUrl] = useState(book.coverUrl ?? '');

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      author: author.trim() || undefined,
      year: year ? Number(year) : undefined,
      coverUrl: coverUrl.trim() || undefined,
    });
  };

  return (
    <div className="card form">
      <label className="form__field">
        <span>Título</span>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} />
      </label>
      <label className="form__field">
        <span>Autor</span>
        <input value={author} onChange={e => setAuthor(e.target.value)} />
      </label>
      <label className="form__field">
        <span>Año</span>
        <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="—" />
      </label>
      <label className="form__field">
        <span>URL de portada</span>
        <input
          value={coverUrl}
          onChange={e => setCoverUrl(e.target.value)}
          placeholder="Déjalo vacío para usar el lomo de color"
        />
      </label>
      <div className="form__actions">
        <button className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn--primary" onClick={submit} disabled={!title.trim()}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
