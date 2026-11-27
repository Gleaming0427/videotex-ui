import { describe, expect, it } from 'vitest';
import { PageBuilder } from '../src/core/builder';
import { cellAt, createPage, pageToPlainText, pageToText } from '../src/core/page';
import { revealSchedule } from '../src/core/reveal';
import { SIXEL_FULL } from '../src/core/mosaic';

const rowText = (builder: PageBuilder, row: number) => pageToText(builder.build()).split('\n')[row];

describe('PageBuilder: text', () => {
  it('starts at row 1, column 0, white on black', () => {
    const b = new PageBuilder().print('A');
    const cell = cellAt(b.build(), 1, 0);
    expect(cell).toMatchObject({ set: 'G0', char: 'A', fg: 7, bg: 0, size: 'normal' });
    expect(b.cursor).toEqual({ row: 1, col: 1 });
  });

  it('applies call attributes without keeping them', () => {
    const b = new PageBuilder().moveTo(2, 0).print('A', { fg: 'red', inverse: true }).print('B');
    expect(cellAt(b.build(), 2, 0)).toMatchObject({ fg: 1, inverse: true });
    expect(cellAt(b.build(), 2, 1)).toMatchObject({ fg: 7, inverse: false });
  });

  it('keeps attributes set with attr() until reset()', () => {
    const b = new PageBuilder({ bg: 'blue' }).attr({ fg: 'yellow' }).print('A').reset().print('B');
    expect(cellAt(b.build(), 1, 0)).toMatchObject({ fg: 3, bg: 4 });
    expect(cellAt(b.build(), 1, 1)).toMatchObject({ fg: 7, bg: 4 });
  });

  it('wraps at column 40, without an extra line before \\n', () => {
    const b = new PageBuilder().moveTo(3, 0).print('x'.repeat(40) + '\nnext');
    expect(rowText(b, 3)).toBe('x'.repeat(40));
    expect(rowText(b, 4)).toBe('next');
    const c = new PageBuilder().moveTo(3, 38).print('abcd');
    expect(rowText(c, 3)).toBe(' '.repeat(38) + 'ab');
    expect(rowText(c, 4)).toBe('cd');
  });

  it('returns to the margin set by moveTo on \\n', () => {
    const b = new PageBuilder().moveTo(5, 4).print('one').print('\ntwo');
    expect(rowText(b, 6)).toBe('    two');
  });

  it('shows the extra characters of the service row in column 40 (STUM)', () => {
    const b = new PageBuilder().moveTo(0, 35).print('abcdefgh');
    expect(rowText(b, 0)).toBe(' '.repeat(35) + 'abcdh');
    expect(rowText(b, 1)).toBe('');
  });

  it('drops text written past the last row', () => {
    const b = new PageBuilder().moveTo(24, 38).print('abcdef');
    expect(rowText(b, 24)).toBe(' '.repeat(38) + 'ab');
    expect(b.build().cells).toHaveLength(25);
  });

  it('rejects positions outside the screen', () => {
    expect(() => new PageBuilder().moveTo(25, 0)).toThrow(RangeError);
    expect(() => new PageBuilder().moveTo(0, 40)).toThrow(RangeError);
  });
});

describe('PageBuilder: double sizes', () => {
  it('double width covers the next column', () => {
    const page = new PageBuilder().moveTo(5, 0).print('AB', { size: 'double-width' }).build();
    expect(cellAt(page, 5, 0)).toMatchObject({ char: 'A', size: 'double-width' });
    expect(cellAt(page, 5, 1).covered).toBe(true);
    expect(cellAt(page, 5, 2)).toMatchObject({ char: 'B', size: 'double-width' });
  });

  it('double height covers the row above', () => {
    const page = new PageBuilder().moveTo(5, 0).print('A', { size: 'double-height', bg: 'blue' }).build();
    expect(cellAt(page, 5, 0).size).toBe('double-height');
    expect(cellAt(page, 4, 0)).toMatchObject({ covered: true, bg: 4 });
  });

  it('double size covers three cells', () => {
    const page = new PageBuilder().moveTo(5, 0).print('A', { size: 'double-size' }).build();
    expect([cellAt(page, 5, 1), cellAt(page, 4, 0), cellAt(page, 4, 1)].every((c) => c.covered)).toBe(true);
  });

  it('ignores double height and double size on rows 0 and 1, but not double width (STUM)', () => {
    const page = new PageBuilder()
      .moveTo(1, 0)
      .print('A', { size: 'double-size' })
      .print('B', { size: 'double-height' })
      .print('C', { size: 'double-width' })
      .moveTo(0, 0)
      .print('D', { size: 'double-size' })
      .build();
    expect([cellAt(page, 1, 0).size, cellAt(page, 1, 1).size]).toEqual(['normal', 'normal']);
    expect(cellAt(page, 1, 2).size).toBe('double-width');
    expect(cellAt(page, 0, 0).size).toBe('normal');
  });

  it('draws a double-width character at normal width in column 40 (STUM)', () => {
    const page = new PageBuilder().moveTo(5, 39).print('A', { size: 'double-width' }).print('B').build();
    expect(cellAt(page, 5, 39)).toMatchObject({ char: 'A', size: 'normal' });
    expect(cellAt(page, 6, 0).char).toBe('B');
    const tall = new PageBuilder().moveTo(5, 39).print('A', { size: 'double-size' }).build();
    expect(cellAt(tall, 5, 39).size).toBe('double-height');
  });
});

