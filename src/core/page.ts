import { BLANK_CELL, type Cell } from './cell';
import { assertInside, COLS, ROWS } from './grid';
import { maskToUnicode } from './mosaic';

/** A full screen: 25 rows of 40 cells. Row 0 is the service row. */
export interface Page {
  readonly cells: readonly (readonly Cell[])[];
}

export function createPage(fill: Cell = BLANK_CELL): Page {
  const row = Object.freeze(Array.from({ length: COLS }, () => fill));
  return Object.freeze({ cells: Object.freeze(Array.from({ length: ROWS }, () => row)) });
}

export function cellAt(page: Page, row: number, col: number): Cell {
  assertInside(row, col);
  return page.cells[row]![col]!;
}

export interface PageToTextOptions {
  /** How to write mosaic cells: spaces (default) or Unicode block sextants. */
  readonly mosaic?: 'space' | 'unicode';
}

/** The page as 25 lines of text, trailing spaces removed. Cells covered by a double-size character are spaces. */
export function pageToText(page: Page, options: PageToTextOptions = {}): string {
  return page.cells
    .map((row) =>
      row
        .map((cell) => {
          if (cell.covered) return ' ';
          if (cell.set === 'G1') return options.mosaic === 'unicode' ? maskToUnicode(cell.mask) : ' ';
          return cell.char;
        })
        .join('')
        .trimEnd(),
    )
    .join('\n');
}

/** Lines of text for screen readers: mosaics left out, spaces collapsed, empty lines removed. */
export function pageToPlainText(page: Page): string[] {
  return pageToText(page)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);
}
