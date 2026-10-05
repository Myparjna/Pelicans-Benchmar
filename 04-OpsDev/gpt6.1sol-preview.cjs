const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '..', 'gpt6.1sol.html');
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/' || pathname === '/gpt6.1sol.html') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(response);
  } else if (pathname === '/favicon.ico') {
    response.writeHead(204).end();
  } else {
    response.writeHead(404).end();
  }
});
server.listen(8766, '127.0.0.1', () => console.log('http://127.0.0.1:8766/gpt6.1sol.html'));
