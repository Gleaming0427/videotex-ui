// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageBuilder } from '../src/core/builder';
import { SIXEL_FULL } from '../src/core/mosaic';
import { Screen } from '../src/react/Screen';

afterEach(cleanup);

const page = new PageBuilder()
  .moveTo(3, 2)
  .print('HELLO', { fg: 'yellow', size: 'double-size' })
  .moveTo(5, 2)
  .print('Choice', { inverse: true, blink: true })
  .moveTo(7, 0)
  .mosaic([SIXEL_FULL, 0, 1], { fg: 'cyan', underline: true })
  .build();

describe('Screen', () => {
  it('draws 1000 cells and hides them from assistive technologies', () => {
    const { container } = render(<Screen page={page} scale={2} />);
    expect(container.querySelectorAll('.vtx-cell')).toHaveLength(1000);
    expect(container.querySelector('.vtx-display')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes the text of the page and an accessible name', () => {
    const { getByRole, getByText } = render(<Screen page={page} aria-label="Home" />);
    expect(getByRole('figure', { name: 'Home' })).toBeTruthy();
    expect(getByText('H E L L O')).toBeTruthy();
    expect(getByText('Choice')).toBeTruthy();
  });

  it('applies colors, inversion, blinking and double size', () => {
    const { container } = render(<Screen page={page} />);
    const cells = container.querySelectorAll('.vtx-cell');
    const title = cells[3 * 40 + 2]!;
    expect(title.classList.contains('vtx-anchor')).toBe(true);
    expect(title.querySelector('.vtx-glyph')?.className).toContain('vtx-double-size');
    expect(title.querySelector('.vtx-glyph')?.className).toContain('vtx-fg-3');
    const choice = cells[5 * 40 + 2]!;
    expect(choice.className).toContain('vtx-bg-7');
    expect(choice.querySelector('.vtx-glyph')?.className).toContain('vtx-fg-0');
    expect(choice.querySelector('.vtx-glyph')?.className).toContain('vtx-blink');
  });

  it('draws mosaics as background layers', () => {
    const { container } = render(<Screen page={page} />);
    const cells = container.querySelectorAll('.vtx-cell');
    const full = cells[7 * 40]!.querySelector<HTMLElement>('.vtx-glyph')!;
    expect(full.style.backgroundImage).toContain('linear-gradient');
    expect(cells[7 * 40 + 1]!.querySelector('.vtx-glyph')).toBeNull();
  });

  it('switches palette and effects with classes', () => {
    const { container } = render(<Screen page={page} palette="monochrome" crt blink={false} />);
    const root = container.querySelector('.vtx-screen')!;
    expect(root.className).toContain('vtx-palette-monochrome');
    expect(root.className).toContain('vtx-crt');
    expect(root.className).toContain('vtx-no-blink');
  });

  it('schedules a progressive display and reports its end', () => {
    vi.useFakeTimers();
    const onRevealEnd = vi.fn();
    const { container } = render(<Screen page={page} baud={1200} onRevealEnd={onRevealEnd} />);
    expect(container.querySelector('.vtx-screen')!.className).toContain('vtx-revealing');
    const delays = [...container.querySelectorAll<HTMLElement>('.vtx-cell')].map((c) => parseFloat(c.style.animationDelay));
    expect(Math.max(...delays)).toBeGreaterThan(0);
    vi.advanceTimersByTime(Math.max(...delays) + 1);
    expect(onRevealEnd).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
