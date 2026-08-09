interface Props {
  onStart: () => void;
}

const STEPS = [
  {
    n: 1,
    title: 'Agrega un libro',
    text: 'Escribe el título y Margen busca la portada y el autor por ti.',
  },
  {
    n: 2,
    title: 'Guarda lo que te marcó',
    text: 'Una cita textual, una idea en tus palabras o una reflexión personal.',
  },
  {
    n: 3,
    title: 'Vuelve a encontrarlo',
    text: 'Mañana verás uno de tus subrayados esperándote al abrir la app.',
  },
];

export function Welcome({ onStart }: Props) {
  return (
    <section className="welcome">
      <p className="welcome__eyebrow">Bienvenido a Margen</p>
      <h2 className="welcome__title">
        El problema no es tomar notas.<br />Es no volver a leerlas nunca.
      </h2>
      <p className="welcome__lead">
        Margen guarda lo que los libros te dejaron y se encarga de devolvértelo.
        Funciona sin conexión y sin cuenta: todo vive en tu dispositivo.
      </p>

      <ol className="welcome__steps">
        {STEPS.map(s => (
          <li key={s.n} className="welcome__step">
            <span className="welcome__num">{s.n}</span>
            <div>
              <strong>{s.title}</strong>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <button className="btn btn--primary welcome__cta" onClick={onStart}>
        Agregar mi primer libro
      </button>
    </section>
  );
}
