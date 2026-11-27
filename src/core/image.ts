// Turning a picture into mosaic characters, and back into pixels.
//
// Each cell is 2 × 3 sixels and can show only two colors: a foreground for the lit sixels and a
// background for the others. For every cell the converter tries all pairs of the 8 colors and
// keeps the pair (and the mask) closest to the picture.
import { CELL_HEIGHT, CELL_WIDTH } from './grid';
import { SIXEL_ROW_HEIGHTS, SIXEL_WIDTH, type SixelMask } from './mosaic';
import { COLOR_RGB, GREY_RGB, type PaletteName, type VtxColor } from './palette';

/** Pixels, RGBA, row by row (the shape of a canvas ImageData). */
export interface RgbaImage {
  readonly width: number;
  readonly height: number;
  readonly data: ArrayLike<number>;
}

export interface MosaicCell {
  readonly mask: SixelMask;
  readonly fg: VtxColor;
  readonly bg: VtxColor;
}

export interface MosaicImage {
  readonly cols: number;
  readonly rows: number;
  /** `rows` rows of `cols` cells. */
  readonly cells: readonly (readonly MosaicCell[])[];
}

// Size

function assertCount(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) throw new RangeError(`${name} must be a whole number of at least 1, got ${value}.`);
}

/**
 * Cells needed to show a picture of `width` × `height` pixels without stretching it (a cell is 8 × 10 dots).
 * Give `cols`, `rows`, or both to fit the picture inside that box. Default: 40 columns.
 */
export function mosaicSize(width: number, height: number, box: { cols?: number; rows?: number } = {}): { cols: number; rows: number } {
  if (!(width > 0 && height > 0)) throw new RangeError(`Invalid picture size: ${width} × ${height}.`);
  const rowsPerCol = (height * CELL_WIDTH) / (width * CELL_HEIGHT);
  const { cols, rows } = box;
  if (cols !== undefined) assertCount(cols, 'cols');
  if (rows !== undefined) assertCount(rows, 'rows');
  const fromCols = (c: number) => ({ cols: c, rows: Math.max(1, Math.round(c * rowsPerCol)) });
  const fromRows = (r: number) => ({ cols: Math.max(1, Math.round(r / rowsPerCol)), rows: r });
  if (cols === undefined && rows === undefined) return fromCols(40);
  if (rows === undefined) return fromCols(cols!);
  if (cols === undefined) return fromRows(rows);
  const byCols = fromCols(cols);
  return byCols.rows <= rows ? byCols : fromRows(rows);
}

// Colors

type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb;
}

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Squared distance, weighted towards green like the eye. */
const distance = (r: number, g: number, b: number, c: Rgb) => {
  const dr = r - c[0];
  const dg = g - c[1];
  const db = b - c[2];
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
};

const PALETTE_RGB: Readonly<Record<PaletteName, readonly Rgb[]>> = {
  color: COLOR_RGB.map(parseHex),
  monochrome: GREY_RGB.map(parseHex),
};

// Conversion

export interface ConvertOptions {
  readonly cols: number;
  readonly rows: number;
  /** 'monochrome' matches the grey of each color code, for a Screen with palette="monochrome". Default: 'color'. */
  readonly palette?: PaletteName;
  /** Ordered dithering (4 × 4 Bayer pattern over the sixels), for smoother gradients. Default: false. */
  readonly dither?: boolean;
}

/** 4 × 4 Bayer matrix: the order in which sixels of a 4 × 4 block switch to the next color. */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

/** Height of each of the 6 sixels of a cell, used to weigh the error. */
const SIXEL_WEIGHTS = [0, 1, 2, 3, 4, 5].map((bit) => SIXEL_ROW_HEIGHTS[(bit >> 1) as 0 | 1 | 2]);
const ROW_OFFSETS = [0, SIXEL_ROW_HEIGHTS[0], SIXEL_ROW_HEIGHTS[0] + SIXEL_ROW_HEIGHTS[1]];

/**
 * Average color of every sixel, as if the picture were stretched over cols × rows cells.
 * Transparent pixels count as black, the color of the screen.
 */
