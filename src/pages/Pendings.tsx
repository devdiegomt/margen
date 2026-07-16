import { useState } from 'react';
import { usePendings } from '../hooks/usePendings';
import { useBooks } from '../hooks/useBooks';
import { PendingItem } from '../components/pendings/PendingItem';
import { EmptyState } from '../components/ui/EmptyState';

export function Pendings() {
  const { pendings, addPending, togglePending, deletePending } = usePendings();
  const { books } = useBooks();
  const [content, setContent] = useState('');
  const [bookId, setBookId] = useState('');

  const submit = () => {
    if (!content.trim()) return;
    addPending(content.trim(), bookId || undefined);
    setContent('');
    setBookId('');
  };

  const open = pendings?.filter(p => !p.done) ?? [];
  const done = pendings?.filter(p => p.done) ?? [];
  const bookTitle = (id?: string) => books?.find(b => b.id === id)?.title;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Pendientes</h1>
      </div>

      <div className="pending-form">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Releer el capítulo 3, buscar la biografía del autor…"
        />
        <select value={bookId} onChange={e => setBookId(e.target.value)} aria-label="Asociar a un libro">
          <option value="">Sin libro</option>
          {books?.map(b => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
        <button className="btn btn--primary" onClick={submit} disabled={!content.trim()}>
          Agregar
        </button>
      </div>

      {open.length === 0 && done.length === 0 && (
        <EmptyState title="Nada pendiente" hint="Anota aquí los temas que no quieres olvidar." />
      )}

      {open.length > 0 && (
        <ul className="pending-list">
          {open.map(p => (
            <PendingItem
              key={p.id}
              pending={p}
              bookTitle={bookTitle(p.bookId)}
              onToggle={() => togglePending(p.id, p.done)}
              onDelete={() => deletePending(p.id)}
            />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <h2 className="pending-list__done-title">Completados</h2>
          <ul className="pending-list pending-list--done">
            {done.map(p => (
              <PendingItem
                key={p.id}
                pending={p}
                bookTitle={bookTitle(p.bookId)}
                onToggle={() => togglePending(p.id, p.done)}
                onDelete={() => deletePending(p.id)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
