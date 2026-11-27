import type { CSSProperties } from 'react';
import { CELL_HEIGHT, CELL_WIDTH } from '../core/grid';
import { SIXEL_ROW_HEIGHTS, SIXEL_WIDTH, type SixelMask } from '../core/mosaic';

const ROW_OFFSETS = SIXEL_ROW_HEIGHTS.map((_, i) => SIXEL_ROW_HEIGHTS.slice(0, i).reduce((a, b) => a + b, 0));
const pct = (ratio: number): string => `${Number((ratio * 100).toFixed(4))}%`;
const cache = new Map<number, CSSProperties>();

/**
 * Draws the lit sixels of a mosaic cell as background layers in `currentColor`.
 * With an integer scale every layer lands on whole pixels, so mosaics stay sharp.
 * Disjoint mosaics lose one dot on the right and bottom of each sixel (to check against the STUM).
 */
export function mosaicStyle(mask: SixelMask, disjoint: boolean): CSSProperties | undefined {
  if (mask === 0) return undefined;
  const key = mask | (disjoint ? 64 : 0);
  const cached = cache.get(key);
  if (cached) return cached;

  const gap = disjoint ? 1 : 0;
  const sizes: string[] = [];
  const positions: string[] = [];
  for (let bit = 0; bit < 6; bit++) {
    if ((mask & (1 << bit)) === 0) continue;
    const col = bit & 1;
    const row = bit >> 1;
    const w = (SIXEL_WIDTH - gap) / CELL_WIDTH;
    const h = (SIXEL_ROW_HEIGHTS[row as 0 | 1 | 2] - gap) / CELL_HEIGHT;
    const x = (col * SIXEL_WIDTH) / CELL_WIDTH;
    const y = ROW_OFFSETS[row]! / CELL_HEIGHT;
    sizes.push(`${pct(w)} ${pct(h)}`);
    // A background-position percentage aligns that point of the layer with the same point of the box.
    positions.push(`${pct(x / (1 - w))} ${pct(y / (1 - h))}`);
  }
  const style: CSSProperties = Object.freeze({
    backgroundImage: Array(sizes.length).fill('linear-gradient(currentColor, currentColor)').join(', '),
    backgroundSize: sizes.join(', '),
    backgroundPosition: positions.join(', '),
    backgroundRepeat: 'no-repeat',
  });
  cache.set(key, style);
  return style;
}
