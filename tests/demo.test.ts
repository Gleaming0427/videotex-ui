// The demo must move between pages with Next, Back and Index (step 5).
import { describe, expect, it } from 'vitest';
import { pageToText } from '../src/core/page';
import { buildPage, INITIAL_STATE, reduce, SEQUENCE, statusRight, type DemoAction, type DemoState } from '../demo/pages';

const run = (...actions: DemoAction[]): DemoState => actions.reduce(reduce, INITIAL_STATE);
const key = (name: Extract<DemoAction, { type: 'key' }>['key']): DemoAction => ({ type: 'key', key: name });
const input = (value: string): DemoAction => ({ type: 'input', value });

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

  it('opens a menu entry with a number and Send, or from the menu', () => {
    expect(run(input('3'), key('send')).page).toBe('palette');
    expect(run(input('9'), key('send')).message).toBe('Type 1 to 4');
    expect(run(key('send')).message).toBe('Type 1 to 4');
    expect(run({ type: 'open', index: 0 }).page).toBe('components');
  });

  it('edits the entry with Correction and Cancel', () => {
    expect(run(input('2'), key('correction')).choice).toBe('');
    expect(run(input('2'), key('cancel')).choice).toBe('');
    expect(run(key('next'), input('2')).choice).toBe('');
  });

  it('returns from the guide to the page it was opened from', () => {
    const inGuide = run(key('next'), key('next'), key('guide'));
    expect(inGuide.page).toBe('guide');
    expect(reduce(inGuide, key('back')).page).toBe('mosaics');
  });

  it('opens the converted picture as a side trip', () => {
    const picture = run(key('next'), { type: 'picture' });
    expect(picture.page).toBe('picture');
    expect(reduce(picture, key('next')).message).toBe('Press Back');
    expect(reduce(picture, key('back')).page).toBe('components');
    const guide = reduce(picture, key('guide'));
    expect(reduce(guide, key('back')).page).toBe('components');
  });

  it('draws the page again with Repeat', () => {
    expect(run(key('repeat')).replay).toBe(1);
  });

  it('numbers the content pages on the service row', () => {
    expect(statusRight('home')).toBe('0.00 F/min');
    expect(statusRight('components')).toBe('1/4');
    expect(statusRight('guide')).toBe('');
  });

  it('builds every background within the 40 × 25 grid', () => {
    for (const page of [...SEQUENCE, 'guide', 'picture'] as const) {
      const lines = pageToText(buildPage(page)).split('\n');
      expect(lines).toHaveLength(25);
      expect(Math.max(...lines.map((l) => l.length))).toBeLessThanOrEqual(40);
    }
  });
});
