import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, type AuthSession } from './auth-session';
import { initialMedicines, type Medicine } from './module-data';

const DEMO_EMAILS = [
  'admin@coresaas.com',
  'manager@coresaas.com',
  'salesman@coresaas.com',
  'inventory@coresaas.com',
  'customer@pharmacy.com',
];

async function getInventoryFilepathAndEmail(): Promise<{ filepath: string; email: string }> {
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
  const filepath = path.join(process.cwd(), 'data', slug ? `module-inventory-${slug}.json` : 'module-inventory.json');
  return { filepath, email };
}

async function getInitialMedicines(email: string): Promise<Medicine[]> {
  if (!email) return initialMedicines;
  const isDemo = DEMO_EMAILS.includes(email.trim().toLowerCase());
  return isDemo ? initialMedicines : [];
}

let cachedMedicines: Record<string, Medicine[]> = {};
let fileMutex = Promise.resolve();

export async function readMedicines(): Promise<Medicine[]> {
  const { filepath, email } = await getInventoryFilepathAndEmail();
  const initial = await getInitialMedicines(email);

  try {
    const raw = await readFile(filepath, 'utf8');
    if (!raw.trim()) {
      // If file is temporarily empty, return cache rather than overwriting
      if (cachedMedicines[filepath] && cachedMedicines[filepath].length > 0) {
        return cachedMedicines[filepath];
      }
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedMedicines[filepath] = parsed.map(normalizeMedicine);
      return cachedMedicines[filepath];
    }
    return initial;
  } catch (err: unknown) {
    const isEnoent = (err as { code?: string })?.code === 'ENOENT';
    if (isEnoent) {
      // File genuinely does not exist yet -> initialize
      await writeMedicines(initial);
      cachedMedicines[filepath] = structuredClone(initial);
      return cachedMedicines[filepath];
    }

    // Try reading backup file if main file was corrupted or in mid-write
    try {
      const backupRaw = await readFile(`${filepath}.backup`, 'utf8');
      const backupParsed = JSON.parse(backupRaw);
      if (Array.isArray(backupParsed) && backupParsed.length > 0) {
        cachedMedicines[filepath] = backupParsed.map(normalizeMedicine);
        // Restore main file from backup
        await writeMedicines(cachedMedicines[filepath]);
        return cachedMedicines[filepath];
      }
    } catch {
      // Backup read failed as well
    }

    // DO NOT wipe the file to [] on read/parse error!
    if (cachedMedicines[filepath] && cachedMedicines[filepath].length > 0) {
      return cachedMedicines[filepath];
    }
    return initial;
  }
}

export async function writeMedicines(medicines: Medicine[]): Promise<void> {
  const { filepath } = await getInventoryFilepathAndEmail();
  const normalized = medicines.map(normalizeMedicine);
  cachedMedicines[filepath] = normalized;

  // Queue write operations sequentially to prevent race conditions during concurrent sales
  fileMutex = fileMutex.then(async () => {
    try {
      await mkdir(path.dirname(filepath), { recursive: true });
      const tempPath = `${filepath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
      const payload = `${JSON.stringify(normalized, null, 2)}\n`;

      // 1. Atomic write via temp file + rename
      await writeFile(tempPath, payload, 'utf8');
      await rename(tempPath, filepath);

      // 2. Keep an automatic backup copy if we have products
      if (normalized.length > 0) {
        await writeFile(`${filepath}.backup`, payload, 'utf8').catch(() => {});
      }
    } catch (writeErr) {
      console.error(`[CRITICAL] writeMedicines error for ${filepath}:`, writeErr);
    }
  });

  await fileMutex;
}

export async function addMedicine(payload: Record<string, unknown>) {
  const medicines = await readMedicines();
  const stock = numberValue(payload.stock, 0);
  const lowStock = numberValue(payload.lowStock, 0);
  const medicine: Medicine = {
    id: medicines.reduce((max, item) => Math.max(max, item.id), 0) + 1,
    medicineName: textValue(payload.medicineName, 'New Medicine'),
    genericName: textValue(payload.genericName, ''),
    category: textValue(payload.category, 'General'),
    unit: textValue(payload.unit, 'Tablet'),
    stock,
    lowStock,
    purchasePrice: numberValue(payload.purchasePrice, 0),
    price: numberValue(payload.price, 0),
    description: textValue(payload.description, ''),
    status: resolveStatus(stock, lowStock),
    active: payload.active !== false,
  };

  medicines.push(medicine);
  await writeMedicines(medicines);
  return medicine;
}


export async function readMedicineById(id: number) {
  const medicines = await readMedicines();
  return medicines.find((medicine) => medicine.id === id);
}

export async function updateMedicine(id: number, payload: Record<string, unknown>) {
  const medicines = await readMedicines();
  const index = medicines.findIndex((medicine) => medicine.id === id);

  if (index < 0) {
    return null;
  }

  const current = medicines[index];
  const lowStock = numberValue(payload.lowStock, current.lowStock);
  const stock = Math.max(0, Math.floor(numberValue(payload.stock, current.stock)));
  const updated: Medicine = {
    ...current,
    medicineName: textValue(payload.medicineName, current.medicineName),
    genericName: textValue(payload.genericName, current.genericName),
    category: textValue(payload.category, current.category),
    unit: textValue(payload.unit, current.unit),
    stock,
    purchasePrice: numberValue(payload.purchasePrice, current.purchasePrice ?? 0),
    price: numberValue(payload.price, current.price),
    lowStock,
    description: textValue(payload.description, current.description ?? ''),
    active: booleanValue(payload.active, current.active),
    status: resolveStatus(stock, lowStock),
  };

  medicines[index] = updated;
  await writeMedicines(medicines);
  return updated;
}

export async function deleteMedicine(id: number) {
  const medicines = await readMedicines();
  const filtered = medicines.filter((medicine) => medicine.id !== id);

  if (filtered.length === medicines.length) {
    return null;
  }

  await writeMedicines(filtered);
  return true;
}

function normalizeMedicine(value: Medicine): Medicine {
  const stock = Number(value.stock) || 0;
  const lowStock = Number(value.lowStock) || 0;
  return {
    id: Number(value.id) || 0,
    sku: typeof value.sku === 'string' && value.sku.trim() ? value.sku.trim() : undefined,
    medicineName: textValue(value.medicineName, 'New Medicine'),
    genericName: textValue(value.genericName, ''),
    category: textValue(value.category, 'General'),
    unit: textValue(value.unit, 'Tablet'),
    stock,
    lowStock,
    purchasePrice: Number(value.purchasePrice) || 0,
    price: Number(value.price) || 0,
    description: textValue(value.description, ''),
    status: value.status || (stock <= 0 ? 'Out of Stock' : stock <= lowStock ? 'Low Stock' : 'In Stock'),
    active: value.active !== false,
  };
}

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true' || value === 'on' || value === '1') return true;
    if (value === 'false' || value === 'off' || value === '0') return false;
  }
  return fallback;
}

function resolveStatus(stock: number, lowStock: number): Medicine['status'] {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= lowStock) return 'Low Stock';
  return 'In Stock';
}
