import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, type AuthSession } from './auth-session';
import { moduleBatchRows, moduleBatchSummary } from './module-data';

const LOW_STOCK_THRESHOLD = 20;

const DEMO_EMAILS = [
  'admin@coresaas.com',
  'manager@coresaas.com',
  'salesman@coresaas.com',
  'inventory@coresaas.com',
  'customer@pharmacy.com',
];

async function getBatchFilepathAndEmail(): Promise<{ filepath: string; email: string }> {
  let email = '';
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (cookie?.value) {
      const parsed = JSON.parse(decodeURIComponent(cookie.value)) as AuthSession;
      email = parsed.email || '';
    }
  } catch {
    // Ignore error (e.g. outside request context/build time)
  }

  const slug = email ? email.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '';
  const filepath = path.join(process.cwd(), 'data', slug ? `module-batches-${slug}.json` : 'module-batches.json');
  return { filepath, email };
}

async function getInitialBatchRows(email: string): Promise<BatchRecord[]> {
  if (!email) return seedBatchRows();
  const isDemo = DEMO_EMAILS.includes(email.trim().toLowerCase());
  return isDemo ? seedBatchRows() : [];
}

export type BatchRecord = {
  medicineName?: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  purchasePrice: number;
  stock: number;
  supplier?: string;
  status: 'In Stock' | 'Low Stock';
  tone: 'green' | 'orange';
};

export type BatchSnapshot = {
  medicineName: string;
  unit: string;
  lowStockAlert: number;
  totalStock: number;
  rows: BatchRecord[];
};

export async function readBatchSnapshot(): Promise<BatchSnapshot> {
  const rows = await readBatchRows();

  return {
    medicineName: rows.length ? 'All Medicines' : moduleBatchSummary.medicineName,
    unit: moduleBatchSummary.unit,
    lowStockAlert: LOW_STOCK_THRESHOLD,
    totalStock: rows.reduce((sum, row) => sum + row.stock, 0),
    rows,
  };
}

export async function readBatchByNo(batchNo: string) {
  const rows = await readBatchRows();
  return rows.find((row) => row.batchNo === batchNo);
}

export async function addBatch(payload: Record<string, unknown>) {
  const rows = await readBatchRows();
  const batchNo = textValue(payload.batchNo, '');

  if (!batchNo) {
    return null;
  }

  const existingIndex = rows.findIndex((row) => row.batchNo === batchNo);
  if (existingIndex >= 0) {
    const current = rows[existingIndex];
    const merged = normalizeBatch({
      medicineName: textValue(payload.medicineName, current.medicineName ?? ''),
      batchNo: current.batchNo,
      mfgDate: textValue(payload.mfgDate, current.mfgDate),
      expiryDate: textValue(payload.expiryDate, current.expiryDate),
      purchasePrice: numberValue(payload.purchasePrice, current.purchasePrice),
      stock: current.stock + Math.max(0, numberValue(payload.quantity ?? payload.stock, 0)),
      supplier: textValue(payload.supplier, current.supplier ?? ''),
    });

    rows[existingIndex] = merged;
    await writeBatchRows(rows);
    return merged;
  }

  const batch = normalizeBatch({
    medicineName: textValue(payload.medicineName, ''),
    batchNo,
    mfgDate: textValue(payload.mfgDate, ''),
    expiryDate: textValue(payload.expiryDate, ''),
    purchasePrice: numberValue(payload.purchasePrice, 0),
    stock: numberValue(payload.quantity ?? payload.stock, 0),
    supplier: textValue(payload.supplier, ''),
  });

  rows.push(batch);
  await writeBatchRows(rows);
  return batch;
}

export async function updateBatch(batchNo: string, payload: Record<string, unknown>) {
  const rows = await readBatchRows();
  const index = rows.findIndex((row) => row.batchNo === batchNo);

  if (index < 0) {
    return null;
  }

  const current = rows[index];
  const updated = normalizeBatch({
    medicineName: textValue(payload.medicineName, current.medicineName ?? ''),
    batchNo: current.batchNo,
    mfgDate: textValue(payload.mfgDate, current.mfgDate),
    expiryDate: textValue(payload.expiryDate, current.expiryDate),
    purchasePrice: numberValue(payload.purchasePrice, current.purchasePrice),
    stock: numberValue(payload.quantity ?? payload.stock, current.stock),
    supplier: textValue(payload.supplier, current.supplier ?? ''),
  });

  rows[index] = updated;
  await writeBatchRows(rows);
  return updated;
}

export async function deleteBatch(batchNo: string) {
  const rows = await readBatchRows();
  const filtered = rows.filter((row) => row.batchNo !== batchNo);

  if (filtered.length === rows.length) {
    return null;
  }

  await writeBatchRows(filtered);
  return true;
}

let cachedBatchRows: Record<string, BatchRecord[]> = {};

async function readBatchRows(): Promise<BatchRecord[]> {
  const { filepath, email } = await getBatchFilepathAndEmail();
  if (cachedBatchRows[filepath]) {
    return cachedBatchRows[filepath];
  }
  const initial = await getInitialBatchRows(email);
  try {
    const raw = await readFile(filepath, 'utf8');
    const parsed = JSON.parse(raw);
    cachedBatchRows[filepath] = Array.isArray(parsed) ? parsed.map(normalizePersistedBatch) : initial;
    return cachedBatchRows[filepath];
  } catch {
    await writeBatchRows(initial);
    cachedBatchRows[filepath] = structuredClone(initial);
    return cachedBatchRows[filepath];
  }
}

async function writeBatchRows(rows: BatchRecord[]) {
  const { filepath } = await getBatchFilepathAndEmail();
  const normalized = rows.map(normalizePersistedBatch);
  cachedBatchRows[filepath] = normalized;
  await mkdir(path.dirname(filepath), { recursive: true });
  await writeFile(filepath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
}

function seedBatchRows(): BatchRecord[] {
  return moduleBatchRows.map((row) =>
    normalizeBatch({
      batchNo: row.batchNo,
      mfgDate: row.mfgDate,
      expiryDate: row.expiryDate,
      purchasePrice: Number(row.purchasePrice),
      stock: Number(row.stock),
      supplier: '',
    }),
  );
}

function normalizeBatch(value: {
  medicineName?: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  purchasePrice: number;
  stock: number;
  supplier?: string;
}): BatchRecord {
  const stock = Number(value.stock) || 0;
  const purchasePrice = Number(value.purchasePrice) || 0;
  const status = stock <= LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock';

  return {
    medicineName: value.medicineName?.trim() || '',
    batchNo: value.batchNo,
    mfgDate: value.mfgDate,
    expiryDate: value.expiryDate,
    purchasePrice,
    stock,
    supplier: value.supplier?.trim() || '',
    status,
    tone: status === 'Low Stock' ? 'orange' : 'green',
  };
}

function normalizePersistedBatch(value: BatchRecord): BatchRecord {
  return normalizeBatch({
    medicineName: textValue(value.medicineName, ''),
    batchNo: textValue(value.batchNo, 'BATCH-000'),
    mfgDate: textValue(value.mfgDate, ''),
    expiryDate: textValue(value.expiryDate, ''),
    purchasePrice: numberValue(value.purchasePrice, 0),
    stock: numberValue(value.stock, 0),
    supplier: textValue(value.supplier, ''),
  });
}

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
