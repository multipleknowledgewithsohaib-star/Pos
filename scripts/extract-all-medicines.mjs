import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('scratch_web_data.db', { readOnly: true });

// Query all autofill entries related to pharmacy / products
const rows = db.prepare(`
  SELECT name, value, count, date_created 
  FROM autofill 
  WHERE name IN ('medicineName', 'genericName', 'category', 'unit', 'stock', 'lowStock', 'purchasePrice', 'price', 'description', 'batchNo', 'mfgDate', 'expiryDate', 'barcode')
  ORDER BY date_created ASC
`).all();

console.log(`=== FOUND ${rows.length} MEDICINE / PRODUCT AUTOFILL ENTRIES ===\n`);

const medicines = [];
const genericNames = [];
const categories = [];
const descriptions = [];
const prices = [];
const stocks = [];

for (const r of rows) {
  console.log(`${r.name}: "${r.value}" (date: ${new Date(r.date_created * 1000).toISOString()})`);
}
