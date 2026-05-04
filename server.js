const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = Number.parseInt(process.env.PORT || '', 10) || 8000;
const HOST = '0.0.0.0';

const DOC_ROOT = path.resolve(__dirname);

/** Resolve URL pathname to a file path strictly inside DOC_ROOT (blocks /../ escapes). */
function safeFilePathFromUrl(reqUrl) {
  let pathname;
  try {
    pathname = new URL(reqUrl, 'http://localhost').pathname;
  } catch {
    return null;
  }
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (pathname.includes('\0')) return null;

  let relative = pathname.replace(/^\/+/u, '');
  if (!relative) relative = 'index.html';

  relative = path.normalize(relative);
  if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
    return null;
  }

  const resolved = path.resolve(DOC_ROOT, relative);
  const relToRoot = path.relative(DOC_ROOT, resolved);
  if (relToRoot.startsWith('..' + path.sep) || relToRoot === '..' || path.isAbsolute(relToRoot)) {
    return null;
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  const filePath = safeFilePathFromUrl(req.url);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  
  const extname = path.extname(filePath);
  const extLower = extname.toLowerCase();
  const BINARY_EXTENSIONS = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.pdf',
    '.zip',
    '.mp3',
    '.mp4',
    '.webm',
    '.svg'
  ]);
  const isBinary = BINARY_EXTENSIONS.has(extLower);

  let contentType = 'text/html';
  switch (extLower) {
    case '.js':
      contentType = 'application/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.webp':
      contentType = 'image/webp';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
    case '.woff':
      contentType = 'font/woff';
      break;
    case '.woff2':
      contentType = 'font/woff2';
      break;
    case '.ttf':
      contentType = 'font/ttf';
      break;
    case '.eot':
      contentType = 'application/vnd.ms-fontobject';
      break;
    case '.mp3':
      contentType = 'audio/mpeg';
      break;
    case '.mp4':
      contentType = 'video/mp4';
      break;
    case '.webm':
      contentType = 'video/webm';
      break;
    case '.pdf':
      contentType = 'application/pdf';
      break;
    case '.zip':
      contentType = 'application/zip';
      break;
  }

  fs.readFile(filePath, isBinary ? undefined : 'utf-8', (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + err.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, isBinary ? undefined : 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  const interfaces = os.networkInterfaces();
  const lanIps = Object.values(interfaces)
    .flat()
    .filter(Boolean)
    .filter(info => info.family === 'IPv4' && !info.internal)
    .map(info => info.address);

  console.log(`Server running at http://localhost:${PORT}/`);
  if (lanIps.length) {
    console.log(`Phone access: http://${lanIps[0]}:${PORT}/`);
  }
  console.log(`Press Ctrl+C to stop the server`);
});
