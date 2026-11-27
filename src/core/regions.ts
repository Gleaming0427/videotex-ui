// Cells drawn by the components placed on a screen. Each function writes with a PageBuilder at
// screen coordinates, so the usual Videotex rules apply, then crops the area the component covers.
import { PageBuilder, type AttributesInput } from './builder';
import { sizeSpan, type Cell, type CharSize } from './cell';
import { COLS, LAST_ROW } from './grid';
import type { SixelMask } from './mosaic';
import { cellAt, cropPage } from './page';
import type { ColorInput } from './palette';

export interface Region {
  readonly top: number;
  readonly left: number;
  /** Row by row; null cells are transparent. */
  readonly cells: readonly (readonly (Cell | null)[])[];
}

const length = (text: string) => [...text].length;

export interface TitleOptions {
  readonly fg?: ColorInput;
  readonly bg?: ColorInput;
  readonly size?: CharSize;
  readonly blink?: boolean;
}

/** A title written at (row, col). Double heights grow upwards, as on the page. */
export function titleRegion(text: string, row: number, col: number, options: TitleOptions = {}): Region {
  const { size = 'double-size', ...attrs } = options;
  const page = new PageBuilder().moveTo(row, col).print(text, { ...attrs, size }).build();
  const span = sizeSpan(cellAt(page, row, col).size);
  const width = Math.min(length(text) * span.width, COLS - col);
  const top = row - span.height + 1;
  return { top, left: col, cells: cropPage(page, top, col, span.height, width) };
}

export interface StatusOptions {
  readonly left?: string;
  readonly message?: string;
  readonly right?: string;
  readonly fg?: ColorInput;
  readonly messageFg?: ColorInput;
}

/** Row 0: service name on the left, a centered message, something on the right. */
export function statusRegion(options: StatusOptions): Region {
  const { left = '', message = '', right = '', fg = 'cyan', messageFg = 'yellow' } = options;
  const b = new PageBuilder();
  if (left) b.moveTo(0, 1).print(left, { fg });
  if (right) b.moveTo(0, Math.max(0, COLS - 1 - length(right))).print(right, { fg });
  if (message) b.moveTo(0, Math.max(0, Math.floor((COLS - length(message)) / 2))).print(message, { fg: messageFg });
  return { top: 0, left: 0, cells: cropPage(b.build(), 0, 0, 1, COLS) };
}

export interface FieldOptions {
  readonly fg?: ColorInput;
  readonly bg?: ColorInput;
  /** Shown in empty positions. Default: '.' */
  readonly placeholder?: string;
  /** Position of the blinking cursor, or null for none. */
  readonly cursor?: number | null;
}

/** An input zone of `size` cells: the value, then dots, with an underlined blinking cursor. */
export function fieldRegion(value: string, size: number, row: number, col: number, options: FieldOptions = {}): Region {
  const { placeholder = '.', cursor = null, ...colors } = options;
  const chars = [...value];
  const width = Math.max(0, Math.min(size, COLS - col));
  const b = new PageBuilder().moveTo(row, col);
  for (let i = 0; i < width; i++) {
    const here = cursor === i;
    b.print(chars[i] ?? placeholder, { ...colors, underline: here, blink: here });
  }
  return { top: row, left: col, cells: cropPage(b.build(), row, col, 1, width) };
}

export interface MenuItemOptions {
  readonly fg?: ColorInput;
  readonly numberFg?: ColorInput;
  /** Draws the label in inverse, like a selection bar. */
  readonly selected?: boolean;
}

/** One menu line: the number in inverse, then the label. */
export function menuItemRegion(label: string, number: number, row: number, col: number, options: MenuItemOptions = {}): Region {
  const { fg = 'white', numberFg = 'white', selected = false } = options;
  const badge = ` ${number} `;
  const text = ` ${label}`;
  const page = new PageBuilder()
    .moveTo(row, col)
    .print(badge, { fg: numberFg, inverse: true })
    .print(text, { fg, inverse: selected })
    .build();
  const width = Math.min(length(badge) + length(text), COLS - col);
  return { top: row, left: col, cells: cropPage(page, row, col, 1, width) };
}

export interface FrameOptions {
  readonly fg?: ColorInput;
  /** Paints the inside. Without it the inside stays transparent. */
  readonly fill?: ColorInput;
  /** Written in inverse on the top edge. */
  readonly title?: string;
}

// Thin lines along the inner side of the border cells.
const EDGE_TOP: SixelMask = 0b110000;
const EDGE_BOTTOM: SixelMask = 0b000011;
const EDGE_LEFT: SixelMask = 0b101010;
const EDGE_RIGHT: SixelMask = 0b010101;
const CORNER_TOP_LEFT: SixelMask = 0b100000;
const CORNER_TOP_RIGHT: SixelMask = 0b010000;
const CORNER_BOTTOM_LEFT: SixelMask = 0b000010;
const CORNER_BOTTOM_RIGHT: SixelMask = 0b000001;

/** A mosaic border around a rectangle, with an optional title and fill. */
export function frameRegion(top: number, left: number, height: number, width: number, options: FrameOptions = {}): Region {
  const { fg = 'cyan', fill, title } = options;
  const bottom = Math.min(top + height - 1, LAST_ROW);
  const right = Math.min(left + width - 1, COLS - 1);
  const attrs: AttributesInput = fill === undefined ? { fg } : { fg, bg: fill };
  const b = new PageBuilder();
  if (fill !== undefined) b.fill(top + 1, left + 1, bottom - top - 1, right - left - 1, { bg: fill });
  for (let col = left; col <= right; col++) {
    const first = col === left;
    const last = col === right;
    b.moveTo(top, col).mosaic(first ? CORNER_TOP_LEFT : last ? CORNER_TOP_RIGHT : EDGE_TOP, attrs);
    b.moveTo(bottom, col).mosaic(first ? CORNER_BOTTOM_LEFT : last ? CORNER_BOTTOM_RIGHT : EDGE_BOTTOM, attrs);
  }
  for (let row = top + 1; row < bottom; row++) {
    b.moveTo(row, left).mosaic(EDGE_LEFT, attrs);
    b.moveTo(row, right).mosaic(EDGE_RIGHT, attrs);
  }
  if (title && right - left >= 4) {
    const room = right - left - 3;
    b.moveTo(top, left + 2).print(` ${[...title].slice(0, room - 2).join('')} `, { fg, inverse: true });
  }
  const border = (row: number, col: number) => row === top || row === bottom || col === left || col === right;
  const keep = fill === undefined ? border : () => true;
  return { top, left, cells: cropPage(b.build(), top, left, bottom - top + 1, right - left + 1, keep) };
}
