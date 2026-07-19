import { useEffect, useState } from 'react';
import type { Session as AuthSession } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { syncNow } from '../../lib/sync';

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; text: string }
  | { kind: 'ok'; text: string }
  | { kind: 'error'; text: string };

export function AccountCard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const sb = supabase;
  if (!sb) {
    return (
      <div className="card data-card">
        <h2>Sincronización</h2>
        <p>
          Para sincronizar entre dispositivos, configura las variables{' '}
          <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (en Vercel o en un{' '}
          <code>.env.local</code>) y vuelve a desplegar. Sin ellas, la app funciona normal en modo local.
        </p>
      </div>
    );
  }

  const sendCode = async () => {
    setStatus({ kind: 'busy', text: 'Enviando código…' });
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) setStatus({ kind: 'error', text: error.message });
    else {
      setCodeSent(true);
      setStatus({ kind: 'ok', text: 'Código enviado. Revisa tu correo (y el spam).' });
    }
  };

  const verifyCode = async () => {
    setStatus({ kind: 'busy', text: 'Verificando…' });
    const { error } = await sb.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    if (error) setStatus({ kind: 'error', text: error.message });
    else {
      setCodeSent(false);
      setCode('');
      setStatus({ kind: 'ok', text: 'Sesión iniciada.' });
      runSync();
    }
  };

  const runSync = async () => {
    setStatus({ kind: 'busy', text: 'Sincronizando…' });
    try {
      const r = await syncNow();
      setStatus({
        kind: 'ok',
        text: `Sincronizado: ${r.pushed} subidas, ${r.pulled} bajadas · ${new Date().toLocaleTimeString('es-CO')}`,
      });
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Error al sincronizar.' });
    }
  };

  const signOut = async () => {
    await sb.auth.signOut();
    setStatus({ kind: 'idle' });
  };

  return (
    <div className="card data-card">
      <h2>Sincronización</h2>

      {!session ? (
        <>
          <p>
            Inicia sesión con tu correo para sincronizar tus notas entre dispositivos. Sin
            contraseñas: te enviamos un código de un solo uso.
          </p>
          <div className="data-card__actions">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              aria-label="Correo electrónico"
              disabled={codeSent}
            />
            {!codeSent ? (
              <button className="btn btn--primary" onClick={sendCode} disabled={!email.includes('@')}>
                Enviar código
              </button>
            ) : (
              <>
                <input
                  inputMode="numeric"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Código de 6 dígitos"
                  aria-label="Código de verificación"
                />
                <button className="btn btn--primary" onClick={verifyCode} disabled={code.trim().length < 6}>
                  Verificar
                </button>
                <button className="btn btn--ghost" onClick={() => setCodeSent(false)}>
                  Cambiar correo
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <p>
            Sesión iniciada como <strong>{session.user.email}</strong>. La app sigue siendo
            local-first: sincronizar sube tus cambios y baja los de otros dispositivos.
          </p>
          <div className="data-card__actions">
            <button className="btn btn--primary" onClick={runSync} disabled={status.kind === 'busy'}>
              Sincronizar ahora
            </button>
            <button className="btn btn--ghost" onClick={signOut}>Cerrar sesión</button>
          </div>
        </>
      )}

      {status.kind !== 'idle' && (
        <p className={`data-card__msg data-card__msg--${status.kind === 'error' ? 'error' : 'ok'}`}>
          {status.text}
        </p>
      )}
    </div>
  );
}
