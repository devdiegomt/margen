-- Margen: esquema de sincronización
-- Correr una sola vez en el SQL Editor de Supabase.
-- Modelo: el cliente es la fuente de verdad (local-first);
-- estas tablas son la réplica de sincronización.

-- ========== Tablas ==========

create table public.books (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  author text,
  status text not null,
  cover_color text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,  -- reloj LWW: lo pone el cliente
  deleted_at timestamptz,           -- tombstone
  synced_at timestamptz not null default now()  -- cursor de pull: lo pone el servidor
);

create table public.notes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_id uuid not null,
  type text not null,
  content text not null default '',
  quote text,
  page integer,
  tags text[] not null default '{}',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);

create table public.pendings (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null,
  done smallint not null default 0,
  book_id uuid,
  due_at text,                       -- fecha local 'YYYY-MM-DD', sin zona horaria
  created_at timestamptz not null,
  completed_at timestamptz,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_ms integer not null,
  synced_at timestamptz not null default now()
);

-- Índices para el pull incremental
create index books_sync_idx on public.books (user_id, synced_at);
create index notes_sync_idx on public.notes (user_id, synced_at);
create index pendings_sync_idx on public.pendings (user_id, synced_at);
create index sessions_sync_idx on public.sessions (user_id, synced_at);

-- ========== synced_at automático en cada upsert ==========

create or replace function public.touch_synced_at()
returns trigger language plpgsql as $$
begin
  new.synced_at = now();
  return new;
end $$;

create trigger books_touch before insert or update on public.books
  for each row execute function public.touch_synced_at();
create trigger notes_touch before insert or update on public.notes
  for each row execute function public.touch_synced_at();
create trigger pendings_touch before insert or update on public.pendings
  for each row execute function public.touch_synced_at();
create trigger sessions_touch before insert or update on public.sessions
  for each row execute function public.touch_synced_at();

-- ========== RLS: cada quien ve solo lo suyo ==========

alter table public.books enable row level security;
alter table public.notes enable row level security;
alter table public.pendings enable row level security;
alter table public.sessions enable row level security;

create policy "own books" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own pendings" on public.pendings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
