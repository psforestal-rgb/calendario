import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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

export default defineConfig({
  plugins: [react(), injectPWAMeta()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
