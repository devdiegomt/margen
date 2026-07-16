import { Link } from 'react-router-dom';
import type { Book } from '../../db/types';
import { Badge } from '../ui/Badge';

export function BookCard({ book, noteCount }: { book: Book; noteCount: number }) {
  return (
    <Link to={`/libro/${book.id}`} className={`book-card book-card--${book.status}`}>
      <div className="book-card__spine" aria-hidden="true" />
      <div className="book-card__body">
        <h3 className="book-card__title">{book.title}</h3>
        {book.author && <p className="book-card__author">{book.author}</p>}
        <div className="book-card__meta">
          <Badge kind={book.status} />
          <span className="book-card__notes">
            {noteCount} {noteCount === 1 ? 'nota' : 'notas'}
          </span>
        </div>
      </div>
    </Link>
  );
}
