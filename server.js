import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Malformed JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

async function serveStatic(req, res, url) {
  let requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
  requestPath = requestPath.replace(/\/+/, '/');
  const target = path.join(publicDir, requestPath);

  try {
    const content = await fs.readFile(target);
    const ext = path.extname(target);
    // Geliştirirken tarayıcının eski HTML/CSS/JS'i göstermemesi için.
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, must-revalidate'
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

function installResponseCompatibility(res) {
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };

  res.json = (payload) => {
    res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
    return res;
  };

  res.send = (payload) => {
    if (typeof payload === 'object' && payload !== null) {
      res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(payload));
      return res;
    }

    res.writeHead(res.statusCode || 200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(payload));
    return res;
  };
}

async function routeApi(req, res, url) {
  const pathname = url.pathname;
  const handlers = {
    '/api/health': () => import('./api/health.js'),
    '/api/items': () => import('./api/items.js'),
    '/api/spaces': () => import('./api/spaces.js'),
    '/api/import': () => import('./api/import.js'),
    '/api/photo-background': () => import('./api/photo-background.js'),
    '/api/photo-status': () => import('./api/photo-status.js'),
    '/api/ai': () => import('./api/ai.js'),
    '/api/image': () => import('./api/image.js'),
    '/api/upload': () => import('./api/upload.js')
  };

  installResponseCompatibility(res);

  const handlerLoader = handlers[pathname];
  if (!handlerLoader) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'Not found' }));
    return;
  }

  try {
    const module = await handlerLoader();
    const request = req;
    request.query = Object.fromEntries(url.searchParams.entries());
    request.body = await readBody(req).catch(() => ({}));
    await module.default(request, res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: error?.message || 'Internal error' }));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname.startsWith('/api/')) {
    await routeApi(req, res, url);
    return;
  }

  await serveStatic(req, res, url);
});

server.listen(port, () => {
  console.log(`Hommie running on http://localhost:${port}`);
});
