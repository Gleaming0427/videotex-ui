// The demo must move between pages with Next, Back and Index (step 5).
import { describe, expect, it } from 'vitest';
import { pageToText } from '../src/core/page';
import { buildPage, INITIAL_STATE, reduce, SEQUENCE, type DemoAction, type DemoState } from '../demo/pages';

const run = (...actions: DemoAction[]): DemoState => actions.reduce(reduce, INITIAL_STATE);
const key = (name: Extract<DemoAction, { type: 'key' }>['key']): DemoAction => ({ type: 'key', key: name });
const digit = (d: string): DemoAction => ({ type: 'digit', digit: d });

describe('demo navigation', () => {
  it('turns the pages with Next and Back, and stops at both ends', () => {
    expect(run(key('next')).page).toBe('components');
    expect(run(key('next'), key('next'), key('back')).page).toBe('components');
    const last = run(...SEQUENCE.map(() => key('next')));
    expect(last.page).toBe('keys');
    expect(last.message).toBe('Last page');
    expect(run(key('back')).message).toBe('First page');
  });

  it('goes back to the main menu with Index', () => {
    expect(run(key('next'), key('next'), key('index')).page).toBe('home');
  });

  it('opens a menu entry with a digit and Send', () => {
    expect(run(digit('3'), key('send')).page).toBe('palette');
    expect(run(digit('9'), key('send')).message).toBe('Type 1 to 4');
    expect(run(key('send')).message).toBe('Type 1 to 4');
  });

  it('edits the entry with Correction and Cancel', () => {
    expect(run(digit('2'), key('correction')).choice).toBe('');
    expect(run(digit('2'), key('cancel')).choice).toBe('');
    expect(run(key('next'), digit('2')).choice).toBe('');
  });

  it('returns from the guide to the page it was opened from', () => {
    const inGuide = run(key('next'), key('next'), key('guide'));
    expect(inGuide.page).toBe('guide');
    expect(reduce(inGuide, key('back')).page).toBe('mosaics');
  });

  it('draws the page again with Repeat', () => {
    expect(run(key('repeat')).replay).toBe(1);
  });

  it('builds every page within the 40 × 25 grid', () => {
    for (const page of [...SEQUENCE, 'guide'] as const) {
      const text = pageToText(buildPage({ ...INITIAL_STATE, page }));
      const lines = text.split('\n');
      expect(lines).toHaveLength(25);
      expect(Math.max(...lines.map((l) => l.length))).toBeLessThanOrEqual(40);
    }
  });

  it('shows the typed digit on the home page', () => {
    const lines = pageToText(buildPage(run(digit('4')))).split('\n');
    expect(lines[23]).toContain('Your choice: 4');
  });
});
