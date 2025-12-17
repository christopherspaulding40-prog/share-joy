require('http').createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>ShareJoy Dev Server</h1><p>Dashboard is running...</p>');
}).listen(3001, () => {
  console.log('Dev server listening on http://localhost:3001');
});
