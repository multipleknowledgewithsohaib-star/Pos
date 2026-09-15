import { NextResponse } from 'next/server';
import { defaultCoreSettings } from '@/lib/core-settings';
import { patchCoreModuleAccess, readCoreModuleAccess, writeCoreModuleAccess } from '@/lib/core-module-access-store';

export async function GET() {
  const data = await readCoreModuleAccess();
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const next = { ...defaultCoreSettings, ...(body ?? {}) };
  const data = await writeCoreModuleAccess(next);
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const data = await patchCoreModuleAccess(body ?? {});
  return NextResponse.json({ data });
}
