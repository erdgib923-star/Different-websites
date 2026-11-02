// Zero-dependency static file server for previewing the production build.
// usage: node scripts/serve.mjs [dir=dist] [port=4173]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.ico': 'image/x-icon',
};

async function find(p) {
  for (const c of [p, p + '.html', join(p, 'index.html')]) {
    try { if ((await stat(c)).isFile()) return c; } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const safe = normalize(join(dir, url));
  if (!safe.startsWith(dir)) { res.writeHead(403).end(); return; }
  const file = (await find(safe)) ?? (await find(join(dir, '404')));
  if (!file) { res.writeHead(404).end('not found'); return; }
  res.writeHead(file.endsWith('404.html') ? 404 : 200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(port, () => console.log(`serving ${dir} on http://localhost:${port}`));
