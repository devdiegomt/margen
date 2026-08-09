import { useState } from 'react';

const KEY = 'margen:tour-dismissed';

const FEATURES = [
  { icon: '★', title: 'Puntúa tus libros', text: 'Las estrellas alimentan las recomendaciones del final de esta página.' },
  { icon: '↗', title: 'Comparte una cita', text: 'El botón ↗ en cada nota crea una imagen lista para Instagram.' },
  { icon: '⏱', title: 'Cronómetro de lectura', text: 'Arriba tienes un pomodoro de 25 minutos. Tus sesiones quedan en Enfoque.' },
  { icon: '☁', title: 'Sincroniza si quieres', text: 'En Datos puedes crear sesión para tener tus notas en varios dispositivos.' },
];

/** Se muestra una vez que el usuario ya tiene libros, hasta que lo cierre. */
export function FeatureTour() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* modo privado: se cerrará solo por esta sesión */
    }
    setDismissed(true);
  };

  return (
    <section className="card tour">
      <header className="tour__header">
        <h2>Lo que quizá no has descubierto</h2>
        <button className="tour__close" onClick={close} aria-label="Ocultar">×</button>
      </header>
      <ul className="tour__list">
        {FEATURES.map(f => (
          <li key={f.title} className="tour__item">
            <span className="tour__icon" aria-hidden="true">{f.icon}</span>
            <div>
              <strong>{f.title}</strong>
              <p>{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
