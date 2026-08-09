import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Sin esto, cualquier excepción deja la pantalla en blanco y sin pista.
 * Con esto, el usuario ve qué pasó y puede seguir usando la app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no capturado:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="page">
        <div className="card data-card">
          <h2>Algo se rompió en esta pantalla</h2>
          <p>
            Tus notas están a salvo: viven en este dispositivo y no se tocaron. Puedes volver
            a la biblioteca y seguir usando la app con normalidad.
          </p>
          <div className="data-card__actions">
            <button className="btn btn--primary" onClick={() => { window.location.hash = '#/'; this.setState({ error: null }); }}>
              Volver a la biblioteca
            </button>
            <button className="btn btn--ghost" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
          <details className="error-details">
            <summary>Detalle técnico</summary>
            <pre>{error.message}</pre>
          </details>
          <p className="data-card__hint">
            Si te vuelve a pasar, cuéntamelo desde el enlace de comentarios en «Datos» —
            copiar el detalle técnico ayuda mucho.
          </p>
        </div>
      </div>
    );
  }
}
