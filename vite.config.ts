import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function appVersionManifestPlugin(buildId: string): Plugin {
  const payload = JSON.stringify(
    {
      buildId,
      builtAt: new Date().toISOString(),
    },
    null,
    2
  );

  return {
    name: 'pokeroutes-version-manifest',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.end(payload);
      });
    },
    writeBundle(options) {
      const outDir = options.dir || path.resolve(__dirname, 'dist');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'version.json'), payload, 'utf8');
    },
  };
}

export default defineConfig(() => {
  const buildId = String(Date.now());
  return {
    define: {
      __APP_BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [react(), tailwindcss(), appVersionManifestPlugin(buildId)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/nycpokemap': {
          target: 'https://nycpokemap.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nycpokemap/, ''),
          headers: {
            'Referer': 'https://nycpokemap.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
        '/api/nyc-cloud-sync': {
          target: 'https://ntfy.sh',
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(/^\/api\/nyc-cloud-sync/, '/pokeskills_nyc_sync_v2_salca'),
        },
      },
    },
  };
});
