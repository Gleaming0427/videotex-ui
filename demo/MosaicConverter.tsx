import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Mosaic, mosaicToCode, mosaicToPng, type MosaicImage, type PaletteName } from '../src';

export interface Picture {
  readonly url: string;
  readonly name: string;
  readonly dither: boolean;
}

/** A generated landscape, so the converter can be tried without a file. */
function sampleImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 400;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const sky = context.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#10194d');
  sky.addColorStop(0.55, '#c2366b');
  sky.addColorStop(1, '#ff9a3c');
  context.fillStyle = sky;
  context.fillRect(0, 0, 640, 400);
  context.fillStyle = '#ffd54a';
  context.beginPath();
  context.arc(320, 250, 80, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#2a1546';
  context.beginPath();
  [[0, 400], [0, 260], [120, 190], [220, 270], [330, 200], [450, 280], [540, 210], [640, 260], [640, 400]].forEach(([x, y], i) =>
    i === 0 ? context.moveTo(x!, y!) : context.lineTo(x!, y!),
  );
  context.fill();
  context.fillStyle = '#120a22';
  context.beginPath();
  context.moveTo(0, 400);
  context.lineTo(0, 330);
  context.quadraticCurveTo(320, 280, 640, 340);
  context.lineTo(640, 400);
  context.fill();
  return canvas.toDataURL('image/png');
}

const baseName = (fileName: string) => fileName.replace(/\.[^.]+$/, '') || 'picture';

export function MosaicConverter({ shownUrl, onShow }: { shownUrl: string | null; onShow: (picture: Picture) => void }) {
  const [picture, setPicture] = useState<{ url: string; name: string } | null>(null);
  const [cols, setCols] = useState(32);
  const [palette, setPalette] = useState<PaletteName>('color');
  const [dither, setDither] = useState(false);
  const [image, setImage] = useState<MosaicImage | null>(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState('');

  // Object URLs are freed when replaced, unless the screen still shows them.
  const current = useRef<string | null>(null);
  const shown = useRef(shownUrl);
  useEffect(() => {
    shown.current = shownUrl;
  });

  const use = (url: string, name: string) => {
    const old = current.current;
    if (old?.startsWith('blob:') && old !== shown.current) URL.revokeObjectURL(old);
    current.current = url;
    setPicture({ url, name });
    setImage(null);
    setNotice('');
  };

  const open = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('That file is not an image.');
      return;
    }
    use(URL.createObjectURL(file), baseName(file.name));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    open(event.dataTransfer.files[0]);
  };

  const download = async () => {
    if (!image || !picture) return;
    try {
      const blob = await mosaicToPng(image, { palette, scale: 2 });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `${picture.name}-mosaic.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      setNotice('PNG downloaded.');
    } catch {
      setNotice('The PNG could not be made.');
    }
  };

  const code = image && picture ? mosaicToCode(image, { name: picture.name, alt: picture.name }) : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setNotice('Code copied.');
    } catch {
      setNotice('Copy failed: select the code below instead.');
    }
  };

  return (
    <section className="demo-converter" aria-labelledby="converter-heading">
      <h2 id="converter-heading">Mosaic converter</h2>
      <p className="demo-note">Drop a photo: each cell keeps the 2 colors closest to it, out of 8.</p>

      <div
        className={dragging ? 'demo-drop is-dragging' : 'demo-drop'}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={onDrop}
      >
        <span>Drop an image here, or</span>
        <label className="demo-file">
          choose a file
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              open(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        <span>or</span>
        <button type="button" onClick={() => use(sampleImage(), 'sample')}>
          use a sample
        </button>
      </div>

      <div className="demo-converter-options" role="group" aria-label="Conversion settings">
        <label>
          Width
          <input type="range" min={8} max={60} value={cols} onChange={(event) => setCols(Number(event.target.value))} />
          <output>{cols} cells</output>
        </label>
        <label>
          <input
            type="checkbox"
            checked={palette === 'monochrome'}
            onChange={(event) => setPalette(event.target.checked ? 'monochrome' : 'color')}
          />{' '}
          Monochrome
        </label>
        <label>
          <input type="checkbox" checked={dither} onChange={(event) => setDither(event.target.checked)} /> Dithering
        </label>
      </div>

      <div className="demo-converter-preview">
        {picture ? (
          <Mosaic
            src={picture.url}
            cols={cols}
            palette={palette}
            dither={dither}
            scale={cols > 40 ? 1 : 2}
            alt={`${picture.name} as a mosaic`}
            onConvert={setImage}
            onError={() => setNotice('This image could not be read.')}
          />
        ) : (
          <p className="demo-note">No image yet.</p>
        )}
      </div>

      <div className="demo-converter-actions">
        <button type="button" disabled={!image} onClick={download}>
          Download PNG
        </button>
        <button type="button" disabled={!image} onClick={copy}>
          Copy code
        </button>
        <button type="button" disabled={!picture} onClick={() => picture && onShow({ ...picture, dither })}>
          Show on the screen
        </button>
        <span className="demo-status" role="status">
          {notice}
        </span>
      </div>

      {image && (
        <details className="demo-code">
          <summary>
            Code ({image.cols} × {image.rows} cells)
          </summary>
          <pre>
            <code>{code}</code>
          </pre>
        </details>
      )}
    </section>
  );
}
