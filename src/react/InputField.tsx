import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type SyntheticEvent,
} from 'react';
import { toColor, type ColorInput } from '../core/palette';
import { fieldRegion } from '../core/regions';
import { CellGrid, gridArea, useScreen } from './cells';
import { cx } from './cx';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'onSubmit' | 'size' | 'type' | 'autoFocus' | 'children'
>;

export interface InputFieldProps extends NativeInputProps {
  /** Accessible name, since the visible label usually sits in the page text. */
  label: string;
  /** Number of characters. */
  size: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called on Enter. Without it, Enter is left to FunctionKeys (Send). */
  onSubmit?: (value: string) => void;
  /** 'digits' keeps only 0 to 9 and shows a numeric keypad on phones. Default: 'text'. */
  type?: 'text' | 'digits';
  /** Default: 'white'. */
  fg?: ColorInput;
  bg?: ColorInput;
  /** Shown in empty positions. Default: '.' */
  placeholderChar?: string;
  /** Takes the focus when shown; on a screen, once the progressive display has ended. */
  autoFocus?: boolean;
  /** Position on a Screen (ignored elsewhere). */
  row?: number;
  col?: number;
}

/**
 * A fixed-length input zone. On a screen it is drawn with cells (dots and a blinking cursor) over
 * a transparent native input, so typing, pasting and screen readers work as usual. Enter, Escape,
 * Page Up and Page Down still reach FunctionKeys while typing.
 */
export function InputField({
  label,
  size,
  value: controlled,
  defaultValue = '',
  onChange,
  onSubmit,
  type = 'text',
  fg = 'white',
  bg,
  placeholderChar = '.',
  autoFocus = false,
  row = 1,
  col = 0,
  className,
  style,
  onKeyDown,
  onFocus,
  onBlur,
  onSelect,
  ...rest
}: InputFieldProps) {
  const screen = useScreen();
  const ref = useRef<HTMLInputElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState(value.length);
  const revealing = screen?.revealing ?? false;

  useEffect(() => {
    if (autoFocus && !revealing) ref.current?.focus({ preventScroll: true });
  }, [autoFocus, revealing]);

  const change = (next: string) => {
    const clean = (type === 'digits' ? next.replace(/[^0-9]/g, '') : next).slice(0, size);
    if (controlled === undefined) setUncontrolled(clean);
    onChange?.(clean);
  };
  const trackCaret = (event: SyntheticEvent<HTMLInputElement>) => {
    setCaret(event.currentTarget.selectionStart ?? event.currentTarget.value.length);
  };

  const region = useMemo(
    () =>
      screen
        ? fieldRegion(value, size, row, col, {
            fg,
            bg,
            placeholder: placeholderChar,
            cursor: focused ? Math.min(caret, size - 1) : null,
          })
        : null,
    [screen, value, size, row, col, fg, bg, placeholderChar, focused, caret],
  );

  const input = (
    <input
      ref={ref}
      type="text"
      aria-label={label}
      data-vtx-field={screen ? '' : undefined}
      value={value}
      maxLength={size}
      size={size}
      inputMode={type === 'digits' ? 'numeric' : undefined}
      autoComplete="off"
      spellCheck={false}
      className={region ? 'vtx-field-input' : cx('vtx-ui', 'vtx-field', `vtx-fg-${toColor(fg)}`, bg !== undefined && `vtx-bg-${toColor(bg)}`, className)}
      style={region ? undefined : ({ '--vtx-field-size': size, ...style } as CSSProperties)}
      onChange={(event) => {
        change(event.target.value);
        trackCaret(event);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && event.key === 'Enter' && onSubmit) {
          event.preventDefault();
          onSubmit(value);
        }
      }}
      onSelect={(event) => {
        trackCaret(event);
        onSelect?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        trackCaret(event);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      {...rest}
    />
  );

  if (!region) return input;

  return (
    <span
      className={cx('vtx-field-on-screen', className)}
      style={{ ...gridArea(region.top, region.left, 1, region.cells[0]?.length ?? 0), ...style }}
    >
      <CellGrid cells={region.cells} />
      {input}
    </span>
  );
}
