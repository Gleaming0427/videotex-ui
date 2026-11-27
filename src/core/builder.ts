import { BLANK_CELL, sizeFromSpan, sizeSpan, type Cell, type CharSize } from './cell';
import { assertInside, COLS, FIRST_PAGE_ROW, isInside, LAST_ROW, ROWS, SERVICE_ROW } from './grid';
import { assertSixelMask, type SixelMask } from './mosaic';
import type { Page } from './page';
import { toColor, type ColorInput, type VtxColor } from './palette';

export interface Attributes {
  readonly fg: VtxColor;
  readonly bg: VtxColor;
  readonly blink: boolean;
  readonly inverse: boolean;
  readonly underline: boolean;
  readonly size: CharSize;
}

export interface AttributesInput {
  readonly fg?: ColorInput;
  readonly bg?: ColorInput;
  readonly blink?: boolean;
  readonly inverse?: boolean;
  readonly underline?: boolean;
  readonly size?: CharSize;
}

/** White on black, normal size: the state of a Minitel after clearing the screen. */
export const DEFAULT_ATTRIBUTES: Attributes = Object.freeze({
  fg: 7,
  bg: 0,
  blink: false,
  inverse: false,
  underline: false,
  size: 'normal',
});

function resolve(base: Attributes, input: AttributesInput = {}): Attributes {
  return {
    fg: input.fg === undefined ? base.fg : toColor(input.fg),
    bg: input.bg === undefined ? base.bg : toColor(input.bg),
    blink: input.blink ?? base.blink,
    inverse: input.inverse ?? base.inverse,
    underline: input.underline ?? base.underline,
    size: input.size ?? base.size,
  };
}

/**
 * Builds a page the way a Videotex server writes one: move the cursor, set attributes, write.
 *
 * ```ts
 * const page = new PageBuilder()
 *   .moveTo(3, 2).print('BONJOUR', { fg: 'yellow', size: 'double-size' })
 *   .moveTo(5, 2).print('Tapez votre choix')
 *   .build();
 * ```
 *
 * Writing rules:
 * - the cursor starts at row 1, column 0;
 * - a line that reaches column 40 wraps to column 0 of the next row, except row 0 which is cut;
 * - `\n` goes to the next row, at the column of the last `moveTo` (the margin);
 * - anything written past row 24 is dropped;
 * - mosaics ignore size and inversion; their underline means disjoint mosaic;
 * - double height is refused on rows 0 and 1, which have no page row above them.
 */
export class PageBuilder {
  readonly #cells: Cell[][];
  readonly #base: Attributes;
  #attrs: Attributes;
  #row = FIRST_PAGE_ROW;
  /** COLS means the row is full: the next character wraps first. */
  #col = 0;
  #margin = 0;

