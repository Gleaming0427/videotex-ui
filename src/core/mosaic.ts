// Mosaic (semi-graphic, G1) characters.
//
// A mosaic character splits its cell into 2 × 3 blocks called sixels.
// A mask stores which sixels are lit, one bit per sixel:
//
//   bit 0 | bit 1    top
//   bit 2 | bit 3    middle
//   bit 4 | bit 5    bottom

/** Lit sixels of a mosaic character, 0 to 63. */
export type SixelMask = number;

export const SIXEL_EMPTY: SixelMask = 0;
export const SIXEL_FULL: SixelMask = 0b111111;
/** Left column only (▌). */
export const SIXEL_LEFT: SixelMask = 0b010101;
/** Right column only (▐). */
export const SIXEL_RIGHT: SixelMask = 0b101010;

/** Width of a sixel column, in dots, for an 8-dot cell (to check). */
export const SIXEL_WIDTH = 4;
/** Height of the top, middle and bottom sixel rows, in dots, for a 10-dot cell (to check). */
export const SIXEL_ROW_HEIGHTS: readonly [number, number, number] = [3, 4, 3];

export function isSixelMask(value: number): boolean {
  return Number.isInteger(value) && value >= SIXEL_EMPTY && value <= SIXEL_FULL;
}

export function assertSixelMask(value: number): void {
  if (!isSixelMask(value)) {
    throw new RangeError(`Invalid sixel mask: ${value}. Expected an integer from 0 to 63.`);
  }
}

/** Code of the G1 character drawing this mask: 0x20 to 0x3F, then 0x60 to 0x7F. */
export function maskToG1Code(mask: SixelMask): number {
  assertSixelMask(mask);
  return 0x20 | (mask & 0x1f) | ((mask & 0x20) << 1);
}

export function g1CodeToMask(code: number): SixelMask {
  const valid = Number.isInteger(code) && ((code >= 0x20 && code <= 0x3f) || (code >= 0x60 && code <= 0x7f));
  if (!valid) {
    throw new RangeError(`Not a G1 mosaic code: ${code}. Expected 0x20 to 0x3F or 0x60 to 0x7F.`);
  }
  return (code & 0x1f) | ((code & 0x40) >> 1);
}

/** Unicode character with the same drawing (block sextants, "Symbols for Legacy Computing"). */
export function maskToUnicode(mask: SixelMask): string {
  assertSixelMask(mask);
  switch (mask) {
    case SIXEL_EMPTY:
      return ' ';
    case SIXEL_FULL:
      return '█';
    case SIXEL_LEFT:
      return '▌';
    case SIXEL_RIGHT:
      return '▐';
  }
  // U+1FB00 onwards lists masks 1 to 62 in order, without the two half blocks above.
  const skipped = (mask > SIXEL_LEFT ? 1 : 0) + (mask > SIXEL_RIGHT ? 1 : 0);
  return String.fromCodePoint(0x1fb00 + mask - 1 - skipped);
}

const isLitChar = (ch: string | undefined): boolean => ch !== undefined && ch !== '.' && ch !== ' ';

/**
 * Mask from three 2-character rows, for readable code:
 * `maskFromRows('##', '#.', '.#')`. Any character other than '.' or a space is lit.
 */
export function maskFromRows(top: string, middle: string, bottom: string): SixelMask {
  let mask = 0;
  [top, middle, bottom].forEach((row, y) => {
    if (row.length !== 2) throw new RangeError(`Each sixel row has 2 characters, got "${row}".`);
    if (isLitChar(row[0])) mask |= 1 << (y * 2);
    if (isLitChar(row[1])) mask |= 1 << (y * 2 + 1);
  });
  return mask;
}

/** A bitmap at sixel resolution: strings (any character other than '.' or a space is lit) or booleans. */
export type Bitmap = readonly string[] | readonly (readonly boolean[])[];

/**
 * Cuts a bitmap into cells of 2 × 3 sixels. Returns one mask per cell, row by row.
 * Pixels missing at the right or bottom edge count as off.
 */
export function bitmapToMasks(bitmap: Bitmap): SixelMask[][] {
  const height = bitmap.length;
  const width = Math.max(0, ...bitmap.map((row) => row.length));
  const lit = (x: number, y: number): boolean => {
    const row = bitmap[y];
    if (row === undefined) return false;
    const pixel = row[x];
    return typeof pixel === 'string' ? isLitChar(pixel) : pixel === true;
  };
  const masks: SixelMask[][] = [];
  for (let cy = 0; cy < Math.ceil(height / 3); cy++) {
    const line: SixelMask[] = [];
    for (let cx = 0; cx < Math.ceil(width / 2); cx++) {
      let mask = 0;
      for (let bit = 0; bit < 6; bit++) {
        if (lit(cx * 2 + (bit & 1), cy * 3 + (bit >> 1))) mask |= 1 << bit;
      }
      line.push(mask);
    }
    masks.push(line);
  }
  return masks;
}
