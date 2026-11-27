// Reference images for the mosaic converter: small pictures whose right answer is known.
import { describe, expect, it } from 'vitest';
import { PageBuilder } from '../src/core/builder';
import {
  decodeMosaic,
  encodeMosaic,
  imageToMosaic,
  mosaicSize,
  mosaicToCode,
  renderMosaic,
  type MosaicImage,
  type RgbaImage,
} from '../src/core/image';
import { SIXEL_FULL, SIXEL_LEFT } from '../src/core/mosaic';
import { cellAt } from '../src/core/page';

type Rgb = [number, number, number];

/** A picture of cols × rows cells at one pixel per screen dot, painted by a function of the dot. */
function picture(cols: number, rows: number, paint: (x: number, y: number) => Rgb, alpha = 255): RgbaImage {
  const width = cols * 8;
  const height = rows * 10;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint(x, y);
      data.set([r, g, b, alpha], (y * width + x) * 4);
    }
  }
  return { width, height, data };
}

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];
const convert = (image: RgbaImage, cols: number, rows: number, extra = {}) => imageToMosaic(image, { cols, rows, ...extra });
const only = (image: MosaicImage) => image.cells[0]![0]!;

describe('mosaicSize', () => {
  it('keeps the proportions of the picture (cells are 8 × 10 dots)', () => {
    expect(mosaicSize(320, 250, { cols: 40 })).toEqual({ cols: 40, rows: 25 });
    expect(mosaicSize(320, 250)).toEqual({ cols: 40, rows: 25 });
    expect(mosaicSize(800, 500, { rows: 10 })).toEqual({ cols: 20, rows: 10 });
  });

  it('fits inside a box', () => {
    expect(mosaicSize(1000, 1000, { cols: 40, rows: 16 })).toEqual({ cols: 20, rows: 16 });
    expect(mosaicSize(2000, 100, { cols: 40, rows: 16 })).toEqual({ cols: 40, rows: 2 });
  });

  it('rejects bad sizes', () => {
    expect(() => mosaicSize(0, 10)).toThrow(RangeError);
    expect(() => mosaicSize(10, 10, { cols: 0 })).toThrow(RangeError);
  });
});

describe('imageToMosaic', () => {
  it('turns a solid color into full blocks on black', () => {
    const red = convert(picture(3, 2, () => [250, 10, 0]), 3, 2);
    expect(red.cells.flat().every((c) => c.mask === SIXEL_FULL && c.fg === 1 && c.bg === 0)).toBe(true);
  });

  it('turns black into empty cells', () => {
    expect(only(convert(picture(1, 1, () => BLACK), 1, 1))).toEqual({ mask: 0, fg: 0, bg: 0 });
  });

  it('finds a left half', () => {
    expect(only(convert(picture(1, 1, (x) => (x < 4 ? WHITE : BLACK)), 1, 1))).toEqual({ mask: SIXEL_LEFT, fg: 7, bg: 0 });
  });

  it('puts the darker color in the background', () => {
    // Top sixel row (3 dots) yellow, the rest blue.
    const cell = only(convert(picture(1, 1, (_, y) => (y < 3 ? [255, 255, 0] : [0, 0, 255])), 1, 1));
    expect(cell).toEqual({ mask: 0b000011, fg: 3, bg: 4 });
  });

  it('follows the 3-4-3 heights of the sixel rows', () => {
    // Dots 0 to 6 white = top and middle sixel rows.
    expect(only(convert(picture(1, 1, (_, y) => (y < 7 ? WHITE : BLACK)), 1, 1)).mask).toBe(0b001111);
  });

  it('matches grey levels with the monochrome palette', () => {
    const grey = convert(picture(1, 1, () => [0x92, 0x92, 0x92]), 1, 1, { palette: 'monochrome' });
    expect(only(grey)).toEqual({ mask: SIXEL_FULL, fg: 2, bg: 0 });
  });

  it('treats transparent pixels as black', () => {
    expect(only(convert(picture(1, 1, () => WHITE, 0), 1, 1)).mask).toBe(0);
  });

  it('samples a large picture down and a small one up', () => {
    const large = picture(8, 8, (x) => (x < 32 ? WHITE : BLACK));
    expect(convert(large, 2, 2).cells.map((r) => r.map((c) => c.fg))).toEqual([
      [7, 0],
      [7, 0],
    ]);
    const tiny: RgbaImage = { width: 1, height: 1, data: [0, 255, 0, 255] };
    expect(convert(tiny, 3, 2).cells.flat().every((c) => c.fg === 2 && c.mask === SIXEL_FULL)).toBe(true);
  });

  it('mixes black and white for mid grey when dithering', () => {
    const grey = picture(10, 6, () => [128, 128, 128]);
    // Share of sixels shown in white.
    const lit = (image: MosaicImage) =>
      image.cells
        .flat()
        .reduce((sum, c) => sum + [0, 1, 2, 3, 4, 5].filter((bit) => (c.mask & (1 << bit) ? c.fg : c.bg) === 7).length, 0) /
      (60 * 6);
    expect(lit(convert(grey, 10, 6))).toBe(1);
    const share = lit(convert(grey, 10, 6, { dither: true }));
    expect(share).toBeGreaterThan(0.3);
    expect(share).toBeLessThan(0.7);
  });

  it('rejects short pixel data', () => {
    expect(() => imageToMosaic({ width: 2, height: 2, data: [0, 0, 0, 255] }, { cols: 1, rows: 1 })).toThrow(RangeError);
  });
});

