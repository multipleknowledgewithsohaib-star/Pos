import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await import('./print-lan-url.mjs');

const sharedEnv = {
  ...process.env,
  HOST: '0.0.0.0',
  CORS_ORIGIN: '*',
};

const api = spawn('node', ['--watch', '--env-file=.env', 'src/server.js'], {
  cwd: root,
  env: sharedEnv,
  stdio: 'inherit',
  shell: true,
});

const web = spawn('node', ['src/web-dev-server.js'], {
  cwd: root,
  env: sharedEnv,
  stdio: 'inherit',
  shell: true,
});

function shutdown() {
  api.kill('SIGTERM');
  web.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

api.on('exit', (code) => {
  if (code && code !== 0) {
    shutdown();
  }
});

web.on('exit', (code) => {
  if (code && code !== 0) {
    shutdown();
  }
});
