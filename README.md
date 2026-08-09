# Margen — notas de lectura

<p align="center">
  <strong>Goodreads te dice qué leen otros. Margen recuerda lo que los libros te dejaron.</strong>
</p>

Aplicación web para capturar lo que te marca de los libros que lees —ideas, citas resaltadas y
reflexiones— y devolvértelo cuando ya lo habías olvidado. Local-first: funciona completa sin
conexión y sin cuenta; la sincronización y la IA son capas opcionales encima.

**En producción:** [margen-page.vercel.app](https://margen-page.vercel.app) · PWA instalable ·
[Política de privacidad](https://margen-page.vercel.app/privacidad.html)

---

## Qué hace

| | |
|---|---|
| **Notas con tipo** | Cada nota es una *idea*, una *cita* textual o una *reflexión*, y se renderiza distinto según su naturaleza. Soporta Markdown y etiquetas. |
| **Metadata automática** | Al escribir el título, autocompleta portada, autor y año desde Open Library. |
| **Cita del día** | Cada día resurge uno de tus subrayados, elegido de forma determinista para que sea el mismo en todos tus dispositivos. Opcionalmente llega como notificación push. |
| **Compartir como imagen** | Cualquier nota se convierte en una imagen 1080×1350 con la identidad visual de la app, lista para redes. |
| **Recomendaciones IA** | Sugiere qué leer después a partir de tus puntuaciones y etiquetas — sin enviar el contenido de tus notas. |
| **Sesiones de lectura** | Temporizador 25/5 con estadísticas semanales de enfoque. |
| **Pendientes** | Temas por retomar, con fecha límite opcional y asociación a un libro. |
| **Tus datos, tuyos** | Respaldo completo en JSON (importable) y exportación por libro en Markdown. |

## Arquitectura

**Local-first.** IndexedDB (vía Dexie) es la fuente de verdad; Supabase es una réplica de
sincronización. La app nunca depende de la red: si no hay conexión, cuenta o configuración de
Supabase, todo funciona igual.

- **Sincronización**: push/pull incremental. `updatedAt` lo escribe el cliente y resuelve
  conflictos por *last-write-wins*; `synced_at` lo escribe el servidor y sirve de cursor para
  bajar solo lo que cambió. Los borrados son suaves (*tombstones*) para propagarse entre
  dispositivos. Se dispara sola al abrir la app, al volver a ella, al recuperar conexión y tras
  cada cambio local con *debounce*.
- **Auth**: código OTP al correo, sin contraseñas.
- **PWA**: service worker propio (`injectManifest`) con precache del shell, portadas y
  tipografías, más los manejadores de `push` y `notificationclick`.
- **Notificaciones**: VAPID + Supabase Edge Function invocada por un cron cada hora, que decide
  a quién le toca según su hora local. El mismo hash de fecha que usa el cliente garantiza que
  la notificación y la app muestren la misma cita.

### Stack

React · TypeScript · Vite · Dexie/IndexedDB · vite-plugin-pwa (Workbox) · Supabase
(Postgres, Auth, Edge Functions) · Groq (`llama-3.3-70b-versatile`) · Open Library · Vercel

### Estructura

```
src/
├── db/           esquema Dexie y tipos (books, notes, pendings, sessions, meta)
├── hooks/        capa de datos con useLiveQuery — los componentes nunca tocan db directo
├── lib/          sync, autosync, push, exportación, imagen de citas, APIs externas
├── components/   UI por dominio (books, notes, pendings, pomodoro, onboarding, layout, ui)
├── pages/        Library, BookDetail, Pendings, Search, Focus, Data
└── sw.ts         service worker (precache + push)
supabase/
├── schema.sql    tablas de sincronización con RLS
├── *.sql         migraciones posteriores
└── functions/    recommend · send-daily-quote
```

## Puesta en marcha

```bash
npm install
npm run dev
```

Sin variables de entorno la app arranca en modo 100% local — Vite elimina el cliente de
Supabase del bundle por *tree-shaking*.

### Variables de entorno

Copia `.env.example` a `.env.local` (o configúralas en Vercel → Environment Variables):

| Variable | Para qué |
|---|---|
| `VITE_SUPABASE_URL` | Proyecto de Supabase (Settings → Data API) |
| `VITE_SUPABASE_ANON_KEY` | Publishable key (Settings → API Keys) |
| `VITE_VAPID_PUBLIC_KEY` | Clave pública de push. Sin ella, la sección de notificaciones se oculta |

> Vite lee las variables **en build**: tras cambiarlas en Vercel hay que redesplegar.

### Backend (opcional)

1. Correr `supabase/schema.sql` y las migraciones de `supabase/*.sql` en el SQL Editor.
2. **SMTP propio** (Resend, Brevo…) en Authentication → Emails. Sin él, las plantillas quedan
   bloqueadas y el correo llega sin el código.
3. Editar las plantillas *Magic Link* **y** *Confirm signup* para que incluyan `{{ .Token }}`
   y quitar el enlace de confirmación: el flujo es por código, no por enlace.
4. Desplegar las funciones y configurar sus secretos:

```bash
npx supabase functions deploy recommend --project-ref TU_REF
npx supabase functions deploy send-daily-quote --no-verify-jwt --project-ref TU_REF
```

| Secreto | Función |
|---|---|
| `GROQ_API_KEY` | `recommend` |
| `VAPID_KEYS` (JWK), `VAPID_SUBJECT`, `CRON_SECRET` | `send-daily-quote` |

5. Programar un cron horario que haga POST a `send-daily-quote` con la cabecera
   `x-cron-secret`. De paso evita que el proyecto gratuito de Supabase se pause por inactividad.

## Android (TWA)

La app se empaqueta con [PWABuilder](https://www.pwabuilder.com) como *Trusted Web Activity*.
El `package_name` y el fingerprint SHA-256 deben coincidir en Play Console, en el paquete y en
`public/.well-known/assetlinks.json`.

> Con **Play App Signing** activo, Google re-firma la app: el fingerprint válido es el de
> Play Console → Integridad de la app, no el del keystore local. Si no coincide, la app abre
> con la barra del navegador visible.

Los cambios en la app web **no requieren nueva versión en Play Store**: el TWA solo es un
contenedor y cada despliegue en Vercel llega a los usuarios automáticamente. Solo hay que
resubir el `.aab` si cambian el nombre, el ícono, el dominio o el `targetSdkVersion`.

## Decisiones de diseño

Tipografía Newsreader para el contenido y Archivo para la interfaz. Las citas se renderizan
con efecto de resaltador amarillo, como un pasaje subrayado en el libro físico, y ese mismo
lenguaje visual se traslada a las imágenes exportadas. El lomo de color de cada tarjeta indica
el estado: azul si lo estás leyendo, amarillo si lo terminaste, gris si está en la fila.

Se dejaron fuera deliberadamente las funciones sociales (foros, puntuaciones colectivas):
Margen es memoria personal de lectura, no un catálogo comunitario.

## Licencia

MIT — ver [LICENSE](LICENSE).
