import os from 'node:os';

/** Hostnames allowed to load Next.js dev assets when opening the app via LAN IP on a phone. */
export function getAllowedDevOrigins(port = process.env.PORT ?? '3000') {
  const origins = new Set([
    'localhost',
    `localhost:${port}`,
    '127.0.0.1',
    `127.0.0.1:${port}`,
  ]);

  const fromEnv = process.env.PHARMA_ALLOWED_DEV_ORIGINS;
  if (fromEnv) {
    for (const part of fromEnv.split(',')) {
      const trimmed = part.trim();
      if (trimmed) {
        origins.add(trimmed);
      }
    }
  }

  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        origins.add(entry.address);
        origins.add(`${entry.address}:${port}`);
      }
    }
  }

  return [...origins];
}
