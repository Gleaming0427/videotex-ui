// Library build (npm run build): one ES module per source file and one CSS file in dist/.
// Keeping the modules apart keeps each 'use client' directive on its own file, so React Server
// Components can import the core (PageBuilder, palettes…) without making it client code.
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: { 'videotex-ui': resolve(import.meta.dirname, 'src/bundle.ts') },
      formats: ['es'],
      cssFileName: 'videotex-ui',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: (chunk) => (chunk.name === 'bundle' ? 'videotex-ui.js' : '[name].js'),
      },
    },
  },
});
