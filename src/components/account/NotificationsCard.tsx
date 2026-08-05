import { useEffect, useState } from 'react';
import { currentSubscription, disablePush, enablePush, pushSupported, updateHour } from '../../lib/push';

const HOURS = [6, 7, 8, 9, 12, 18, 20, 21];

export function NotificationsCard() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(8);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    currentSubscription().then(sub => setEnabled(Boolean(sub)));
  }, []);

  if (!pushSupported()) {
    return (
      <div className="card data-card">
        <h2>Cita del día</h2>
        <p>
          Este navegador no soporta notificaciones push. En iPhone funcionan solo si instalas
          Margen en la pantalla de inicio; en Android, desde Chrome o la app instalada.
        </p>
      </div>
    );
  }

  const toggle = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
        setMessage({ kind: 'ok', text: 'Notificaciones desactivadas.' });
      } else {
        await enablePush(hour);
        setEnabled(true);
        setMessage({ kind: 'ok', text: `Listo: recibirás una cita cada día alrededor de las ${hour}:00.` });
      }
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Algo salió mal.' });
    } finally {
      setBusy(false);
    }
  };

  const changeHour = async (h: number) => {
    setHour(h);
    if (enabled) {
      await updateHour(h);
      setMessage({ kind: 'ok', text: `Hora actualizada a las ${h}:00.` });
    }
  };

  return (
    <div className="card data-card">
      <h2>Cita del día</h2>
      <p>
        Una notificación diaria con uno de tus subrayados, elegido entre todo lo que has leído.
        Requiere sesión iniciada y que tus notas estén sincronizadas.
      </p>
      <div className="data-card__actions">
        <label className="editor__page">
          <span>a las</span>
          <select value={hour} onChange={e => changeHour(Number(e.target.value))}>
            {HOURS.map(h => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
        </label>
        <button className="btn btn--primary" onClick={toggle} disabled={busy}>
          {busy ? 'Un momento…' : enabled ? 'Desactivar' : 'Activar notificaciones'}
        </button>
      </div>
      {message && (
        <p className={`data-card__msg data-card__msg--${message.kind}`}>{message.text}</p>
      )}
    </div>
  );
}
