import { NextResponse } from 'next/server';
import { addMedicine, readMedicines } from '@/lib/module-inventory-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;

    const medicines = await readMedicines();
    const activeMedicines = medicines.filter((m) => m.active !== false);

    let filtered = activeMedicines;
    if (search) {
      filtered = activeMedicines.filter((m) =>
        [m.medicineName, m.genericName, m.category || ''].some((val) =>
          val.toLowerCase().includes(search)
        ) || (m.sku && m.sku.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = await request.json();
  const medicine = await addMedicine(payload);
  return NextResponse.json({ data: medicine }, { status: 201 });
}
