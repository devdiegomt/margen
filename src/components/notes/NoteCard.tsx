import { useState } from 'react';
import Markdown from 'react-markdown';
import type { Note } from '../../db/types';
import { Badge } from '../ui/Badge';

const fmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

interface Props {
  note: Note;
  onDelete: () => void;
  onUpdate: (changes: { content: string; quote?: string; page?: number }) => void;
}

export function NoteCard({ note, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [quote, setQuote] = useState(note.quote ?? '');
  const [page, setPage] = useState(note.page ? String(note.page) : '');

  const startEdit = () => {
    setContent(note.content);
    setQuote(note.quote ?? '');
    setPage(note.page ? String(note.page) : '');
    setEditing(true);
  };

  const save = () => {
    if (note.type === 'cita' && !quote.trim()) return;
    if (note.type !== 'cita' && !content.trim()) return;
    onUpdate({
      content: content.trim(),
      quote: note.type === 'cita' ? quote.trim() : undefined,
      page: page ? Number(page) : undefined,
    });
    setEditing(false);
  };

  return (
    <article className={`note note--${note.type}`}>
      <header className="note__header">
        <Badge kind={note.type} />
        {!editing && note.page && <span className="note__page">pág. {note.page}</span>}
        <span className="note__date">{fmt.format(new Date(note.createdAt))}</span>
        {!editing && (
          <button className="note__action" onClick={startEdit} aria-label="Editar nota">
            ✎
          </button>
        )}
        <button className="note__delete" onClick={onDelete} aria-label="Eliminar nota">
          ×
        </button>
      </header>

      {editing ? (
        <div className="note__edit">
          {note.type === 'cita' && (
            <textarea
              className="editor__quote"
              value={quote}
              onChange={e => setQuote(e.target.value)}
              rows={3}
            />
          )}
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} />
          <div className="note__edit-footer">
            <label className="editor__page">
              <span>pág.</span>
              <input type="number" min="1" value={page} onChange={e => setPage(e.target.value)} placeholder="—" />
            </label>
            <div className="note__edit-actions">
              <button className="btn btn--ghost" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn btn--primary" onClick={save}>Guardar cambios</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {note.type === 'cita' && note.quote && (
            <blockquote className="note__quote">
              <mark>{note.quote}</mark>
            </blockquote>
          )}
          {note.content && (
            <div className="note__content">
              <Markdown>{note.content}</Markdown>
            </div>
          )}
        </>
      )}
    </article>
  );
}
