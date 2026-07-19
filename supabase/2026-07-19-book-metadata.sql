-- Margen: metadata de libros + puntuación personal
-- Correr en el SQL Editor (los campos son opcionales: el sync viejo no se rompe)
alter table public.books
  add column if not exists cover_url text,
  add column if not exists year integer,
  add column if not exists rating smallint check (rating between 1 and 5);
