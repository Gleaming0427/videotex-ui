// Demo application (npm run dev, npm run build:demo).
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const page = (name: string) => fileURLToPath(new URL(`./demo/${name}`, import.meta.url));

/**
 * GitHub Pages serves 404.html at every missing address, however deep, so its relative paths would
 * point to the wrong folder. That page gets a <base> with the address of the site instead:
 * DEMO_BASE_PATH, given by the Pages workflow ("/videotex-ui", or "" at the root of a domain).
 * Without it (local builds), 404.html keeps relative paths and works at /404.html.
 */
function notFoundBase(basePath: string | undefined): Plugin {
  return {
    name: 'demo-not-found-base',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { path }) {
        if (basePath === undefined || path !== '/404.html') return html;
        return [{ tag: 'base', attrs: { href: `${basePath.replace(/\/+$/, '')}/` }, injectTo: 'head-prepend' }];
      },
    },
  };
}

export default defineConfig({
  root: 'demo',
  // Relative asset paths: the built demo works at any address, at the root of a domain or in a folder.
  base: './',
  plugins: [react(), notFoundBase(process.env.DEMO_BASE_PATH)],
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
    rolldownOptions: {
      input: { main: page('index.html'), notFound: page('404.html') },
    },
  },
});
