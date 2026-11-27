// The 8 Minitel function keys: names, labels and keyboard shortcuts.

/**
 * Keys in our layout order: two columns, read row by row. The STUM 1B shows the keyboard only in
 * photos, so this arrangement is not verified.
 */
export const FUNCTION_KEYS = ['index', 'guide', 'cancel', 'correction', 'back', 'next', 'repeat', 'send'] as const;

export type FunctionKeyName = (typeof FUNCTION_KEYS)[number];

export type FunctionKeyLabels = Readonly<Record<FunctionKeyName, string>>;

export const FUNCTION_KEY_LABELS: Readonly<{ en: FunctionKeyLabels; fr: FunctionKeyLabels }> = Object.freeze({
  en: Object.freeze({
    index: 'Index',
    guide: 'Guide',
    cancel: 'Cancel',
    correction: 'Correction',
    back: 'Back',
    next: 'Next',
    repeat: 'Repeat',
    send: 'Send',
  }),
  /** As printed on the Minitel keyboard. */
  fr: Object.freeze({
    index: 'Sommaire',
    guide: 'Guide',
    cancel: 'Annulation',
    correction: 'Correction',
    back: 'Retour',
    next: 'Suite',
    repeat: 'Répétition',
    send: 'Envoi',
  }),
});

/** Control code sent before a function key code. */
export const SEP = 0x13;

/**
 * Byte sent after SEP by each key in Videotex mode (STUM 1B, part 2, ch. 3, §6).
 * Connexion/Fin (0x49) goes to the modem and is not one of the 8 keys.
 */
export const FUNCTION_KEY_CODES: Readonly<Record<FunctionKeyName, number>> = Object.freeze({
  send: 0x41,
  back: 0x42,
  repeat: 0x43,
  guide: 0x44,
  cancel: 0x45,
  index: 0x46,
  correction: 0x47,
  next: 0x48,
});

/** A `KeyboardEvent.key` value per function key. Shift is allowed (for '?'); Ctrl, Alt and Meta are not. */
export type FunctionKeyShortcuts = Readonly<Partial<Record<FunctionKeyName, string>>>;

export const DEFAULT_SHORTCUTS: Readonly<Record<FunctionKeyName, string>> = Object.freeze({
  index: 'Home',
  guide: '?',
  cancel: 'Escape',
  correction: 'Backspace',
  back: 'PageUp',
  next: 'PageDown',
  repeat: 'End',
  send: 'Enter',
});

/** `true`: default shortcuts. `false`: none. Object: defaults with overrides, `null` removes one. */
export type ShortcutsInput = boolean | Readonly<Partial<Record<FunctionKeyName, string | null>>>;

export function resolveShortcuts(input: ShortcutsInput): FunctionKeyShortcuts {
  if (input === false) return {};
  const merged: Partial<Record<FunctionKeyName, string>> = {};
  const seen = new Map<string, FunctionKeyName>();
  for (const name of FUNCTION_KEYS) {
    const value = input === true || !(name in input) ? DEFAULT_SHORTCUTS[name] : input[name];
    if (value === null || value === undefined) continue;
    const owner = seen.get(value);
    if (owner) throw new RangeError(`Shortcut "${value}" is used by both "${owner}" and "${name}".`);
    seen.set(value, name);
    merged[name] = value;
  }
  return merged;
}

export interface KeyLike {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly altKey?: boolean;
  readonly metaKey?: boolean;
}

/** The function key a keyboard event stands for, or null. */
export function keyFromEvent(event: KeyLike, shortcuts: FunctionKeyShortcuts): FunctionKeyName | null {
  if (event.ctrlKey || event.altKey || event.metaKey) return null;
  return FUNCTION_KEYS.find((name) => shortcuts[name] === event.key) ?? null;
}
