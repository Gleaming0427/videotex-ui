# videotex-ui

A React UI kit inspired by French Videotex: 40 × 25 grid, mosaic graphics, 8 colors, function keys.

> Version 0.1.0 is ready but not published yet: the install commands below work once it is on npm.

## Install

### With npm

```bash
npm install videotex-ui
```

```tsx
import { Screen, PageBuilder } from 'videotex-ui';
import 'videotex-ui/styles.css';
```

### With the shadcn CLI

The CLI copies the source of a component into your project, in `components/videotex/`, with the core and the stylesheet:

```bash
npx shadcn@latest add https://cdn.jsdelivr.net/npm/videotex-ui/r/screen.json
```

Then import the stylesheet once, for example in your root layout, and the components from that folder:

```tsx
import '@/components/videotex/videotex.css';
import { Screen } from '@/components/videotex/react/Screen';
import { PageBuilder } from '@/components/videotex/core';
```

Items: `screen`, `function-keys`, `title`, `status-row`, `frame`, `input-field`, `menu`, `mosaic`, and `videotex-ui` for all of them. Every item brings the core and the stylesheet; the CLI skips the files you already have. To pin a version, write it in the address: `videotex-ui@0.1.0/r/screen.json`.

### React Server Components

The components are client components (`'use client'`). The core (`PageBuilder`, palettes, mosaics…) has no React code, so a server component can build a page and pass it to `Screen`.

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

The VT323 font (SIL Open Font License) is not bundled. Serve it with your site, for example with [`@fontsource/vt323`](https://www.npmjs.com/package/@fontsource/vt323) and `import '@fontsource/vt323'`. Loading it from Google's servers sends your visitors' IP addresses to Google, which a German court has found to breach the GDPR. You can also change `--vtx-font`, then adjust `--vtx-font-scale` and `--vtx-font-stretch`.

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
| `children` | | Components placed on the grid (see below) |

Screen readers read the text of the page; the grid itself is hidden from them. `prefers-reduced-motion` turns off blinking, flicker and progressive display.

### Components on the screen, or on their own

`Title`, `StatusRow`, `Menu`, `InputField`, `Frame` and `Mosaic` work in two ways:

- **On a screen** (faithful mode): as children of `Screen`, placed with `row` and `col`. They are drawn with the same cells as the page, over it, and stay real headings, lists, buttons and inputs for keyboards and screen readers. They appear once a progressive display has ended.
- **On their own** (modern mode): anywhere in a page, with the Videotex font and colors, following the page layout.

```tsx
<Screen page={background} baud={1200} revealKey={pageName}>
  <StatusRow left="MY SERVICE" message={message} right="1/4" />
  <Title row={3} col={2} bg="blue">WELCOME</Title>
  <Menu row={18} col={2} items={['News', 'Weather']} onSelect={open} />
  <InputField row={23} col={15} size={1} type="digits" label="Your choice" value={choice} onChange={setChoice} autoFocus />
</Screen>
<FunctionKeys shortcuts onSend={send} />
```

| Component | Main props | Notes |
| --- | --- | --- |
| `Title` | `children`, `level` (2), `size` (`'double-size'`), `fg` (`'yellow'`), `bg`, `blink`, `row`, `col` | A heading. Double heights grow upwards from `row` |
| `StatusRow` | `left`, `message`, `right`, `fg` (`'cyan'`), `messageFg` (`'yellow'`) | Row 0 on a screen. The message is announced to screen readers |
| `Menu` | `items`, `onSelect(index)`, `start` (1), `fg`, `numberFg`, `row`, `col`, `spacing` (1) | Arrow keys move, a digit jumps to its item, Enter or a click chooses. The focused item shows in inverse |
| `InputField` | `label`, `size`, `value` / `defaultValue`, `onChange`, `onSubmit`, `type` (`'text'` or `'digits'`), `autoFocus`, `row`, `col` | On a screen: dots and a blinking cursor over a transparent native input. Enter, Escape, Page Up and Page Down still reach `FunctionKeys` while typing, unless `onSubmit` handles Enter |
| `Frame` | `title`, `fg` (`'cyan'`), `fill`, `row`, `col`, `height`, `width`, `children` | A mosaic border. On a screen, children keep screen coordinates |

### `Mosaic` and the image converter

`Mosaic` turns a picture into mosaic characters: every cell keeps the two colors, out of 8, closest to that part of the picture.

```tsx
// Converted in the browser (same site, data or blob URL, or a site that allows CORS)
<Mosaic src="/cat.jpg" cols={32} dither alt="A cat" />

// On a screen: fitted and centered in a 40 × 16 box from row 5
<Screen page={page}>
  <Mosaic src="/cat.jpg" row={5} col={0} cols={40} rows={16} alt="A cat" />
</Screen>

// Already converted: no canvas, works on the server
const cat = decodeMosaic('32x13:…');
<Mosaic data={cat} alt="A cat" />
```

| Prop | Default | What it does |
| --- | --- | --- |
| `alt` | | Text alternative (required) |
| `src` / `data` | | A picture to convert, or one already converted (`data` wins) |
| `cols`, `rows` | 40 columns | One keeps the proportions; both fit the picture in that box |
| `palette` | the screen's, else `'color'` | `'monochrome'` matches the 8 greys |
| `dither` | `false` | Ordered dithering (4 × 4 Bayer pattern) for smoother gradients |
| `row`, `col` | | Position on a screen |
| `scale` | `2` | Off screen: CSS pixels per screen dot |
| `onConvert(image)`, `onError(error)` | | After converting `src` |

Functions, for your own tools:

| Function | Where | What it does |
| --- | --- | --- |
| `imageToMosaic(pixels, { cols, rows, palette, dither })` | anywhere | RGBA pixels to a `MosaicImage` |
| `mosaicSize(width, height, { cols, rows })` | anywhere | Cells needed without stretching the picture |
| `renderMosaic(image, { palette, scale })` | anywhere | A `MosaicImage` back to RGBA pixels |
| `encodeMosaic(image)`, `decodeMosaic(text)` | anywhere | Compact text form, two characters per cell |
| `mosaicToCode(image, { name, alt })` | anywhere | A ready-to-paste React component |
| `PageBuilder.mosaicImage(image)` | anywhere | Writes the picture into a page from the cursor |
| `convertImage(src, options)` | browser | Loads and converts a picture |
| `mosaicToPng(image, { palette, scale })` | browser | A PNG `Blob` |

To build your own component for the screen, use `useScreen()` (null when off screen), `gridArea()` and `CellGrid`, with the cell helpers of the core (`titleRegion`, `fieldRegion`, `cropPage`…).

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
| `layout` | `'faithful'` | `'faithful'`: two rows of four, like the Minitel 1B; `'compact'`: one wrapping row |
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

## Development

```bash
npm install
npm run dev              # demo on http://localhost:5173
npm test                 # tests
npm run build            # library in dist/
npm run registry         # rewrites registry.json after a source file is added or moved
npm run registry:build   # shadcn registry in r/
```

`npm pack` and `npm publish` build the library and the registry first. Changes go in [CHANGELOG.md](CHANGELOG.md).

## Roadmap

The steps are described in [ROADMAP.md](ROADMAP.md) and tracked in the repository issues. The technical values in use, and what is still to be verified, are listed in [docs/SPECS.md](docs/SPECS.md).

## Trademarks

Minitel is a registered trademark of Orange. videotex-ui is an independent project inspired by the Minitel: it is not affiliated with Orange, nor sponsored or endorsed by it. See [docs/LEGAL.md](docs/LEGAL.md).

## License

[MIT](LICENSE)
