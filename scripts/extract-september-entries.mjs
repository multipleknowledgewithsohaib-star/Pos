import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('scratch_web_data.db', { readOnly: true });

// Get all entries created in September 2026 (timestamp >= 1788220800, i.e. Sept 1, 2026)
const sepTimestamp = Math.floor(new Date('2026-09-01T00:00:00Z').getTime() / 1000);

const rows = db.prepare(`
  SELECT name, value, count, date_created 
  FROM autofill 
  WHERE date_created >= ?
  ORDER BY date_created ASC
`).all(sepTimestamp);

console.log(`=== FOUND ${rows.length} AUTOFILL ENTRIES IN SEPTEMBER 2026 ===\n`);
for (const r of rows) {
  console.log(`[${r.name}] => "${r.value}" (${new Date(r.date_created * 1000).toISOString()})`);
}
