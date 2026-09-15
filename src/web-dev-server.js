import http from 'node:http';
import os from 'node:os';
import { getAllowedDevOrigins } from '../lib/lan-dev-origins.mjs';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
process.env.PHARMA_NEXT_DIST_DIR =
  process.env.PHARMA_NEXT_DIST_DIR ?? `.next-web-dev-${process.pid}`;
delete process.env.TURBOPACK;

const { default: next } = await import('next');

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const hostname = process.env.HOST ?? '0.0.0.0';

function getLanAddress() {
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return '127.0.0.1';
}

// Do not pin hostname to one LAN IP — breaks JS/assets when opened via another IP.
const app = next({
  dev: true,
  webpack: true,
  dir: process.cwd(),
  port,
});

const handle = app.getRequestHandler();
let server;

async function shutdown(signal) {
  if (!server) {
    return;
  }

  console.log(`${signal} received, shutting down web dev server`);

  await app.close();

  await new Promise((resolve) => {
    server.close(() => resolve());
  });

  process.exit(0);
}

async function start() {
  await app.prepare();

  server = http.createServer((req, res) => {
    void handle(req, res);
  });

  server.listen(port, hostname, () => {
    const lanIp = getLanAddress();
    const devOrigins = getAllowedDevOrigins(String(port));
    console.log(`Pharma web dev server listening on http://localhost:${port}`);
    if (hostname === '0.0.0.0') {
      console.log(`Share on your network: http://${lanIp}:${port}`);
      console.log(`LAN dev origins (next.config allowedDevOrigins): ${devOrigins.join(', ')}`);
    }
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
