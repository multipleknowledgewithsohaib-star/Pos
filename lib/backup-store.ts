import { DEMO_COUNTS, DEMO_INVENTORY_COUNTS } from '@/lib/demo-seed.mjs';

export type BackupListRow = {
  id: number;
  slug: string;
  name: string;
  datetime: string;
  size: string;
  type: string;
  status: 'Success' | 'Failed';
  description: string;
  compression: string;
  encryption: string;
  createdBy: string;
};

export type BackupActivityRow = {
  id: number;
  action: string;
  name: string;
  datetime: string;
  status: 'Success' | 'Failed';
  performedBy: string;
};

export type BackupDataSummary = {
  label: string;
  value: string;
};

const BACKUP_LIST_KEY = 'pharma-backups-v1';
const BACKUP_ACTIVITY_KEY = 'pharma-backup-activity-v1';

function formatBackupDate(date: Date) {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function slugForName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'backup';
}

function estimateSizeMb(index: number) {
  const base = 18 + (index % 7) * 4.2;
  return `${base.toFixed(1)} MB`;
}

export function buildDataSummary(): BackupDataSummary[] {
  return [
    { label: 'Products', value: String(DEMO_COUNTS.products) },
    { label: 'Stock Entries', value: String(DEMO_INVENTORY_COUNTS.stockEntries) },
    { label: 'Customers', value: String(DEMO_COUNTS.customers) },
    { label: 'Suppliers', value: '48' },
    { label: 'Purchase Records', value: '312' },
    { label: 'Sales Records', value: String(DEMO_COUNTS.invoices) },
    { label: 'Users', value: '24' },
    { label: 'Settings', value: '12' },
  ];
}

export function buildSeedBackups(): BackupListRow[] {
  const types = ['Full', 'Incremental', 'Full', 'Manual'] as const;
  const rows: BackupListRow[] = [];

  for (let index = 0; index < 12; index += 1) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - index * 2);
    createdAt.setHours(9 + (index % 6), (index * 11) % 60, 0, 0);
    const name = `pharma-backup-${createdAt.toISOString().slice(0, 10)}-${String(index + 1).padStart(2, '0')}`;
    rows.push({
      id: index + 1,
      slug: slugForName(name),
      name,
      datetime: formatBackupDate(createdAt),
      size: estimateSizeMb(index),
      type: types[index % types.length],
      status: index === 5 ? 'Failed' : 'Success',
      description: index === 5 ? 'Interrupted during stock export.' : 'Automated pharmacy dataset snapshot.',
      compression: 'gzip',
      encryption: 'AES-256',
      createdBy: index % 2 === 0 ? 'Admin User' : 'System Scheduler',
    });
  }

  return rows;
}

function buildSeedActivity(backups: BackupListRow[]): BackupActivityRow[] {
  return backups.flatMap((backup, index) => {
    const rows: BackupActivityRow[] = [
      {
        id: index * 2 + 1,
        action: 'Backup Created',
        name: backup.name,
        datetime: backup.datetime,
        status: backup.status,
        performedBy: backup.createdBy,
      },
    ];

    if (backup.status === 'Success' && index % 3 === 0) {
      rows.push({
        id: index * 2 + 2,
        action: 'Backup Verified',
        name: backup.name,
        datetime: backup.datetime,
        status: 'Success',
        performedBy: 'System',
      });
    }

    return rows;
  });
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function ensureBackupStore() {
  const seed = buildSeedBackups();
  const backups = readStorage<BackupListRow[]>(BACKUP_LIST_KEY, []);
  if (!backups.length) {
    writeStorage(BACKUP_LIST_KEY, seed);
    writeStorage(BACKUP_ACTIVITY_KEY, buildSeedActivity(seed));
    return seed;
  }

  return backups;
}

export function listBackups() {
  return ensureBackupStore();
}

export function listBackupActivity() {
  ensureBackupStore();
  const activity = readStorage<BackupActivityRow[]>(BACKUP_ACTIVITY_KEY, []);
  if (!activity.length) {
    const seedActivity = buildSeedActivity(buildSeedBackups());
    writeStorage(BACKUP_ACTIVITY_KEY, seedActivity);
    return seedActivity;
  }

  return activity;
}

export function getBackupBySlug(slug: string) {
  return listBackups().find((backup) => backup.slug === slug) ?? null;
}

export function getBackupDashboardStats() {
  const backups = listBackups();
  const successful = backups.filter((backup) => backup.status === 'Success');
  const latest = successful[0] ?? backups[0];
  const totalSize = backups.reduce((sum, backup) => sum + Number.parseFloat(backup.size), 0);

  return {
    totalBackups: backups.length,
    lastBackup: latest?.datetime ?? 'N/A',
    backupSize: `${totalSize.toFixed(1)} MB`,
    status: backups.length ? (successful.length === backups.length ? 'Healthy' : 'Attention') : 'No Backups',
    helper: backups.length ? `${successful.length} successful` : 'Waiting for first backup',
  };
}

export function createBackup(input: { name: string; description?: string }) {
  const backups = listBackups();
  const createdAt = new Date();
  const fallbackName = `pharma-backup-${createdAt.toISOString().slice(0, 10)}`;
  const name = input.name.trim() || fallbackName;
  const record: BackupListRow = {
    id: backups.reduce((max, row) => Math.max(max, row.id), 0) + 1,
    slug: slugForName(name),
    name,
    datetime: formatBackupDate(createdAt),
    size: estimateSizeMb(backups.length),
    type: 'Manual',
    status: 'Success',
    description: input.description?.trim() || 'Manual backup created from console.',
    compression: 'gzip',
    encryption: 'AES-256',
    createdBy: 'Admin User',
  };

  const nextBackups = [record, ...backups];
  writeStorage(BACKUP_LIST_KEY, nextBackups);

  const activity = listBackupActivity();
  const nextActivity: BackupActivityRow[] = [
    {
      id: activity.reduce((max, row) => Math.max(max, row.id), 0) + 1,
      action: 'Backup Created',
      name: record.name,
      datetime: record.datetime,
      status: record.status,
      performedBy: record.createdBy,
    },
    ...activity,
  ];
  writeStorage(BACKUP_ACTIVITY_KEY, nextActivity);

  return record;
}

export function downloadBackupFile(backup: BackupListRow) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    backup,
    exportedAt: new Date().toISOString(),
    dataSummary: buildDataSummary(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${backup.name}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
