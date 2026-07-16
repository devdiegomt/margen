interface Props {
  value: string;
  onChange: (v: string) => void;
}

/** Input simple de tags separados por coma. parseTags lo convierte en array limpio. */
export function TagInput({ value, onChange }: Props) {
  return (
    <input
      className="tag-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="tags: aprendizaje, hábitos"
      aria-label="Tags separados por coma"
    />
  );
}

export function parseTags(raw: string): string[] {
  return [...new Set(
    raw
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean)
  )];
}
