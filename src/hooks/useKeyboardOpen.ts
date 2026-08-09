import { useEffect } from 'react';

/**
 * Añade la clase `keyboard-open` al <body> mientras hay un campo enfocado.
 * En iOS Safari, los elementos `position: fixed` se comportan mal cuando sube
 * el teclado: la barra de pestañas puede quedar flotando sobre el contenido.
 */
export function useKeyboardOpen(): void {
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);

    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target)) document.body.classList.add('keyboard-open');
    };
    const onFocusOut = (e: FocusEvent) => {
      if (isField(e.target)) document.body.classList.remove('keyboard-open');
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.body.classList.remove('keyboard-open');
    };
  }, []);
}
