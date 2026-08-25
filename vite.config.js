import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = 'http://127.0.0.1:3001';

export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    const env = loadEnv(mode, process.cwd(), '');
    if (!String(env.VITE_API_URL ?? '').trim()) {
      throw new Error('Для build нужен VITE_API_URL в .env.production (например https://api.sishel.ru)');
    }
  }

  return {
    base: './',
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      open: false,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/tts': {
          target: API_TARGET,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      {
        name: 'seashell-html-cache-bust',
        transformIndexHtml(html) {
          const buildId = process.env.SEASHELL_BUILD_ID || String(Date.now());
          let out = html.replace(/<\/head>/i, `    <meta name="seashell-build" content="${buildId}" />\n  </head>`);
          out = out.replace(/(\.\/assets\/[^"?]+\.(?:js|css))(?=")/g, `$1?v=${buildId}`);
          return out;
        },
      },
    ],
    build: {
      outDir: 'build',
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/@remix-run/router')) {
              return 'vendor-router';
            }
            if (id.includes('node_modules/@telegram-apps/analytics')) {
              return 'vendor-analytics';
            }
          },
        },
      },
    },
  };
});
