const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8000;
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
  
  // Get the file extension
  const extname = path.extname(filePath);
  
  // Set the content type based on file extension
  let contentType = 'text/html';
  switch (extname) {
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
  }
  
  // Read and serve the file
  fs.readFile(filePath, (err, content) => {
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
      res.end(content, 'utf-8');
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
