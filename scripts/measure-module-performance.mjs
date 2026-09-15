#!/usr/bin/env node
/**
 * Module performance benchmark.
 * Usage: node scripts/measure-module-performance.mjs [baseUrl]
 */
const baseUrl = (process.argv[2] || 'http://127.0.0.1:3000').replace(/\/$/, '');

const pages = [
  { module: 'Customers', route: '/modules/customers' },
  { module: 'Import Export', route: '/modules/administration/import-export' },
  { module: 'Dashboard', route: '/modules/dashboard' },
  { module: 'POS', route: '/modules/pos' },
  { module: 'New Sale', route: '/modules/pos/new-sale' },
];

const apis = [
  { name: 'Inventory Search', url: '/api/modules/inventory?search=para&limit=8' },
  { name: 'Import Products API', url: '/api/modules/import-export/products' },
  { name: 'Inventory Batches API', url: '/api/modules/inventory/batches' },
];

async function measurePage(route) {
  const start = performance.now();
  const response = await fetch(`${baseUrl}${route}`, {
    headers: { Accept: 'text/html' },
    redirect: 'follow',
  });
  await response.text();
  return {
    route,
    ms: Math.round(performance.now() - start),
    status: response.status,
    ok: response.ok,
  };
}

async function measureApi(path) {
  const start = performance.now();
  const response = await fetch(`${baseUrl}${path}`, { cache: 'no-store' });
  await response.text();
  return {
    path,
    ms: Math.round(performance.now() - start),
    status: response.status,
    ok: response.ok,
  };
}

async function measureSearchSamples() {
  const terms = ['para', 'amox', 'tab'];
  const samples = [];

  for (const term of terms) {
    const start = performance.now();
    const response = await fetch(
      `${baseUrl}/api/modules/inventory?search=${encodeURIComponent(term)}&limit=8`,
      { cache: 'no-store' },
    );
    await response.json();
    samples.push({
      term,
      ms: Math.round(performance.now() - start),
      ok: response.ok,
    });
  }

  const avg = Math.round(samples.reduce((sum, row) => sum + row.ms, 0) / samples.length);
  return { samples, avg };
}

async function main() {
  try {
    await fetch(baseUrl);
  } catch {
    console.error(`Server not reachable at ${baseUrl}`);
    process.exit(1);
  }

  console.log(`Performance report: ${baseUrl}\n`);

  console.log('PAGE LOAD TIMES');
  const pageResults = [];
  for (const page of pages) {
    const result = await measurePage(page.route);
    pageResults.push({ ...page, ...result });
    console.log(`${page.module.padEnd(16)} ${page.route.padEnd(42)} ${result.ok ? `${result.ms} ms` : `FAIL ${result.status}`}`);
  }

  console.log('\nAPI TIMES');
  const apiResults = [];
  for (const api of apis) {
    const result = await measureApi(api.url);
    apiResults.push({ ...api, ...result });
    console.log(`${api.name.padEnd(20)} ${api.url.padEnd(44)} ${result.ok ? `${result.ms} ms` : `FAIL ${result.status}`}`);
  }

  console.log('\nSEARCH TIMES (POS medicine search)');
  const search = await measureSearchSamples();
  for (const sample of search.samples) {
    console.log(`term "${sample.term}"`.padEnd(20), `${sample.ms} ms`);
  }
  console.log('Average search'.padEnd(20), `${search.avg} ms`);

  const pageAvg = Math.round(
    pageResults.filter((row) => row.ok).reduce((sum, row) => sum + row.ms, 0) /
      Math.max(1, pageResults.filter((row) => row.ok).length),
  );

  console.log('\nSUMMARY');
  console.log(`Pages tested: ${pageResults.length}`);
  console.log(`Average page load: ${pageAvg} ms`);
  console.log(`Average search API: ${search.avg} ms`);
}

main();
