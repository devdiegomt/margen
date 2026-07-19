import { useRef, useState } from 'react';
import { exportJSON, importJSON, download } from '../lib/exporter';
import { AccountCard } from '../components/account/AccountCard';

export function Data() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    const { filename, content } = await exportJSON();
    download(filename, content, 'application/json');
    setMessage({ kind: 'ok', text: 'Respaldo descargado. Guárdalo donde no lo pierdas.' });
  };

  const handleImport = async (file: File) => {
    try {
      const raw = await file.text();
      const counts = await importJSON(raw);
      setMessage({
        kind: 'ok',
        text: `Importado: ${counts.books} libros, ${counts.notes} notas, ${counts.pendings} pendientes. Los datos existentes se conservaron.`,
      });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'No se pudo importar el archivo.' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Tus datos</h1>
      </div>

      <AccountCard />

      <div className="card data-card">
        <h2>Respaldo completo</h2>
        <p>
          Todo lo que escribes vive en <strong>este navegador</strong> (IndexedDB), no en un servidor.
          Descarga un respaldo de vez en cuando, y úsalo para pasar tus notas a otro dispositivo.
        </p>
        <div className="data-card__actions">
          <button className="btn btn--primary" onClick={handleExport}>
            Descargar respaldo (.json)
          </button>
          <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
            Importar respaldo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
        </div>
        <p className="data-card__hint">
          La importación combina: actualiza lo que ya existe por ID y agrega lo nuevo. No borra nada.
        </p>
        {message && <p className={`data-card__msg data-card__msg--${message.kind}`}>{message.text}</p>}
      </div>

      <div className="card data-card">
        <h2>Exportar un libro en Markdown</h2>
        <p>
          En la página de cada libro encuentras el botón <strong>Exportar .md</strong>: genera un
          documento legible con todas sus notas, citas y tags, listo para Obsidian, Notion o donde quieras.
        </p>
      </div>
    </div>
  );
}
