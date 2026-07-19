import type { Book, Note } from '../../db/types';
import { NoteCard } from './NoteCard';
import { EmptyState } from '../ui/EmptyState';

interface Props {
  notes: Note[];
  book?: Book;
  onDelete: (id: string) => void;
  onUpdate: (id: string, changes: { content: string; quote?: string; page?: number; tags: string[] }) => void;
}

export function NoteList({ notes, book, onDelete, onUpdate }: Props) {
  if (notes.length === 0) {
    return (
      <EmptyState
        title="Este libro no tiene notas todavía"
        hint="Escribe la primera arriba: una idea, una cita o una reflexión."
      />
    );
  }
  return (
    <div className="note-list">
      {notes.map(n => (
        <NoteCard
          key={n.id}
          note={n}
          book={book}
          onDelete={() => onDelete(n.id)}
          onUpdate={changes => onUpdate(n.id, changes)}
        />
      ))}
    </div>
  );
}
