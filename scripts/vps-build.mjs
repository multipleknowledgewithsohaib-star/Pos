#!/usr/bin/env node
/**
 * VPS production build helper.
 * Run from project root: node scripts/vps-build.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production' },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(path.join(root, 'package.json'))) {
  console.error('ERROR: package.json not found. Run this inside the Pharma project folder.');
  console.error('Expected path like: /var/www/main/package.json');
  process.exit(1);
}

console.log('=== Pharma VPS build ===');
console.log('Project:', root);

run('node', ['scripts/vps-fix-structure.mjs']);
run('npm', ['ci']);
run('npm', ['run', 'db:generate']);
run('npm', ['run', 'build']);

console.log('');
console.log('Build complete. Start with:');
console.log('  pm2 start ecosystem.config.cjs');
console.log('  pm2 save');
