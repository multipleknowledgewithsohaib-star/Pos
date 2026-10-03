import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, type AuthSession } from './auth-session';
import type { PosSaleRecord } from './pos-state';

async function getSalesFilepathAndEmail(): Promise<{ filepath: string; email: string }> {
  let email = '';
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (cookie?.value) {
      const parsed = JSON.parse(decodeURIComponent(cookie.value)) as AuthSession;
      email = parsed.email || '';
    }
  } catch {}

  const slug = email ? email.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '';
  const filepath = path.join(process.cwd(), 'data', slug ? `module-pos-sales-${slug}.json` : 'module-pos-sales.json');
  return { filepath, email };
}

let cachedSales: Record<string, PosSaleRecord[]> = {};
let salesMutex = Promise.resolve();

export async function readSales(): Promise<PosSaleRecord[]> {
  const { filepath } = await getSalesFilepathAndEmail();
  try {
    const raw = await readFile(filepath, 'utf8');
    if (!raw.trim()) {
      if (cachedSales[filepath] && cachedSales[filepath].length > 0) {
        return cachedSales[filepath];
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedSales[filepath] = parsed;
      return parsed;
    }
    return [];
  } catch (err: unknown) {
    const isEnoent = (err as { code?: string })?.code === 'ENOENT';
    if (isEnoent) {
      cachedSales[filepath] = [];
      return [];
    }
    // Try reading backup
    try {
      const backupRaw = await readFile(`${filepath}.backup`, 'utf8');
      const backupParsed = JSON.parse(backupRaw);
      if (Array.isArray(backupParsed)) {
        cachedSales[filepath] = backupParsed;
        return backupParsed;
      }
    } catch {}

    return cachedSales[filepath] ?? [];
  }
}

export async function writeSales(sales: PosSaleRecord[]): Promise<void> {
  const { filepath } = await getSalesFilepathAndEmail();
  cachedSales[filepath] = sales;

  salesMutex = salesMutex.then(async () => {
    try {
      await mkdir(path.dirname(filepath), { recursive: true });
      const tempPath = `${filepath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
      const payload = `${JSON.stringify(sales, null, 2)}\n`;

      await writeFile(tempPath, payload, 'utf8');
      await rename(tempPath, filepath);

      if (sales.length > 0) {
        await writeFile(`${filepath}.backup`, payload, 'utf8').catch(() => {});
      }
    } catch (err) {
      console.error(`[CRITICAL] Error writing sales to ${filepath}:`, err);
    }
  });

  await salesMutex;
}

export async function addSale(sale: PosSaleRecord): Promise<PosSaleRecord> {
  const currentSales = await readSales();
  // Check if invoice already exists
  const existingIdx = currentSales.findIndex((s) => s.invoice === sale.invoice);
  if (existingIdx >= 0) {
    currentSales[existingIdx] = sale;
  } else {
    currentSales.unshift(sale); // newest first
  }
  await writeSales(currentSales);
  return sale;
}

export async function addSales(newSales: PosSaleRecord[]): Promise<PosSaleRecord[]> {
  if (!Array.isArray(newSales) || newSales.length === 0) {
    return readSales();
  }
  const currentSales = await readSales();
  const invoiceMap = new Map<string, PosSaleRecord>();
  // Put existing sales first
  for (const s of currentSales) {
    if (s && s.invoice) {
      invoiceMap.set(s.invoice, s);
    }
  }
  // Overlay new sales
  for (const s of newSales) {
    if (s && s.invoice) {
      invoiceMap.set(s.invoice, s);
    }
  }
  const merged = Array.from(invoiceMap.values());
  await writeSales(merged);
  return merged;
}

