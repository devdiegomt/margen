export type BookStatus = 'pendiente' | 'leyendo' | 'terminado';
export type NoteType = 'idea' | 'cita' | 'reflexion';

export interface Book {
  id: string;
  title: string;
  author?: string;
  status: BookStatus;
  coverColor?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  bookId: string;
  type: NoteType;
  content: string;
  quote?: string;
  page?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Pending {
  id: string;
  content: string;
  done: 0 | 1; // Dexie no indexa booleanos de forma fiable
  bookId?: string;
  dueAt?: string; // fecha 'YYYY-MM-DD'
  createdAt: string;
  completedAt?: string;
}

export interface Session {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
}
