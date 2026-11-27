// Demo application (npm run dev, npm run build:demo).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'demo',
  // Relative asset paths: the built demo works at any address, at the root of a domain or in a folder.
  base: './',
  plugins: [react()],
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
});
