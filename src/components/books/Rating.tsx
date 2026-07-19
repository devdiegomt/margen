interface Props {
  value?: number;
  onChange?: (rating: number) => void; // sin onChange = solo lectura
}

export function Rating({ value = 0, onChange }: Props) {
  return (
    <div className="rating" role={onChange ? 'radiogroup' : undefined} aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`rating__star ${n <= value ? 'is-on' : ''}`}
          onClick={onChange ? () => onChange(n === value ? 0 : n) : undefined}
          disabled={!onChange}
          aria-label={`${n} de 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
