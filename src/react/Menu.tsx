import { useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { toColor, type ColorInput } from '../core/palette';
import { menuItemRegion } from '../core/regions';
import { CellGrid, gridArea, useScreen } from './cells';
import { cx } from './cx';

export interface MenuProps extends Omit<HTMLAttributes<HTMLOListElement>, 'onSelect' | 'children'> {
  items: readonly string[];
  /** Called with the index of the chosen item (click, Enter or Space). */
  onSelect?: (index: number) => void;
  /** Number of the first item. Default: 1. */
  start?: number;
  /** Label color. Default: 'white'. */
  fg?: ColorInput;
  /** Number color, shown in inverse. Default: 'white'. */
  numberFg?: ColorInput;
  /** Position of the first item on a Screen (ignored elsewhere). */
  row?: number;
  col?: number;
  /** Rows from one item to the next on a Screen. Default: 1. */
  spacing?: number;
}

/**
 * Numbered choices. Arrow keys move between items, a digit jumps to its item,
 * Enter or a click chooses it. Only one item is in the tab order.
 */
export function Menu({
  items,
  onSelect,
  start = 1,
  fg = 'white',
  numberFg = 'white',
  row = 1,
  col = 0,
  spacing = 1,
  className,
  onKeyDown,
  'aria-label': ariaLabel = 'Menu',
  ...rest
}: MenuProps) {
  const screen = useScreen();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState<number | null>(null);

  const regions = useMemo(
    () =>
      screen
        ? items.map((label, i) =>
            menuItemRegion(label, start + i, row + i * spacing, col, { fg, numberFg, selected: focused === i }),
          )
        : null,
    [screen, items, start, row, col, spacing, fg, numberFg, focused],
  );

  const moveTo = (index: number) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    buttons.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || items.length === 0) return;
    const current = focused ?? active;
    if (event.key === 'ArrowDown') {
      moveTo(current + 1);
    } else if (event.key === 'ArrowUp') {
      moveTo(current - 1);
    } else if (/^[0-9]$/.test(event.key) && Number(event.key) - start >= 0 && Number(event.key) - start < items.length) {
      moveTo(Number(event.key) - start);
    } else {
      return;
    }
    event.preventDefault();
  };

  const tabIndex = Math.min(active, Math.max(0, items.length - 1));

  return (
    <ol
      aria-label={ariaLabel}
      className={cx(regions ? 'vtx-sublayer' : cx('vtx-ui', 'vtx-menu'), className)}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {items.map((label, i) => {
        const region = regions?.[i];
        return (
          <li
            key={i}
            style={region ? gridArea(region.top, region.left, 1, region.cells[0]?.length ?? 0) : undefined}
          >
            <button
              ref={(element) => {
                buttons.current[i] = element;
              }}
              type="button"
              tabIndex={i === tabIndex ? 0 : -1}
              className={region ? undefined : 'vtx-menu-item'}
              aria-label={region ? undefined : `${start + i} ${label}`}
              onClick={() => {
                setActive(i);
                onSelect?.(i);
              }}
              onFocus={() => {
                setActive(i);
                setFocused(i);
              }}
              onBlur={() => setFocused((f) => (f === i ? null : f))}
            >
              {region ? (
                <>
                  <span className="vtx-sr-only">{`${start + i} ${label}`}</span>
                  <CellGrid cells={region.cells} />
                </>
              ) : (
                <>
                  <span className={cx('vtx-menu-number', 'vtx-fg-0', `vtx-bg-${toColor(numberFg)}`)}>{start + i}</span>{' '}
                  <span className={cx('vtx-menu-label', `vtx-fg-${toColor(fg)}`)}>{label}</span>
                </>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
