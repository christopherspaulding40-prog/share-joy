#!/usr/bin/env node
'use strict';

const net = require('net');
const { spawn, spawnSync } = require('child_process');

const PROXY_PORT = process.env.PROXY_PORT ? Number(process.env.PROXY_PORT) : 9293;
const APP_PORT = process.env.APP_PORT ? Number(process.env.APP_PORT) : 9494;
const HOST = '127.0.0.1';

function startProxy() {
  const server = net.createServer((socket) => {
    const remote = net.connect(APP_PORT, HOST);
    socket.pipe(remote);
    remote.pipe(socket);

    socket.on('error', () => remote.end());
    remote.on('error', () => socket.end());
  });

  server.on('error', (err) => {
    console.error('Proxy server error:', err);
    process.exit(1);
  });

  server.listen(PROXY_PORT, () => {
    console.log(`TCP proxy listening on ${PROXY_PORT} -> ${HOST}:${APP_PORT}`);
  });

  return server;
}

function startShopify(server) {
  const env = Object.assign({}, process.env, {
    PORT: String(APP_PORT),
    SHOPIFY_APP_URL: `http://${HOST}:${APP_PORT}`,
    BROWSER: 'none',
  });

  const cmd = process.env.USE_TUNNEL === '1' ? 'shopify app dev' : 'shopify app dev --use-localhost';
  const child = spawn(cmd, { stdio: 'inherit', shell: true, env });

  child.on('exit', (code, signal) => {
    console.log(`shopify app dev exited with code=${code} signal=${signal}`);
    server.close(() => process.exit(code || 0));
  });

  const shutdown = () => {
    try { child.kill('SIGINT'); } catch (e) {}
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Quick safety: if something else is listening on PROXY_PORT, warn and exit
const check = spawnSync('lsof', ['-i', `:${PROXY_PORT}`, '-sTCP:LISTEN', '-Pn']);
if (check.status === 0 && check.stdout && check.stdout.length) {
  console.error(`Port ${PROXY_PORT} appears to be in use. Please stop the process using it or run the proxy on a different port (set PROXY_PORT env).`);
  process.exit(1);
}

const server = startProxy();
startShopify(server);
