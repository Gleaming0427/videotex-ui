import { describe, expect, it } from 'vitest';
import {
  bitmapToMasks,
  g1CodeToMask,
  maskFromRows,
  maskToG1Code,
  maskToUnicode,
  SIXEL_FULL,
  SIXEL_LEFT,
  SIXEL_RIGHT,
} from '../src/core/mosaic';
import { mosaicStyle } from '../src/react/mosaicStyle';

const ALL_MASKS = Array.from({ length: 64 }, (_, i) => i);

describe('G1 codes', () => {
  it('maps the edges of both ranges', () => {
    expect(maskToG1Code(0)).toBe(0x20);
    expect(maskToG1Code(0b011111)).toBe(0x3f);
    expect(maskToG1Code(0b100000)).toBe(0x60);
    expect(maskToG1Code(SIXEL_FULL)).toBe(0x7f);
  });

  it('round-trips every mask', () => {
    for (const mask of ALL_MASKS) expect(g1CodeToMask(maskToG1Code(mask))).toBe(mask);
  });

  it('rejects letters and invalid masks', () => {
    expect(() => g1CodeToMask(0x41)).toThrow(RangeError);
    expect(() => maskToG1Code(64)).toThrow(RangeError);
    expect(() => maskToG1Code(-1)).toThrow(RangeError);
  });
});

describe('Unicode sextants', () => {
  it('uses block characters for the special masks', () => {
    expect(maskToUnicode(0)).toBe(' ');
    expect(maskToUnicode(SIXEL_FULL)).toBe('█');
    expect(maskToUnicode(SIXEL_LEFT)).toBe('▌');
    expect(maskToUnicode(SIXEL_RIGHT)).toBe('▐');
  });

  it('covers U+1FB00 to U+1FB3B with one character per mask', () => {
    expect(maskToUnicode(1).codePointAt(0)).toBe(0x1fb00);
    expect(maskToUnicode(62).codePointAt(0)).toBe(0x1fb3b);
    expect(new Set(ALL_MASKS.map(maskToUnicode)).size).toBe(64);
  });
});

describe('authoring helpers', () => {
  it('reads masks from text rows', () => {
    expect(maskFromRows('#.', '..', '..')).toBe(0b000001);
    expect(maskFromRows('.#', '..', '.#')).toBe(0b100010);
    expect(maskFromRows('##', '##', '##')).toBe(SIXEL_FULL);
    expect(() => maskFromRows('#', '..', '..')).toThrow(RangeError);
  });

  it('cuts a bitmap into 2 × 3 cells', () => {
    const masks = bitmapToMasks(['###', '#..', '#..', '...']);
    expect(masks).toHaveLength(2);
    expect(masks[0]).toEqual([SIXEL_LEFT | 0b000010, 0b000001]);
    expect(masks[1]).toEqual([0, 0]);
  });

  it('accepts boolean bitmaps', () => {
    expect(bitmapToMasks([[true, true], [true, true], [true, true]])).toEqual([[SIXEL_FULL]]);
  });
});

describe('mosaicStyle', () => {
  it('draws nothing for an empty mask', () => {
    expect(mosaicStyle(0, false)).toBeUndefined();
  });

  it('places the six sixels of a full mask', () => {
    const style = mosaicStyle(SIXEL_FULL, false)!;
    expect(style.backgroundSize).toBe('50% 30%, 50% 30%, 50% 40%, 50% 40%, 50% 30%, 50% 30%');
    expect(style.backgroundPosition).toBe('0% 0%, 100% 0%, 0% 50%, 100% 50%, 0% 100%, 100% 100%');
  });

  it('separates the sixels of a disjoint mosaic', () => {
    const style = mosaicStyle(0b000010, true)!;
    expect(style.backgroundSize).toBe('37.5% 20%');
    expect(style.backgroundPosition).toBe('80% 0%');
  });
});
