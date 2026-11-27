// Finishes the type declarations in dist/, after tsc (npm run build).
//
// The source imports its own files without extensions ('./core', '../core/palette'): bundlers and
// the copies made by the shadcn CLI expect that. Projects set to "moduleResolution": "node16" or
// "nodenext" resolve the package like Node does, and Node needs full paths ('./core/index.js'):
// without them, those projects get no types at all. This script:
//   - adds the extension to every relative import of the .d.ts files;
//   - writes the declaration of the stylesheet, so that import 'videotex-ui/styles.css' also
//     type-checks where side-effect imports are checked (the default since TypeScript 6).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const dist = resolve(import.meta.dirname, '..', 'dist');
const STYLESHEET_TYPES = 'videotex-ui.css.d.ts';

/** './core' → './core/index.js', '../core/palette' → '../core/palette.js'. */
function withExtension(file, specifier) {
  if (/\.(js|mjs|cjs|json|css)$/.test(specifier)) return specifier;
  const base = join(dirname(file), specifier);
  if (existsSync(`${base}.d.ts`)) return `${specifier}.js`;
  if (existsSync(join(base, 'index.d.ts'))) return `${specifier}/index.js`;
  throw new Error(`${relative(dist, file)}: cannot resolve ${specifier}`);
}

// from './x', import './x', import('./x')
const RELATIVE_IMPORT = /(\bfrom\s+|\bimport\s+|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g;

if (!existsSync(dist)) throw new Error('dist/ is missing: run npm run build');

const files = readdirSync(dist, { recursive: true })
  .map(String)
  .filter((name) => name.endsWith('.d.ts'))
  .map((name) => join(dist, name));

let changed = 0;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const fixed = source.replace(
    RELATIVE_IMPORT,
    (_, keyword, quote, specifier) => `${keyword}${quote}${withExtension(file, specifier)}${quote}`,
  );
  if (fixed !== source) {
    writeFileSync(file, fixed);
    changed += 1;
  }
}

writeFileSync(
  join(dist, STYLESHEET_TYPES),
  '// videotex-ui/styles.css is imported for its side effect only: it exports nothing.\nexport {};\n',
);

console.log(`Type declarations: extensions added in ${changed} of ${files.length} files, ${STYLESHEET_TYPES} written.`);
