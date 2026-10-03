import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('scratch_history.db', { readOnly: true });

// Search for any URLs or titles containing rayyantraders or fizup or beverage or drink
const rows = db.prepare(`
  SELECT url, title, visit_count
  FROM urls
  WHERE url LIKE '%rayyantraders%' OR title LIKE '%fizup%' OR title LIKE '%Beverage%' OR title LIKE '%Rayyan%'
  LIMIT 100
`).all();

console.log(`Found ${rows.length} relevant history URLs:`);
for (const r of rows) {
  console.log(`- [${r.title}] ${r.url}`);
}
