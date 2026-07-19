export interface BookSuggestion {
  title: string;
  author?: string;
  year?: number;
  coverUrl?: string;
}

interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

/** Busca en Open Library (sin API key ni cuotas). Devuelve [] si falla: la app nunca depende de esto. */
export async function searchBooks(query: string): Promise<BookSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=title,author_name,first_publish_year,cover_i`
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
    return (data.docs ?? [])
      .filter((d): d is OpenLibraryDoc & { title: string } => Boolean(d.title))
      .map(d => ({
        title: d.title,
        author: d.author_name?.[0],
        year: d.first_publish_year,
        coverUrl: d.cover_i
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
          : undefined,
      }));
  } catch {
    return [];
  }
}
