'use client';

import { useMemo, type HTMLAttributes } from 'react';
import { toColor, type ColorInput } from '../core/palette';
import { statusRegion } from '../core/regions';
import { CellGrid, gridArea, useScreen } from './cells';
import { cx } from './cx';

export interface StatusRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Usually the service name. */
  left?: string;
  /** Centered and announced to screen readers when it changes. */
  message?: string;
  /** A page number, a price… */
  right?: string;
  /** Default: 'cyan'. */
  fg?: ColorInput;
  /** Default: 'yellow'. */
  messageFg?: ColorInput;
}

/** The Minitel service row: row 0 on a screen, a status bar elsewhere. */
export function StatusRow({
  left = '',
  message = '',
  right = '',
  fg = 'cyan',
  messageFg = 'yellow',
  className,
  style,
  ...rest
}: StatusRowProps) {
  const screen = useScreen();
  const region = useMemo(
    () => (screen ? statusRegion({ left, message, right, fg, messageFg }) : null),
    [screen, left, message, right, fg, messageFg],
  );

  if (!region) {
    return (
      <div className={cx('vtx-ui', 'vtx-status', `vtx-fg-${toColor(fg)}`, className)} style={style} {...rest}>
        <span>{left}</span>
        <span role="status" className={`vtx-fg-${toColor(messageFg)}`}>
          {message}
        </span>
        <span>{right}</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ ...gridArea(0, 0, 1, region.cells[0]?.length ?? 0), ...style }} {...rest}>
      <span className="vtx-sr-only">{[left, right].filter(Boolean).join(' ')}</span>
      <span className="vtx-sr-only" role="status">
        {message}
      </span>
      <CellGrid cells={region.cells} />
    </div>
  );
}
