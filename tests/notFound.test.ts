// The demo's 404 page (demo/NotFound.tsx).
import { describe, expect, it } from 'vitest';
import { pageToText } from '../src/core/page';
import { fitAddress, notFoundPage } from '../demo/NotFound';

describe('demo 404 page', () => {
  it('shows the address that was asked for', () => {
    expect(pageToText(notFoundPage('/nowhere')).split('\n')[17]).toBe('  /nowhere');
  });

  it('cuts a long address and replaces characters the screen cannot show', () => {
    expect(fitAddress(`/${'a'.repeat(50)}`)).toBe(`/${'a'.repeat(32)}...`);
    expect(fitAddress(`/${'a'.repeat(50)}`)).toHaveLength(36);
    expect(fitAddress('/café')).toBe('/caf?');
  });

  it('draws the digits with mosaic characters on rows 5 to 12', () => {
    const page = notFoundPage('/');
    const mosaicRows = page.cells.flatMap((row, r) => (row.some((cell) => cell.set === 'G1') ? [r] : []));
    // Row 22 is the line above the key hints.
    expect(mosaicRows).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 22]);
  });
});
