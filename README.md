# Margen — notas de lectura

App personal para guardar lo más importante de los libros que lees: ideas, citas resaltadas y reflexiones, más una lista de pendientes de lectura. 100% local (IndexedDB vía Dexie), sin backend ni cuentas.

## Correr en desarrollo

```bash
npm install
npm run dev
```

## Desplegar

```bash
npm run build
```

El contenido de `dist/` es estático: sirve en Vercel, Netlify o GitHub Pages tal cual. Usa `HashRouter`, así que no necesitas configurar rewrites.

## Estructura

- `src/db/` — esquema Dexie y tipos (books, notes, pendings)
- `src/hooks/` — capa de datos con `useLiveQuery` (los componentes nunca tocan `db` directo)
- `src/components/` — UI por dominio (books, notes, pendings, layout, ui)
- `src/pages/` — Library, BookDetail, Pendings

## Roadmap

- **v2 (en curso)**: ✅ pomodoro persistente en el Shell, ✅ editar notas · pendiente: búsqueda y tags (el índice `*tags` ya existe)
- **v3**: recordatorios con fecha, exportar notas (Markdown/JSON), estadísticas de lectura, sync con Supabase

## Notas de diseño

Tipografía: Newsreader (títulos y citas) + Archivo (UI). Las citas se renderizan con efecto resaltador amarillo, como un pasaje subrayado en el libro físico. El lomo de color en cada tarjeta indica el estado: azul = leyendo, amarillo = terminado, gris = pendiente.