  constructor(base: AttributesInput = {}) {
    this.#base = resolve(DEFAULT_ATTRIBUTES, base);
    this.#attrs = this.#base;
    const blank: Cell = Object.freeze({ ...BLANK_CELL, fg: this.#base.fg, bg: this.#base.bg });
    this.#cells = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => blank));
  }

  /** Current cursor. `col` is 40 when the row is full. */
  get cursor(): { readonly row: number; readonly col: number } {
    return { row: this.#row, col: this.#col };
  }

  get attributes(): Attributes {
    return this.#attrs;
  }

  /** Moves the cursor and sets the margin used by `\n`. */
  moveTo(row: number, col: number): this {
    assertInside(row, col);
    this.#row = row;
    this.#col = col;
    this.#margin = col;
    return this;
  }

  /** Changes the attributes used by the next writes. */
  attr(input: AttributesInput): this {
    this.#attrs = resolve(this.#attrs, input);
    return this;
  }

  /** Back to the attributes given to the constructor. */
  reset(): this {
    this.#attrs = this.#base;
    return this;
  }

  /** Writes alphanumeric text. `attrs` apply to this call only. */
  print(text: string, attrs?: AttributesInput): this {
    const current = resolve(this.#attrs, attrs);
    for (const ch of text) {
      if (ch === '\n') this.#newline();
      else if (ch !== '\r') this.#putChar(ch, current);
    }
    return this;
  }

  /** Writes one or more mosaic characters on the current row, wrapping like text. */
  mosaic(masks: SixelMask | readonly SixelMask[], attrs?: AttributesInput): this {
    const current = resolve(this.#attrs, attrs);
    for (const mask of typeof masks === 'number' ? [masks] : masks) {
      assertSixelMask(mask);
      if (!this.#makeRoom(1)) continue;
      this.#write(this.#row, this.#col, {
        set: 'G1',
        char: ' ',
        mask,
        fg: current.fg,
        bg: current.bg,
        blink: current.blink,
        inverse: false,
        underline: current.underline,
        size: 'normal',
        covered: false,
      });
      this.#col += 1;
    }
    return this;
  }

  /** Writes rows of masks (see `bitmapToMasks`), each one starting at the current column. */
  mosaicBlock(block: readonly (readonly SixelMask[])[], attrs?: AttributesInput): this {
    const { row, col } = this.#col < COLS ? this.cursor : { row: this.#row + 1, col: 0 };
    block.forEach((masks, i) => {
      if (row + i > LAST_ROW) return;
      this.moveTo(row + i, col).mosaic(masks, attrs);
    });
    return this;
  }

  /** Paints a rectangle with spaces in the given attributes. Does not move the cursor. */
  fill(top: number, left: number, height: number, width: number, attrs?: AttributesInput): this {
    const current = resolve(this.#attrs, attrs);
    const cell: Cell = { ...BLANK_CELL, fg: current.fg, bg: current.bg, inverse: current.inverse };
    for (let row = top; row < top + height; row++) {
      for (let col = left; col < left + width; col++) {
        if (isInside(row, col)) this.#write(row, col, cell);
      }
    }
    return this;
  }

  /** Snapshot of the page. The builder can keep writing afterwards. */
  build(): Page {
    return Object.freeze({ cells: Object.freeze(this.#cells.map((row) => Object.freeze(row.slice()))) });
  }

  #newline(): void {
    this.#row += 1;
    this.#col = this.#margin;
  }

  /** Wraps if `width` columns don't fit. Returns false when the character must be dropped. */
  #makeRoom(width: number): boolean {
    if (this.#row > LAST_ROW) return false;
    if (this.#col + width <= COLS) return true;
    if (this.#row === SERVICE_ROW) return false;
    this.#row += 1;
    this.#col = 0;
    return this.#row <= LAST_ROW;
  }

  #putChar(ch: string, attrs: Attributes): void {
    const span = sizeSpan(attrs.size);
    const width = this.#row === SERVICE_ROW ? 1 : span.width;
    if (!this.#makeRoom(width)) return;
    const height = this.#row - 1 < FIRST_PAGE_ROW ? 1 : span.height;
    const row = this.#row;
    const col = this.#col;
    const cell: Cell = {
      set: 'G0',
      char: ch,
      mask: 0,
      fg: attrs.fg,
      bg: attrs.bg,
      blink: attrs.blink,
      inverse: attrs.inverse,
      underline: attrs.underline,
      size: sizeFromSpan(width, height),
      covered: false,
    };
    this.#write(row, col, cell);
    const covered: Cell = { ...BLANK_CELL, fg: cell.fg, bg: cell.bg, inverse: cell.inverse, covered: true };
    if (width === 2) this.#write(row, col + 1, covered);
    if (height === 2) this.#write(row - 1, col, covered);
    if (width === 2 && height === 2) this.#write(row - 1, col + 1, covered);
    this.#col += width;
  }

  #write(row: number, col: number, cell: Cell): void {
    this.#cells[row]![col] = Object.isFrozen(cell) ? cell : Object.freeze(cell);
  }
}
