import type { Pending } from '../../db/types';

export function PendingItem({
  pending,
  bookTitle,
  onToggle,
  onDelete,
}: {
  pending: Pending;
  bookTitle?: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li className={`pending ${pending.done ? 'is-done' : ''}`}>
      <label className="pending__check">
        <input type="checkbox" checked={pending.done === 1} onChange={onToggle} />
        <span className="pending__content">{pending.content}</span>
      </label>
      {bookTitle && <span className="pending__book">{bookTitle}</span>}
      <button className="pending__delete" onClick={onDelete} aria-label="Eliminar pendiente">
        ×
      </button>
    </li>
  );
}
