import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLOR_RGB, GREY_RGB, LUMINANCE_ORDER, toColor } from '../src/core/palette';

const luma = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r! + 0.587 * g! + 0.114 * b!;
};

describe('palette', () => {
  it('accepts codes and names', () => {
    expect(toColor(0)).toBe(0);
    expect(toColor('yellow')).toBe(3);
    expect(toColor('white')).toBe(7);
  });

  it('rejects anything else', () => {
    expect(() => toColor(8 as never)).toThrow(RangeError);
    expect(() => toColor(1.5 as never)).toThrow(RangeError);
    expect(() => toColor('orange' as never)).toThrow(RangeError);
  });

  it('orders the greys by the luminance of each colour', () => {
    const byLuma = [...COLOR_RGB.keys()].sort((a, b) => luma(COLOR_RGB[a]!) - luma(COLOR_RGB[b]!));
    expect(byLuma).toEqual(LUMINANCE_ORDER);
    const greys = LUMINANCE_ORDER.map((code) => luma(GREY_RGB[code]!));
    expect(greys).toEqual([...greys].sort((a, b) => a - b));
    expect(GREY_RGB[0]).toBe('#000000');
    expect(GREY_RGB[7]).toBe('#ffffff');
  });

  it('matches the colours of the stylesheet', () => {
    const css = readFileSync(new URL('../src/styles/videotex.css', import.meta.url), 'utf8');
    const block = (name: string) => {
      const body = css.match(new RegExp(`\\.vtx-palette-${name} \\{([^}]*)\\}`))?.[1] ?? '';
      return [...body.matchAll(/--vtx-c(\d): (#[0-9a-f]{6})/g)].map((m) => m[2]);
    };
    expect(block('color')).toEqual(COLOR_RGB);
    expect(block('monochrome')).toEqual(GREY_RGB);
  });
});
