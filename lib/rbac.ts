import type { AuthRole } from './auth-session';
import type { CoreSettings } from './core-settings';

/** Map of roles to the absolute base paths they are allowed to access. */
const ROLE_PERMISSIONS: Record<AuthRole, string[]> = {
  admin: ['/modules'],
  manager: [
    '/modules/dashboard',
    '/modules/inventory',
    '/modules/pos',
    '/modules/purchases',
    '/modules/customers',
    '/modules/reports',
  ],
  salesman: [
    '/modules/dashboard',
    '/modules/pos',
    '/modules/customers',
  ],
  inventory_user: [
    '/modules/dashboard',
    '/modules/inventory',
    '/modules/purchases',
  ],
  customer: [
    '/modules/dashboard',
  ],
};

/** Checks if a role is inherently allowed to access a specific route. */
export function canAccessRoute(role: AuthRole, path: string): boolean {
  if (role === 'admin') {
    return true;
  }

  const allowedPrefixes = ROLE_PERMISSIONS[role] || [];

  if (path.startsWith('/modules/settings') || path.startsWith('/modules/administration')) {
    return false;
  }

  return allowedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}#`),
  );
}

/** Checks if a module is enabled globally in Core settings. */
export function isModuleEnabled(path: string, settings: CoreSettings): boolean {
  if (path.startsWith('/modules/purchases')) {
    return settings.isPurchasesEnabled;
  }
  if (path.startsWith('/modules/pos')) {
    return settings.isPosEnabled;
  }
  if (path.startsWith('/modules/inventory')) {
    return settings.isInventoryEnabled;
  }
  if (path.startsWith('/modules/reports')) {
    return settings.isReportsEnabled;
  }
  if (path.startsWith('/modules/customers')) {
    return settings.isCustomersEnabled;
  }
  if (path.startsWith('/modules/settings')) {
    return settings.isSettingsEnabled;
  }
  if (path.startsWith('/modules/backup-restore')) {
    return settings.isBackupEnabled;
  }
  if (path.startsWith('/modules/administration')) {
    return settings.isImportExportEnabled;
  }
  if (path.startsWith('/modules/dashboard')) {
    return settings.isDashboardEnabled;
  }

  return true;
}

/** Checks both role permission and global module availability. */
export function isRouteAllowed(role: AuthRole, path: string, settings: CoreSettings): boolean {
  return canAccessRoute(role, path) && isModuleEnabled(path, settings);
}

export function moduleNameToSettingsKey(moduleName: string): keyof CoreSettings | null {
  switch (moduleName) {
    case 'Dashboard':
      return 'isDashboardEnabled';
    case 'Inventory':
      return 'isInventoryEnabled';
    case 'POS':
      return 'isPosEnabled';
    case 'Purchases':
      return 'isPurchasesEnabled';
    case 'Sales':
      return 'isPosEnabled';
    case 'Settings':
      return 'isSettingsEnabled';
    case 'Audit Logs':
      return 'isBackupEnabled';
    default:
      return null;
  }
}
