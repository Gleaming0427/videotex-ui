import { useMemo, useState } from 'react';
import { Screen, MINITEL_BAUD, type PaletteName } from '../src';
import { buildDemoPage } from './demoPage';

export function App() {
  const page = useMemo(buildDemoPage, []);
  const [palette, setPalette] = useState<PaletteName>('color');
  const [crt, setCrt] = useState(true);
  const [slow, setSlow] = useState(true);
  const [replay, setReplay] = useState(0);
  const [status, setStatus] = useState('');

  return (
    <main className="demo">
      <header className="demo-header">
        <h1>videotex-ui</h1>
        <p>React UI kit inspired by French Videotex: 40 × 25 grid, mosaic graphics, 8 colors.</p>
      </header>

      <Screen
        key={replay}
        page={page}
        palette={palette}
        crt={crt}
        baud={slow ? MINITEL_BAUD : false}
        onRevealEnd={() => setStatus('Page displayed.')}
        aria-label="Home page of a fictional service"
      />

      <div className="demo-controls" role="group" aria-label="Screen settings">
        <button type="button" onClick={() => setPalette((p) => (p === 'color' ? 'monochrome' : 'color'))}>
          Palette: {palette}
        </button>
        <label>
          <input type="checkbox" checked={crt} onChange={(e) => setCrt(e.target.checked)} /> CRT effect
        </label>
        <label>
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Display at 1,200 baud
        </label>
        <button
          type="button"
          onClick={() => {
            setStatus('');
            setReplay((n) => n + 1);
          }}
        >
          Replay
        </button>
        <span className="demo-status" role="status">
          {status}
        </span>
      </div>
    </main>
  );
}
