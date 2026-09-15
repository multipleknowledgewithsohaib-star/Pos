export const CORE_SETTINGS_KEY = 'pharma-core-settings-v1';
export const CORE_SETTINGS_CHANGED_EVENT = 'pharma-core-settings-changed';

export type CoreSettings = {
  isDashboardEnabled: boolean;
  isPosEnabled: boolean;
  isInventoryEnabled: boolean;
  isPurchasesEnabled: boolean;
  isReportsEnabled: boolean;
  isCustomersEnabled: boolean;
  isSettingsEnabled: boolean;
  isBackupEnabled: boolean;
  isImportExportEnabled: boolean;
};

export const defaultCoreSettings: CoreSettings = {
  isDashboardEnabled: true,
  isPosEnabled: true,
  isInventoryEnabled: true,
  isPurchasesEnabled: true,
  isReportsEnabled: true,
  isCustomersEnabled: true,
  isSettingsEnabled: true,
  isBackupEnabled: true,
  isImportExportEnabled: true,
};

export function readCoreSettings(): CoreSettings {
  if (typeof window === 'undefined') {
    return defaultCoreSettings;
  }

  try {
    const raw = window.localStorage.getItem(CORE_SETTINGS_KEY);
    if (!raw) {
      return defaultCoreSettings;
    }
    return { ...defaultCoreSettings, ...JSON.parse(raw) };
  } catch {
    return defaultCoreSettings;
  }
}

export function writeCoreSettings(settings: Partial<CoreSettings>) {
  if (typeof window === 'undefined') {
    return readCoreSettings();
  }

  try {
    const current = readCoreSettings();
    const next = { ...current, ...settings };
    window.localStorage.setItem(CORE_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CORE_SETTINGS_CHANGED_EVENT, { detail: next }));
    return next;
  } catch (error) {
    console.warn('Unable to write core settings to localStorage:', error);
    return readCoreSettings();
  }
}

export function subscribeCoreSettings(listener: (settings: CoreSettings) => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<CoreSettings>).detail;
    listener(detail ?? readCoreSettings());
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === CORE_SETTINGS_KEY) {
      listener(readCoreSettings());
    }
  };

  window.addEventListener(CORE_SETTINGS_CHANGED_EVENT, onCustom);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(CORE_SETTINGS_CHANGED_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

export async function fetchCoreSettingsFromServer(): Promise<CoreSettings | null> {
  try {
    const response = await fetch('/api/core/module-access', { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { data?: Partial<CoreSettings> };
    if (!payload.data) {
      return null;
    }
    return { ...defaultCoreSettings, ...payload.data };
  } catch {
    return null;
  }
}

export async function saveCoreSettingsToServer(settings: CoreSettings): Promise<CoreSettings | null> {
  try {
    const response = await fetch('/api/core/module-access', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { data?: CoreSettings };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function syncCoreSettings(): Promise<CoreSettings> {
  const remote = await fetchCoreSettingsFromServer();
  if (!remote) {
    return readCoreSettings();
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CORE_SETTINGS_KEY, JSON.stringify(remote));
    window.dispatchEvent(new CustomEvent(CORE_SETTINGS_CHANGED_EVENT, { detail: remote }));
  }

  return remote;
}

export type SystemSettings = {
  systemName: string;
  ownerName: string;
  ntn: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  fiscalYearStart: string;
  taxLabel: string;
  creditLimit: string;
  itemsPerPage: string;
};

export function readSystemSettings(): SystemSettings {
  const defaultSysSettings: SystemSettings = {
    systemName: 'SOLUTIONIR POS',
    ownerName: 'Admin',
    ntn: '1234567-8',
    address: 'Shop # 2, Near Noor Hospital, Block 19, Al Noor Society, Karachi',
    phone: '021-34567890',
    email: 'admin@coresaas.com',
    currency: 'PKR (Pakistani Rupee)',
    dateFormat: 'DD MMM YYYY',
    timeFormat: '12 Hour (hh:mm AM/PM)',
    fiscalYearStart: 'July',
    taxLabel: 'GST',
    creditLimit: '50000',
    itemsPerPage: '25',
  };

  if (typeof window === 'undefined') {
    return defaultSysSettings;
  }

  try {
    const raw = window.localStorage.getItem('pharma-form:/modules/settings');
    if (!raw) {
      return defaultSysSettings;
    }
    const parsed = JSON.parse(raw);
    return {
      systemName: parsed['System Name'] || defaultSysSettings.systemName,
      ownerName: parsed['Owner Name'] || defaultSysSettings.ownerName,
      ntn: parsed['NTN'] || defaultSysSettings.ntn,
      address: parsed['Address'] || defaultSysSettings.address,
      phone: parsed['Phone'] || defaultSysSettings.phone,
      email: parsed['Email'] || defaultSysSettings.email,
      currency: parsed['Currency'] || defaultSysSettings.currency,
      dateFormat: parsed['Date Format'] || defaultSysSettings.dateFormat,
      timeFormat: parsed['Time Format'] || defaultSysSettings.timeFormat,
      fiscalYearStart: parsed['Fiscal Year Start'] || defaultSysSettings.fiscalYearStart,
      taxLabel: parsed['Tax Label'] || defaultSysSettings.taxLabel,
      creditLimit: parsed['Default Credit Limit (PKR)'] || defaultSysSettings.creditLimit,
      itemsPerPage: parsed['Items Per Page'] || defaultSysSettings.itemsPerPage,
    };
  } catch {
    return defaultSysSettings;
  }
}
