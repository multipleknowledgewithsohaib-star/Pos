import { roundMoney, type PurchaseLineItem, type PurchaseOrder } from './purchase-data';

export type PurchaseSyncResult = {
  updated: number;
  created: number;
  batches: number;
  skipped: string[];
};

type InventoryMedicine = {
  id: number;
  medicineName: string;
  genericName?: string;
  category?: string;
  unit?: string;
  stock?: number;
  lowStock?: number;
  purchasePrice?: number;
  price?: number;
  description?: string;
  active?: boolean;
};

async function readInventory() {
  const response = await fetch('/api/modules/inventory', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to load inventory data.');
  }

  const payload = (await response.json()) as { data?: InventoryMedicine[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

async function saveMedicine(medicine: InventoryMedicine, payload: Record<string, unknown>) {
  const response = await fetch(`/api/modules/inventory/${medicine.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Unable to update ${medicine.medicineName}.`);
  }

  const body = (await response.json()) as { data?: InventoryMedicine };
  return body.data ?? ({ ...medicine, ...payload } as InventoryMedicine);
}

async function createMedicine(payload: Record<string, unknown>) {
  const response = await fetch('/api/modules/inventory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Unable to create medicine from received stock.');
  }

  const body = (await response.json()) as { data?: InventoryMedicine };
  return body.data ?? null;
}

async function createBatch(payload: Record<string, unknown>) {
  const response = await fetch('/api/modules/inventory/batches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Unable to create batch record.');
  }
}

function guessGenericName(name: string) {
  return name
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|iu)\b/gi, '')
    .replace(/\b(?:tab|tablet|cap|capsule|syrup|inhaler|drop|cream|ointment|supp)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || name;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function findMatchingMedicine(inventory: InventoryMedicine[], name: string) {
  const normalized = normalizeName(name);
  if (!normalized) {
    return null;
  }

  const exact = inventory.find((medicine) => normalizeName(medicine.medicineName) === normalized);
  if (exact) {
    return exact;
  }

  return (
    inventory.find((medicine) => {
      const candidate = normalizeName(medicine.medicineName);
      return candidate.length > 2 && (candidate.includes(normalized) || normalized.includes(candidate));
    }) ?? null
  );
}

export async function syncReceivedPurchaseItems({
  order,
  items,
  receiveDate,
}: {
  order: PurchaseOrder;
  items: Array<PurchaseLineItem & { receiveQty: number; batchNo: string; expiryDate: string }>;
  receiveDate: string;
}): Promise<PurchaseSyncResult> {
  const inventory = await readInventory();
  const summary: PurchaseSyncResult = {
    updated: 0,
    created: 0,
    batches: 0,
    skipped: [],
  };

  for (const item of items) {
    const quantity = Math.max(0, Math.floor(Number(item.receiveQty) || 0));
    if (!quantity) {
      summary.skipped.push(item.medicine);
      continue;
    }

    const name = item.medicine.trim();
    if (!name) {
      summary.skipped.push(item.id);
      continue;
    }

    const existing = findMatchingMedicine(inventory, name);
    const baseStock = Math.max(0, Number(existing?.stock) || 0);
    const purchasePrice = roundMoney(Number(item.purchasePrice) || 0);
    const category = existing?.category ?? 'Purchased';
    const unit = existing?.unit ?? item.pack ?? 'Pack';
    const price = roundMoney(existing?.price ?? purchasePrice * 1.35);

    if (existing) {
      const updatedMedicine = await saveMedicine(existing, {
        ...existing,
        medicineName: existing.medicineName || name,
        genericName: existing.genericName ?? guessGenericName(name),
        category,
        unit,
        stock: baseStock + quantity,
        lowStock: existing.lowStock ?? 20,
        purchasePrice,
        price,
        description: existing.description ?? `Received from ${order.supplierName}`,
        active: existing.active !== false,
      });
      Object.assign(existing, updatedMedicine);
      summary.updated += 1;
    } else {
      const createdMedicine = await createMedicine({
        medicineName: name,
        genericName: guessGenericName(name),
        category,
        unit,
        stock: quantity,
        lowStock: 20,
        purchasePrice,
        price,
        description: `Received from ${order.supplierName}`,
        active: true,
      });
      if (createdMedicine) {
        inventory.push(createdMedicine);
      }
      summary.created += 1;
    }

    if (item.batchNo.trim()) {
      await createBatch({
        medicineName: existing?.medicineName || name,
        batchNo: item.batchNo.trim(),
        mfgDate: receiveDate,
        expiryDate: item.expiryDate,
        purchasePrice,
        quantity,
        supplier: order.supplierName,
      });
      summary.batches += 1;
    }
  }

  return summary;
}

export async function syncReturnedPurchaseItems({
  items,
}: {
  items: Array<{ medicine: string; returnQty: number }>;
}): Promise<PurchaseSyncResult> {
  const inventory = await readInventory();
  const summary: PurchaseSyncResult = {
    updated: 0,
    created: 0,
    batches: 0,
    skipped: [],
  };

  for (const item of items) {
    const quantity = Math.max(0, Math.floor(Number(item.returnQty) || 0));
    if (!quantity) {
      summary.skipped.push(item.medicine);
      continue;
    }

    const name = item.medicine.trim();
    const existing = findMatchingMedicine(inventory, name);
    if (!existing) {
      summary.skipped.push(name);
      continue;
    }

    const stock = Math.max(0, (Number(existing.stock) || 0) - quantity);
    const updatedMedicine = await saveMedicine(existing, {
      ...existing,
      stock,
      genericName: existing.genericName ?? guessGenericName(name),
      active: existing.active !== false,
    });
    Object.assign(existing, updatedMedicine);
    summary.updated += 1;
  }

  return summary;
}
