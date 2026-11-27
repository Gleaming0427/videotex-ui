import { useMemo, useState } from 'react';
import { Ecran, MINITEL_BAUD, type PaletteName } from '../src';
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
        <p>Kit d’interface React inspiré du Vidéotex : grille de 40 × 25, mosaïques, 8 couleurs.</p>
      </header>

      <Ecran
        key={replay}
        page={page}
        palette={palette}
        crt={crt}
        baud={slow ? MINITEL_BAUD : false}
        onRevealEnd={() => setStatus('Page affichée.')}
        aria-label="Page d’accueil d’un service fictif"
      />

      <div className="demo-controls" role="group" aria-label="Réglages de l’écran">
        <button type="button" onClick={() => setPalette((p) => (p === 'color' ? 'monochrome' : 'color'))}>
          Palette : {palette === 'color' ? 'couleur' : 'monochrome'}
        </button>
        <label>
          <input type="checkbox" checked={crt} onChange={(e) => setCrt(e.target.checked)} /> Effet cathodique
        </label>
        <label>
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Affichage à 1 200 bauds
        </label>
        <button
          type="button"
          onClick={() => {
            setStatus('');
            setReplay((n) => n + 1);
          }}
        >
          Rejouer
        </button>
        <span className="demo-status" role="status">
          {status}
        </span>
      </div>
    </main>
  );
}
