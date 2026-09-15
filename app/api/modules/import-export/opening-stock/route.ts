import { NextResponse } from 'next/server';
import { addBatch } from '@/lib/module-batch-store';
import { readMedicines, updateMedicine } from '@/lib/module-inventory-store';

type OpeningStockRow = {
  productName?: string;
  batchNo?: string;
  quantity?: string | number;
  purchasePrice?: string | number;
  expiryDate?: string;
  supplier?: string;
  mfgDate?: string;
};

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(request: Request) {
  const body = await request.json();
  const items = Array.isArray(body?.items) ? (body.items as OpeningStockRow[]) : [];

  if (!items.length) {
    return NextResponse.json({ error: 'No valid records to import.' }, { status: 400 });
  }

  const medicines = await readMedicines();
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    const productName = text(item.productName);
    const batchNo = text(item.batchNo);
    const quantity = Math.max(0, Math.floor(number(item.quantity)));

    if (!productName || !batchNo || quantity <= 0) {
      skipped += 1;
      continue;
    }

    const medicine = medicines.find((row) => row.medicineName.toLowerCase() === productName.toLowerCase());
    if (!medicine) {
      skipped += 1;
      errors.push(`Product not found for opening stock: ${productName}`);
      continue;
    }

    const batch = await addBatch({
      medicineName: productName,
      batchNo,
      quantity,
      stock: quantity,
      purchasePrice: number(item.purchasePrice),
      expiryDate: text(item.expiryDate),
      mfgDate: text(item.mfgDate),
      supplier: text(item.supplier),
    });

    if (!batch) {
      skipped += 1;
      errors.push(`Could not import batch ${batchNo} for ${productName}`);
      continue;
    }

    const nextStock = medicine.stock + quantity;
    await updateMedicine(medicine.id, {
      stock: nextStock,
      purchasePrice: number(item.purchasePrice, medicine.purchasePrice ?? 0),
    });

    medicine.stock = nextStock;
    imported += 1;
  }

  return NextResponse.json({ imported, skipped, errors });
}
