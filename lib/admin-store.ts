import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AdminBranch, AdminClient, AdminData, AdminRole, AdminStatus, AdminUser, RoleTone } from './admin-types';

const storePath = path.join(process.cwd(), 'data', 'admin-console.json');

const seedData: AdminData = {
  clients: [],
  users: [],
  branches: [],
  roles: [],
};

export async function readAdminData(): Promise<AdminData> {
  try {
    const raw = await readFile(storePath, 'utf8');
    return normalizeData(JSON.parse(raw));
  } catch {
    await writeAdminData(seedData);
    return structuredClone(seedData);
  }
}

export async function writeAdminData(data: AdminData) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(normalizeData(data), null, 2)}\n`, 'utf8');
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export function initialsFor(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'U';
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? 'S';
  return `${first}${second}`.toUpperCase();
}

export function roleToneFor(role: string): RoleTone {
  const normalized = role.toLowerCase();
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('manager') || normalized.includes('sales')) return 'manager';
  if (normalized.includes('cashier')) return 'cashier';
  if (normalized.includes('viewer')) return 'viewer';
  return 'pharmacist';
}

export function asStatus(value: unknown): AdminStatus {
  return value === 'Inactive' ? 'Inactive' : 'Active';
}

export function nextNumberId(items: Array<{ id: number }>) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function uniqueSlug(base: string, used: string[]) {
  const root = slugify(base);
  let candidate = root;
  let count = 2;

  while (used.includes(candidate)) {
    candidate = `${root}-${count}`;
    count += 1;
  }

  return candidate;
}

function normalizeData(value: Partial<AdminData>): AdminData {
  return {
    clients: Array.isArray(value.clients) ? value.clients.map(normalizeClient) : seedData.clients,
    users: Array.isArray(value.users) ? value.users.map(normalizeUser) : seedData.users,
    branches: Array.isArray(value.branches) ? value.branches.map(normalizeBranch) : seedData.branches,
    roles: Array.isArray(value.roles) ? value.roles.map(normalizeRole) : seedData.roles,
  };
}

function normalizeClient(client: AdminClient): AdminClient {
  return {
    ...client,
    id: client.id || slugify(client.name),
    status: asStatus(client.status),
    modules: Number(client.modules) || 0,
  };
}

function normalizeUser(user: AdminUser): AdminUser {
  return {
    ...user,
    id: Number(user.id),
    initials: user.initials || initialsFor(user.name),
    roleTone: user.roleTone || roleToneFor(user.role),
    status: asStatus(user.status),
  };
}

function normalizeBranch(branch: AdminBranch): AdminBranch {
  return {
    ...branch,
    id: Number(branch.id),
    initials: branch.initials || initialsFor(branch.manager),
    status: asStatus(branch.status),
  };
}

function normalizeRole(role: AdminRole): AdminRole {
  return {
    ...role,
    id: role.id || slugify(role.name),
    users: Number(role.users) || 0,
    modules: Number(role.modules) || 0,
    status: asStatus(role.status),
  };
}