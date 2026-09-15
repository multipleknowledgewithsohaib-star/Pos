import fs from 'node:fs';
import path from 'node:path';

const inventory = [
  {
    id: 1,
    sku: 'B-S 001',
    medicineName: 'BABY SPOON',
    genericName: 'Baby Spoon',
    category: 'Baby Care',
    unit: 'SINGLE PAC',
    stock: 1000,
    lowStock: 50,
    purchasePrice: 40,
    price: 50,
    description: 'Batch: B-S 001, Packing: SINGLE PAC',
    status: 'In Stock',
    active: true,
  },
  {
    id: 2,
    sku: 'B-C 001',
    medicineName: 'BABY COMF',
    genericName: 'Baby Comf',
    category: 'Baby Care',
    unit: 'SINGLE PAC',
    stock: 800,
    lowStock: 50,
    purchasePrice: 450,
    price: 531,
    description: 'Batch: B-C 001, Packing: SINGLE PAC',
    status: 'In Stock',
    active: true,
  },
];

const batches = [
  {
    medicineName: 'BABY SPOON',
    batchNo: 'B-S 001',
    mfgDate: '2026-01-01',
    expiryDate: '2028-12-31',
    purchasePrice: 40,
    stock: 1000,
    supplier: 'FnS & CO.',
    status: 'In Stock',
    tone: 'green',
  },
  {
    medicineName: 'BABY COMF',
    batchNo: 'B-C 001',
    mfgDate: '2026-01-01',
    expiryDate: '2028-12-31',
    purchasePrice: 450,
    stock: 800,
    supplier: 'FnS & CO.',
    status: 'In Stock',
    tone: 'green',
  },
];

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const files = fs.readdirSync(dataDir);
for (const file of files) {
  const filePath = path.join(dataDir, file);
  if (file.startsWith('module-inventory')) {
    fs.writeFileSync(filePath, JSON.stringify(inventory, null, 2) + '\n', 'utf8');
    console.log(`Updated ${file}`);
  }
  if (file.startsWith('module-batches')) {
    fs.writeFileSync(filePath, JSON.stringify(batches, null, 2) + '\n', 'utf8');
    console.log(`Updated ${file}`);
  }
}

// Write standard files if not present
fs.writeFileSync(path.join(dataDir, 'module-inventory.json'), JSON.stringify(inventory, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(dataDir, 'module-batches.json'), JSON.stringify(batches, null, 2) + '\n', 'utf8');

// Reset pharma-store.json if present to a tiny stub
const pharmaStorePath = path.join(dataDir, 'pharma-store.json');
if (fs.existsSync(pharmaStorePath)) {
  fs.writeFileSync(
    pharmaStorePath,
    JSON.stringify(
      {
        counters: { category: 2, supplier: 1, product: 2, batch: 2, stockMovement: 2 },
        categories: [{ id: 1, name: 'Baby Care' }],
        suppliers: [{ id: 1, name: 'FnS & CO.' }],
        products: inventory,
        batches: batches,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  console.log('Reset pharma-store.json');
}

console.log('Finished resetting data files!');
