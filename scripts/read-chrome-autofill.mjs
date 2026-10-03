import { DatabaseSync } from 'node:sqlite';

try {
  const db = new DatabaseSync('scratch_web_data.db', { readOnly: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Available tables:', tables.map(t => t.name));

  if (tables.some(t => t.name === 'autofill')) {
    const rows = db.prepare('SELECT name, value, count, date_created FROM autofill ORDER BY date_created DESC LIMIT 200').all();
    console.log(`Found ${rows.length} autofill rows:`);
    for (const row of rows) {
      console.log(`[${row.name}] => ${row.value} (used ${row.count} times)`);
    }
  }
} catch (e) {
  console.error('Error reading Chrome data:', e);
}