describe('PageBuilder: mosaics and fills', () => {
  it('writes mosaics without size or inversion', () => {
    const page = new PageBuilder()
      .moveTo(2, 0)
      .mosaic([SIXEL_FULL, 1], { size: 'double-size', inverse: true, underline: true })
      .build();
    expect(cellAt(page, 2, 0)).toMatchObject({ set: 'G1', mask: SIXEL_FULL, size: 'normal', inverse: false, underline: true });
    expect(cellAt(page, 2, 1).mask).toBe(1);
  });

  it('writes a block of mosaic rows at the same column', () => {
    const page = new PageBuilder().moveTo(10, 3).mosaicBlock([[1, 2], [3, 4]]).build();
    expect([cellAt(page, 10, 3).mask, cellAt(page, 10, 4).mask]).toEqual([1, 2]);
    expect([cellAt(page, 11, 3).mask, cellAt(page, 11, 4).mask]).toEqual([3, 4]);
  });

  it('fills a rectangle, clipped to the screen', () => {
    const b = new PageBuilder().moveTo(3, 3);
    const page = b.fill(23, 38, 5, 5, { bg: 'red' }).build();
    expect(cellAt(page, 24, 39).bg).toBe(1);
    expect(cellAt(page, 22, 39).bg).toBe(0);
    expect(b.cursor).toEqual({ row: 3, col: 3 });
  });

  it('rejects invalid masks', () => {
    expect(() => new PageBuilder().mosaic(64)).toThrow(RangeError);
  });

  it('returns snapshots that later writes do not change', () => {
    const b = new PageBuilder();
    const first = b.print('A').build();
    b.print('B');
    expect(cellAt(first, 1, 1).char).toBe(' ');
    expect(Object.isFrozen(first.cells[1])).toBe(true);
  });
});

describe('text output', () => {
  it('gives plain text for screen readers', () => {
    const page = new PageBuilder()
      .moveTo(0, 1)
      .print('SERVICE')
      .moveTo(3, 2)
      .print('HELLO', { size: 'double-width' })
      .moveTo(5, 0)
      .mosaic([SIXEL_FULL, SIXEL_FULL])
      .print('  Type   1')
      .build();
    expect(pageToPlainText(page)).toEqual(['SERVICE', 'H E L L O', 'Type 1']);
  });

  it('can write mosaics as Unicode', () => {
    const page = new PageBuilder().mosaic([SIXEL_FULL, 1]).build();
    expect(pageToText(page, { mosaic: 'unicode' }).split('\n')[1]).toBe('█\u{1fb00}');
  });
});

describe('revealSchedule', () => {
  it('costs nothing for an empty page', () => {
    expect(revealSchedule(createPage()).duration).toBe(0);
  });

  it('sends 120 characters per second at 1200 bauds', () => {
    const page = new PageBuilder().moveTo(1, 0).print('x'.repeat(120)).build();
    const schedule = revealSchedule(page, 1200);
    expect(schedule.duration).toBeCloseTo(1000);
    expect(schedule.delays).toHaveLength(1000);
    expect(schedule.delays[40]).toBeCloseTo(1000 / 120);
  });

  it('counts colored spaces but not black ones', () => {
    const page = new PageBuilder().fill(1, 0, 1, 10, { bg: 'blue' }).build();
    expect(revealSchedule(page, 1200).duration).toBeCloseTo((10 * 1000) / 120);
  });

  it('rejects a speed of zero', () => {
    expect(() => revealSchedule(createPage(), 0)).toThrow(RangeError);
  });
});
