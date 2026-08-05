# Margen — push de la cita del día + TWA

## 0. Dependencias nuevas

```bash
npm i -D workbox-precaching workbox-core workbox-routing workbox-strategies workbox-expiration workbox-cacheable-response
```

(Con `injectManifest` el service worker lo compilas tú, así que los módulos de Workbox
pasan a ser dependencias reales del proyecto.)

## 1. Archivos: dónde va cada uno

| Archivo del zip | Destino en `D:\projects\margen` |
|---|---|
| `vite.config.ts` | reemplaza el existente |
| `src/sw.ts` | nuevo |
| `src/lib/push.ts` | nuevo |
| `src/components/account/NotificationsCard.tsx` | nuevo |
| `supabase/2026-08-05-push.sql` | nuevo (correr en el SQL Editor) |
| `supabase/functions/send-daily-quote/index.ts` | nuevo |
| `public/.well-known/assetlinks.json` | nuevo (editar después, paso TWA) |

Y un cambio de dos líneas en `src/pages/Data.tsx`:

```tsx
import { NotificationsCard } from '../components/account/NotificationsCard';
// …y debajo de <AccountCard />:
<NotificationsCard />
```

## 2. Variables de entorno (Vercel + .env.local)

```
VITE_VAPID_PUBLIC_KEY=BAo3TO0BRDMt2esMGV-zf4Qos0uml8O0wB_WqtbJN8EhblVIKiumO3dspZFJgpMTuo91LysiRWn7ZpKRuv2xKl8
```

Redesplegar después de agregarla (Vite la lee en build).

## 3. Supabase

1. Correr `supabase/2026-08-05-push.sql` en el SQL Editor.
2. Secrets (el `VAPID_KEYS` va en una sola línea, con comillas simples en PowerShell):

```bash
npx supabase secrets set VAPID_KEYS='{"publicKey":{"kty":"EC","crv":"P-256","x":"CjdM7QFEMy3Z6wwZX7N_hCizS6aXw7TAH9aq1sk3wSE","y":"blVIKiumO3dspZFJgpMTuo91LysiRWn7ZpKRuv2xKl8","ext":true,"key_ops":["verify"]},"privateKey":{"kty":"EC","crv":"P-256","x":"CjdM7QFEMy3Z6wwZX7N_hCizS6aXw7TAH9aq1sk3wSE","y":"blVIKiumO3dspZFJgpMTuo91LysiRWn7ZpKRuv2xKl8","d":"PTrdKVsFqFs87DFw2CCKF80MAZIU-zSCWCk3FBpeKEc","ext":true,"key_ops":["sign"]}}' --project-ref pyluzzgholbnlbwpubkz

npx supabase secrets set VAPID_SUBJECT='mailto:devdiegomt@gmail.com' --project-ref pyluzzgholbnlbwpubkz

npx supabase secrets set CRON_SECRET='pon-aqui-una-cadena-larga-al-azar' --project-ref pyluzzgholbnlbwpubkz
```

3. Desplegar (ojo al `--no-verify-jwt`: el cron no tiene sesión de usuario):

```bash
npx supabase functions deploy send-daily-quote --no-verify-jwt --project-ref pyluzzgholbnlbwpubkz
```

## 4. Cron (cron-job.org)

- URL: `https://pyluzzgholbnlbwpubkz.supabase.co/functions/v1/send-daily-quote`
- Método: POST
- Cabecera: `x-cron-secret: <el mismo CRON_SECRET>`
- Frecuencia: cada hora, al minuto 0

La función devuelve `{"sent":N,"skipped":N,"removed":N}` — sirve de keep-alive del
proyecto de Supabase, así que ya no necesitas un ping aparte.

## 5. Probar

1. Desplegar el front y abrir Margen **instalada** (no la pestaña).
2. Datos → Cita del día → elegir hora → Activar.
3. Verificar en Supabase → Table Editor → `push_subscriptions` que quedó la fila.
4. Prueba inmediata sin esperar: cambiar `hour_local` a la hora UTC-local actual y
   dejar `last_sent_date` en null, luego invocar la función a mano con curl y el
   header del secreto.

## 6. TWA / Play Store

1. **PWABuilder**: entrar a pwabuilder.com, pegar la URL de Vercel, sección Android →
   *Generate Package*. Elegir el modo **Trusted Web Activity**.
2. Descargar el zip: trae el `.aab` (para subir), el `.apk` (para probar) y el
   `signing-key-info.txt` con el **fingerprint SHA-256** y el keystore.
   Guardar el keystore: si se pierde, no se puede actualizar la app nunca más.
3. Copiar el `package_name` y el fingerprint en `public/.well-known/assetlinks.json`,
   commit y redeploy. Verificar que `https://tu-dominio/.well-known/assetlinks.json`
   responda el JSON — sin esto, la app abre con barra de navegador.
4. Play Console (US$25 pago único): crear la app, subir el `.aab`, llenar ficha,
   política de privacidad (obligatoria) y el cuestionario de contenido.
