import { NextResponse } from 'next/server';
import { addSale, addSales, readSales } from '@/lib/module-pos-store';

export async function GET() {
  try {
    const sales = await readSales();
    return NextResponse.json({ data: sales });
  } catch (error) {
    console.error('Error reading sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload) {
      return NextResponse.json({ error: 'Invalid sale payload' }, { status: 400 });
    }
    if (Array.isArray(payload)) {
      const sales = await addSales(payload);
      return NextResponse.json({ data: sales }, { status: 201 });
    }
    if (!payload.invoice) {
      return NextResponse.json({ error: 'Invalid sale payload: invoice missing' }, { status: 400 });
    }
    const sale = await addSale(payload);
    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (error) {
    console.error('Error saving sale:', error);
    return NextResponse.json({ error: 'Failed to save sale' }, { status: 500 });
  }
}

