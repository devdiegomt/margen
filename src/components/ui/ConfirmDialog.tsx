import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo de confirmación con la identidad de la app.
 * Usa <dialog> nativo: trae modalidad, cierre con Escape y foco atrapado sin
 * tener que reimplementarlo.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Escape y clic en el fondo cierran sin confirmar
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClose = () => onCancel();
    const onClick = (e: MouseEvent) => {
      if (e.target === el) onCancel(); // el propio <dialog> es el backdrop
    };
    el.addEventListener('close', onClose);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('close', onClose);
      el.removeEventListener('click', onClick);
    };
  }, [onCancel]);

  return (
    <dialog ref={ref} className="confirm" aria-labelledby="confirm-title">
      <div className="confirm__body">
        <h2 className="confirm__title" id="confirm-title">{title}</h2>
        {description && <p className="confirm__text">{description}</p>}
        <div className="confirm__actions">
          <button className="btn btn--outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
