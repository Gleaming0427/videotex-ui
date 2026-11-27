// Checks the npm package as a user receives it (npm run check:package).
//
// Packs the package (which builds the library and the registry first), unpacks it into the
// node_modules of a throwaway project, then:
//   - checks that every file named by "exports" and every registry item is in the package;
//   - type-checks a small TSX file importing the package, under each module resolution a project
//     can use (bundler, node16, nodenext), with the TypeScript of this repository;
//   - imports the package in Node and resolves the stylesheet.
// React and its types are linked from this repository's node_modules: nothing is downloaded.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'));
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const LINKED = ['react', 'react-dom', '@types/react', '@types/react-dom'];
const RESOLUTIONS = [
  { module: 'esnext', moduleResolution: 'bundler' },
  { module: 'node16', moduleResolution: 'node16' },
  { module: 'nodenext', moduleResolution: 'nodenext' },
];

const CONSUMER = `import { FunctionKeys, Menu, PageBuilder, Screen, type ScreenProps } from 'videotex-ui';
import 'videotex-ui/styles.css';

const page = new PageBuilder().moveTo(3, 2).print('HELLO', { fg: 'yellow', size: 'double-size' }).build();
const props: ScreenProps = { page, crt: true, baud: 1200 };

export const screen = <Screen {...props} aria-label="Home" />;
export const keys = <FunctionKeys shortcuts onSend={() => undefined} />;
export const menu = <Menu items={['News', 'Weather']} onSelect={(index: number) => index} />;
// Only an error if the types were found: without them, every import would be 'any'.
// @ts-expect-error crt is a boolean
export const wrong = <Screen page={page} crt="yes" />;
`;

const RUNTIME = `const m = await import('videotex-ui');
for (const name of ['Screen', 'FunctionKeys', 'Title', 'StatusRow', 'Frame', 'InputField', 'Menu', 'Mosaic', 'PageBuilder']) {
  if (typeof m[name] !== 'function') throw new Error('videotex-ui does not export ' + name);
}
const page = new m.PageBuilder().moveTo(1, 1).print('OK').build();
if (m.pageToPlainText(page).join('|') !== 'OK') throw new Error('PageBuilder output is wrong');
const css = import.meta.resolve('videotex-ui/styles.css');
if (!css.endsWith('/dist/videotex-ui.css')) throw new Error('videotex-ui/styles.css resolves to ' + css);
`;

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

/** Every file named in "exports", e.g. { ".": { types, import } } → the two paths. */
function exportTargets(value) {
  if (typeof value === 'string') return [value];
  return Object.values(value).flatMap(exportTargets);
}

const work = mkdtempSync(join(tmpdir(), 'videotex-ui-package-'));
try {
  // 1. Pack and unpack. --dry-run=false: run from npm publish --dry-run, this script inherits
  // npm_config_dry_run, which would stop npm pack from writing the tarball.
  execFileSync('npm', ['pack', '--dry-run=false', '--loglevel=warn', '--pack-destination', work], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const tarball = readdirSync(work).find((name) => name.endsWith('.tgz'));
  if (!tarball) throw new Error('npm pack wrote no tarball');
  const project = join(work, 'project');
  const installed = join(project, 'node_modules', 'videotex-ui');
  mkdirSync(installed, { recursive: true });
  execFileSync('tar', ['-xzf', join(work, tarball), '-C', installed, '--strip-components=1']);
  for (const name of LINKED) {
    const link = join(project, 'node_modules', name);
    mkdirSync(dirname(link), { recursive: true });
    symlinkSync(join(root, 'node_modules', name), link, 'dir');
  }
  writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }));
  console.log(`Packed ${tarball}`);

  // 2. Files.
  const expected = [
    ...exportTargets(pkg.exports),
    ...registry.items.map((item) => `./r/${item.name}.json`),
    './r/registry.json',
  ];
  const missing = expected.filter((path) => !existsSync(join(installed, path)));
  if (missing.length) fail(`missing from the package: ${missing.join(', ')}`);
  else console.log(`✓ ${expected.length} files named by "exports" and the registry are in the package`);

  // 3. Types.
  writeFileSync(join(project, 'index.tsx'), CONSUMER);
  for (const { module, moduleResolution } of RESOLUTIONS) {
    const tsconfig = `tsconfig.${moduleResolution}.json`;
    writeFileSync(
      join(project, tsconfig),
      JSON.stringify({
        compilerOptions: {
          target: 'es2022',
          lib: ['es2022', 'dom'],
          module,
          moduleResolution,
          jsx: 'react-jsx',
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          noUncheckedSideEffectImports: true,
          types: [],
        },
        files: ['index.tsx'],
      }),
    );
    try {
      execFileSync(process.execPath, [tsc, '-p', tsconfig], { cwd: project, encoding: 'utf8' });
      console.log(`✓ types resolve with "moduleResolution": "${moduleResolution}"`);
    } catch (error) {
      fail(`types fail with "moduleResolution": "${moduleResolution}":\n${error.stdout || error.message}`);
    }
  }

  // 4. Node.
  writeFileSync(join(project, 'runtime.mjs'), RUNTIME);
  try {
    execFileSync(process.execPath, ['runtime.mjs'], { cwd: project, encoding: 'utf8', stdio: 'pipe' });
    console.log('✓ Node imports the package and resolves videotex-ui/styles.css');
  } catch (error) {
    fail(`Node cannot use the package:\n${error.stderr || error.message}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (process.exitCode) console.error('The package check failed.');
else console.log('The package check passed.');
