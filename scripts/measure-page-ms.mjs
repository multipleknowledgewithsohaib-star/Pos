#!/usr/bin/env node
/**
 * Measure server response time (ms) for each static page route.
 * Usage: node scripts/measure-page-ms.mjs [baseUrl]
 */
const baseUrl = (process.argv[2] || 'http://127.0.0.1:3099').replace(/\/$/, '');

const staticRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/2fa',
  '/two-factor',
  '/verify-email',
  '/email-verification',
  '/admin',
  '/dashboard',
  '/settings',
  '/settings/plan',
  '/settings/roles',
  '/settings/security',
  '/settings/payment',
  '/settings/notifications',
  '/settings/inventory',
  '/users',
  '/users/new',
  '/roles',
  '/roles/new',
  '/clients',
  '/clients/new',
  '/branches',
  '/branches/new',
  '/reports',
  '/reports/sales',
  '/reports/purchase',
  '/reports/inventory',
  '/reports/profit-loss',
  '/reports/expiry',
  '/reports/stock-valuation',
  '/reports/customer',
  '/reports/supplier',
  '/reports/tax',
  '/backup-restore',
  '/backup-restore/list',
  '/backup-restore/create',
  '/backup-restore/restore',
  '/backup-restore/schedule',
  '/backup-restore/settings',
  '/backup-restore/activity',
  '/backup-restore/quick-actions',
  '/modules',
  '/modules/login',
  '/modules/signup',
  '/modules/dashboard',
  '/modules/pos',
  '/modules/pos/new-sale',
  '/modules/pos/payment',
  '/modules/pos/sales-history',
  '/modules/pos/settings',
  '/modules/pos/quick-actions',
  '/modules/pos/hold-sale',
  '/modules/pos/barcode-scanner',
  '/modules/pos/customer-selection',
  '/modules/pos/discount-tax',
  '/modules/pos/invoice-preview',
  '/modules/purchases',
  '/modules/purchases/list',
  '/modules/purchases/new',
  '/modules/purchases/receive',
  '/modules/purchases/returns',
  '/modules/purchases/suppliers',
  '/modules/purchases/expenses',
  '/modules/purchases/ocr',
  '/modules/purchases/quick-actions',
  '/modules/inventory',
  '/modules/inventory/new',
  '/modules/inventory/history',
  '/modules/inventory/adjustment',
  '/modules/inventory/transfer',
  '/modules/inventory/low-stock',
  '/modules/inventory/expiring-soon',
  '/modules/inventory/medicines',
  '/modules/inventory/batch/new',
  '/modules/inventory/batch-details',
  '/modules/customers',
  '/modules/reports',
  '/modules/reports/sales',
  '/modules/reports/purchase',
  '/modules/reports/inventory',
  '/modules/settings',
  '/modules/settings/roles',
  '/modules/settings/security',
  '/modules/settings/payment',
  '/modules/settings/notifications',
  '/modules/settings/inventory',
  '/modules/backup-restore',
  '/modules/backup-restore/list',
  '/modules/backup-restore/create',
  '/modules/administration/import-export',
  '/modules/two-factor',
  '/modules/verify-email',
  '/modules/forgot-password',
  '/modules/reset-password',
  '/modules/2fa',
  '/modules/email-verification',
];

async function measureRoute(route) {
  const url = `${baseUrl}${route}`;
  const start = performance.now();

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { Accept: 'text/html' },
    });
    const body = await response.text();
    const ms = Math.round(performance.now() - start);

    return {
      route,
      ms,
      status: response.status,
      ok: response.ok,
      sizeKb: Math.round((body.length / 1024) * 10) / 10,
    };
  } catch (error) {
    return {
      route,
      ms: Math.round(performance.now() - start),
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  try {
    await fetch(baseUrl);
  } catch {
    console.error(`Server not reachable at ${baseUrl}`);
    console.error('Start first: npx next start --port 3099');
    process.exit(1);
  }

  console.log(`Measuring page response times from ${baseUrl}\n`);

  const results = [];
  for (const route of staticRoutes) {
    const result = await measureRoute(route);
    results.push(result);
    const label = result.ok ? `${result.ms} ms` : `FAIL (${result.error || result.status})`;
    console.log(`${route.padEnd(48)} ${label}`);
  }

  const okResults = results.filter((r) => r.ok);
  const avg = okResults.length
    ? Math.round(okResults.reduce((sum, r) => sum + r.ms, 0) / okResults.length)
    : 0;
  const min = okResults.length ? Math.min(...okResults.map((r) => r.ms)) : 0;
  const max = okResults.length ? Math.max(...okResults.map((r) => r.ms)) : 0;

  console.log('\n=== Summary ===');
  console.log(`Pages tested: ${results.length}`);
  console.log(`Successful:   ${okResults.length}`);
  console.log(`Average:      ${avg} ms`);
  console.log(`Fastest:      ${min} ms`);
  console.log(`Slowest:      ${max} ms`);
}

main();
