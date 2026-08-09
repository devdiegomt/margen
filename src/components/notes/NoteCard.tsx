import { useState } from 'react';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';
import type { Book, Note } from '../../db/types';
import { Badge } from '../ui/Badge';
import { TagInput } from '../ui/TagInput';
import { parseTags } from '../../lib/tags';
import { shareQuoteImage } from '../../lib/quote-image';

const fmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

interface Props {
  note: Note;
  book?: Book;
  onDelete: () => void;
  onUpdate: (changes: { content: string; quote?: string; page?: number; tags: string[] }) => void;
}

/* Íconos en línea: sin dependencias y legibles a cualquier tamaño */
const IconShare = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M12 15V3" />
    <path d="m8 7 4-4 4 4" />
  </svg>
);
const IconEdit = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
  </svg>
);

export function NoteCard({ note, book, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [quote, setQuote] = useState(note.quote ?? '');
  const [page, setPage] = useState(note.page ? String(note.page) : '');
  const [tags, setTags] = useState(note.tags.join(', '));

  const startEdit = () => {
    setContent(note.content);
    setQuote(note.quote ?? '');
    setPage(note.page ? String(note.page) : '');
    setTags(note.tags.join(', '));
    setEditing(true);
  };

  const save = () => {
    if (note.type === 'cita' && !quote.trim()) return;
    if (note.type !== 'cita' && !content.trim()) return;
    onUpdate({
      content: content.trim(),
      quote: note.type === 'cita' ? quote.trim() : undefined,
      page: page ? Number(page) : undefined,
      tags: parseTags(tags),
    });
    setEditing(false);
  };

  const share = async () => {
    setSharing(true);
    try {
      await shareQuoteImage(note, book);
    } finally {
      setSharing(false);
    }
  };

  return (
    <article className={`note note--${note.type}`}>
      <header className="note__header">
        <Badge kind={note.type} />
        {!editing && note.page && <span className="note__page">pág. {note.page}</span>}
        <span className="note__date">{fmt.format(new Date(note.createdAt))}</span>
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
            <TagInput value={tags} onChange={setTags} />
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
          {note.tags.length > 0 && (
            <div className="note__tags">
              {note.tags.map(t => (
                <Link key={t} to={`/buscar?tag=${encodeURIComponent(t)}`} className="tag">
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {/* Acciones con etiqueta: en móvil no hay hover que revele tooltips */}
          <footer className="note__actions">
            <button className="note-action" onClick={share} disabled={sharing}>
              <IconShare />
              {sharing ? 'Generando…' : 'Compartir imagen'}
            </button>
            <button className="note-action" onClick={startEdit}>
              <IconEdit />
              Editar
            </button>
            <button
              className="note-action note-action--danger"
              onClick={() => {
                if (confirm('¿Eliminar esta nota?')) onDelete();
              }}
            >
              <IconTrash />
              Eliminar
            </button>
          </footer>
        </>
      )}
    </article>
  );
}
