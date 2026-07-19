import { db } from '../db/db';
import { supabase } from './supabase';

export interface Recommendation {
  title: string;
  author?: string;
  reason?: string;
}

/**
 * Perfil compacto del lector: lo suficiente para recomendar bien,
 * sin enviar el texto de las notas (privacidad + menos tokens).
 */
async function buildProfile() {
  const books = (await db.books.filter(b => !b.deletedAt).toArray()).map(b => ({
    title: b.title,
    author: b.author,
    status: b.status,
    rating: b.rating,
  }));

  const tagCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  await db.notes.filter(n => !n.deletedAt).each(n => {
    typeCounts[n.type] = (typeCounts[n.type] ?? 0) + 1;
    for (const t of n.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag, count]) => ({ tag, count }));

  return { books: books.slice(0, 60), topTags, noteTypes: typeCounts };
}

export async function getRecommendations(): Promise<Recommendation[]> {
  if (!supabase) throw new Error('Configura Supabase para usar recomendaciones.');
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Inicia sesión (en Datos) para pedir recomendaciones.');

  const profile = await buildProfile();
  if (profile.books.length === 0) {
    throw new Error('Agrega al menos un libro para poder recomendarte.');
  }

  const { data, error } = await supabase.functions.invoke('recommend', {
    body: { profile },
  });
  if (error) throw new Error(`No se pudo obtener recomendaciones: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  const recs = (data?.recommendations ?? []) as Recommendation[];
  if (recs.length === 0) throw new Error('La respuesta llegó vacía. Intenta de nuevo.');
  return recs.slice(0, 3);
}
