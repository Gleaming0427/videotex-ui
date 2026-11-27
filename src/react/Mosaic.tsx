import { useEffect, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { PageBuilder } from '../core/builder';
import { BLANK_CELL, type Cell } from '../core/cell';
import { COLS, ROWS } from '../core/grid';
import type { MosaicImage } from '../core/image';
import { cropPage } from '../core/page';
import type { PaletteName } from '../core/palette';
import { CellGrid, gridArea, useScreen } from './cells';
import { cx } from './cx';
import { convertImage } from './mosaicDom';

export interface MosaicProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'onError'> {
  /** Text alternative: what the picture shows. */
  alt: string;
  /** Picture to convert in the browser (same site, data/blob URL, or a site that allows CORS). */
  src?: string;
  /** A picture already converted, for example with `decodeMosaic`. Takes precedence over `src`. */
  data?: MosaicImage;
  /**
   * Size in cells for `src`. One of them keeps the picture's proportions; both fit it inside that box
   * (centered on a screen). Default: 40 columns.
   */
  cols?: number;
  rows?: number;
  /** Colors used to convert, and to display off screen. Default: the screen's palette, else 'color'. */
  palette?: PaletteName;
  /** Ordered dithering for smoother gradients. Default: false. */
  dither?: boolean;
  /** Position of the top-left cell on a Screen (ignored elsewhere). */
  row?: number;
  col?: number;
  /** Off screen: CSS pixels per screen dot. Default: 2. */
  scale?: number;
  /** Called once `src` is converted. */
  onConvert?: (image: MosaicImage) => void;
  /** Called when `src` cannot be loaded or read. */
  onError?: (error: unknown) => void;
}

function toCells(image: MosaicImage): Cell[][] {
  return image.cells.map((row) => row.map((cell) => ({ ...BLANK_CELL, set: 'G1', mask: cell.mask, fg: cell.fg, bg: cell.bg })));
}

/** A picture drawn with mosaic characters, 2 colors per cell. */
export function Mosaic({
  alt,
  src,
  data,
  cols,
  rows,
  palette,
  dither = false,
  row = 1,
  col = 0,
  scale = 2,
  onConvert,
  onError,
  className,
  style,
  ...rest
}: MosaicProps) {
  const screen = useScreen();
  const colors = palette ?? screen?.palette ?? 'color';
  const [converted, setConverted] = useState<{ src: string; image: MosaicImage } | null>(null);
  const callbacks = useRef({ onConvert, onError });
  useEffect(() => {
    callbacks.current = { onConvert, onError };
  });

  useEffect(() => {
    if (data || !src) return;
    let cancelled = false;
    convertImage(src, { cols, rows, palette: colors, dither }).then(
      (image) => {
        if (cancelled) return;
        setConverted({ src, image });
        callbacks.current.onConvert?.(image);
      },
      (error: unknown) => {
        if (!cancelled) callbacks.current.onError?.(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [data, src, cols, rows, colors, dither]);

  const image = data ?? (converted && converted.src === src ? converted.image : null);

  const region = useMemo(() => {
    if (!screen || !image) return null;
    // With a box, center the picture in it.
    const top = row + (rows !== undefined && !data ? Math.max(0, Math.floor((rows - image.rows) / 2)) : 0);
    const left = col + (cols !== undefined && rows !== undefined && !data ? Math.max(0, Math.floor((cols - image.cols) / 2)) : 0);
    if (top > ROWS - 1 || left > COLS - 1) return null;
    const page = new PageBuilder().moveTo(top, left).mosaicImage(image).build();
    return { top, left, cells: cropPage(page, top, left, image.rows, image.cols) };
  }, [screen, image, row, col, rows, cols, data]);

  if (!image) return null;

  if (region) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={className}
        style={{ ...gridArea(region.top, region.left, region.cells.length, region.cells[0]?.length ?? 0), ...style }}
        {...rest}
      >
        <CellGrid cells={region.cells} />
      </span>
    );
  }
  if (screen) return null;

  return (
    <span
      role="img"
      aria-label={alt}
      className={cx('vtx-mosaic', `vtx-palette-${colors}`, className)}
      style={{ '--vtx-px': `${scale}px`, ...style } as CSSProperties}
      {...rest}
    >
      <CellGrid cells={toCells(image)} />
    </span>
  );
}
