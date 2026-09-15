import { NextResponse } from 'next/server';
import { deleteBatch, readBatchByNo, updateBatch } from '@/lib/module-batch-store';

type RouteContext = {
  params: Promise<{
    batchNo: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const batchNo = await resolveBatchNo(context);
  if (!batchNo) {
    return NextResponse.json({ error: 'Invalid batch number.' }, { status: 404 });
  }

  const batch = await readBatchByNo(batchNo);
  if (!batch) {
    return NextResponse.json({ error: 'Batch not found.' }, { status: 404 });
  }

  return NextResponse.json({ data: batch });
}

export async function PUT(request: Request, context: RouteContext) {
  const batchNo = await resolveBatchNo(context);
  if (!batchNo) {
    return NextResponse.json({ error: 'Invalid batch number.' }, { status: 404 });
  }

  const payload = await request.json();
  const batch = await updateBatch(batchNo, payload);

  if (!batch) {
    return NextResponse.json({ error: 'Batch not found.' }, { status: 404 });
  }

  return NextResponse.json({ data: batch });
}

export async function PATCH(request: Request, context: RouteContext) {
  return PUT(request, context);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const batchNo = await resolveBatchNo(context);
  if (!batchNo) {
    return NextResponse.json({ error: 'Invalid batch number.' }, { status: 404 });
  }

  const deleted = await deleteBatch(batchNo);
  if (!deleted) {
    return NextResponse.json({ error: 'Batch not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

async function resolveBatchNo(context: RouteContext) {
  const { batchNo } = await context.params;
  return batchNo.trim() ? batchNo.trim() : null;
}
