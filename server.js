const http = require('http');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Configure marked for safe rendering
marked.setOptions({ breaks: true, gfm: true });

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

// Estimate reading time for Chinese/English mixed content
function readingTime(text) {
  var totalChars = text.replace(/\s/g, '').length;
  return Math.max(1, Math.round(totalChars / 400));
}

// Markdown rendering that converts relative /images/ src to absolute
function renderMarkdown(md) {
  let html = marked.parse(md);
  html = html.replace(/src="\/images\//g, 'src="images/');
  return html;
}

const server = http.createServer((req, res) => {
  // API: return post list from posts/ folder
  if (req.url === '/api/posts') {
    const postsDir = path.join(ROOT, 'posts');
    try {
      const files = fs.readdirSync(postsDir)
        .filter(f => f.endsWith('.md'))
        .sort();
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

  // API: return a single post as HTML
  if (req.url.startsWith('/api/posts/')) {
    const slug = decodeURIComponent(req.url.replace('/api/posts/', '')).replace(/\.\./g, '');
    const filePath = path.join(ROOT, 'posts', slug + '.md');
    if (!filePath.startsWith(path.join(ROOT, 'posts'))) {
      res.writeHead(403);
      res.end('403 Forbidden');
      return;
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { meta, body } = parseFrontmatter(raw);
      const html = renderMarkdown(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...meta, slug, content: html, readingTime: readingTime(body) }));
    } catch {
      res.writeHead(404);
      res.end('404 Not Found');
    }
    return;
  }

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

  // RSS feed
  if (req.url === '/rss.xml' || req.url === '/rss') {
    const postsDir = path.join(ROOT, 'posts');
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
          '      <link>http://localhost:' + PORT + '/post?slug=' + slug + '</link>\n' +
          '      <guid>http://localhost:' + PORT + '/post?slug=' + slug + '</guid>\n' +
          (pubDate ? '      <pubDate>' + pubDate + '</pubDate>\n' : '') +
          (category ? '      <category>' + escapeXml(category) + '</category>\n' : '') +
          '      <description>' + escapeXml(excerpt) + '</description>\n' +
          '    </item>';
      }).join('\n');
      const rss = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<rss version="2.0">\n' +
        '  <channel>\n' +
        '    <title>STILL</title>\n' +
        '    <link>http://localhost:' + PORT + '</link>\n' +
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

  const urlPath = req.url.split('?')[0];
  let safePath = (urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath).replace(/^\/+/, ''));
  // Clean URL: /blog → blog.html, /post → post.html
  if (!path.extname(safePath)) safePath += '.html';
  const filePath = path.resolve(path.join(ROOT, safePath));

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
