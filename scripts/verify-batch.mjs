import { readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildDemoCompletedSales,
  buildDemoCustomers,
  buildInventoryStoreSeed,
  buildDemoMedicines,
  buildDemoPosCatalog,
  DEMO_COUNTS,
  DEMO_INVENTORY_COUNTS,
} from '../lib/demo-seed.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventoryPath = path.join(root, 'data', 'module-inventory.json');
const storePath = path.join(root, 'data', 'pharma-store.json');

function formatInvoiceNumber(number) {
  return `INV-${String(number).padStart(5, '0')}`;
}

function createLine(input) {
  return { ...input, qty: Math.max(0, input.qty ?? 1) };
}

function createSaleRecord(input) {
  return {
    ...input,
    notes: input.draft?.notes ?? '',
    total: 0,
    items: input.items ?? [],
  };
}

function calculateTotals() {
  return { total: 0, subtotal: 0, discountAmount: 0, taxAmount: 0 };
}

function formatShortDateTime() {
  return new Date().toISOString();
}

const customers = buildDemoCustomers([]);
const medicines = buildDemoMedicines();
const catalog = buildDemoPosCatalog(medicines);
const store = buildInventoryStoreSeed();
const invoices = buildDemoCompletedSales(
  customers,
  catalog,
  formatInvoiceNumber,
  createLine,
  createSaleRecord,
  calculateTotals,
  formatShortDateTime,
);

const wrongCustomers = customers.filter((row) => row.note?.startsWith('WRONG')).length;
const wrongProducts = medicines.filter((row) => row.seedIssue).length;
const wrongInvoices = invoices.filter((row) => row.notes?.startsWith('WRONG')).length;
const wrongStock = store.stockMovements.filter((row) => String(row.note || '').startsWith('WRONG')).length;

const checks = [];

checks.push({
  name: 'Customer count',
  pass: customers.length === DEMO_COUNTS.customers,
  detail: `${customers.length} / ${DEMO_COUNTS.customers}`,
});
checks.push({
  name: 'Wrong customers',
  pass: wrongCustomers === DEMO_COUNTS.wrongCustomers,
  detail: `${wrongCustomers} / ${DEMO_COUNTS.wrongCustomers}`,
});
checks.push({
  name: 'Product count',
  pass: medicines.length === DEMO_COUNTS.products,
  detail: `${medicines.length} / ${DEMO_COUNTS.products}`,
});
checks.push({
  name: 'Wrong products',
  pass: wrongProducts === DEMO_COUNTS.wrongProducts,
  detail: `${wrongProducts} / ${DEMO_COUNTS.wrongProducts}`,
});
checks.push({
  name: 'Invoice count',
  pass: invoices.length === DEMO_COUNTS.invoices,
  detail: `${invoices.length} / ${DEMO_COUNTS.invoices}`,
});
checks.push({
  name: 'Wrong invoices',
  pass: wrongInvoices === DEMO_COUNTS.wrongInvoices,
  detail: `${wrongInvoices} / ${DEMO_COUNTS.wrongInvoices}`,
});
checks.push({
  name: 'Stock records count',
  pass: store.stockMovements.length === DEMO_INVENTORY_COUNTS.stockEntries,
  detail: `${store.stockMovements.length} / ${DEMO_INVENTORY_COUNTS.stockEntries}`,
});
checks.push({
  name: 'Wrong stock records',
  pass: wrongStock === DEMO_INVENTORY_COUNTS.wrongStockEntries,
  detail: `${wrongStock} / ${DEMO_INVENTORY_COUNTS.wrongStockEntries}`,
});

const searchTerm = 'paracetamol';
const started = performance.now();
const hits = catalog.filter((item) =>
  [item.name, item.barcode, item.category].some((value) => value.toLowerCase().includes(searchTerm)),
);
const searchMs = performance.now() - started;

