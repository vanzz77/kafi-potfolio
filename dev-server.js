// Server lokal untuk tes: menyajikan situs statis + menjalankan fungsi di "Portofolio kafi/api".
// Pakai:  node dev-server.js   lalu buka http://localhost:3000
// Membaca .env di folder ini (RESEND_API_KEY, GROQ_API_KEY). Nilainya tidak pernah dicetak.
// File ini hanya untuk pengembangan lokal dan tidak dipakai Vercel.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'Portofolio kafi');
const PORT = process.env.PORT || 3000;

// muat .env sederhana
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { console.warn('.env tidak ditemukan; fungsi API akan menjawab "belum dikonfigurasi".'); }

console.log('Env terbaca:', ['GROQ_API_KEY', 'RESEND_API_KEY'].map((k) => k + '=' + (process.env[k] ? 'ada' : 'KOSONG')).join(', '));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.json': 'application/json', '.pdf': 'application/pdf', '.ico': 'image/x-icon'
};

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); }
    });
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);

  // Fungsi API
  if (pathname.startsWith('/api/')) {
    const name = pathname.slice(5).replace(/[^a-z0-9_-]/gi, '');
    const file = path.join(ROOT, 'api', name + '.js');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
    req.body = req.method === 'POST' ? await readBody(req) : undefined;
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
    try {
      delete require.cache[require.resolve(file)]; // selalu pakai kode terbaru
      const handler = require(file);
      return await handler(req, res);
    } catch (e) { console.error(e); res.writeHead(500); return res.end('Server error'); }
  }

  // File statis
  if (pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`Situs + API lokal: http://localhost:${PORT}`));
