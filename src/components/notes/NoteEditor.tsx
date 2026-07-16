import { useState } from 'react';
import type { NoteType } from '../../db/types';
import { TagInput, parseTags } from '../ui/TagInput';

interface Props {
  onSubmit: (data: { type: NoteType; content: string; quote?: string; page?: number; tags?: string[] }) => void;
}

const TYPES: { value: NoteType; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'cita', label: 'Cita' },
  { value: 'reflexion', label: 'Reflexión' },
];

export function NoteEditor({ onSubmit }: Props) {
  const [type, setType] = useState<NoteType>('idea');
  const [content, setContent] = useState('');
  const [quote, setQuote] = useState('');
  const [page, setPage] = useState('');
  const [tags, setTags] = useState('');

  const canSubmit = type === 'cita' ? quote.trim().length > 0 : content.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      type,
      content: content.trim(),
      quote: type === 'cita' ? quote.trim() : undefined,
      page: page ? Number(page) : undefined,
      tags: parseTags(tags),
    });
    setContent('');
    setQuote('');
    setPage('');
    setTags('');
  };

  return (
    <div className="editor">
      <div className="editor__types" role="tablist" aria-label="Tipo de nota">
        {TYPES.map(t => (
          <button
            key={t.value}
            role="tab"
            aria-selected={type === t.value}
            className={`editor__type ${type === t.value ? 'is-active' : ''}`}
            onClick={() => setType(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type === 'cita' && (
        <textarea
          className="editor__quote"
          value={quote}
          onChange={e => setQuote(e.target.value)}
          placeholder="Copia aquí el pasaje del libro…"
          rows={3}
        />
      )}

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={
          type === 'cita'
            ? 'Tu comentario sobre la cita (opcional, soporta Markdown)'
            : type === 'idea'
              ? 'Lo más importante, en tus palabras (soporta Markdown)'
              : '¿Qué te hizo pensar o sentir? (soporta Markdown)'
        }
        rows={4}
      />

      <div className="editor__footer">
        <TagInput value={tags} onChange={setTags} />
        <label className="editor__page">
          <span>pág.</span>
          <input
            type="number"
            min="1"
            value={page}
            onChange={e => setPage(e.target.value)}
            placeholder="—"
          />
        </label>
        <button className="btn btn--primary" onClick={submit} disabled={!canSubmit}>
          Guardar nota
        </button>
      </div>
    </div>
  );
}
