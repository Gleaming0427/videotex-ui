import { describe, expect, it } from 'vitest';
import { PageBuilder } from '../src/core/builder';
import { cropPage } from '../src/core/page';
import { fieldRegion, frameRegion, menuItemRegion, statusRegion, titleRegion } from '../src/core/regions';
import type { Cell } from '../src/core/cell';

const text = (cells: readonly (readonly (Cell | null)[])[]) =>
  cells.map((row) => row.map((c) => (c === null ? '·' : c.covered ? '+' : c.set === 'G1' ? '#' : c.char)).join(''));

describe('cropPage', () => {
  it('cuts a rectangle and clips it to the screen', () => {
    const page = new PageBuilder().moveTo(24, 38).print('AB').build();
    expect(text(cropPage(page, 24, 38, 5, 5))).toEqual(['AB']);
  });

  it('leaves out the cells keep() refuses', () => {
    const page = new PageBuilder().moveTo(1, 0).print('ABC').build();
    expect(text(cropPage(page, 1, 0, 1, 3, (_, col) => col !== 1))).toEqual(['A·C']);
  });
});

describe('titleRegion', () => {
  it('covers the row above for double size', () => {
    const region = titleRegion('HI', 3, 2, { fg: 'yellow' });
    expect(region.top).toBe(2);
    expect(region.left).toBe(2);
    expect(text(region.cells)).toEqual(['++++', 'H+I+']);
  });

  it('keeps one row for normal size and on row 1', () => {
    expect(titleRegion('HI', 5, 0, { size: 'normal' }).cells).toHaveLength(1);
    const onRowOne = titleRegion('HI', 1, 0);
    expect(onRowOne.top).toBe(1);
    expect(text(onRowOne.cells)).toEqual(['HI']);
  });

  it('is cut at the right edge', () => {
    expect(titleRegion('HELLO', 3, 36).cells[0]).toHaveLength(4);
  });
});

describe('statusRegion', () => {
  it('fills row 0 with the name, a centered message and the right part', () => {
    const [row] = text(statusRegion({ left: 'SERVICE', message: 'Hello', right: '1/4' }).cells);
    expect(row).toHaveLength(40);
    expect(row!.slice(1, 8)).toBe('SERVICE');
    expect(row!.slice(17, 22)).toBe('Hello');
    expect(row!.slice(36, 39)).toBe('1/4');
  });

  it('keeps a blank column between the message and the texts around it', () => {
    const [row] = text(statusRegion({ left: 'VIDEOTEX-UI', message: 'Trains selected', right: '0.00 F/min' }).cells);
    expect(row).toBe(' VIDEOTEX-UI Trains selected 0.00 F/min ');
  });
});

describe('fieldRegion', () => {
  it('shows the value, then dots, with the cursor underlined and blinking', () => {
    const region = fieldRegion('12', 4, 23, 15, { cursor: 2 });
    expect(text(region.cells)).toEqual(['12..']);
    const cursor = region.cells[0]![2]!;
    expect(cursor.underline && cursor.blink).toBe(true);
    expect(region.cells[0]![0]!.underline).toBe(false);
  });

  it('has no cursor by default and stops at the right edge', () => {
    expect(fieldRegion('', 3, 1, 0).cells[0]!.some((c) => c?.underline)).toBe(false);
    expect(fieldRegion('', 10, 1, 35).cells[0]).toHaveLength(5);
  });
});

describe('menuItemRegion', () => {
  it('draws the number in inverse, then the label', () => {
    const region = menuItemRegion('News', 1, 18, 2);
    expect(text(region.cells)).toEqual([' 1  News']);
    expect(region.cells[0]![1]!.inverse).toBe(true);
    expect(region.cells[0]![4]!.inverse).toBe(false);
    expect(menuItemRegion('News', 1, 18, 2, { selected: true }).cells[0]![4]!.inverse).toBe(true);
  });
});

describe('frameRegion', () => {
  it('draws mosaic edges and leaves the inside transparent', () => {
    expect(text(frameRegion(5, 1, 4, 6).cells)).toEqual(['######', '#····#', '#····#', '######']);
  });

  it('writes the title on the top edge and can fill the inside', () => {
    const region = frameRegion(5, 1, 3, 12, { title: 'MENU', fill: 'blue' });
    expect(text(region.cells)[0]).toBe('## MENU ####');
    expect(region.cells[1]![3]).toMatchObject({ bg: 4 });
  });

  it('uses corner and edge masks that join up', () => {
    const [top, middle] = frameRegion(5, 1, 3, 3).cells;
    expect(top!.map((c) => c!.mask)).toEqual([0b100000, 0b110000, 0b010000]);
    expect([middle![0]!.mask, middle![2]!.mask]).toEqual([0b101010, 0b010101]);
  });
});
