import { useState } from 'react';
import { getRecommendations, type Recommendation } from '../../lib/recommend';
import { useBooks } from '../../hooks/useBooks';

export function RecommendCard() {
  const { addBook } = useBooks();
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const ask = async () => {
    setLoading(true);
    setError(null);
    try {
      setRecs(await getRecommendations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.');
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = async (r: Recommendation) => {
    await addBook({ title: r.title, author: r.author, status: 'pendiente' });
    setAdded(prev => new Set(prev).add(r.title));
  };

  return (
    <section className="card data-card recommend">
      <h2>¿Qué leer después?</h2>
      <p>
        Según tus libros, puntuaciones y tags — sin enviar el contenido de tus notas.
      </p>
      <div className="data-card__actions">
        <button className="btn btn--primary" onClick={ask} disabled={loading}>
          {loading ? 'Pensando…' : recs ? 'Otras recomendaciones' : 'Recomiéndame'}
        </button>
      </div>

      {error && <p className="data-card__msg data-card__msg--error">{error}</p>}

      {recs && (
        <ul className="recommend__list">
          {recs.map(r => (
            <li key={r.title} className="recommend__item">
              <div className="recommend__text">
                <strong>{r.title}</strong>
                {r.author && <span className="recommend__author"> — {r.author}</span>}
                {r.reason && <p className="recommend__reason">{r.reason}</p>}
              </div>
              <button
                className="btn btn--ghost recommend__add"
                onClick={() => addToQueue(r)}
                disabled={added.has(r.title)}
              >
                {added.has(r.title) ? 'En la fila ✓' : '+ A la fila'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
