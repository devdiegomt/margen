interface Props {
  value: string;
  onChange: (v: string) => void;
}

/** Input simple de tags separados por coma. La normalización vive en lib/tags. */
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
