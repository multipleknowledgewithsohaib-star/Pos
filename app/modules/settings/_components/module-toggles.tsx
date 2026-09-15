'use client';

import { useEffect, useState } from 'react';
import { readCoreSettings, saveCoreSettingsToServer, syncCoreSettings, writeCoreSettings, type CoreSettings } from '@/lib/core-settings';
import { Save } from 'lucide-react';
import { readAuthSession } from '@/lib/auth-session';

export function ModuleToggles() {
  const [settings, setSettings] = useState<CoreSettings | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    void syncCoreSettings().then((next) => setSettings(next));
    const session = readAuthSession();
    setIsAdmin(session?.role === 'admin');
  }, []);

  if (!settings) return null;

  const handleChange = (key: keyof CoreSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: e.target.checked };
    });
  };

  const handleSave = async () => {
    if (!settings) {
      return;
    }

    writeCoreSettings(settings);
    await saveCoreSettingsToServer(settings);
    await syncCoreSettings();
    window.location.reload();
  };

  if (!isAdmin) {
    return (
      <div className="section-panel settings-system-panel">
        <p>You do not have permission to manage Core SaaS Module Toggles.</p>
      </div>
    );
  }

  return (
    <div className="section-panel settings-system-panel" style={{ marginTop: '2rem' }}>
      <h2>Core SaaS Module Toggles</h2>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Disable any module here to hide it globally across the entire application for all roles.
      </p>
      <div className="form-fields settings-system-fields">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={settings.isPosEnabled}
            onChange={handleChange('isPosEnabled')}
          />
          <span>Enable POS (Sales) Module</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={settings.isInventoryEnabled}
            onChange={handleChange('isInventoryEnabled')}
          />
          <span>Enable Inventory Module</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={settings.isPurchasesEnabled}
            onChange={handleChange('isPurchasesEnabled')}
          />
          <span>Enable Purchases Module</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={settings.isCustomersEnabled}
            onChange={handleChange('isCustomersEnabled')}
          />
          <span>Enable Customers Module</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={settings.isReportsEnabled}
            onChange={handleChange('isReportsEnabled')}
          />
          <span>Enable Reports Module</span>
        </label>
      </div>

      <div className="settings-actions" style={{ marginTop: '2rem' }}>
        <button className="button button-primary" onClick={handleSave}>
          <Save className="button-icon" />
          <span>Save & Apply Toggles</span>
        </button>
      </div>
    </div>
  );
}
