/** Canal directo para los testers. Cambia la URL por tu formulario o correo. */
const FEEDBACK_URL = 'mailto:devdiegomt@gmail.com?subject=Feedback%20de%20Margen';

export function FeedbackLink() {
  return (
    <a className="feedback" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
      ¿Algo no funciona o se te ocurre algo? Cuéntamelo →
    </a>
  );
}
