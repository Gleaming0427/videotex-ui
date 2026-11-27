import type { SixelMask } from './mosaic';
import type { VtxColor } from './palette';

/** G0: alphanumeric characters. G1: mosaic (semi-graphic) characters. */
export type CharSet = 'G0' | 'G1';

/**
 * Double height grows upwards: the character sits on the cursor row and covers the row above.
 * Double width covers the next column. Double size does both. (To check against the STUM.)
 */
export type CharSize = 'normal' | 'double-height' | 'double-width' | 'double-size';

export interface Cell {
  readonly set: CharSet;
  /** Character shown by a G0 cell. A space for blank cells and for G1 cells. */
  readonly char: string;
  /** Lit sixels of a G1 cell. 0 for G0 cells. */
  readonly mask: SixelMask;
  readonly fg: VtxColor;
  readonly bg: VtxColor;
  readonly blink: boolean;
  /** Swaps foreground and background. G0 only. */
  readonly inverse: boolean;
  /** Underlined text for G0; disjoint (separated) mosaic for G1. */
  readonly underline: boolean;
  /** Always 'normal' for G1. */
  readonly size: CharSize;
  /** True when a neighbouring double-size character draws over this cell. */
  readonly covered: boolean;
}

export const BLANK_CELL: Cell = Object.freeze({
  set: 'G0',
  char: ' ',
  mask: 0,
  fg: 7,
  bg: 0,
  blink: false,
  inverse: false,
  underline: false,
  size: 'normal',
  covered: false,
});

export function sizeSpan(size: CharSize): { readonly width: 1 | 2; readonly height: 1 | 2 } {
  switch (size) {
    case 'double-height':
      return { width: 1, height: 2 };
    case 'double-width':
      return { width: 2, height: 1 };
    case 'double-size':
      return { width: 2, height: 2 };
    default:
      return { width: 1, height: 1 };
  }
}

export function sizeFromSpan(width: 1 | 2, height: 1 | 2): CharSize {
  if (width === 2) return height === 2 ? 'double-size' : 'double-width';
  return height === 2 ? 'double-height' : 'normal';
}

/** Colors actually painted, once inversion is applied. */
export function displayedColors(cell: Cell): { readonly fg: VtxColor; readonly bg: VtxColor } {
  return cell.set === 'G0' && cell.inverse ? { fg: cell.bg, bg: cell.fg } : { fg: cell.fg, bg: cell.bg };
}

/** True when the cell looks like the black screen: nothing to send or draw. */
export function isVisiblyEmpty(cell: Cell): boolean {
  if (cell.covered) return true;
  if (displayedColors(cell).bg !== 0) return false;
  return cell.set === 'G0' ? cell.char === ' ' && !cell.underline : cell.mask === 0;
}
