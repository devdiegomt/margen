import { supabase } from './supabase';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** La clave VAPID viaja en base64url; el navegador la pide como Uint8Array. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(VAPID_PUBLIC)
  );
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/** Pide permiso, se suscribe en el navegador y guarda la suscripción en Supabase. */
export async function enablePush(hourLocal: number): Promise<void> {
  if (!supabase) throw new Error('Configura Supabase para recibir notificaciones.');
  if (!pushSupported()) throw new Error('Este navegador no soporta notificaciones push.');

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Inicia sesión para activar las notificaciones.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permiso denegado. Actívalo en los ajustes del navegador si cambias de opinión.');
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC!) as BufferSource,
    }));

  const json = sub.toJSON() as { keys?: { p256dh?: string; auth?: string } };
  if (!json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('El navegador no entregó las claves de la suscripción.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: sub.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    hour_local: hourLocal,
    // getTimezoneOffset devuelve minutos *restados*: en Bogotá es 300, el offset real es -300
    utc_offset_minutes: -new Date().getTimezoneOffset(),
  });
  if (error) throw new Error(`No se pudo guardar la suscripción: ${error.message}`);
}

/** Actualiza solo la hora, sin volver a pedir permiso. */
export async function updateHour(hourLocal: number): Promise<void> {
  if (!supabase) return;
  const sub = await currentSubscription();
  if (!sub) return;
  await supabase
    .from('push_subscriptions')
    .update({ hour_local: hourLocal, utc_offset_minutes: -new Date().getTimezoneOffset() })
    .eq('endpoint', sub.endpoint);
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  if (supabase) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  }
  await sub.unsubscribe();
}
