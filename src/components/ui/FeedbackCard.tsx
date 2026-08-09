const FEEDBACK_URL = 'https://forms.gle/ykgNFdp3HziV1LwW8'; // formulario de Google, Tally, o mailto:

export function FeedbackCard() {
  return (
    <div className="card data-card">
      <h2>¿Algo no funciona o te falta?</h2>
      <p>
        Margen está en pruebas y tu opinión cambia lo que sigue. Cuéntame qué te sobra,
        qué te falta o qué te resultó confuso — todo suma, incluso "no entendí para qué es esto".
      </p>
      <div className="data-card__actions">
        <a className="btn btn--primary" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
          Enviar comentarios
        </a>
      </div>
    </div>
  );
}
