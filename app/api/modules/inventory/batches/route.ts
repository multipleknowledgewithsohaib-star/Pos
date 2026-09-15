import { NextResponse } from 'next/server';
import { addBatch, readBatchSnapshot } from '@/lib/module-batch-store';

export async function GET() {
  const snapshot = await readBatchSnapshot();
  return NextResponse.json({ data: snapshot });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const batch = await addBatch(payload);

  if (!batch) {
    return NextResponse.json({ error: 'Batch already exists or payload is invalid.' }, { status: 409 });
  }

  return NextResponse.json({ data: batch }, { status: 201 });
}
