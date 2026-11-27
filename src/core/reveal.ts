import { isVisiblyEmpty } from './cell';
import type { Page } from './page';

/** Bits sent per character on a Minitel line: start, 7 data bits, even parity, stop (STUM 1B). */
export const BITS_PER_CHARACTER = 10;

/** Usual Minitel speed, in bauds. */
export const MINITEL_BAUD = 1200;

export interface RevealSchedule {
  /** Time at which each cell appears, in milliseconds, row by row (row 0 first). */
  readonly delays: readonly number[];
  /** Time to draw the whole page, in milliseconds. */
  readonly duration: number;
}

/**
 * When each cell appears if the page is sent over a line at `baud` bits per second.
 * Every cell that is not black and empty costs one character; empty cells cost nothing.
 * At 1200 bauds a full page of 1000 characters takes about 8.3 seconds.
 */
export function revealSchedule(page: Page, baud: number = MINITEL_BAUD): RevealSchedule {
  if (!(Number.isFinite(baud) && baud > 0)) {
    throw new RangeError(`Invalid speed: ${baud}. Expected a positive number of bauds.`);
  }
  const msPerCharacter = (BITS_PER_CHARACTER * 1000) / baud;
  const delays: number[] = [];
  let sent = 0;
  for (const row of page.cells) {
    for (const cell of row) {
      if (!isVisiblyEmpty(cell)) sent += 1;
      delays.push(sent * msPerCharacter);
    }
  }
  return { delays, duration: sent * msPerCharacter };
}
