import { NextResponse } from 'next/server';
import { asStatus, initialsFor, readAdminData, roleToneFor, slugify, writeAdminData } from '@/lib/admin-store';
import type { AdminBranch, AdminClient, AdminData, AdminRole, AdminUser } from '@/lib/admin-types';

type Entity = 'clients' | 'users' | 'branches' | 'roles';

type RouteContext = {
  params: Promise<{
    entity: string;
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const resolved = await resolveParams(context);
  if (!resolved) return notFoundEntity();

  const data = await readAdminData();
  const record = findRecord(data, resolved.entity, resolved.id);

  if (!record) {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}

export async function PUT(request: Request, context: RouteContext) {
  return updateRecord(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return updateRecord(request, context);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const resolved = await resolveParams(context);
  if (!resolved) return notFoundEntity();

  const data = await readAdminData();
  const before = data[resolved.entity].length;

  if (resolved.entity === 'clients') data.clients = data.clients.filter((item) => item.id !== resolved.id);
  if (resolved.entity === 'users') data.users = data.users.filter((item) => String(item.id) !== resolved.id);
  if (resolved.entity === 'branches') data.branches = data.branches.filter((item) => String(item.id) !== resolved.id);
  if (resolved.entity === 'roles') data.roles = data.roles.filter((item) => item.id !== resolved.id);

  if (data[resolved.entity].length === before) {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  }

  await writeAdminData(data);
  return NextResponse.json({ ok: true });
}

async function updateRecord(request: Request, context: RouteContext) {
  const resolved = await resolveParams(context);
  if (!resolved) return notFoundEntity();

  const payload = await request.json();
  const data = await readAdminData();
  const updated = updateEntityRecord(data, resolved.entity, resolved.id, payload);

  if (!updated) {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  }

  await writeAdminData(data);
  return NextResponse.json({ data: updated });
}

async function resolveParams(context: RouteContext): Promise<{ entity: Entity; id: string } | null> {
  const { entity, id } = await context.params;
  return isEntity(entity) ? { entity, id } : null;
}

function isEntity(entity: string): entity is Entity {
  return ['clients', 'users', 'branches', 'roles'].includes(entity);
}

function notFoundEntity() {
  return NextResponse.json({ error: 'Unknown admin entity.' }, { status: 404 });
}

function findRecord(data: AdminData, entity: Entity, id: string) {
  if (entity === 'clients') return data.clients.find((item) => item.id === id);
  if (entity === 'users') return data.users.find((item) => String(item.id) === id);
  if (entity === 'branches') return data.branches.find((item) => String(item.id) === id);
  return data.roles.find((item) => item.id === id);
}

function updateEntityRecord(data: AdminData, entity: Entity, id: string, payload: Record<string, unknown>) {
  if (entity === 'clients') {
    const index = data.clients.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const current = data.clients[index];
    const modules = arrayValue(payload.moduleAccess).length || numberValue(payload.modules, current.modules);
    const updated: AdminClient = {
      ...current,
      name: text(payload.name, current.name),
      type: text(payload.type, current.type),
      plan: text(payload.plan, current.plan),
      status: asStatus(payload.status ?? current.status),
      branch: text(payload.branch, current.branch),
      modules,
      createdOn: text(payload.createdOn, current.createdOn),
      contactName: text(payload.contactName, current.contactName ?? ''),
      email: text(payload.email, current.email ?? ''),
      phone: text(payload.phone, current.phone ?? ''),
    };
    data.clients[index] = updated;
    return updated;
  }

  if (entity === 'users') {
    const index = data.users.findIndex((item) => String(item.id) === id);
    if (index < 0) return null;
    const current = data.users[index];
    const name = text(payload.name, current.name);
    const role = text(payload.role, current.role);
    const updated: AdminUser = {
      ...current,
      name,
      initials: initialsFor(name),
      role,
      roleTone: roleToneFor(role),
      branch: text(payload.branch, current.branch),
      status: asStatus(payload.status ?? current.status),
      email: text(payload.email, current.email),
      phone: text(payload.phone, current.phone),
      password: typeof payload.password === 'string' ? payload.password : current.password,
    };
    data.users[index] = updated;
    return updated;
  }

  if (entity === 'branches') {
    const index = data.branches.findIndex((item) => String(item.id) === id);
    if (index < 0) return null;
    const current = data.branches[index];
    const manager = text(payload.manager, current.manager);
    const updated: AdminBranch = {
      ...current,
      name: text(payload.name, current.name),
      city: text(payload.city, current.city),
      manager,
      initials: initialsFor(manager),
      status: asStatus(payload.status ?? current.status),
      createdOn: text(payload.createdOn, current.createdOn),
      phone: text(payload.phone, current.phone ?? ''),
      address: text(payload.address, current.address ?? ''),
      notes: text(payload.notes, current.notes ?? ''),
    };
    data.branches[index] = updated;
    return updated;
  }

  const index = data.roles.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const current = data.roles[index];
  const name = text(payload.name, current.name);
  const updated: AdminRole = {
    ...current,
    id: current.id || slugify(name),
    name,
    description: text(payload.description, current.description),
    users: numberValue(payload.users, current.users),
    modules: Math.max(arrayValue(payload.permissions).length, numberValue(payload.modules, current.modules)),
    status: asStatus(payload.status ?? current.status),
  };
  data.roles[index] = updated;
  return updated;
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function arrayValue(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) return [value];
  return [];
}