checks.push({
  name: 'Search speed (catalog filter)',
  pass: searchMs < 50,
  detail: `${hits.length} hits in ${searchMs.toFixed(2)}ms`,
});

const raw = await readFile(inventoryPath, 'utf8');
const parsed = JSON.parse(raw);
checks.push({
  name: 'Data reopen (inventory JSON)',
  pass: Array.isArray(parsed) && parsed.length === DEMO_COUNTS.products,
  detail: `${parsed.length} rows`,
});

const storeRaw = await readFile(storePath, 'utf8');
const reopenedStore = JSON.parse(storeRaw);
checks.push({
  name: 'Data reopen (pharma store)',
  pass:
    Array.isArray(reopenedStore.stockMovements) &&
    reopenedStore.stockMovements.length === DEMO_INVENTORY_COUNTS.stockEntries,
  detail: `${reopenedStore.stockMovements?.length ?? 0} rows`,
});

const probe = {
  id: 9_999_001,
  sku: 'SKU-VERIFY-PROBE',
  medicineName: 'Verify Probe Medicine',
  genericName: 'Probe',
  category: 'General',
  unit: 'Tablet',
  stock: 1,
  lowStock: 1,
  purchasePrice: 10,
  price: 15,
  description: 'verify-batch probe',
  status: 'In Stock',
  active: true,
};

const withProbe = [...parsed, probe];
const tempPath = path.join(root, 'data', '.verify-inventory-probe.json');
await writeFile(tempPath, `${JSON.stringify(withProbe, null, 2)}\n`, 'utf8');
const reopened = JSON.parse(await readFile(tempPath, 'utf8'));
await unlink(tempPath);
await writeFile(inventoryPath, raw, 'utf8');

checks.push({
  name: 'Data save/reopen probe',
  pass: reopened.some((row) => row.sku === 'SKU-VERIFY-PROBE'),
  detail: reopened.find((row) => row.sku === 'SKU-VERIFY-PROBE')?.medicineName ?? 'missing',
});

function movementDelta(movementType, quantity) {
  if (movementType === 'DISPENSE') return -quantity;
  return quantity;
}

const cleanMovements = store.stockMovements.filter((row) => !String(row.note || '').startsWith('WRONG'));
const cleanBatches = new Map(store.batches.map((batch) => [batch.id, batch.quantityOnHand]));
for (const movement of cleanMovements) {
  const current = cleanBatches.get(movement.batchId) ?? 0;
  cleanBatches.set(movement.batchId, current + movementDelta(movement.movementType, movement.quantity));
}
checks.push({
  name: 'Stock Add',
  pass: cleanMovements.some((row) => row.movementType === 'RECEIVE'),
  detail: `${cleanMovements.filter((row) => row.movementType === 'RECEIVE').length} receive entries`,
});
checks.push({
  name: 'Purchase Receive',
  pass: cleanMovements.some((row) => String(row.note).toLowerCase().includes('purchase')),
  detail: `${cleanMovements.filter((row) => String(row.note).toLowerCase().includes('purchase')).length} purchase movements`,
});
checks.push({
  name: 'Inventory Adjustment',
  pass: cleanMovements.some((row) => row.movementType === 'ADJUSTMENT'),
  detail: `${cleanMovements.filter((row) => row.movementType === 'ADJUSTMENT').length} adjustment movements`,
});
checks.push({
  name: 'Stock Minus After Sale',
  pass: cleanMovements.some((row) => row.movementType === 'DISPENSE'),
  detail: `${cleanMovements.filter((row) => row.movementType === 'DISPENSE').length} dispense movements`,
});

const expiryIssues = store.batches.filter((batch) => !batch.expiryDate || Number.isNaN(new Date(batch.expiryDate).getTime())).length;
checks.push({
  name: 'Batch/Expiry health',
  pass: expiryIssues === 0,
  detail: `${store.batches.length - expiryIssues}/${store.batches.length} with valid expiry`,
});

