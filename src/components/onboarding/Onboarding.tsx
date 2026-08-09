import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

const TIPS_KEY = 'margen:tips-dismissed';

/**
 * Onboarding progresivo: cambia según dónde está el usuario.
 * 1. Sin libros  → bienvenida con los 3 pasos
 * 2. Con libros, sin notas → empujón a escribir la primera
 * 3. Con notas → tips de las features que no son obvias (descartable)
 */
export function Onboarding() {
  const [tipsDismissed, setTipsDismissed] = useState(
    () => localStorage.getItem(TIPS_KEY) === '1'
  );

  const state = useLiveQuery(async () => {
    const books = await db.books.filter(b => !b.deletedAt).count();
    const notes = await db.notes.filter(n => !n.deletedAt).count();
    return { books, notes };
  }, []);

  if (!state) return null;

  // ---- 1. Biblioteca vacía: bienvenida ----
  if (state.books === 0) {
    return (
      <section className="onboarding">
        <h2 className="onboarding__title">Lo que lees, donde no se te olvide</h2>
        <p className="onboarding__lead">
          Margen guarda las ideas, citas y reflexiones de tus libros — y te las devuelve
          cuando ya las habías olvidado.
        </p>
        <ol className="onboarding__steps">
          <li>
            <span className="onboarding__num">1</span>
            <div>
              <strong>Agrega el libro que estás leyendo</strong>
              <p>Escribe el título y elige una sugerencia: la portada y el autor se completan solos.</p>
            </div>
          </li>
          <li>
            <span className="onboarding__num">2</span>
            <div>
              <strong>Anota lo que te marque</strong>
              <p>Una cita textual, una idea en tus palabras o una reflexión personal.</p>
            </div>
          </li>
          <li>
            <span className="onboarding__num">3</span>
            <div>
              <strong>Vuelve mañana</strong>
              <p>Te espera uno de tus subrayados, elegido entre todo lo que has leído.</p>
            </div>
          </li>
        </ol>
        <p className="onboarding__foot">
          Todo vive en tu dispositivo y funciona sin internet. La cuenta es opcional, solo si
          quieres sincronizar entre dispositivos.
        </p>
      </section>
    );
  }

  // ---- 2. Hay libro, falta la primera nota ----
  if (state.notes === 0) {
    return (
      <section className="onboarding onboarding--slim">
        <h2 className="onboarding__title">Ya tienes tu primer libro</h2>
        <p className="onboarding__lead">
          Ábrelo y escribe la primera nota. Si copias una cita textual, Margen la guarda
          resaltada — y podrás compartirla como imagen.
        </p>
      </section>
    );
  }

  // ---- 3. Tips de lo que no es obvio ----
  if (!tipsDismissed) {
    return (
      <section className="onboarding onboarding--tips">
        <button
          className="onboarding__close"
          onClick={() => {
            localStorage.setItem(TIPS_KEY, '1');
            setTipsDismissed(true);
          }}
          aria-label="Ocultar sugerencias"
        >
          ×
        </button>
        <h2 className="onboarding__title">Tres cosas que quizá no has visto</h2>
        <ul className="onboarding__tips">
          <li><strong>↗ en cada nota</strong> — la convierte en una imagen lista para compartir.</li>
          <li><strong>¿Qué leer después?</strong> — al final de esta página, recomienda según tus notas y puntuaciones.</li>
          <li><strong>Cita del día</strong> — actívala en Datos para recibirla como notificación.</li>
        </ul>
      </section>
    );
  }

  return null;
}
