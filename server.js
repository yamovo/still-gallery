const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Allowed image extensions for the API
const IMG_RE = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

const server = http.createServer((req, res) => {
  // API: return image list from images/ folder
  if (req.url === '/api/images') {
    const imgDir = path.join(ROOT, 'images');
    try {
      const files = fs.readdirSync(imgDir)
        .filter(f => IMG_RE.test(f))
        .sort();
      // Load optional metadata from images/images.json
      let meta = {};
      try {
        const raw = fs.readFileSync(path.join(imgDir, 'images.json'), 'utf-8');
        JSON.parse(raw).forEach(m => { if (m.file) meta[m.file] = m; });
      } catch {}
      const list = files.map(f => {
        const m = meta[f] || {};
        return {
          src: 'images/' + encodeURIComponent(f),
          title: m.title || path.parse(f).name,
          category: m.category || ''
        };
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(list));
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('[]');
    }
    return;
  }

  const urlPath = req.url.split('?')[0];
  const filePath = path.resolve(ROOT, urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath));

  // Security: prevent path traversal — resolved path must stay inside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('  URL: http://localhost:' + PORT);
});