function sampleSixels(image: RgbaImage, cols: number, rows: number): Float64Array {
  const { width, height, data } = image;
  if (data.length < width * height * 4) throw new RangeError('Pixel data is shorter than width × height × 4.');
  const sixelsWide = cols * 2;
  const out = new Float64Array(sixelsWide * rows * 3 * 3);
  const dotsWide = cols * CELL_WIDTH;
  const dotsHigh = rows * CELL_HEIGHT;
  // Source pixels whose centers fall in [start, end) of a dot range; at least the nearest one.
  const span = (start: number, end: number, dots: number, size: number): [number, number] => {
    let from = Math.ceil((start / dots) * size - 0.5);
    let to = Math.ceil((end / dots) * size - 0.5);
    if (to <= from) {
      from = Math.min(size - 1, Math.max(0, Math.floor((((start + end) / 2) / dots) * size)));
      to = from + 1;
    }
    return [Math.max(0, from), Math.min(size, to)];
  };

  for (let sy = 0; sy < rows * 3; sy++) {
    const cellRow = Math.floor(sy / 3);
    const y0 = cellRow * CELL_HEIGHT + ROW_OFFSETS[sy % 3]!;
    const [py0, py1] = span(y0, y0 + SIXEL_ROW_HEIGHTS[(sy % 3) as 0 | 1 | 2], dotsHigh, height);
    for (let sx = 0; sx < sixelsWide; sx++) {
      const x0 = sx * SIXEL_WIDTH;
      const [px0, px1] = span(x0, x0 + SIXEL_WIDTH, dotsWide, width);
      let r = 0;
      let g = 0;
      let b = 0;
      for (let py = py0; py < py1; py++) {
        for (let px = px0; px < px1; px++) {
          const i = (py * width + px) * 4;
          const alpha = (data[i + 3] ?? 255) / 255;
          r += data[i]! * alpha;
          g += data[i + 1]! * alpha;
          b += data[i + 2]! * alpha;
        }
      }
      const count = (py1 - py0) * (px1 - px0);
      const o = (sy * sixelsWide + sx) * 3;
      out[o] = r / count;
      out[o + 1] = g / count;
      out[o + 2] = b / count;
    }
  }
  return out;
}

/** Converts pixels to mosaic cells. Resize the picture to about cols × 8 by rows × 10 pixels first for speed. */
export function imageToMosaic(image: RgbaImage, options: ConvertOptions): MosaicImage {
  const { cols, rows, palette = 'color', dither = false } = options;
  assertCount(cols, 'cols');
  assertCount(rows, 'rows');
  const colors = PALETTE_RGB[palette];
  const brightness = colors.map((c) => luma(c[0], c[1], c[2]));
  const sixels = sampleSixels(image, cols, rows);
  const sixelsWide = cols * 2;

  if (palette === 'monochrome') {
    for (let i = 0; i < sixels.length; i += 3) {
      const grey = luma(sixels[i]!, sixels[i + 1]!, sixels[i + 2]!);
      sixels[i] = grey;
      sixels[i + 1] = grey;
      sixels[i + 2] = grey;
    }
  }

  if (dither) {
    // Nudge every sixel up or down: by up to a quarter of a channel for the color palette, so mid
    // tones mix while dark and light areas stay clean; by up to half a grey step (10 %) for the
    // monochrome one.
    const gap = palette === 'monochrome' ? 255 * 0.1 : 255 * 0.5;
    for (let sy = 0; sy < rows * 3; sy++) {
      for (let sx = 0; sx < sixelsWide; sx++) {
        const nudge = ((BAYER_4[sy & 3]![sx & 3]! + 0.5) / 16 - 0.5) * gap;
        const o = (sy * sixelsWide + sx) * 3;
        for (let k = 0; k < 3; k++) sixels[o + k] = sixels[o + k]! + nudge;
      }
    }
  }

  const cells: MosaicCell[][] = [];
  const dist = new Float64Array(6 * 8);
  for (let cy = 0; cy < rows; cy++) {
    const line: MosaicCell[] = [];
    for (let cx = 0; cx < cols; cx++) {
      const offset = (bit: number) => (((cy * 3 + (bit >> 1)) * sixelsWide + cx * 2 + (bit & 1)) * 3);
      for (let bit = 0; bit < 6; bit++) {
        const o = offset(bit);
        for (let c = 0; c < 8; c++) dist[bit * 8 + c] = distance(sixels[o]!, sixels[o + 1]!, sixels[o + 2]!, colors[c]!);
      }

      // Every pair of colors, one color alone included; ties keep the earlier (simpler) choice.
      let best = Infinity;
      let first = 0;
      let second = 0;
      for (let i = 0; i < 8; i++) {
        for (let j = i; j < 8; j++) {
          let error = 0;
          for (let bit = 0; bit < 6; bit++) {
            error += SIXEL_WEIGHTS[bit]! * Math.min(dist[bit * 8 + i]!, dist[bit * 8 + j]!);
          }
          if (error < best) {
            best = error;
            first = i;
            second = j;
          }
        }
      }

      // The darker color is the background; a single color is a full block on black.
      let fg: VtxColor;
      let bg: VtxColor;
      let mask = 0;
      if (first === second) {
        fg = first as VtxColor;
        bg = 0;
        mask = first === 0 ? 0 : 0b111111;
      } else {
        [bg, fg] = (brightness[first]! <= brightness[second]! ? [first, second] : [second, first]) as [VtxColor, VtxColor];
        for (let bit = 0; bit < 6; bit++) {
          if (dist[bit * 8 + fg]! < dist[bit * 8 + bg]!) mask |= 1 << bit;
        }
      }
      line.push({ mask, fg, bg });
    }
    cells.push(line);
  }
  return { cols, rows, cells };
}

