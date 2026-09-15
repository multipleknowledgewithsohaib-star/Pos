#!/usr/bin/env node
/**
 * Fixes VPS upload mistake: entire project copied into app/app/
 * Run automatically via npm prebuild, or: node scripts/vps-fix-structure.mjs
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'app');
const nestedApp = path.join(appDir, 'app');

function hasRoutes(dir) {
  if (!existsSync(dir)) return false;
  return (
    existsSync(path.join(dir, 'modules')) ||
    existsSync(path.join(dir, '(console)')) ||
    existsSync(path.join(dir, 'layout.tsx')) ||
    existsSync(path.join(dir, 'page.tsx'))
  );
}

function moveNestedAppUp() {
  console.log('Moving app/app/* up to app/ (wrong upload layout)...');

  for (const entry of readdirSync(nestedApp)) {
    const source = path.join(nestedApp, entry);
    const target = path.join(appDir, entry);

    if (existsSync(target)) {
      console.log('Skipping (already exists):', `app/${entry}`);
      continue;
    }

    renameSync(source, target);
    console.log('Moved:', `app/app/${entry} -> app/${entry}`);
  }

  if (existsSync(nestedApp)) {
    const left = readdirSync(nestedApp);
    if (left.length === 0) {
      rmSync(nestedApp, { recursive: true, force: true });
    } else {
      console.log('REMOVING leftover duplicate folder: app/app/');
      rmSync(nestedApp, { recursive: true, force: true });
    }
  }
}

function cleanBuildArtifacts() {
  const cleanupTargets = [
    '.next',
    '.next-build',
    '.next-prod',
    'tsconfig.tsbuildinfo',
  ];

  for (const entry of cleanupTargets) {
    const target = path.join(root, entry);
    if (!existsSync(target)) continue;
    rmSync(target, { recursive: true, force: true });
    console.log('Removed build artifact:', entry);
  }

  for (const entry of readdirSync(root)) {
    if (!entry.startsWith('.next-web-dev-')) continue;
    const target = path.join(root, entry);
    if (!existsSync(target)) continue;
    rmSync(target, { recursive: true, force: true });
    console.log('Removed build artifact:', entry);
  }
}

function fixNestedAppFolder() {
  if (!existsSync(nestedApp)) return false;

  const topLevelRoutes = hasRoutes(appDir);
  const nestedRoutes = hasRoutes(nestedApp);

  if (topLevelRoutes) {
    console.log('REMOVING duplicate folder: app/app/');
    rmSync(nestedApp, { recursive: true, force: true });
    return true;
  }

  if (nestedRoutes) {
    moveNestedAppUp();
    return true;
  }

  console.log('REMOVING unknown nested folder: app/app/');
  rmSync(nestedApp, { recursive: true, force: true });
  return true;
}

const aliasPages = {
  'app/2fa/page.tsx': `import { redirect } from 'next/navigation';

export default function TwoFactorAliasPage() {
  redirect('/modules/two-factor');
}
`,
  'app/email-verification/page.tsx': `import { redirect } from 'next/navigation';

export default function EmailVerificationAliasPage() {
  redirect('/modules/verify-email');
}
`,
};

const brokenImportPatterns = ['../two-factor/page', '../verify-email/page', '../email-verification/page'];

function fileHasBrokenImport(filePath) {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, 'utf8');
  return brokenImportPatterns.some((pattern) => content.includes(pattern));
}

console.log('=== VPS structure check ===');
console.log('Project:', root);

if (!existsSync(path.join(root, 'package.json'))) {
  console.error('ERROR: package.json not found. cd to /var/www/main');
  process.exit(1);
}

let changed = fixNestedAppFolder();

for (const [relativePath, content] of Object.entries(aliasPages)) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) continue;

  if (fileHasBrokenImport(fullPath)) {
    console.log('FIXING', relativePath);
    writeFileSync(fullPath, content, 'utf8');
    changed = true;
  }
}

if (existsSync(nestedApp)) {
  console.error('');
  console.error('FATAL: app/app/ still exists.');
  console.error('Run on VPS:  cd /var/www/main && rm -rf app/app');
  console.error('Then check:  ls app/modules  and  ls "app/(console)"');
  process.exit(1);
}

if (!existsSync(path.join(appDir, 'modules')) && !existsSync(path.join(appDir, '(console)'))) {
  console.error('');
  console.error('FATAL: app/modules and app/(console) missing.');
  console.error('Re-upload the full project from your PC to /var/www/main');
  process.exit(1);
}

if (changed) {
  console.log('Structure fixed.');
} else {
  console.log('Structure OK.');
}

cleanBuildArtifacts();
