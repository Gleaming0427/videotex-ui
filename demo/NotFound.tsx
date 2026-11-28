// The demo's 404 page. GitHub Pages serves 404.html at every address that does not exist,
// so this page shows whatever was typed, on a Videotex screen.
import { useMemo, useState } from 'react';
import { bitmapToMasks, FunctionKeys, MINITEL_BAUD, PageBuilder, Screen, StatusRow, Title, type Page } from '../src';

/** "404" at sixel resolution, 2 sixels per cell across and 3 down: 29 columns × 8 rows. */
const DIGITS = [
  '..........................................................',
  '..........###............######..................###......',
  '.........####..........##########...............####......',
  '.........####..........##########...............####......',
  '........#####.........############.............#####......',
  '.......######........####......####...........######......',
  '.......######........####......####...........######......',
  '......#######........###........###..........#######......',
  '.....####.###........###........###.........####.###......',
  '.....####.###........###........###.........####.###......',
  '....####..###........###........###........####..###......',
  '...####...###........###........###.......####...###......',
  '...####...###........###........###.......####...###......',
  '..####....###........###........###......####....###......',
  '.###############.....###........###.....###############...',
  '.###############.....###........###.....###############...',
  '.###############.....###........###.....###############...',
  '..........###........####......####..............###......',
  '..........###........####......####..............###......',
  '..........###.........############...............###......',
  '..........###..........##########................###......',
  '..........###..........##########................###......',
  '..........###............######..................###......',
  '..........................................................',
];

/** Room for the address on its row, from column 2. */
const ADDRESS_WIDTH = 36;

/** The address, on one row: characters outside printable ASCII become '?', a long one is cut. */
export function fitAddress(address: string, width = ADDRESS_WIDTH): string {
  const text = address.replace(/[^\x20-\x7e]/g, '?');
  return text.length <= width ? text : `${text.slice(0, width - 3)}...`;
}

/** Background of the 404 page. The title (rows 2 and 3) and the service row are components. */
export function notFoundPage(address: string): Page {
  const b = new PageBuilder();
  b.fill(1, 0, 3, 40, { bg: 'blue' });
  bitmapToMasks(DIGITS).forEach((masks, i) => {
    b.moveTo(5 + i, 6).mosaic(masks, { fg: 'yellow' });
  });
  b.moveTo(14, 2).print('This page is not on the service.');
  b.moveTo(16, 2).print('Address:', { fg: 'cyan' });
  b.moveTo(17, 2).print(fitAddress(address));
  b.moveTo(19, 2).print('Check the address, or go back to\nthe main menu.');
  b.moveTo(22, 0).mosaic(Array(40).fill(0b001100), { fg: 'blue' });
  b.moveTo(23, 2).print(' Index ', { inverse: true }).print(' main menu  ', { fg: 'cyan' });
  b.print(' Back ', { inverse: true }).print(' previous', { fg: 'cyan' });
  b.moveTo(24, 2).print('Error 404', { fg: 'green', underline: true });
  return b.build();
}

/** The demo's home page: './' read against the <base> of 404.html. */
function home(): void {
  window.location.assign(new URL('./', document.baseURI).href);
}

/** The address that was asked for, without the folder of the site ("/videotex-ui" on GitHub Pages). */
function requestedAddress(): string {
  const site = new URL('./', document.baseURI).pathname;
  const path = window.location.pathname;
  return path.startsWith(site) ? `/${path.slice(site.length)}` : path;
}

export function NotFound() {
  const page = useMemo(() => notFoundPage(requestedAddress()), []);
  const [replay, setReplay] = useState(0);
  const [message, setMessage] = useState('');
  const hint = () => setMessage('Press Index or Back');

  return (
    <main className="demo">
      <div className="demo-terminal">
        <Screen page={page} revealKey={replay} crt baud={MINITEL_BAUD} aria-label="Page not found">
          <StatusRow left="VIDEOTEX-UI" message={message} right="404" />
          <Title level={1} row={3} col={2} bg="blue">
            PAGE NOT FOUND
          </Title>
        </Screen>
        <FunctionKeys
          shortcuts
          onKey={() => setMessage('')}
          onIndex={home}
          onBack={() => (window.history.length > 1 ? window.history.back() : home())}
          onRepeat={() => setReplay((n) => n + 1)}
          onGuide={hint}
          onCancel={hint}
          onCorrection={hint}
          onNext={hint}
          onSend={hint}
        />
      </div>
      <p className="demo-note demo-not-found">
        The 404 page of the <a href="./">videotex-ui demo</a>, drawn with the same components.{' '}
        <a href="https://github.com/Gleaming0427/videotex-ui/blob/main/demo/NotFound.tsx">See its source</a>.
      </p>
    </main>
  );
}
