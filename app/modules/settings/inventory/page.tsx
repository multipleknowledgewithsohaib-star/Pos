import Link from 'next/link';
import { Save } from 'lucide-react';
import { DemoActionButton } from '@/components/demo-submit-form';
import { FormPersistenceLoader } from '@/components/form-persistence';
import { SectionHero } from '@/components/section-hero';
import { inventorySettingsFields, inventorySettingsToggles } from '@/lib/settings-content';

export default function InventorySettingsPage() {
  return (
    <div className="settings-page">
      <SectionHero
        badge="11.10"
        eyebrow="INVENTORY SETTINGS"
        title="Inventory Settings"
        description="Configure inventory preferences."
      />

      <form className="settings-grid settings-form-shell">
        <FormPersistenceLoader />
        <article className="settings-card settings-list-card">
          <div className="settings-heading">
            <h2>Inventory Rules</h2>
          </div>
          <div className="settings-toggle-list">
            {inventorySettingsToggles.map((item) => (
              <div className="setting-toggle-row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                </div>
                <label className="switch">
                  <input defaultChecked={item.checked} type="checkbox" />
                  <span />
                </label>
              </div>
            ))}
          </div>
        </article>

        <article className="settings-card settings-list-card">
          <div className="settings-heading">
            <h2>Alert Settings</h2>
          </div>
          <div className="settings-inline-fields">
            <label className="settings-inline-field">
              <span>Low Stock Level</span>
              <div className="settings-inline-value">
                <input defaultValue={inventorySettingsFields.lowStockLevel} />
                <p>Alert when stock is less or equal</p>
              </div>
            </label>
            <label className="settings-inline-field">
              <span>Expiry Alert Days</span>
              <div className="settings-inline-value">
                <input defaultValue={inventorySettingsFields.expiryAlertDays} />
                <p>Alert before days of expiry</p>
              </div>
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Default Markup (%)</span>
              <input defaultValue={inventorySettingsFields.defaultMarkup} />
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Default Tax (%)</span>
              <input defaultValue={inventorySettingsFields.defaultTax} />
            </label>
          </div>
        </article>

        <div className="settings-actions settings-actions-wide">
          <Link className="button button-ghost" href="/modules/settings">
            Cancel
          </Link>
          <DemoActionButton message="Inventory settings saved successfully.">
            <Save className="button-icon" />
            <span>Save Changes</span>
          </DemoActionButton>
        </div>
      </form>
    </div>
  );
}
