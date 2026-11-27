import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SHORTCUTS,
  FUNCTION_KEY_CODES,
  FUNCTION_KEY_LABELS,
  FUNCTION_KEYS,
  keyFromEvent,
  resolveShortcuts,
  SEP,
} from '../src/core/keys';

describe('function keys', () => {
  it('has 8 keys with English and French labels', () => {
    expect(FUNCTION_KEYS).toHaveLength(8);
    expect(FUNCTION_KEY_LABELS.en.send).toBe('Send');
    expect(FUNCTION_KEY_LABELS.fr.send).toBe('Envoi');
    expect(FUNCTION_KEY_LABELS.fr.index).toBe('Sommaire');
  });

  it('has the Videotex codes of the STUM 1B, sent after SEP', () => {
    expect(SEP).toBe(0x13);
    expect(FUNCTION_KEY_CODES.send).toBe(0x41);
    expect(FUNCTION_KEY_CODES.next).toBe(0x48);
    expect(new Set(Object.values(FUNCTION_KEY_CODES)).size).toBe(8);
  });
});

describe('resolveShortcuts', () => {
  it('gives nothing, the defaults, or the defaults with overrides', () => {
    expect(resolveShortcuts(false)).toEqual({});
    expect(resolveShortcuts(true)).toEqual(DEFAULT_SHORTCUTS);
    const custom = resolveShortcuts({ next: 'ArrowDown', guide: null });
    expect(custom.next).toBe('ArrowDown');
    expect(custom.send).toBe('Enter');
    expect('guide' in custom).toBe(false);
  });

  it('rejects one shortcut for two keys', () => {
    expect(() => resolveShortcuts({ next: 'Enter' })).toThrow(/"send" and "next"|"next" and "send"/);
  });
});

describe('keyFromEvent', () => {
  const shortcuts = resolveShortcuts(true);

  it('finds the key of an event', () => {
    expect(keyFromEvent({ key: 'Enter' }, shortcuts)).toBe('send');
    expect(keyFromEvent({ key: 'PageDown' }, shortcuts)).toBe('next');
    expect(keyFromEvent({ key: '?' }, shortcuts)).toBe('guide');
  });

  it('ignores other keys and modifier combinations', () => {
    expect(keyFromEvent({ key: 'a' }, shortcuts)).toBeNull();
    expect(keyFromEvent({ key: 'Enter', ctrlKey: true }, shortcuts)).toBeNull();
    expect(keyFromEvent({ key: 'Home', metaKey: true }, shortcuts)).toBeNull();
    expect(keyFromEvent({ key: 'Enter' }, {})).toBeNull();
  });
});
