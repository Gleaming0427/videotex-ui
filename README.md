# videotex-ui

A React UI kit inspired by French Videotex: 40 × 25 grid, mosaic graphics, 8 colors, function keys.

> Work in progress, private repository. Nothing is published on npm yet.

## Getting started

```bash
npm install
npm run dev        # demo on http://localhost:5173
npm test           # tests
npm run build      # library in dist/
```

## Usage

```tsx
import { Screen, PageBuilder } from 'videotex-ui';
import 'videotex-ui/styles.css';

const page = new PageBuilder()
  .moveTo(3, 2).print('HELLO', { fg: 'yellow', size: 'double-size' })
  .moveTo(5, 2).print('Type your choice then ')
  .print(' Send ', { inverse: true })
  .build();

export function Home() {
  return <Screen page={page} crt baud={1200} aria-label="Home" />;
}
```

The VT323 font is not bundled: load it from Google Fonts, or change `--vtx-font` (then adjust `--vtx-font-scale` and `--vtx-font-stretch`).

### `PageBuilder`

Writes a page the way a Videotex server does: place the cursor, pick attributes, write.

| Method | What it does |
| --- | --- |
| `moveTo(row, col)` | Places the cursor (rows 0 to 24, columns 0 to 39) and sets the margin used by `\n` |
| `attr({ fg, bg, … })` | Changes the attributes of the following writes; `reset()` goes back to the constructor's |
| `print(text, attrs?)` | Writes text; wraps at column 40 |
| `mosaic(masks, attrs?)` | Writes mosaic characters (6-bit masks, see `maskFromRows`) |
| `mosaicBlock(rows, attrs?)` | Writes several rows of mosaics, for example from `bitmapToMasks` |
| `fill(top, left, height, width, attrs?)` | Paints a rectangle |
| `build()` | Returns the page (frozen) |

Attributes: `fg` and `bg` (0 to 7 or `'black'`, `'red'`, `'green'`, `'yellow'`, `'blue'`, `'magenta'`, `'cyan'`, `'white'`), `blink`, `inverse`, `underline` (disjoint mosaic for mosaic characters), `size` (`'normal'`, `'double-height'`, `'double-width'`, `'double-size'`).

### `Screen`

| Prop | Default | What it does |
| --- | --- | --- |
| `page` | | Page to show |
| `palette` | `'color'` | `'color'` or `'monochrome'` (8 grey levels) |
| `crt` | `false` | Scanlines, vignette, glow, dark border |
| `baud` | `false` | Progressive display at this speed (1200 on a Minitel) |
| `revealKey` | | When set, only a new key starts a progressive display; other page changes (a typed character, a message) show at once |
| `scale` | `'auto'` | Size of one screen dot in CSS pixels; `'auto'` picks the largest whole number that fits, so pixels stay sharp |
| `blink` | `true` | Enables blinking |
| `onRevealEnd` | | Called when the progressive display ends |

Screen readers read the text of the page; the grid itself is hidden from them. `prefers-reduced-motion` turns off blinking, flicker and progressive display.

### `FunctionKeys`

The 8 Minitel function keys, as real buttons.

```tsx
<FunctionKeys
  shortcuts
  onSend={() => submit()}
  onNext={() => setPage((p) => p + 1)}
  onBack={() => setPage((p) => p - 1)}
  onIndex={() => setPage(0)}
/>
```

| Prop | Default | What it does |
| --- | --- | --- |
| `onKey(name)` | | Called for every key, before the key's own handler |
| `onIndex`, `onGuide`, `onCancel`, `onCorrection`, `onBack`, `onNext`, `onRepeat`, `onSend` | | One handler per key |
| `layout` | `'faithful'` | `'faithful'`: two columns of four, like the Minitel; `'compact'`: one wrapping row |
| `labels` | `'en'` | `'en'`, `'fr'` (the labels printed on the Minitel: Sommaire, Envoi…) or your own labels |
| `shortcuts` | `false` | `true` for the default shortcuts, or an object to change some of them (`null` removes one) |

Default shortcuts:

| Key | Shortcut | | Key | Shortcut |
| --- | --- | --- | --- | --- |
| Index | Home | | Guide | ? |
| Cancel | Escape | | Correction | Backspace |
| Back | Page Up | | Next | Page Down |
| Repeat | End | | Send | Enter |

Shortcuts are off by default because they listen on the whole window and take over keys such as Enter or Page Down. When on, they ignore text fields, key repeats and combinations with Ctrl, Alt or Meta, and leave Enter and Space to a focused button or link.

## Roadmap

The steps are described in [ROADMAP.md](ROADMAP.md) and tracked in the repository issues. The technical values in use, and what is still to be verified, are listed in [docs/SPECS.md](docs/SPECS.md).

## License

[MIT](LICENSE)
