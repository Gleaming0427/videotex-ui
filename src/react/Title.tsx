'use client';

import { useMemo, type HTMLAttributes } from 'react';
import type { CharSize } from '../core/cell';
import { toColor, type ColorInput } from '../core/palette';
import { titleRegion } from '../core/regions';
import { CellGrid, gridArea, useScreen } from './cells';
import { cx } from './cx';

export interface TitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> {
  children: string;
  /** Heading level. Default: 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Default: 'double-size'. On a screen, double heights grow upwards from `row`. */
  size?: CharSize;
  /** Default: 'yellow'. */
  fg?: ColorInput;
  bg?: ColorInput;
  blink?: boolean;
  /** Position on a Screen (ignored elsewhere). Default: row 2, column 0. */
  row?: number;
  col?: number;
}

/** A heading in Videotex double-size characters. */
export function Title({
  children,
  level = 2,
  size = 'double-size',
  fg = 'yellow',
  bg,
  blink = false,
  row = 2,
  col = 0,
  className,
  style,
  ...rest
}: TitleProps) {
  const screen = useScreen();
  const Heading = `h${level}` as const;
  const region = useMemo(
    () => (screen ? titleRegion(children, row, col, { fg, bg, size, blink }) : null),
    [screen, children, row, col, fg, bg, size, blink],
  );

  if (!region) {
    return (
      <Heading
        className={cx(
          'vtx-ui',
          'vtx-title',
          `vtx-title-${size}`,
          `vtx-fg-${toColor(fg)}`,
          bg !== undefined && `vtx-bg-${toColor(bg)}`,
          blink && 'vtx-blink',
          className,
        )}
        style={style}
        {...rest}
      >
        {children}
      </Heading>
    );
  }

  const height = region.cells.length;
  const width = region.cells[0]?.length ?? 0;
  return (
    <Heading className={className} style={{ ...gridArea(region.top, region.left, height, width), ...style }} {...rest}>
      <span className="vtx-sr-only">{children}</span>
      <CellGrid cells={region.cells} />
    </Heading>
  );
}
