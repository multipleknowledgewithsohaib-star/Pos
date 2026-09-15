import { NextResponse } from 'next/server';
import { readMedicines, writeMedicines } from '@/lib/module-inventory-store';
import type { Medicine } from '@/lib/module-data';

type ProductImportRow = {
  productName?: string;
  category?: string;
  purchasePrice?: string | number;
  salePrice?: string | number;
  stock?: string | number;
  genericName?: string;
  unit?: string;
  lowStock?: string | number;
};

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveStatus(stock: number, lowStock: number): Medicine['status'] {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= lowStock) return 'Low Stock';
  return 'In Stock';
}

export async function POST(request: Request) {
  const body = await request.json();
  const items = Array.isArray(body?.items) ? (body.items as ProductImportRow[]) : [];

  if (!items.length) {
    return NextResponse.json({ error: 'No valid records to import.' }, { status: 400 });
  }

  const medicines = await readMedicines();
  const existingNames = new Set(medicines.map((item) => item.medicineName.toLowerCase()));
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    const medicineName = text(item.productName);
    if (!medicineName) {
      skipped += 1;
      continue;
    }

    if (existingNames.has(medicineName.toLowerCase())) {
      skipped += 1;
      errors.push(`Skipped duplicate product: ${medicineName}`);
      continue;
    }

    const stock = Math.max(0, Math.floor(number(item.stock)));
    const lowStock = Math.max(0, Math.floor(number(item.lowStock, 5)));
    const medicine: Medicine = {
      id: medicines.reduce((max, row) => Math.max(max, row.id), 0) + 1,
      medicineName,
      genericName: text(item.genericName),
      category: text(item.category, 'General'),
      unit: text(item.unit, 'Tablet'),
      stock,
      lowStock,
      purchasePrice: number(item.purchasePrice),
      price: number(item.salePrice),
      description: '',
      status: resolveStatus(stock, lowStock),
      active: true,
    };

    medicines.push(medicine);
    existingNames.add(medicineName.toLowerCase());
    imported += 1;
  }

  if (imported > 0) {
    await writeMedicines(medicines);
  }

  return NextResponse.json({ imported, skipped, errors });
}

export async function GET() {
  const medicines = await readMedicines();
  return NextResponse.json({ data: medicines });
}
