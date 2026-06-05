const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

marked.setOptions({ breaks: true, gfm: true });

const ROOT = path.join(__dirname, '..');

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
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
};

const IMG_RE = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  match[1].split(/\r?\n/).forEach(line => {
    const sep = line.indexOf(':');
    if (sep > 0) {
      const key = line.slice(0, sep).trim();
      let val = line.slice(sep + 1).trim();
      val = val.replace(/^["']|["']$/g, '');
      meta[key] = val;
    }
  });
  return { meta, body: match[2] };
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function readingTime(text) {
  var totalChars = text.replace(/\s/g, '').length;
  return Math.max(1, Math.round(totalChars / 400));
}

function renderMarkdown(md) {
  let html = marked.parse(md);
  html = html.replace(/src="\/images\//g, 'src="images/');
  return html;
}

module.exports = function handler(req, res) {
  // API: post list
  if (req.url === '/api/posts') {
    const postsDir = path.join(ROOT, 'posts');
    try {
      const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).sort();
      const posts = files.map(f => {
        const raw = fs.readFileSync(path.join(postsDir, f), 'utf-8');
        const { meta, body } = parseFrontmatter(raw);
        const slug = f.replace(/\.md$/, '');
        return {
          slug,
          title: meta.title || slug,
          date: meta.date || '',
          excerpt: meta.excerpt || '',
          category: meta.category || '',
          cover: meta.cover || '',
          readingTime: readingTime(body)
        };
      }).sort((a, b) => b.date.localeCompare(a.date));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(posts));
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('[]');
    }
    return;
  }

  // API: single post
  if (req.url.startsWith('/api/posts/')) {
    const slug = decodeURIComponent(req.url.replace('/api/posts/', '')).replace(/\.\./g, '');
    const filePath = path.join(ROOT, 'posts', slug + '.md');
    if (!filePath.startsWith(path.join(ROOT, 'posts'))) {
      res.writeHead(403); res.end('403 Forbidden'); return;
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { meta, body } = parseFrontmatter(raw);
      const html = renderMarkdown(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...meta, slug, content: html, readingTime: readingTime(body) }));
    } catch {
      res.writeHead(404); res.end('404 Not Found');
    }
    return;
  }

  // API: image list
  if (req.url === '/api/images') {
    const imgDir = path.join(ROOT, 'images');
    try {
      let meta = {};
      try {
        const raw = fs.readFileSync(path.join(imgDir, 'images.json'), 'utf-8');
        JSON.parse(raw).forEach(m => { if (m.file) meta[m.file] = m; });
      } catch {}

      const list = [];
      function makeEntry(f, src, cat) {
        const m = meta[f] || {};
        const entry = { src, title: m.title || path.parse(f).name, category: cat };
        if (m.audio) entry.audio = m.audio;
        return entry;
      }

      fs.readdirSync(imgDir).filter(f => IMG_RE.test(f)).sort().forEach(f => {
        list.push(makeEntry(f, 'images/' + encodeURIComponent(f), ''));
      });

      fs.readdirSync(imgDir, { withFileTypes: true }).filter(d => d.isDirectory()).forEach(d => {
        const subDir = path.join(imgDir, d.name);
        try {
          fs.readdirSync(subDir).filter(f => IMG_RE.test(f)).sort().forEach(f => {
            list.push(makeEntry(f, 'images/' + encodeURIComponent(d.name) + '/' + encodeURIComponent(f), d.name));
          });
        } catch {}
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(list));
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('[]');
    }
    return;
  }

  // Sitemap
  if (req.url === '/sitemap.xml') {
    const postsDir = path.join(ROOT, 'posts');
    const host = req.headers.host || 'localhost';
    const base = 'https://' + host;
    let urls = ['/', '/blog'];
    try {
      fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).forEach(f => {
        urls.push('/post?slug=' + f.replace(/\.md$/, ''));
      });
    } catch {}
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => '  <url><loc>' + base + u + '</loc></url>').join('\n') + '\n' +
      '</urlset>';
    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end(xml);
    return;
  }

  // RSS
  if (req.url === '/rss.xml' || req.url === '/rss') {
    const postsDir = path.join(ROOT, 'posts');
    const host = req.headers.host || 'localhost';
    const base = 'https://' + host;
    try {
      const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).sort();
      const items = files.map(f => {
        const raw = fs.readFileSync(path.join(postsDir, f), 'utf-8');
        const { meta, body } = parseFrontmatter(raw);
        const slug = f.replace(/\.md$/, '');
        const title = meta.title || slug;
        const date = meta.date || '';
        const excerpt = meta.excerpt || '';
        const category = meta.category || '';
        const pubDate = date ? new Date(date + 'T00:00:00Z').toUTCString() : '';
        return '    <item>\n' +
          '      <title>' + escapeXml(title) + '</title>\n' +
          '      <link>' + base + '/post?slug=' + slug + '</link>\n' +
          '      <guid>' + base + '/post?slug=' + slug + '</guid>\n' +
          (pubDate ? '      <pubDate>' + pubDate + '</pubDate>\n' : '') +
          (category ? '      <category>' + escapeXml(category) + '</category>\n' : '') +
          '      <description>' + escapeXml(excerpt) + '</description>\n' +
          '    </item>';
      }).join('\n');
      const rss = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<rss version="2.0">\n' +
        '  <channel>\n' +
        '    <title>STILL</title>\n' +
        '    <link>' + base + '</link>\n' +
        '    <description>A curated collection of still images and writing</description>\n' +
        '    <language>zh-cn</language>\n' +
        items + '\n' +
        '  </channel>\n' +
        '</rss>';
      res.writeHead(200, { 'Content-Type': 'application/xml' });
      res.end(rss);
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/xml' });
      res.end('<?xml version="1.0"?><rss version="2.0"><channel><title>STILL</title></channel></rss>');
    }
    return;
  }

  // Static files
  const urlPath = req.url.split('?')[0];
  let safePath = (urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath).replace(/^\/+/, ''));
  if (!path.extname(safePath)) safePath += '.html';
  const filePath = path.resolve(path.join(ROOT, safePath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('403 Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      const notFoundPath = path.join(ROOT, '404.html');
      fs.readFile(notFoundPath, (err2, data2) => {
        if (err2) { res.writeHead(404); res.end('404 Not Found'); return; }
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(data2);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
};
