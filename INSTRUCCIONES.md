# Margen v6 — onboarding + sincronización automática

## Archivos nuevos

| Archivo | Destino |
|---|---|
| `src/components/onboarding/Onboarding.tsx` | nuevo |
| `src/lib/autosync.ts` | nuevo |
| `src/hooks/useAutoSync.ts` | nuevo |
| `src/components/layout/SyncIndicator.tsx` | nuevo |
| `src/components/layout/Shell.tsx` | reemplaza |
| `src/components/layout/Nav.tsx` | reemplaza |
| `estilos-nuevos.css` | pegar su contenido al final de `src/styles.css` |

## Cambio manual en `src/pages/Library.tsx`

1. Importar:

```tsx
import { Onboarding } from '../components/onboarding/Onboarding';
```

2. Reemplazar el `<EmptyState .../>` de "Tu biblioteca está vacía" por `<Onboarding />`,
   y ponerlo justo **antes** de `<DailyQuote />`:

```tsx
<Onboarding />
<DailyQuote />
```

   (El `EmptyState` de la biblioteca vacía ya no hace falta: el onboarding lo reemplaza.
   Si el import de `EmptyState` queda sin usar, bórralo o TypeScript se quejará por
   `noUnusedLocals`.)

## Notas

- El onboarding es progresivo: bienvenida → empujón a la primera nota → tips descartables.
  El descarte se guarda en `localStorage` (`margen:tips-dismissed`), no se sincroniza.
- El auto-sync no hace nada si no hay sesión, si no hay internet o si Supabase no está
  configurado. Nunca lanza errores hacia la UI.
- El botón "Sincronizar ahora" de Datos sigue funcionando igual, como respaldo manual.
