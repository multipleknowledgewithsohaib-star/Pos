import { NextResponse } from 'next/server';
import { deleteMedicine, readMedicineById, updateMedicine } from '@/lib/module-inventory-store';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const id = await resolveId(context);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid medicine id.' }, { status: 404 });
  }

  const medicine = await readMedicineById(id);
  if (!medicine) {
    return NextResponse.json({ error: 'Medicine not found.' }, { status: 404 });
  }

  return NextResponse.json({ data: medicine });
}

export async function PUT(request: Request, context: RouteContext) {
  const id = await resolveId(context);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid medicine id.' }, { status: 404 });
  }

  const payload = await request.json();
  const medicine = await updateMedicine(id, payload);

  if (!medicine) {
    return NextResponse.json({ error: 'Medicine not found.' }, { status: 404 });
  }

  return NextResponse.json({ data: medicine });
}

export async function PATCH(request: Request, context: RouteContext) {
  return PUT(request, context);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = await resolveId(context);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid medicine id.' }, { status: 404 });
  }

  const deleted = await deleteMedicine(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Medicine not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

async function resolveId(context: RouteContext) {
  const { id } = await context.params;
  const parsed = Number(id);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
