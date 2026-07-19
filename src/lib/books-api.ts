export interface BookSuggestion {
  title: string;
  author?: string;
  year?: number;
  coverUrl?: string;
}

interface GoogleVolume {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

/** Busca en Google Books (sin API key). Devuelve [] si falla: la app nunca depende de esto. */
export async function searchBooks(query: string): Promise<BookSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&printType=books`
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: GoogleVolume[] };
    return (data.items ?? [])
      .map(v => v.volumeInfo)
      .filter((info): info is NonNullable<GoogleVolume['volumeInfo']> => Boolean(info?.title))
      .map(info => {
        const thumb = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
        return {
          title: info.title!,
          author: info.authors?.[0],
          year: info.publishedDate ? Number(info.publishedDate.slice(0, 4)) || undefined : undefined,
          // Google devuelve http://; forzamos https para no romper la PWA
          coverUrl: thumb?.replace(/^http:\/\//, 'https://'),
        };
      });
  } catch {
    return [];
  }
}
