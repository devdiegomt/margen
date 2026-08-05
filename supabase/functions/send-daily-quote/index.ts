// Edge Function: envía la cita del día por push.
// La llama un cron cada hora; ella decide a quién le toca según su hora local.
//
// Desplegar (sin verificación de JWT: la protege CRON_SECRET):
//   npx supabase functions deploy send-daily-quote --no-verify-jwt --project-ref TU_REF
// Secrets:
//   npx supabase secrets set VAPID_KEYS='{"publicKey":...}' --project-ref TU_REF
//   npx supabase secrets set VAPID_SUBJECT='mailto:tu@correo.com' --project-ref TU_REF
//   npx supabase secrets set CRON_SECRET='una-cadena-larga-al-azar' --project-ref TU_REF

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as webpush from 'jsr:@negrel/webpush@0.3';

interface Subscription {
  endpoint: string;
  user_id: string;
  p256dh: string;
  auth: string;
  hour_local: number;
  utc_offset_minutes: number;
  last_sent_date: string | null;
}

interface NoteRow {
  id: string;
  book_id: string;
  type: string;
  content: string;
  quote: string | null;
  deleted_at: string | null;
}

/** Mismo hash que en el cliente: la cita del día es estable e igual en todos lados. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Fecha y hora locales del suscriptor, a partir de su offset. */
function localNow(offsetMinutes: number) {
  const local = new Date(Date.now() + offsetMinutes * 60_000);
  const date = local.toISOString().slice(0, 10); // seguro: ya desplazamos el instante
  return { date, hour: local.getUTCHours() };
}

Deno.serve(async (req) => {
  // Puerta: solo el cron con el secreto correcto
  const secret = Deno.env.get('CRON_SECRET');
  const provided = req.headers.get('x-cron-secret');
  if (!secret || provided !== secret) {
    return new Response('No autorizado', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const appServer = await webpush.ApplicationServer.new({
    contactInformation: Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hola@margen.app',
    vapidKeys: await webpush.importVapidKeys(JSON.parse(Deno.env.get('VAPID_KEYS')!)),
  });

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let removed = 0;

  for (const sub of (subs ?? []) as Subscription[]) {
    const { date, hour } = localNow(sub.utc_offset_minutes);

    // ¿le toca ahora y no le hemos enviado hoy?
    if (hour !== sub.hour_local || sub.last_sent_date === date) {
      skipped++;
      continue;
    }

    // Elegir la cita del día entre las notas sincronizadas de ese usuario
    const { data: notes } = await supabase
      .from('notes')
      .select('id, book_id, type, content, quote, deleted_at')
      .eq('user_id', sub.user_id)
      .is('deleted_at', null);

    const rows = (notes ?? []) as NoteRow[];
    const pool = rows.filter(n => n.type === 'cita' && n.quote);
    const candidates = pool.length > 0 ? pool : rows.filter(n => n.content);
    if (candidates.length === 0) {
      skipped++;
      continue;
    }

    candidates.sort((a, b) => a.id.localeCompare(b.id));
    const pick = candidates[hashString(date) % candidates.length];
    const text = (pick.type === 'cita' && pick.quote ? pick.quote : pick.content).trim();

    const { data: book } = await supabase
      .from('books')
      .select('title')
      .eq('id', pick.book_id)
      .maybeSingle();

    const payload = JSON.stringify({
      title: book?.title ? `De "${book.title}"` : 'Tu subrayado de hoy',
      body: text.length > 180 ? `${text.slice(0, 177)}…` : text,
      bookId: pick.book_id,
    });

    try {
      const subscriber = appServer.subscribe({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      });
      await subscriber.pushTextMessage(payload, { ttl: 60 * 60 * 12 });

      await supabase
        .from('push_subscriptions')
        .update({ last_sent_date: date })
        .eq('endpoint', sub.endpoint);
      sent++;
    } catch (err) {
      // 404/410 = el navegador ya no acepta esa suscripción: la limpiamos
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('404') || msg.includes('410') || msg.includes('gone')) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        removed++;
      } else {
        console.error('push falló', sub.endpoint, msg);
      }
    }
  }

  return new Response(JSON.stringify({ sent, skipped, removed }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
