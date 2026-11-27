import { useMemo, useState, type ReactNode } from 'react';
import { Frame, InputField, Menu, Screen, StatusRow, Title, type PaletteName } from '../src';
import { servicePage } from './pages';
import { playConnection, playKey } from './sound';

const SERVICES = ['Weather', 'Trains', 'Directory'];

export interface TwoModesProps {
  readonly palette: PaletteName;
  readonly crt: boolean;
  readonly baud: number | false;
  readonly sound: boolean;
}

/**
 * One small service, one React tree, two modes. In web mode the components follow the page layout;
 * in Videotex mode the same components, with the same state, sit on a screen.
 */
export function TwoModes({ palette, crt, baud, sound }: TwoModesProps) {
  const [videotex, setVideotex] = useState(false);
  const [connection, setConnection] = useState(0);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const background = useMemo(() => servicePage(), []);

  const key = () => sound && playKey();
  const greet = () => {
    key();
    setMessage(name ? `Hello ${name}` : 'Type your name');
  };
  const switchMode = () => {
    if (!videotex) {
      if (sound) playConnection();
      setConnection((n) => n + 1);
    }
    setVideotex(!videotex);
  };

  const field = <InputField row={10} col={23} size={14} label="Your name" value={name} onChange={setName} onSubmit={greet} />;
  const service: ReactNode = (
    <>
      <StatusRow left="VIDEOTEX-UI" message={message} right="0.00 F/min" />
      <Title level={3} row={3} col={2} bg="blue">
        Welcome
      </Title>
      <Frame title="Services" fg="green" row={6} col={1} height={8} width={18}>
        <Menu
          row={8}
          col={3}
          spacing={2}
          items={SERVICES}
          aria-label="Services"
          onSelect={(i) => {
            key();
            setMessage(`${SERVICES[i] ?? ''} selected`);
          }}
        />
      </Frame>
      <Frame title="Sign in" fg="magenta" row={6} col={21} height={8} width={18}>
        {videotex ? (
          field
        ) : (
          <form
            className="demo-form"
            onSubmit={(event) => {
              event.preventDefault();
              greet();
            }}
          >
            <label className="demo-label">
              Your name
              {field}
            </label>
            <button type="submit" className="demo-submit">
              Send
            </button>
          </form>
        )}
      </Frame>
    </>
  );

  return (
    <section className="demo-modes" aria-labelledby="modes-heading">
      <div className="demo-modes-header">
        <div>
          <h2 id="modes-heading">One React tree, two modes</h2>
          <p className="demo-note">
            The same components and the same state: an ordinary web page, or a Videotex screen.
          </p>
        </div>
        <button type="button" className="demo-switch" onClick={switchMode}>
          {videotex ? 'Back to web mode' : 'Switch to Videotex mode'}
        </button>
      </div>
      {videotex ? (
        <Screen
          page={background}
          revealKey={connection}
          palette={palette}
          crt={crt}
          baud={baud}
          aria-label="The service in Videotex mode"
        >
          {service}
        </Screen>
      ) : (
        <div className="demo-modern-grid">{service}</div>
      )}
    </section>
  );
}
