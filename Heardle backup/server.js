const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8000;
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
  // Parse the requested file path
  let filePath = path.join(__dirname, req.url === '/' ? 'Heardle.html' : req.url);
  
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
      contentType = 'image/jpg';
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
