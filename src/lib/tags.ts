/** Normaliza una cadena de tags separados por coma: minúsculas, sin '#', sin duplicados. */
export function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(',')
        .map(t => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean)
    ),
  ];
}
