import type { Book, Note } from '../db/types';

const W = 1080;
const H = 1350; // 4:5, formato de feed de Instagram

const PAPER = '#fbf9f3';
const INK = '#1e2430';
const INK_SOFT = '#5c6472';
const LINE = '#e6e1d5';
const MARKER = '#ffe977';
const TINTA = '#2b4fd8';

const MARGIN_X = 150; // línea de margen del cuaderno
const TEXT_X = 210;
const TEXT_W = W - TEXT_X - 120;

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
export async function generateQuoteImage(note: Note, book?: Book): Promise<Blob> {
  const text = (note.type === 'cita' && note.quote ? note.quote : note.content).trim();

  // aseguramos que las webfonts estén disponibles para el canvas
  await Promise.all([
    document.fonts.load('italic 600 56px Newsreader'),
    document.fonts.load('600 36px Archivo'),
    document.fonts.load('600 52px Newsreader'),
  ]).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // papel + línea de margen
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, 100);
  ctx.lineTo(MARGIN_X, H - 100);
  ctx.stroke();

  // la cita: probamos tamaños hasta que quepa; si no, recortamos con elipsis
  let fontSize = 60;
  let lines: string[] = [];
  const maxLines = 11;
  for (const size of [60, 52, 46, 40, 36]) {
    fontSize = size;
    ctx.font = `italic 600 ${size}px Newsreader, Georgia, serif`;
    lines = wrap(ctx, text, TEXT_W);
    if (lines.length <= maxLines) break;
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }

  const lineHeight = fontSize * 1.55;
  const blockHeight = lines.length * lineHeight;
  let y = (H - blockHeight) / 2 - 60; // centrado óptico, deja aire abajo para la fuente

  ctx.font = `italic 600 ${fontSize}px Newsreader, Georgia, serif`;
  ctx.textBaseline = 'alphabetic';
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    // resaltador detrás de la línea
    ctx.fillStyle = MARKER;
    ctx.fillRect(TEXT_X - 8, y - fontSize * 0.82, w + 16, fontSize * 1.08);
    // tinta encima
    ctx.fillStyle = INK;
    ctx.fillText(line, TEXT_X, y);
    y += lineHeight;
  }

  // fuente: libro, autor, página
  y += 30;
  if (book) {
    ctx.fillStyle = INK;
    ctx.font = '600 36px Archivo, system-ui, sans-serif';
    ctx.fillText(book.title, TEXT_X, y);
    y += 48;
    const detail = [book.author, note.page ? `pág. ${note.page}` : null].filter(Boolean).join(' · ');
    if (detail) {
      ctx.fillStyle = INK_SOFT;
      ctx.font = '400 32px Archivo, system-ui, sans-serif';
      ctx.fillText(detail, TEXT_X, y);
    }
  }

  // marca abajo a la derecha
  ctx.textAlign = 'right';
  ctx.fillStyle = INK;
  ctx.font = '600 52px Newsreader, Georgia, serif';
  ctx.fillText('Margen', W - 132, H - 110);
  ctx.fillStyle = TINTA;
  ctx.beginPath();
  ctx.arc(W - 108, H - 122, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/png');
  });
}

/** Comparte con el share sheet nativo; si no está disponible, descarga el PNG. */
export async function shareQuoteImage(note: Note, book?: Book): Promise<'shared' | 'downloaded'> {
  const blob = await generateQuoteImage(note, book);
  const file = new File([blob], 'margen-cita.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch {
      // usuario canceló el share sheet: no hacemos nada más
      return 'shared';
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
