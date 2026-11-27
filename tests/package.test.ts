import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('React Server Components', () => {
  const files = readdirSync(join(root, 'src/react')).map((name) => `src/react/${name}`);

  it.each(files.filter((file) => /\b(use[A-Z]\w*|createContext|memo)\(/.test(read(file))))(
    '%s uses React state and is a client module',
    (file) => {
      expect(read(file).startsWith("'use client';\n")).toBe(true);
    },
  );

  it('keeps the core free of React', () => {
    for (const name of readdirSync(join(root, 'src/core'))) {
      expect(read(`src/core/${name}`)).not.toMatch(/from 'react'/);
    }
  });
});

describe('shadcn registry', () => {
  const registry = JSON.parse(read('registry.json')) as {
    items: { name: string; files: { path: string; target: string }[] }[];
  };

  it('has one item per component, and one for all of them', () => {
    expect(registry.items.map((item) => item.name)).toEqual([
      'screen',
      'function-keys',
      'title',
      'status-row',
      'frame',
      'input-field',
      'menu',
      'mosaic',
      'videotex-ui',
    ]);
  });

  it('installs every item with the core and the stylesheet, under components/videotex', () => {
    for (const item of registry.items) {
      const paths = item.files.map((file) => file.path);
      expect(paths).toContain('src/core/index.ts');
      expect(paths).toContain('src/styles/videotex.css');
      for (const file of item.files) expect(file.target.startsWith('@components/videotex/')).toBe(true);
    }
  });
});
