const http = require('http');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Configure marked for safe rendering
marked.setOptions({ breaks: true, gfm: true });

const PORT = process.env.PORT || 3456;
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
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
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

// ===== Shared API helpers =====

function getImageList(imgDir, urlPrefix) {
  let meta = {};
  try {
    const raw = fs.readFileSync(path.join(imgDir, 'images.json'), 'utf-8');
    JSON.parse(raw).forEach(m => { if (m.file) meta[m.file] = m; });
  } catch {}

  const list = [];

  function makeEntry(f, src, cat, subfolder) {
    const m = meta[f] || (subfolder ? meta[subfolder + '/' + f] : null) || {};
    const entry = {
      src: src,
      title: m.title || path.parse(f).name,
      category: cat
    };
    if (m.audio) entry.audio = m.audio;
    return entry;
  }

  // Root-level images (no category)
  fs.readdirSync(imgDir)
    .filter(f => IMG_RE.test(f))
    .sort()
    .forEach(f => {
      list.push(makeEntry(f, urlPrefix + '/' + encodeURIComponent(f), '', null));
    });

  // Subfolder images (folder name = category)
  fs.readdirSync(imgDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .forEach(d => {
      const subDir = path.join(imgDir, d.name);
      try {
        fs.readdirSync(subDir)
          .filter(f => IMG_RE.test(f))
          .sort()
          .forEach(f => {
            list.push(makeEntry(f, urlPrefix + '/' + encodeURIComponent(d.name) + '/' + encodeURIComponent(f), d.name, d.name));
          });
      } catch {}
    });

  return list;
}

function getPostList(postsDir) {
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).sort();
  return files.map(f => {
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
}

function getSinglePost(postsDir, slug) {
  const filePath = path.join(postsDir, slug + '.md');
  if (!filePath.startsWith(postsDir)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const html = renderMarkdown(body);
  return { ...meta, slug, content: html, readingTime: readingTime(body) };
}

function sendJson(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function send403(res) {
  res.writeHead(403);
  res.end('403 Forbidden');
}

function send404(res) {
  const notFoundPath = path.join(ROOT, '404.html');
  fs.readFile(notFoundPath, (err, data) => {
    if (err) { res.writeHead(404); res.end('404 Not Found'); return; }
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

// ===== Request handler =====

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // --- Image API ---
  if (req.url === '/api/images') {
    try { sendJson(res, getImageList(path.join(ROOT, 'images'), 'images')); }
    catch { sendJson(res, []); }
    return;
  }
  if (req.url === '/void-api/images') {
    try { sendJson(res, getImageList(path.join(ROOT, 'void-content/images'), 'void-content/images')); }
    catch { sendJson(res, []); }
    return;
  }

  // --- Post list API ---
  if (req.url === '/api/posts') {
    try { sendJson(res, getPostList(path.join(ROOT, 'posts'))); }
    catch { sendJson(res, []); }
    return;
  }
  if (req.url === '/void-api/posts') {
    try { sendJson(res, getPostList(path.join(ROOT, 'void-content/posts'))); }
    catch { sendJson(res, []); }
    return;
  }

  // --- Single post API ---
  if (req.url.startsWith('/api/posts/')) {
    const slug = decodeURIComponent(req.url.replace('/api/posts/', '')).replace(/\.\./g, '');
    const postsDir = path.join(ROOT, 'posts');
    try {
      const post = getSinglePost(postsDir, slug);
      if (!post) { send403(res); return; }
      sendJson(res, post);
    } catch { send404(res); }
    return;
  }
  if (req.url.startsWith('/void-api/posts/')) {
    const slug = decodeURIComponent(req.url.replace('/void-api/posts/', '')).replace(/\.\./g, '');
    const postsDir = path.join(ROOT, 'void-content/posts');
    try {
      const post = getSinglePost(postsDir, slug);
      if (!post) { send403(res); return; }
      // Fix image paths for void content
      post.content = post.content.replace(/src="images\//g, 'src="void-content/images/');
      sendJson(res, post);
    } catch { res.writeHead(404); res.end('404'); }
    return;
  }

  // --- Sitemap ---
  if (req.url === '/sitemap.xml') {
    const host = req.headers.host || ('localhost:' + PORT);
    const base = 'http://' + host;
    let urls = ['/', '/blog'];
    try {
      fs.readdirSync(path.join(ROOT, 'posts')).filter(f => f.endsWith('.md')).forEach(f => {
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

  // --- RSS feed ---
  if (req.url === '/rss.xml' || req.url === '/rss') {
    const host = req.headers.host || ('localhost:' + PORT);
    const base = 'http://' + host;
    try {
      const files = fs.readdirSync(path.join(ROOT, 'posts')).filter(f => f.endsWith('.md')).sort();
      const items = files.map(f => {
        const raw = fs.readFileSync(path.join(ROOT, 'posts', f), 'utf-8');
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

  // --- Static files ---
  let safePath = (urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath).replace(/^\/+/, ''));
  // Clean URL: /blog → blog.html, /post → post.html
  if (!path.extname(safePath)) safePath += '.html';
  const filePath = path.resolve(path.join(ROOT, safePath));

  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT)) { send403(res); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { send404(res); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('  URL: http://localhost:' + PORT);
});
