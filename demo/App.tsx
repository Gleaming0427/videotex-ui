import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  DEFAULT_SHORTCUTS,
  FUNCTION_KEY_LABELS,
  FUNCTION_KEYS,
  FunctionKeys,
  MINITEL_BAUD,
  Screen,
  type PaletteName,
} from '../src';
import { buildPage, INITIAL_STATE, reduce } from './pages';

const KEY_NAMES: Readonly<Record<string, string>> = {
  PageUp: 'Page Up',
  PageDown: 'Page Down',
  Escape: 'Esc',
};

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select') !== null);
}

export function App() {
  const [state, dispatch] = useReducer(reduce, INITIAL_STATE);
  const page = useMemo(() => buildPage(state), [state]);
  const [palette, setPalette] = useState<PaletteName>('color');
  const [crt, setCrt] = useState(true);
  const [slow, setSlow] = useState(true);
  const [layout, setLayout] = useState<'faithful' | 'compact'>('faithful');
  const [labels, setLabels] = useState<'en' | 'fr'>('en');
  const revealKey = `${state.page}:${state.replay}`;
  const [displayed, setDisplayed] = useState<string | null>(null);

  // Digits typed anywhere on the page go to the input field of the home page.
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || isEditable(event.target)) return;
      if (/^[0-9]$/.test(event.key)) dispatch({ type: 'digit', digit: event.key });
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  return (
    <main className="demo">
      <header className="demo-header">
        <h1>videotex-ui</h1>
        <p>React UI kit inspired by French Videotex: 40 × 25 grid, mosaic graphics, 8 colors.</p>
      </header>

      <div className="demo-terminal">
        <Screen
          page={page}
          revealKey={revealKey}
          palette={palette}
          crt={crt}
          baud={slow ? MINITEL_BAUD : false}
          onRevealEnd={() => setDisplayed(revealKey)}
          aria-label="Fictional Videotex service"
        />
        <FunctionKeys
          shortcuts
          layout={layout}
          labels={labels}
          onKey={(key) => dispatch({ type: 'key', key })}
        />
      </div>

      <ul className="demo-shortcuts" aria-label="Keyboard shortcuts">
        <li>
          <kbd>1</kbd>–<kbd>4</kbd> menu choice
        </li>
        {FUNCTION_KEYS.map((key) => (
          <li key={key}>
            <kbd>{KEY_NAMES[DEFAULT_SHORTCUTS[key]] ?? DEFAULT_SHORTCUTS[key]}</kbd> {FUNCTION_KEY_LABELS.en[key]}
          </li>
        ))}
      </ul>

      <div className="demo-controls" role="group" aria-label="Demo settings">
        <button type="button" onClick={() => setPalette((p) => (p === 'color' ? 'monochrome' : 'color'))}>
          Palette: {palette}
        </button>
        <button type="button" onClick={() => setLayout((l) => (l === 'faithful' ? 'compact' : 'faithful'))}>
          Keys: {layout}
        </button>
        <button type="button" onClick={() => setLabels((l) => (l === 'en' ? 'fr' : 'en'))}>
          Key labels: {labels === 'en' ? 'English' : 'original French'}
        </button>
        <label>
          <input type="checkbox" checked={crt} onChange={(e) => setCrt(e.target.checked)} /> CRT effect
        </label>
        <label>
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Display at 1,200 baud
        </label>
        <span className="demo-status" role="status">
          {slow && displayed === revealKey ? 'Page displayed.' : ''}
        </span>
      </div>
    </main>
  );
}
