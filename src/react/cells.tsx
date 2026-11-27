// Cell rendering shared by Screen and by the components placed on it.
import { createContext, memo, useContext, type CSSProperties, type ReactElement } from 'react';
import { displayedColors, type Cell } from '../core/cell';
import { cx } from './cx';
import { mosaicStyle } from './mosaicStyle';

export const CellView = memo(function CellView({ cell, delay }: { cell: Cell; delay?: number | undefined }) {
  const { fg, bg } = displayedColors(cell);
  const style = delay === undefined ? undefined : { animationDelay: `${delay}ms` };
  const anchor = !cell.covered && cell.size !== 'normal';
  let glyph: ReactElement | null = null;

  if (!cell.covered) {
    const blink = cell.blink && 'vtx-blink';
    if (cell.set === 'G1') {
      if (cell.mask !== 0) {
        glyph = <span className={cx('vtx-glyph', `vtx-fg-${fg}`, blink)} style={mosaicStyle(cell.mask, cell.underline)} />;
      }
    } else if (cell.char !== ' ' || cell.underline) {
      glyph = (
        <span
          className={cx('vtx-glyph', `vtx-fg-${fg}`, blink, cell.underline && 'vtx-underline', anchor && `vtx-${cell.size}`)}
        >
          <span className="vtx-char">{cell.char}</span>
        </span>
      );
    }
  }

  return (
    <span className={cx('vtx-cell', `vtx-bg-${bg}`, anchor && 'vtx-anchor')} style={style}>
      {glyph}
    </span>
  );
});

/** Grid placement on the 40 × 25 screen (0-based row and column). */
export function gridArea(top: number, left: number, height: number, width: number): CSSProperties {
  return { gridRow: `${top + 1} / span ${height}`, gridColumn: `${left + 1} / span ${width}` };
}

/** A block of cells drawn like the screen. `null` cells stay transparent. Hidden from assistive technologies. */
export function CellGrid({
  cells,
  className,
  style,
}: {
  cells: readonly (readonly (Cell | null)[])[];
  className?: string;
  style?: CSSProperties;
}) {
  const width = Math.max(0, ...cells.map((row) => row.length));
  return (
    <span
      aria-hidden="true"
      className={cx('vtx-cells', className)}
      style={{
        gridTemplateColumns: `repeat(${width}, var(--vtx-cell-w))`,
        gridTemplateRows: `repeat(${cells.length}, var(--vtx-cell-h))`,
        ...style,
      }}
    >
      {cells.flatMap((row, r) =>
        row.map((cell, c) =>
          cell ? <CellView key={`${r}:${c}`} cell={cell} /> : <span key={`${r}:${c}`} className="vtx-cell vtx-cell-empty" />,
        ),
      )}
    </span>
  );
}

export interface ScreenContextValue {
  /** True while the page is drawn progressively; components on the screen are hidden until it ends. */
  readonly revealing: boolean;
}

export const ScreenContext = createContext<ScreenContextValue | null>(null);

/** The Screen a component is placed on, or null when it is used on its own in a web page. */
export function useScreen(): ScreenContextValue | null {
  return useContext(ScreenContext);
}
