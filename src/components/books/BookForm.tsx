import { useState } from 'react';
import type { BookStatus } from '../../db/types';

interface Props {
  onSubmit: (data: { title: string; author?: string; status: BookStatus }) => void;
  onCancel: () => void;
}

export function BookForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('leyendo');

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), author: author.trim() || undefined, status });
  };

  return (
    <div className="card form">
      <label className="form__field">
        <span>Título</span>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="El nombre del viento"
        />
      </label>
      <label className="form__field">
        <span>Autor</span>
        <input
          value={author}
          onChange={e => setAuthor(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Patrick Rothfuss"
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
