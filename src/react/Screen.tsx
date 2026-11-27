import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type RefObject,
} from 'react';
import { displayedColors, type Cell } from '../core/cell';
import { COLS, SCREEN_WIDTH } from '../core/grid';
import { pageToPlainText, type Page } from '../core/page';
import type { PaletteName } from '../core/palette';
import { revealSchedule } from '../core/reveal';
import { cx } from './cx';
import { mosaicStyle } from './mosaicStyle';

export interface ScreenProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The page to show, usually made with `PageBuilder`. */
  page: Page;
  /** Color Minitel or monochrome Minitel (8 greys). Default: 'color'. */
  palette?: PaletteName;
  /** Scanlines, vignette, glow and a dark border. Default: false. */
  crt?: boolean;
  /** Draws the page progressively at this speed, like a Minitel line (1200 is typical). Default: false. */
  baud?: number | false;
  /**
   * What starts a progressive display. Without it, every new `page` object is drawn again.
   * With it, only a new key is; other page changes show at once (a typed character, a message).
   */
  revealKey?: string | number;
  /**
   * Size of one screen dot, in CSS pixels. 'auto' (default) picks the largest whole number that fits
   * the available width, so the screen stays sharp; below 320 px it shrinks to fit.
   */
  scale?: 'auto' | number;
  /** Lets blinking characters blink. Default: true. */
  blink?: boolean;
  /** Called when a progressive display ends. */
  onRevealEnd?: () => void;
}

/** Dark border drawn around the screen in CRT mode, in dots. */
const CRT_BORDER = 12;

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const pageIds = new WeakMap<Page, number>();
let nextPageId = 1;
function pageId(page: Page): number {
  let id = pageIds.get(page);
  if (id === undefined) {
    id = nextPageId++;
    pageIds.set(page, id);
  }
  return id;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useAutoScale(ref: RefObject<HTMLElement | null>, enabled: boolean, dotsWide: number): number {
  const [scale, setScale] = useState(2);
  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const update = (width: number) => {
      if (width <= 0) return;
      const raw = width / dotsWide;
      setScale(raw >= 1 ? Math.floor(raw) : raw);
    };
    update(element.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled, dotsWide]);
  return scale;
}

const CellView = memo(function CellView({ cell, delay }: { cell: Cell; delay: number | undefined }) {
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

/**
 * A 40 × 25 Videotex screen.
 *
 * The grid is drawn with real text and is hidden from assistive technologies, which read
 * a plain-text version of the page instead.
 */
export function Screen({
  page,
  palette = 'color',
  crt = false,
  baud = false,
  revealKey,
  scale = 'auto',
  blink = true,
  onRevealEnd,
  className,
  style,
  'aria-label': ariaLabel = 'Videotex screen',
  ...rest
}: ScreenProps) {
  const rootRef = useRef<HTMLElement>(null);
  const border = crt ? CRT_BORDER : 0;
  const autoScale = useAutoScale(rootRef, scale === 'auto', SCREEN_WIDTH + 2 * border);
  const dot = scale === 'auto' ? autoScale : scale;

  // One token per progressive display. Once it has played, the page updates without animation.
  const token = baud ? `${revealKey === undefined ? `page:${pageId(page)}` : `key:${String(revealKey)}`}@${baud}` : null;
  const [finished, setFinished] = useState<string | null>(null);
  const revealing = token !== null && finished !== token;
  const schedule = useMemo(
    () => (revealing && baud ? revealSchedule(page, baud) : null),
    [page, baud, revealing],
  );
  const lines = useMemo(() => pageToPlainText(page), [page]);

  const onRevealEndRef = useRef(onRevealEnd);
  const durationRef = useRef(0);
  useEffect(() => {
    onRevealEndRef.current = onRevealEnd;
    durationRef.current = schedule?.duration ?? 0;
  });
  useEffect(() => {
    if (!revealing || token === null) return;
    const timer = setTimeout(
      () => {
        setFinished(token);
        onRevealEndRef.current?.();
      },
      prefersReducedMotion() ? 0 : durationRef.current,
    );
    return () => clearTimeout(timer);
  }, [token, revealing]);

  const cells = useMemo(
    () =>
      page.cells.flatMap((row, r) =>
        row.map((cell, c) => {
          const index = r * COLS + c;
          return <CellView key={index} cell={cell} delay={schedule?.delays[index]} />;
        }),
      ),
    [page, schedule],
  );

  const vars = { '--vtx-px': `${dot}px`, '--vtx-border': border } as CSSProperties;

  return (
    <figure
      ref={rootRef}
      className={cx(
        'vtx-screen',
        `vtx-palette-${palette}`,
        crt && 'vtx-crt',
        !blink && 'vtx-no-blink',
        schedule && 'vtx-revealing',
        className,
      )}
      style={{ ...vars, ...style }}
      aria-label={ariaLabel}
      {...rest}
    >
      <div className="vtx-display" aria-hidden="true">
        {/* A new token remounts the grid, which restarts the reveal animations. */}
        <div className="vtx-grid" key={token ?? 'static'}>
          {cells}
        </div>
      </div>
      <div className="vtx-sr-only">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </figure>
  );
}