describe('renderMosaic', () => {
  const half: MosaicImage = { cols: 1, rows: 1, cells: [[{ mask: SIXEL_LEFT, fg: 7, bg: 4 }]] };

  it('draws 8 × 10 pixels per cell', () => {
    const { width, height, data } = renderMosaic(half);
    expect([width, height]).toEqual([8, 10]);
    expect([...data.slice(0, 4)]).toEqual([255, 255, 255, 255]);
    const right = (0 * width + 4) * 4;
    expect([...data.slice(right, right + 4)]).toEqual([0, 0, 255, 255]);
  });

  it('scales and uses the grey palette', () => {
    const { width, data } = renderMosaic(half, { scale: 2, palette: 'monochrome' });
    expect(width).toBe(16);
    const right = 8 * 4;
    expect(data[right]).toBe(0x24);
  });

  it('turns a converted picture back into the same picture', () => {
    const source = picture(2, 1, (x, y) => (x < 8 && y < 3 ? WHITE : BLACK));
    const { data } = renderMosaic(convert(source, 2, 1));
    expect([...data]).toEqual(Array.from(source.data));
  });
});

describe('text form and code', () => {
  const image: MosaicImage = {
    cols: 2,
    rows: 2,
    cells: [
      [
        { mask: 0, fg: 0, bg: 0 },
        { mask: 63, fg: 7, bg: 4 },
      ],
      [
        { mask: 21, fg: 3, bg: 1 },
        { mask: 42, fg: 6, bg: 5 },
      ],
    ],
  };

  it('round-trips through two characters per cell', () => {
    const text = encodeMosaic(image);
    expect(text).toMatch(/^2x2:[A-Za-z0-9_-]{8}$/);
    expect(decodeMosaic(text)).toEqual(image);
  });

  it('rejects malformed text', () => {
    expect(() => decodeMosaic('2x2:AAAA')).toThrow(SyntaxError);
    expect(() => decodeMosaic('hello')).toThrow(SyntaxError);
  });

  it('writes a component that decodes the picture', () => {
    const code = mosaicToCode(image, { name: 'my cat.jpg', alt: 'My "cat"' });
    expect(code).toContain(`const myCatJpg = decodeMosaic('${encodeMosaic(image)}');`);
    expect(code).toContain('export function MyCatJpg()');
    expect(code).toContain('alt={"My \\"cat\\""}');
    expect(mosaicToCode(image, { name: '2024' })).toContain('const picture2024 =');
  });
});

describe('PageBuilder.mosaicImage', () => {
  it('writes each cell with its own colors and cuts at the right edge', () => {
    const image: MosaicImage = { cols: 3, rows: 1, cells: [[{ mask: 1, fg: 1, bg: 2 }, { mask: 2, fg: 3, bg: 4 }, { mask: 3, fg: 5, bg: 6 }]] };
    const page = new PageBuilder().moveTo(5, 38).mosaicImage(image).build();
    expect(cellAt(page, 5, 38)).toMatchObject({ set: 'G1', mask: 1, fg: 1, bg: 2 });
    expect(cellAt(page, 5, 39)).toMatchObject({ mask: 2, fg: 3, bg: 4 });
    expect(cellAt(page, 6, 0).set).toBe('G0');
  });
});
