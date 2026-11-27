// Geometry of a Videotex screen. Values marked "to check" are verified in step 1 (STUM).

/** Number of columns. */
export const COLS = 40;
/** Number of rows, including the service row. */
export const ROWS = 25;
/** Row 0 is the service (status) row of a Minitel; it never wraps and only takes normal-size text. */
export const SERVICE_ROW = 0;
/** First row of page content. */
export const FIRST_PAGE_ROW = 1;
/** Last row of page content. */
export const LAST_ROW = ROWS - 1;

/** Width of a character cell, in screen dots (to check). */
export const CELL_WIDTH = 8;
/** Height of a character cell, in screen dots (to check). */
export const CELL_HEIGHT = 10;
/** Screen size in dots: 320 × 250. */
export const SCREEN_WIDTH = COLS * CELL_WIDTH;
export const SCREEN_HEIGHT = ROWS * CELL_HEIGHT;

export function isInside(row: number, col: number): boolean {
  return Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

export function assertInside(row: number, col: number): void {
  if (!isInside(row, col)) {
    throw new RangeError(`Position outside the screen: row ${row}, column ${col}. Rows go from 0 to ${LAST_ROW}, columns from 0 to ${COLS - 1}.`);
  }
}
