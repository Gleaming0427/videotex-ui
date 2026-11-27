// Writes registry.json, the shadcn registry: one item per component.
//
//   node scripts/registry.mjs          write registry.json
//   node scripts/registry.mjs --check  fail if registry.json is out of date
//
// Each item carries every file its component needs: the component, the React helpers it imports,
// the whole core (so PageBuilder comes with any component) and the stylesheet. Items share files,
// and the shadcn CLI skips a file that is already installed with the same content.
// Files keep the src/ layout under components/videotex/, so relative imports keep working.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const STYLESHEET = 'src/styles/videotex.css';
const TARGET_DIR = '@components/videotex';

const COMPONENTS = [
  ['screen', 'Screen', 'The 40 × 25 Videotex screen: shows a page, reveals it at 1,200 baud, in color or grey levels.'],
  ['function-keys', 'FunctionKeys', 'The 8 Minitel function keys (Envoi, Retour, Suite…) with keyboard shortcuts.'],
  ['title', 'Title', 'A title row in normal, double-height or double-size characters.'],
  ['status-row', 'StatusRow', 'Row 0, the service row: a message on the left and a status on the right.'],
  ['frame', 'Frame', 'A frame drawn with mosaic characters, with an optional title.'],
  ['input-field', 'InputField', 'A Videotex input field: dots to type on, a native input for accessibility.'],
  ['menu', 'Menu', 'A numbered menu, chosen with the digit keys or the arrows.'],
  ['mosaic', 'Mosaic', 'Converts a picture to 2 × 3 mosaic characters in the 8 Videotex colors.'],
];

/** Relative imports of a source file, as repository paths. */
function localImports(file) {
  const source = readFileSync(join(root, file), 'utf8');
  const specifiers = [...source.matchAll(/(?:from|import)\s+'(\.{1,2}\/[^']+)'/g)].map((match) => match[1]);
  return specifiers.map((specifier) => {
    const base = join(dirname(file), specifier);
    const found = ['.ts', '.tsx', ''].map((ext) => base + ext).find((path) => existsSync(join(root, path)));
    if (!found) throw new Error(`${file}: cannot resolve ${specifier}`);
    return found;
  });
}

/** The entry files and everything they import, entries first. */
function closure(entries) {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    localImports(file).forEach(visit);
  };
  entries.forEach(visit);
  return [...seen];
}

function registryFile(path) {
  const target = `${TARGET_DIR}/${relative('src', path).replace(/^styles\//, '')}`;
  const type = path.endsWith('.css') ? 'registry:file' : path.startsWith('src/core/') ? 'registry:lib' : 'registry:ui';
  return { path, type, target };
}

/** Entries first, then the other React files, then the core, then the stylesheet. */
function item(name, title, description, entries) {
  const group = (path) => (path.startsWith('src/react/') ? 0 : 1);
  const others = closure([...entries, 'src/core/index.ts'])
    .filter((path) => !entries.includes(path))
    .sort((a, b) => group(a) - group(b) || a.localeCompare(b));
  return {
    name,
    type: 'registry:ui',
    title,
    description,
    files: [...entries, ...others, STYLESHEET].map(registryFile),
    docs: 'Import components/videotex/videotex.css once, in your root layout or entry file. The VT323 font from Google Fonts is used when the page loads it.',
  };
}

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: pkg.name,
  homepage: pkg.homepage,
  items: [
    ...COMPONENTS.map(([name, title, description]) => item(name, title, description, [`src/react/${title}.tsx`])),
    item(
      'videotex-ui',
      'Videotex UI',
      'All the components at once.',
      COMPONENTS.map(([, title]) => `src/react/${title}.tsx`),
    ),
  ],
};

const output = `${JSON.stringify(registry, null, 2)}\n`;
const file = join(root, 'registry.json');

if (process.argv.includes('--check')) {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (current !== output) {
    console.error('registry.json is out of date: run npm run registry.');
    process.exit(1);
  }
  console.log('registry.json is up to date.');
} else {
  writeFileSync(file, output);
  console.log(`registry.json: ${registry.items.length} items.`);
}
