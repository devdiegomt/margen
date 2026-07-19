import { Link } from 'react-router-dom';
import { useDailyQuote } from '../../hooks/useDailyQuote';

export function DailyQuote() {
  const daily = useDailyQuote();
  if (!daily) return null; // sin notas todavía, o cargando

  const { note, book } = daily;
  const text = note.type === 'cita' && note.quote ? note.quote : note.content;

  return (
    <Link to={`/libro/${note.bookId}`} className="daily">
      <span className="daily__eyebrow">Tu subrayado de hoy</span>
      <p className="daily__text">
        <mark>{text}</mark>
      </p>
      <span className="daily__source">
        {book ? (
          <>
            {book.title}
            {book.author ? ` — ${book.author}` : ''}
            {note.page ? ` · pág. ${note.page}` : ''}
          </>
        ) : (
          'De tus notas'
        )}
      </span>
    </Link>
  );
}
