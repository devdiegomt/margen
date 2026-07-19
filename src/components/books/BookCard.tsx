import { Link } from 'react-router-dom';
import type { Book } from '../../db/types';
import { Badge } from '../ui/Badge';
import { Rating } from './Rating';

export function BookCard({ book, noteCount }: { book: Book; noteCount: number }) {
  return (
    <Link to={`/libro/${book.id}`} className={`book-card book-card--${book.status}`}>
      {book.coverUrl ? (
        <img src={book.coverUrl} alt="" className="book-card__cover" loading="lazy" />
      ) : (
        <div className="book-card__spine" aria-hidden="true" />
      )}
      <div className="book-card__body">
        <h3 className="book-card__title">{book.title}</h3>
        {book.author && (
          <p className="book-card__author">
            {book.author}{book.year ? ` · ${book.year}` : ''}
          </p>
        )}
        {book.rating ? <Rating value={book.rating} /> : null}
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