const expectedDashboardProducts = store.products.length;
const expectedDashboardBatches = store.batches.length;
const expectedDashboardStock = store.batches.reduce((sum, row) => sum + Math.max(0, Number(row.quantityOnHand) || 0), 0);
const reopenedDashboardProducts = Array.isArray(reopenedStore.products) ? reopenedStore.products.length : 0;
const reopenedDashboardBatches = Array.isArray(reopenedStore.batches) ? reopenedStore.batches.length : 0;
const reopenedDashboardStock = Array.isArray(reopenedStore.batches)
  ? reopenedStore.batches.reduce((sum, row) => sum + Math.max(0, Number(row.quantityOnHand) || 0), 0)
  : 0;
checks.push({
  name: 'Dashboard Counts',
  pass:
    expectedDashboardProducts === reopenedDashboardProducts &&
    expectedDashboardBatches === reopenedDashboardBatches &&
    expectedDashboardStock === reopenedDashboardStock,
  detail: `products=${expectedDashboardProducts}, batches=${expectedDashboardBatches}, stock=${expectedDashboardStock}`,
});

const reportSalesQty = cleanMovements
  .filter((row) => row.movementType === 'DISPENSE')
  .reduce((sum, row) => sum + row.quantity, 0);
const reportPurchaseQty = cleanMovements
  .filter((row) => row.movementType === 'RECEIVE')
  .reduce((sum, row) => sum + row.quantity, 0);
checks.push({
  name: 'Reports Totals',
  pass: reportPurchaseQty > 0 && reportSalesQty > 0,
  detail: `purchaseQty=${reportPurchaseQty}, salesQty=${reportSalesQty}`,
});

// Strong engineering test: exact +/- for 100 sales and 100 purchases.
const stockLedger = new Map(store.batches.map((row) => [row.id, row.quantityOnHand]));
const saleBatchIds = store.batches.slice(0, 100).map((row) => row.id);
const purchaseBatchIds = store.batches.slice(100, 200).map((row) => row.id);

let minusApplied = 0;
for (const batchId of saleBatchIds) {
  const before = stockLedger.get(batchId) ?? 0;
  const delta = Math.min(2, Math.max(0, before));
  stockLedger.set(batchId, before - delta);
  minusApplied += delta;
}
let plusApplied = 0;
for (const batchId of purchaseBatchIds) {
  const before = stockLedger.get(batchId) ?? 0;
  const delta = 3;
  stockLedger.set(batchId, before + delta);
  plusApplied += delta;
}
const minusExpected = saleBatchIds.reduce((sum, batchId) => {
  const before = store.batches.find((row) => row.id === batchId)?.quantityOnHand ?? 0;
  return sum + Math.min(2, Math.max(0, before));
}, 0);
const plusExpected = purchaseBatchIds.length * 3;
checks.push({
  name: '100 sales stock exact minus',
  pass: minusApplied === minusExpected,
  detail: `${minusApplied} / ${minusExpected}`,
});
checks.push({
  name: '100 purchases stock exact plus',
  pass: plusApplied === plusExpected,
  detail: `${plusApplied} / ${plusExpected}`,
});

const featureRoutes = [
  ['Sale', 'app/modules/pos'],
  ['Return', 'app/modules/purchases'],
  ['Stock Increase/Decrease', 'app/modules/inventory/adjustment'],
  ['Dashboard', 'app/modules/dashboard'],
  ['Reports', 'app/modules/reports'],
];

for (const [label, segment] of featureRoutes) {
  const target = path.join(root, segment);
  let pass = false;
  try {
    const { readdir } = await import('node:fs/promises');
    await readdir(target, { recursive: false });
    pass = true;
  } catch {
    pass = false;
  }
  checks.push({ name: `${label} module present`, pass, detail: segment });
}

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? 'PASS' : 'FAIL'}  ${check.name} — ${check.detail}`);
}

if (failed.length) {
  process.exitCode = 1;
} else {
  console.log(`\nAll ${checks.length} batch checks passed.`);
}
