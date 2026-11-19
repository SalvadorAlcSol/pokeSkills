import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import type { IncomingMessage } from 'http';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function runPhoneLinkScript(scriptPath: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args],
      { windowsHide: true }
    );

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (d) => stdoutChunks.push(Buffer.from(d)));
    child.stderr.on('data', (d) => stderrChunks.push(Buffer.from(d)));
    child.on('error', reject);
    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf8').trim();
      const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();

      if (stdout) {
        const lastLine = stdout.split(/\r?\n/).filter(Boolean).pop() || stdout;
        try {
          const parsed = JSON.parse(lastLine);
          resolve(parsed);
          return;
        } catch {
          // fall through to error
        }
      }

      reject(new Error(stderr || stdout || `Controller exited with code ${code}`));
    });
  });
}

function buildRectAndHwndArgs(body: any): string[] {
  const args: string[] = [];
  const hwnd = Number(body?.hwnd || 0);
  if (Number.isFinite(hwnd) && hwnd > 0) {
    args.push('-Hwnd', String(Math.round(hwnd)));
  }
  const rect = body?.rect;
  if (rect && Number(rect.width) > 0 && Number(rect.height) > 0) {
    args.push(
      '-Left',
      String(Math.round(Number(rect.left || 0))),
      '-Top',
      String(Math.round(Number(rect.top || 0))),
      '-Width',
      String(Math.round(Number(rect.width))),
      '-Height',
      String(Math.round(Number(rect.height)))
    );
  }
  return args;
}

function phoneLinkAutomationPlugin(): Plugin {
  const scriptPath = path.resolve(__dirname, 'scripts', 'phone-link-controller.ps1');

  return {
    name: 'pokeroutes-phone-link-automation',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlPath = (req.url || '').split('?')[0];
        if (!urlPath.startsWith('/api/phone-link/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        try {
          if (urlPath === '/api/phone-link/status' && req.method === 'GET') {
            const data = await runPhoneLinkScript(scriptPath, ['-Action', 'status']);
            res.end(JSON.stringify(data));
            return;
          }

          if (urlPath === '/api/phone-link/cursor' && req.method === 'GET') {
            const data = await runPhoneLinkScript(scriptPath, ['-Action', 'cursor']);
            res.end(JSON.stringify(data));
            return;
          }

          if (urlPath === '/api/phone-link/test' && req.method === 'POST') {
            const body = await readJsonBody(req);
            const action = String(body?.action || '');
            if (!['capture', 'scroll-down', 'scroll-up', 'next-pokemon'].includes(action)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Acción inválida.' }));
              return;
            }

            const args = ['-Action', action, ...buildRectAndHwndArgs(body)];
            if (action === 'scroll-down' || action === 'scroll-up') {
              const method = body?.method === 'wheel' ? 'wheel' : 'drag';
              args.push('-ScrollMethod', method);
            } else if (action === 'next-pokemon') {
              const method = body?.method === 'tap' ? 'tap' : 'swipe';
              args.push('-NextMethod', method);
            }

            const data = await runPhoneLinkScript(scriptPath, args);
            res.end(JSON.stringify(data));
            return;
          }

          if (urlPath === '/api/phone-link/step' && req.method === 'POST') {
            const body = await readJsonBody(req);
            const args = [
              '-Action',
              'step',
              ...buildRectAndHwndArgs(body),
              '-CaptureBottom',
              body?.captureBottom === false ? '0' : '1',
              '-AdvanceNext',
              body?.advanceNext === false ? '0' : '1',
              '-ScrollMethod',
              body?.scrollMethod === 'wheel' ? 'wheel' : 'drag',
              '-NextMethod',
              body?.nextMethod === 'tap' ? 'tap' : 'swipe',
              '-ScrollDelayMs',
              String(Math.min(3000, Math.max(200, Math.round(Number(body?.scrollDelayMs || 650))))),
              '-SwipeDelayMs',
              String(Math.min(3000, Math.max(200, Math.round(Number(body?.swipeDelayMs || 700))))),
            ];

            const data = await runPhoneLinkScript(scriptPath, args);
            res.end(JSON.stringify(data));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ success: false, error: 'Ruta no encontrada.' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              success: false,
              error: err?.message || 'Error ejecutando el controlador de Enlace Móvil.',
            })
          );
        }
      });
    },
  };
}

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
    plugins: [react(), tailwindcss(), phoneLinkAutomationPlugin(), appVersionManifestPlugin(buildId)],
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
            path.replace(/^\/api\/nyc-cloud-sync/, '/pokeskills_nyc_sync_v3_salca'),
        },
      },
    },
  };
});
