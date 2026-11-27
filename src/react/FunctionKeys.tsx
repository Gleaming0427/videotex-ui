'use client';

import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import {
  FUNCTION_KEY_LABELS,
  FUNCTION_KEYS,
  keyFromEvent,
  resolveShortcuts,
  type FunctionKeyName,
  type ShortcutsInput,
} from '../core/keys';
import { cx } from './cx';

type KeyHandlers = {
  onIndex?: () => void;
  onGuide?: () => void;
  onCancel?: () => void;
  onCorrection?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onRepeat?: () => void;
  onSend?: () => void;
};

const HANDLER_PROPS: Readonly<Record<FunctionKeyName, keyof KeyHandlers>> = {
  index: 'onIndex',
  guide: 'onGuide',
  cancel: 'onCancel',
  correction: 'onCorrection',
  back: 'onBack',
  next: 'onNext',
  repeat: 'onRepeat',
  send: 'onSend',
};

export interface FunctionKeysProps extends KeyHandlers, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Called for every key, before the key's own handler. */
  onKey?: (key: FunctionKeyName) => void;
  /** 'faithful': two rows of four, like the Minitel 1B. 'compact': one wrapping row. Default: 'faithful'. */
  layout?: 'faithful' | 'compact';
  /** 'en' (default), 'fr' for the labels printed on the Minitel, or your own labels. */
  labels?: 'en' | 'fr' | Partial<Record<FunctionKeyName, string>>;
  /**
   * Keyboard shortcuts, listened to on the whole window. Off by default, because they take over keys
   * such as Enter or Page Down. `true` uses DEFAULT_SHORTCUTS; an object overrides some of them.
   */
  shortcuts?: ShortcutsInput;
}

/** How long a key looks pressed after a shortcut, in milliseconds. */
const PRESS_FEEDBACK_MS = 140;

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest('input, textarea, select') !== null;
}

/** Keys that do not edit a one-line field, so they still work as function keys inside an InputField. */
const FIELD_KEYS = new Set(['Enter', 'Escape', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown']);

function isVideotexField(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-vtx-field]') !== null;
}

/** Elements that already act on Enter or Space themselves. */
function handlesActivation(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('button, a[href], summary, [role="button"], [role="link"]') !== null;
}

/** The 8 Minitel function keys, as real buttons. */
export function FunctionKeys({
  onKey,
  onIndex,
  onGuide,
  onCancel,
  onCorrection,
  onBack,
  onNext,
  onRepeat,
  onSend,
  layout = 'faithful',
  labels = 'en',
  shortcuts = false,
  className,
  'aria-label': ariaLabel = 'Function keys',
  ...rest
}: FunctionKeysProps) {
  const handlers: KeyHandlers = { onIndex, onGuide, onCancel, onCorrection, onBack, onNext, onRepeat, onSend };
  const texts = typeof labels === 'string' ? FUNCTION_KEY_LABELS[labels] : { ...FUNCTION_KEY_LABELS.en, ...labels };
  const keyMap = resolveShortcuts(shortcuts);
  const [pressed, setPressed] = useState<FunctionKeyName | null>(null);

  const press = (name: FunctionKeyName) => {
    onKey?.(name);
    handlers[HANDLER_PROPS[name]]?.();
  };

  // The window listener reads the latest props without being added again on every render.
  const latest = useRef({ press, keyMap });
  useEffect(() => {
    latest.current = { press, keyMap };
  });

  const enabled = shortcuts !== false;
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (isEditable(event.target) && !(isVideotexField(event.target) && FIELD_KEYS.has(event.key))) return;
      const name = keyFromEvent(event, latest.current.keyMap);
      if (!name) return;
      if ((event.key === 'Enter' || event.key === ' ') && handlesActivation(event.target)) return;
      event.preventDefault();
      latest.current.press(name);
      setPressed(name);
      clearTimeout(timer);
      timer = setTimeout(() => setPressed(null), PRESS_FEEDBACK_MS);
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
      clearTimeout(timer);
    };
  }, [enabled]);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx('vtx-keys', `vtx-keys-${layout}`, className)}
      {...rest}
    >
      {FUNCTION_KEYS.map((name) => (
        <button
          key={name}
          type="button"
          className="vtx-key"
          data-key={name}
          data-pressed={pressed === name ? '' : undefined}
          aria-keyshortcuts={keyMap[name]}
          onClick={() => press(name)}
        >
          {texts[name]}
        </button>
      ))}
    </div>
  );
}
