import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { useBooks } from '../hooks/useBooks';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

const fmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

export function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const tag = params.get('tag') ?? '';
  const { results, allTags } = useSearch(query, tag);
  const { books } = useBooks();

  const bookTitle = (id: string) => books?.find(b => b.id === id)?.title ?? 'Libro eliminado';

  const update = (next: { q?: string; tag?: string }) => {
    const p = new URLSearchParams();
    const q = next.q ?? query;
    const t = next.tag ?? tag;
    if (q) p.set('q', q);
    if (t) p.set('tag', t);
    setParams(p, { replace: true });
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Buscar</h1>
      </div>

      <input
        className="search-input"
        autoFocus
        value={query}
        onChange={e => update({ q: e.target.value })}
        placeholder="Busca en tus notas y citas…"
        aria-label="Buscar en notas"
      />

      {allTags && allTags.length > 0 && (
        <div className="search-tags">
          {allTags.map(t => (
            <button
              key={t}
              className={`tag tag--btn ${tag === t ? 'is-active' : ''}`}
              onClick={() => update({ tag: tag === t ? '' : t })}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {!query && !tag && (
        <EmptyState
          title="Busca entre todo lo que has leído"
          hint="Escribe una palabra o toca un tag. La búsqueda cubre tus notas y las citas textuales."
        />
      )}

      {(query || tag) && results && results.length === 0 && (
        <EmptyState title="Sin resultados" hint="Prueba con otra palabra o revisa el tag activo." />
      )}

      {results && results.length > 0 && (
        <div className="note-list">
          {results.map(n => (
            <Link key={n.id} to={`/libro/${n.bookId}`} className="search-result">
              <header className="note__header">
                <Badge kind={n.type} />
                <span className="search-result__book">{bookTitle(n.bookId)}</span>
                <span className="note__date">{fmt.format(new Date(n.createdAt))}</span>
              </header>
              {n.quote && <p className="search-result__quote">“{n.quote}”</p>}
              {n.content && <p className="search-result__content">{n.content}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
