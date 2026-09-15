import os from 'node:os';
import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';

const port = Number.parseInt(process.env.PORT ?? '4000', 10);
const host = process.env.HOST ?? '0.0.0.0';
const app = createApp();

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

const server = app.listen(port, host, () => {
  console.log(`Pharma API listening on http://localhost:${port}`);
  if (host === '0.0.0.0') {
    console.log(`API on your network: http://${getLanAddress()}:${port}`);
  }
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  // Stop acc
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } finally {
      process.exit(0);
    }
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGETERM', () => {
  void shutdown()
})