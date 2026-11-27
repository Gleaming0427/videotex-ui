'use client';

import { useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { toColor, type ColorInput } from '../core/palette';
import { frameRegion } from '../core/regions';
import { CellGrid, gridArea, useScreen } from './cells';
import { cx } from './cx';

export interface FrameProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Written on the top edge; also the accessible name of the section. */
  title?: string;
  /** Border color. Default: 'cyan'. */
  fg?: ColorInput;
  /** Paints the inside. Default: transparent. */
  fill?: ColorInput;
  /** Rectangle on a Screen (ignored elsewhere). Default: the whole page, rows 1 to 24. */
  row?: number;
  col?: number;
  height?: number;
  width?: number;
  /** On a screen, children keep screen coordinates; elsewhere they go inside the frame. */
  children?: ReactNode;
}

/** A mosaic border with an optional title. */
export function Frame({
  title,
  fg = 'cyan',
  fill,
  row = 1,
  col = 0,
  height = 24,
  width = 40,
  children,
  className,
  style,
  ...rest
}: FrameProps) {
  const screen = useScreen();
  const region = useMemo(
    () => (screen ? frameRegion(row, col, height, width, { fg, fill, title }) : null),
    [screen, row, col, height, width, fg, fill, title],
  );

  if (!region) {
    const color = { '--vtx-frame-color': `var(--vtx-c${toColor(fg)})` } as CSSProperties;
    return (
      <section
        aria-label={title}
        className={cx('vtx-ui', 'vtx-frame', fill !== undefined && `vtx-bg-${toColor(fill)}`, className)}
        style={{ ...color, ...style }}
        {...rest}
      >
        {title && (
          <div className="vtx-frame-title" aria-hidden="true">
            {title}
          </div>
        )}
        {children}
      </section>
    );
  }

  return (
    <section aria-label={title} className={cx('vtx-sublayer', className)} style={style} {...rest}>
      <CellGrid
        cells={region.cells}
        style={gridArea(region.top, region.left, region.cells.length, region.cells[0]?.length ?? 0)}
      />
      {children}
    </section>
  );
}
