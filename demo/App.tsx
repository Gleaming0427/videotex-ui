import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  DEFAULT_SHORTCUTS,
  Frame,
  FUNCTION_KEY_LABELS,
  FUNCTION_KEYS,
  FunctionKeys,
  InputField,
  Menu,
  MINITEL_BAUD,
  Mosaic,
  Screen,
  StatusRow,
  Title,
  type PaletteName,
} from '../src';
import { MosaicConverter, type Picture } from './MosaicConverter';
import { buildPage, INITIAL_STATE, MENU_ITEMS, reduce, statusRight, TITLES } from './pages';

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
  const page = useMemo(() => buildPage(state.page), [state.page]);
  const [palette, setPalette] = useState<PaletteName>('color');
  const [crt, setCrt] = useState(true);
  const [slow, setSlow] = useState(true);
  const [layout, setLayout] = useState<'faithful' | 'compact'>('faithful');
  const [labels, setLabels] = useState<'en' | 'fr'>('en');
  const revealKey = `${state.page}:${state.replay}`;
  const [displayed, setDisplayed] = useState<string | null>(null);
  const [shown, setShown] = useState<Picture | null>(null);

  // A digit typed outside any field goes to the input field of the home page.
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || isEditable(event.target)) return;
      if (/^[0-9]$/.test(event.key)) dispatch({ type: 'input', value: event.key });
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
        >
          <StatusRow left="VIDEOTEX-UI" message={state.message} right={statusRight(state.page)} />
          {state.page === 'home' ? (
            <>
              <Title row={3} col={2} bg="blue">
                {TITLES.home}
              </Title>
              <Title level={3} row={16} col={2} size="double-height" fg="cyan">
                MAIN MENU
              </Title>
              <Menu
                row={18}
                col={2}
                items={MENU_ITEMS}
                aria-label="Main menu"
                onSelect={(index) => dispatch({ type: 'open', index })}
              />
              <InputField
                row={23}
                col={15}
                size={1}
                type="digits"
                label="Your choice, 1 to 4"
                value={state.choice}
                onChange={(value) => dispatch({ type: 'input', value })}
                autoFocus
              />
            </>
          ) : (
            <Title row={3} col={2} size="double-height" bg="blue">
              {TITLES[state.page]}
            </Title>
          )}
          {state.page === 'guide' && <Frame row={5} col={1} height={14} width={38} title="HOW IT WORKS" />}
          {state.page === 'picture' && shown && (
            <Mosaic row={5} col={0} cols={40} rows={16} src={shown.url} dither={shown.dither} alt={`${shown.name}, as a mosaic`} />
          )}
        </Screen>
        <FunctionKeys shortcuts layout={layout} labels={labels} onKey={(key) => dispatch({ type: 'key', key })} />
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

      <MosaicConverter
        shownUrl={shown?.url ?? null}
        onShow={(picture) => {
          setShown(picture);
          dispatch({ type: 'picture' });
          document.querySelector('.demo-terminal')?.scrollIntoView();
        }}
      />

      <OutsideTheScreen />
    </main>
  );
}

/** The same components in an ordinary web page. */
function OutsideTheScreen() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const items = ['Weather', 'Trains', 'Directory'];
  const greet = () => setMessage(name ? `Hello ${name}` : 'Type a name');

  return (
    <section className="demo-modern" aria-labelledby="modern-heading">
      <h2 id="modern-heading">Outside the screen</h2>
      <p className="demo-note">The same components in an ordinary page: they follow the layout and keep native behavior.</p>
      <div className="demo-modern-grid">
        <StatusRow left="VIDEOTEX-UI" message={message} right="0.00 F/min" />
        <Title level={3}>Welcome</Title>
        <Frame title="Services" fg="green">
          <Menu items={items} aria-label="Services" onSelect={(i) => setMessage(`${items[i] ?? ''} selected`)} />
        </Frame>
        <Frame title="Sign in" fg="magenta">
          <form
            className="demo-form"
            onSubmit={(event) => {
              event.preventDefault();
              greet();
            }}
          >
            <label className="demo-label">
              Name
              <InputField label="Name" size={12} value={name} onChange={setName} onSubmit={greet} />
            </label>
            <button type="submit" className="demo-submit">
              Send
            </button>
          </form>
        </Frame>
      </div>
    </section>
  );
}
