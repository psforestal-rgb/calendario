import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Plugin to inject PWA meta tags after Vite processing (so they won't be hashed)
const injectPWAMeta = () => ({
  name: 'inject-pwa-meta',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      return html.replace(
        '</head>',
        '    <link rel="icon" type="image/png" sizes="192x192" href="./icon-192.png">\n' +
        '    <link rel="apple-touch-icon" href="./icon-192.png">\n' +
        '    <link rel="manifest" href="./manifest.json">\n' +
        '    <meta name="theme-color" content="#0a1214">\n' +
        '</head>'
      );
    },
  },
});

// Plugin to stamp sw.js with a unique build version on each build
const stampServiceWorker = () => ({
  name: 'stamp-service-worker',
  closeBundle() {
    const buildVersion = Date.now().toString(36);
    const swPath = resolve('dist', 'sw.js');
    try {
      let sw = readFileSync(swPath, 'utf-8');
      sw = sw.replace(
        /const APP_VERSION = '[^']*'/,
        `const APP_VERSION = '${buildVersion}'`
      );
      writeFileSync(swPath, sw);
      console.log(`SW version stamped: ${buildVersion}`);
    } catch (e) {
      console.warn('Could not stamp sw.js:', e.message);
    }
  },
});

export default defineConfig({
  plugins: [react(), injectPWAMeta(), stampServiceWorker()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
