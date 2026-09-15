import { NextResponse } from 'next/server';
import { posCustomers } from '@/lib/pos-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;

    let filtered = posCustomers;
    if (search) {
      filtered = posCustomers.filter((c) =>
        [c.name, c.phone, c.address || '', c.note || ''].some((val) =>
          val.toLowerCase().includes(search)
        )
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
    console.error('Error fetching customers:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
