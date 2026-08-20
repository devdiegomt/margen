import type { Book, Note } from '../db/types';

export type QuoteFormat = 'feed' | 'square' | 'story';
export type QuoteTheme = 'papel' | 'tinta';

export interface QuoteImageOptions {
  format: QuoteFormat;
  theme: QuoteTheme;
}

export const DEFAULT_OPTIONS: QuoteImageOptions = {
  format: 'feed',
  theme: 'papel',
};

/** Cuenta que firma cada imagen compartida. */
const HANDLE = '@margen.notas';

const SIZES: Record<QuoteFormat, { w: number; h: number }> = {
  feed: { w: 1080, h: 1350 },   // 4:5 — feed, ocupa más pantalla
  square: { w: 1080, h: 1080 }, // 1:1 — Instagram no pide reencuadre
  story: { w: 1080, h: 1920 },  // 9:16 — historias
};

/** Espacio reservado abajo para la firma, en píxeles por formato.
 *  Fijo y no proporcional: en 9:16 un porcentaje daba un hueco enorme
 *  y desplazaba el texto dejando la marca fuera de cuadro. */
const BRAND_SPACE: Record<QuoteFormat, number> = {
  feed: 150,
  square: 140,
  story: 190,
};

interface Palette {
  bg: string;
  ink: string;
  inkSoft: string;
  line: string;
  marker: string;
  accent: string;
  /** El resaltador no funciona sobre fondo oscuro: ahí subrayamos. */
  highlight: 'marker' | 'underline';
}

const PALETTES: Record<QuoteTheme, Palette> = {
  papel: {
    bg: '#fbf9f3',
    ink: '#1e2430',
    inkSoft: '#5c6472',
    line: '#e6e1d5',
    marker: '#ffe977',
    accent: '#2b4fd8',
    highlight: 'marker',
  },
  tinta: {
    bg: '#1e2430',
    ink: '#fbf9f3',
    inkSoft: '#9aa3b2',
    line: '#39414f',
    marker: '#ffe977',
    accent: '#7d97ff',
    highlight: 'underline',
  },
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth) {
      current = attempt;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Genera la imagen de una cita con la identidad visual de Margen. */
export async function generateQuoteImage(
  note: Note,
  book?: Book,
  options: QuoteImageOptions = DEFAULT_OPTIONS
): Promise<Blob> {
  const { w: W, h: H } = SIZES[options.format];
  const p = PALETTES[options.theme];
  const text = (note.type === 'cita' && note.quote ? note.quote : note.content).trim();

  const marginX = Math.round(W * 0.139);
  const textX = Math.round(W * 0.194);
  const textW = W - textX - Math.round(W * 0.111);
  const maxLines = options.format === 'story' ? 15 : options.format === 'square' ? 9 : 11;

  await Promise.all([
    document.fonts.load('italic 600 56px Newsreader'),
    document.fonts.load('600 36px Archivo'),
    document.fonts.load('600 52px Newsreader'),
  ]).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // fondo + línea de margen del cuaderno
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(marginX, 100);
  ctx.lineTo(marginX, H - 100);
  ctx.stroke();

  // la cita: bajamos el tamaño hasta que quepa
  let fontSize = options.format === 'story' ? 64 : 60;
  let lines: string[] = [];
  const ladder =
    options.format === 'story'
      ? [64, 56, 50, 44, 38]
      : options.format === 'square'
        ? [56, 50, 44, 38, 34]
        : [60, 52, 46, 40, 36];
  for (const size of ladder) {
    fontSize = size;
    ctx.font = `italic 600 ${size}px Newsreader, Georgia, serif`;
    lines = wrap(ctx, text, textW);
    if (lines.length <= maxLines) break;
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }

  // Centrado óptico contando todo el bloque: cita + fuente + reserva de marca
  const lineHeight = fontSize * 1.55;
  const quoteHeight = lines.length * lineHeight;
  const sourceHeight = book ? 30 + 48 + (book.author || note.page ? 42 : 0) : 0;
  const brandReserve = BRAND_SPACE[options.format];
  let y = (H - brandReserve - quoteHeight - sourceHeight) / 2 + fontSize * 0.75;

  ctx.font = `italic 600 ${fontSize}px Newsreader, Georgia, serif`;
  ctx.textBaseline = 'alphabetic';
  for (const line of lines) {
    const lineW = ctx.measureText(line).width;
    if (p.highlight === 'marker') {
      ctx.fillStyle = p.marker;
      ctx.fillRect(textX - 8, y - fontSize * 0.82, lineW + 16, fontSize * 1.08);
    } else {
      ctx.fillStyle = p.marker;
      ctx.fillRect(textX, y + fontSize * 0.18, lineW, Math.max(3, fontSize * 0.07));
    }
    ctx.fillStyle = p.ink;
    ctx.fillText(line, textX, y);
    y += lineHeight;
  }

  // fuente: libro, autor, página
  y += 30;
  if (book) {
    ctx.fillStyle = p.ink;
    ctx.font = '600 36px Archivo, system-ui, sans-serif';
    ctx.fillText(book.title, textX, y);
    y += 48;
    const detail = [book.author, note.page ? `pág. ${note.page}` : null]
      .filter(Boolean)
      .join(' · ');
    if (detail) {
      ctx.fillStyle = p.inkSoft;
      ctx.font = '400 32px Archivo, system-ui, sans-serif';
      ctx.fillText(detail, textX, y);
    }
  }

  // marca: nombre en serif y la cuenta debajo, en tono suave
  ctx.textAlign = 'right';
  ctx.fillStyle = p.ink;
  ctx.font = '600 52px Newsreader, Georgia, serif';
  const brandBaseline = H - 96; // misma distancia al borde en todos los formatos
  ctx.fillText('Margen', W - 132, brandBaseline - 44);
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(W - 108, brandBaseline - 56, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.inkSoft;
  ctx.font = '500 28px Archivo, system-ui, sans-serif';
  ctx.fillText(HANDLE, W - 108, brandBaseline);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))),
      'image/png'
    );
  });
}

/** Comparte con el share sheet nativo; si no está disponible, descarga el PNG. */
export async function shareQuoteImage(
  note: Note,
  book?: Book,
  options: QuoteImageOptions = DEFAULT_OPTIONS
): Promise<'shared' | 'downloaded'> {
  const blob = await generateQuoteImage(note, book, options);
  const file = new File([blob], 'margen-cita.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch {
      return 'shared'; // el usuario canceló
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'margen-cita.png';
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
