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

- **v2 (completa)**: ✅ pomodoro persistente en el Shell, ✅ editar notas, ✅ búsqueda global y tags
- **v3 (completa)**: ✅ exportar/importar (respaldo JSON con merge, Markdown por libro), ✅ pendientes con fecha límite, ✅ estadísticas de enfoque (tabla `sessions`)
- **v4 (completa)**: ✅ PWA instalable offline, ✅ sync con Supabase (local-first, LWW, tombstones, OTP por correo)
- **v5 (rumbo a Play Store)**: ✅ portadas y metadata (Google Books) + puntuación personal · siguientes: cita del día con notificación, compartir citas como imagen, recomendaciones IA, empaquetado TWA

## Sincronización (Supabase)

Local-first: IndexedDB es la fuente de verdad y Supabase la réplica. Push/pull incremental con last-write-wins por `updatedAt`; los borrados son suaves (tombstones `deletedAt`) para propagarse entre dispositivos. Auth por código OTP al correo.

Setup:
1. Crear proyecto en Supabase y correr `supabase/schema.sql` en el SQL Editor
2. En Authentication → Email Templates, editar la plantilla *Magic Link* para incluir el código: `{{ .Token }}`
3. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Vercel → Environment Variables, o `.env.local`)
4. Redesplegar. Sin las variables, la app compila y funciona en modo 100% local (el código de sync se elimina del bundle)

## PWA / Play Store

La app es una PWA instalable: manifest + service worker (Workbox, precache del shell completo → funciona offline). Los íconos se generan desde `icons-src/icon.svg` con `node icons-src/generate.mjs`.

Para publicar en Play Store: empaquetar como TWA con [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) o [PWABuilder](https://www.pwabuilder.com) apuntando al dominio de Vercel, y subir el `.aab` a Play Console (requiere el archivo `assetlinks.json` en `public/.well-known/` para verificar el dominio).

## Notas de diseño

Tipografía: Newsreader (títulos y citas) + Archivo (UI). Las citas se renderizan con efecto resaltador amarillo, como un pasaje subrayado en el libro físico. El lomo de color en cada tarjeta indica el estado: azul = leyendo, amarillo = terminado, gris = pendiente.
