import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildDemoMedicines,
  buildInventoryStoreSeed,
  DEMO_COUNTS,
  DEMO_INVENTORY_COUNTS,
  DEMO_MILESTONE_TARGETS,
} from '../lib/demo-seed.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventoryPath = path.join(rootDir, 'data', 'module-inventory.json');
const storePath = path.join(rootDir, 'data', 'pharma-store.json');

const medicines = buildDemoMedicines();
const storeState = buildInventoryStoreSeed();

await mkdir(path.dirname(inventoryPath), { recursive: true });
await writeFile(inventoryPath, `${JSON.stringify(medicines, null, 2)}\n`, 'utf8');
await writeFile(storePath, `${JSON.stringify(storeState, null, 2)}\n`, 'utf8');

const validProducts = DEMO_COUNTS.products - DEMO_COUNTS.wrongProducts;
const wrongPct = ((DEMO_COUNTS.wrongProducts / DEMO_COUNTS.products) * 100).toFixed(1);

console.log(`Wrote ${medicines.length} medicines to ${inventoryPath}`);
console.log(`  valid: ${validProducts}, wrong: ${DEMO_COUNTS.wrongProducts} (${wrongPct}%)`);
console.log(`Wrote ${storeState.stockMovements.length} stock records to ${storePath}`);
console.log(
  `  valid: ${DEMO_INVENTORY_COUNTS.stockEntries - DEMO_INVENTORY_COUNTS.wrongStockEntries}, wrong: ${DEMO_INVENTORY_COUNTS.wrongStockEntries}`,
);
console.log(
  `  next milestone: ${DEMO_MILESTONE_TARGETS.customers} customers, ${DEMO_MILESTONE_TARGETS.products} products, ${DEMO_MILESTONE_TARGETS.invoices} invoices`,
);
