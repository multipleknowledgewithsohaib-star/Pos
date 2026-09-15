import { NextResponse } from 'next/server';
import {
  asStatus,
  initialsFor,
  nextNumberId,
  readAdminData,
  roleToneFor,
  slugify,
  uniqueSlug,
  writeAdminData,
} from '@/lib/admin-store';
import type { AdminBranch, AdminClient, AdminData, AdminRole, AdminUser } from '@/lib/admin-types';

type Entity = 'clients' | 'users' | 'branches' | 'roles';

type RouteContext = {
  params: Promise<{
    entity: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const entity = await resolveEntity(context);
  if (!entity) return notFoundEntity();

  const data = await readAdminData();
  return NextResponse.json({ data: data[entity] });
}

export async function POST(request: Request, context: RouteContext) {
  const entity = await resolveEntity(context);
  if (!entity) return notFoundEntity();

  const payload = await request.json();
  const data = await readAdminData();
  const created = createRecord(entity, payload, data);
  await writeAdminData(data);

  return NextResponse.json({ data: created }, { status: 201 });
}

async function resolveEntity(context: RouteContext): Promise<Entity | null> {
  const { entity } = await context.params;
  return isEntity(entity) ? entity : null;
}

function isEntity(entity: string): entity is Entity {
  return ['clients', 'users', 'branches', 'roles'].includes(entity);
}

function notFoundEntity() {
  return NextResponse.json({ error: 'Unknown admin entity.' }, { status: 404 });
}

function createRecord(entity: Entity, payload: Record<string, unknown>, data: AdminData) {
  if (entity === 'clients') {
    const name = text(payload.name, 'New Client');
    const modules = arrayValue(payload.moduleAccess).length || numberValue(payload.modules, 0);
    const record: AdminClient = {
      id: uniqueSlug(name, data.clients.map((client) => client.id)),
      name,
      type: text(payload.type, 'Hospital'),
      plan: text(payload.plan, 'Premium'),
      status: asStatus(payload.status),
      branch: text(payload.branchName, text(payload.branch, 'Head Office')),
      modules,
      createdOn: text(payload.createdOn, new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })),
      contactName: text(payload.contactName, ''),
      email: text(payload.email, ''),
      phone: text(payload.phone, ''),
    };
    data.clients.push(record);
    return record;
  }

  if (entity === 'users') {
    const name = text(payload.name, 'New User');
    const role = text(payload.role, 'Viewer');
    const record: AdminUser = {
      id: nextNumberId(data.users),
      initials: initialsFor(name),
      name,
      role,
      roleTone: roleToneFor(role),
      branch: text(payload.branch, text(payload.branchAccess, 'Head Office')),
      status: asStatus(payload.status),
      email: text(payload.email, 'user@example.com'),
      phone: text(payload.phone, ''),
      password: text(payload.password, 'password123'),
    };
    data.users.push(record);
    return record;
  }

  if (entity === 'branches') {
    const name = text(payload.name, 'New Branch');
    const manager = text(payload.manager, 'Unassigned');
    const record: AdminBranch = {
      id: nextNumberId(data.branches),
      name,
      city: text(payload.city, 'Karachi'),
      manager,
      initials: initialsFor(manager),
      status: asStatus(payload.status),
      createdOn: text(payload.createdOn, new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })),
      phone: text(payload.phone, ''),
      address: text(payload.address, ''),
      notes: text(payload.notes, ''),
    };
    data.branches.push(record);
    return record;
  }

  const name = text(payload.name, 'New Role');
  const record: AdminRole = {
    id: uniqueSlug(name, data.roles.map((role) => role.id)),
    name,
    description: text(payload.description, 'Custom role for selected permissions.'),
    users: numberValue(payload.users, 0),
    modules: Math.max(arrayValue(payload.permissions).length, numberValue(payload.modules, 0)),
    status: asStatus(payload.status),
  };
  data.roles.push(record);
  return record;
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