// Rendering

export interface RenderOptions {
  readonly palette?: PaletteName;
  /** Pixels per screen dot. Default: 1 (8 × 10 pixels per cell). */
  readonly scale?: number;
}

/** Draws a mosaic image as RGBA pixels, ready for a canvas or a PNG encoder. */
export function renderMosaic(image: MosaicImage, options: RenderOptions = {}) {
  const { palette = 'color', scale = 1 } = options;
  assertCount(scale, 'scale');
  const colors = PALETTE_RGB[palette];
  const width = image.cols * CELL_WIDTH * scale;
  const height = image.rows * CELL_HEIGHT * scale;
  const data = new Uint8ClampedArray(width * height * 4);
  const sixelRow = (dotY: number) => (dotY < ROW_OFFSETS[1]! ? 0 : dotY < ROW_OFFSETS[2]! ? 1 : 2);

  for (let y = 0; y < height; y++) {
    const cellRow = Math.floor(y / (CELL_HEIGHT * scale));
    const dotY = Math.floor(y / scale) % CELL_HEIGHT;
    const row = image.cells[cellRow] ?? [];
    for (let x = 0; x < width; x++) {
      const cell = row[Math.floor(x / (CELL_WIDTH * scale))];
      const dotX = Math.floor(x / scale) % CELL_WIDTH;
      const bit = sixelRow(dotY) * 2 + (dotX < SIXEL_WIDTH ? 0 : 1);
      const color = colors[cell ? (cell.mask & (1 << bit) ? cell.fg : cell.bg) : 0]!;
      const i = (y * width + x) * 4;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

// Text form

const DIGITS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Compact text: "colsxrows:" then two characters per cell (mask, then foreground × 8 + background). */
export function encodeMosaic(image: MosaicImage): string {
  const body = image.cells.map((row) => row.map((cell) => DIGITS[cell.mask]! + DIGITS[cell.fg * 8 + cell.bg]!).join('')).join('');
  return `${image.cols}x${image.rows}:${body}`;
}

export function decodeMosaic(text: string): MosaicImage {
  const match = /^(\d+)x(\d+):([A-Za-z0-9_-]*)$/.exec(text.trim());
  if (!match) throw new SyntaxError('Not a mosaic: expected "colsxrows:" followed by cell data.');
  const cols = Number(match[1]);
  const rows = Number(match[2]);
  const body = match[3]!;
  assertCount(cols, 'cols');
  assertCount(rows, 'rows');
  if (body.length !== cols * rows * 2) {
    throw new SyntaxError(`A ${cols} × ${rows} mosaic needs ${cols * rows * 2} characters of data, got ${body.length}.`);
  }
  const cells: MosaicCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const line: MosaicCell[] = [];
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 2;
      const colorsValue = DIGITS.indexOf(body[i + 1]!);
      line.push({ mask: DIGITS.indexOf(body[i]!), fg: (colorsValue >> 3) as VtxColor, bg: (colorsValue & 7) as VtxColor });
    }
    cells.push(line);
  }
  return { cols, rows, cells };
}

/** A ready-to-paste React component showing the image. */
export function mosaicToCode(image: MosaicImage, options: { name?: string; alt?: string } = {}): string {
  const words = (options.name ?? 'picture').replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const camel = words.map((w, i) => (i === 0 ? w.toLowerCase() : w[0]!.toUpperCase() + w.slice(1).toLowerCase())).join('');
  const variable = /^[A-Za-z_]/.test(camel) ? camel : `picture${camel}`;
  const component = variable[0]!.toUpperCase() + variable.slice(1);
  return [
    "import { Mosaic, decodeMosaic } from 'videotex-ui';",
    '',
    `const ${variable} = decodeMosaic('${encodeMosaic(image)}');`,
    '',
    `export function ${component}() {`,
    `  return <Mosaic data={${variable}} alt={${JSON.stringify(options.alt ?? 'Mosaic picture')}} />;`,
    '}',
    '',
  ].join('\n');
}
