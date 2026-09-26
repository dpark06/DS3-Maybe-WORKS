import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';

const root = import.meta.dirname;

// Pages that live at /name (no trailing slash) map to /name/index.html, in dev and in `vite preview`.
// On the host: public/_redirects (Netlify, Cloudflare Pages) and vercel.json (Vercel) do the same.
const PAGES = ['the-food', 'find-it', 'share'];
const rewritePages = (server) => {
  server.middlewares.use((req, _res, next) => {
    const m = req.url && req.url.match(/^\/([a-z-]+)\/?(\?.*)?$/);
    if (m && PAGES.includes(m[1])) req.url = `/${m[1]}/index.html${m[2] || ''}`;
    next();
  });
};

// <!--include:nav--> and <!--include:footer--> pull in partials/*.html so every page shares one nav and footer.
const partials = {
  name: 'partials',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replace(/<!--include:(\w+)-->/g, (_, n) => readFileSync(resolve(root, 'partials', `${n}.html`), 'utf8')),
  },
};

// This computer's address on the local network. While developing, QR codes use it instead of "localhost"
// (a phone cannot open "localhost"). Never baked into a production build.
const lanIp = () => {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) if (i.family === 'IPv4' && !i.internal) return i.address;
  }
  return null;
};

export default defineConfig(({ command, isPreview }) => ({
  server: { host: true },
  optimizeDeps: { exclude: ['maplibre-gl'] }, // its module worker must keep its real URL
  define: { __LAN_HOST__: JSON.stringify(command === 'serve' || isPreview ? lanIp() : null) },
  plugins: [partials, { name: 'pages', configureServer: rewritePages, configurePreviewServer: rewritePages }],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        food: resolve(root, 'the-food/index.html'),
        find: resolve(root, 'find-it/index.html'),
        share: resolve(root, 'share/index.html'),
      },
    },
  },
}));
