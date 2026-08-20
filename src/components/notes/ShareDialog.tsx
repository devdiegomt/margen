import { useEffect, useRef, useState } from 'react';
import type { Book, Note } from '../../db/types';
import {
  DEFAULT_OPTIONS,
  generateQuoteImage,
  shareQuoteImage,
  type QuoteFormat,
  type QuoteImageOptions,
  type QuoteTheme,
} from '../../lib/quote-image';

interface Props {
  open: boolean;
  note: Note;
  book?: Book;
  onClose: () => void;
}

const FORMATS: { value: QuoteFormat; label: string; hint: string }[] = [
  { value: 'feed', label: 'Publicación', hint: '4:5' },
  { value: 'square', label: 'Cuadrada', hint: '1:1' },
  { value: 'story', label: 'Historia', hint: '9:16' },
];

const THEMES: { value: QuoteTheme; label: string }[] = [
  { value: 'papel', label: 'Papel' },
  { value: 'tinta', label: 'Tinta' },
];

const PREFS_KEY = 'margen:share-options';

function loadPrefs(): QuoteImageOptions {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_OPTIONS;
    const parsed = JSON.parse(raw) as Partial<QuoteImageOptions>;
    return {
      format: parsed.format ?? DEFAULT_OPTIONS.format,
      theme: parsed.theme ?? DEFAULT_OPTIONS.theme,
    };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

export function ShareDialog({ open, note, book, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [options, setOptions] = useState<QuoteImageOptions>(loadPrefs);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCloseEvent = () => onClose();
    const onClick = (e: MouseEvent) => {
      if (e.target === el) onClose();
    };
    el.addEventListener('close', onCloseEvent);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('close', onCloseEvent);
      el.removeEventListener('click', onClick);
    };
  }, [onClose]);

  // Vista previa en vivo: se regenera al cambiar cualquier opción
  useEffect(() => {
    if (!open) return;
    let url: string | null = null;
    let cancelled = false;

    generateQuoteImage(note, book, options)
      .then(blob => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
      })
      .catch(() => setPreview(null));

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, note, book, options]);

  const update = (patch: Partial<QuoteImageOptions>) => {
    const next = { ...options, ...patch };
    setOptions(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* almacenamiento bloqueado */
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      await shareQuoteImage(note, book, options);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={ref} className="share" aria-labelledby="share-title">
      <div className="share__body">
        <button className="share__close" onClick={onClose} aria-label="Cerrar">×</button>
        <h2 className="share__title" id="share-title">Compartir cita</h2>

        <div className={`share__preview share__preview--${options.format}`}>
          {preview ? (
            <img src={preview} alt="Vista previa de la imagen" />
          ) : (
            <span className="share__loading">Generando…</span>
          )}
        </div>

        {options.format === 'feed' && (
          <p className="share__hint">
            En Instagram, toca el ícono de expandir <span aria-hidden="true">⤢</span> al
            publicar para que se vea vertical y no recortada.
          </p>
        )}

        <div className="share__controls">
          <div className="share__group" role="group" aria-label="Formato">
            {FORMATS.map(f => (
              <button
                key={f.value}
                className={`share__opt ${options.format === f.value ? 'is-active' : ''}`}
                onClick={() => update({ format: f.value })}
              >
                {f.label} <small>{f.hint}</small>
              </button>
            ))}
          </div>

          <div className="share__group" role="group" aria-label="Tema">
            {THEMES.map(t => (
              <button
                key={t.value}
                className={`share__opt share__opt--${t.value} ${
                  options.theme === t.value ? 'is-active' : ''
                }`}
                onClick={() => update({ theme: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="share__actions">
          <button className="btn btn--outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={share} disabled={busy || !preview}>
            {busy ? 'Preparando…' : 'Compartir'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
