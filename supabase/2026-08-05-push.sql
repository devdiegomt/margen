-- Margen: suscripciones de notificaciones push
-- Correr en el SQL Editor de Supabase.

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  hour_local smallint not null default 8,        -- hora local preferida (0-23)
  utc_offset_minutes integer not null default 0, -- offset del dispositivo al suscribirse
  last_sent_date text,                           -- 'YYYY-MM-DD' local: evita duplicados
  created_at timestamptz not null default now()
);

create index if not exists push_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Cada quien gestiona sus propias suscripciones.
-- La Edge Function usa la service_role key, que salta RLS para poder enviar a todos.
create policy "own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
