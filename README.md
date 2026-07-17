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
- **v4 (en curso)**: ✅ PWA instalable con soporte offline (vite-plugin-pwa, autoUpdate) · pendiente: empaquetar para Play Store (TWA con Bubblewrap/PWABuilder), sync con Supabase, notificaciones

## PWA / Play Store

La app es una PWA instalable: manifest + service worker (Workbox, precache del shell completo → funciona offline). Los íconos se generan desde `icons-src/icon.svg` con `node icons-src/generate.mjs`.

Para publicar en Play Store: empaquetar como TWA con [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) o [PWABuilder](https://www.pwabuilder.com) apuntando al dominio de Vercel, y subir el `.aab` a Play Console (requiere el archivo `assetlinks.json` en `public/.well-known/` para verificar el dominio).

## Notas de diseño

Tipografía: Newsreader (títulos y citas) + Archivo (UI). Las citas se renderizan con efecto resaltador amarillo, como un pasaje subrayado en el libro físico. El lomo de color en cada tarjeta indica el estado: azul = leyendo, amarillo = terminado, gris = pendiente.
