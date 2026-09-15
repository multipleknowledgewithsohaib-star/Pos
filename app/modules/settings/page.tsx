import { Plus, Save } from 'lucide-react';
import { DemoActionButton } from '@/components/demo-submit-form';
import { FormPersistenceLoader } from '@/components/form-persistence';
import { SectionHero } from '@/components/section-hero';
import { systemSettingsFields } from '@/lib/settings-content';
import { ModuleToggles } from './_components/module-toggles';

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <SectionHero
        badge="11.1"
        eyebrow="SYSTEM SETTINGS"
        title="System Settings"
        description="Configure general system settings."
      />

      <form className="section-panel settings-system-panel">
        <FormPersistenceLoader />
        <div className="settings-brand-row">
          <div className="settings-brand-preview">
            <div className="settings-brand-mark">
              <Plus />
            </div>
            <div className="settings-brand-copy">
              <strong>SOLUTIONIR</strong>
              <span>POS</span>
            </div>
          </div>

          <div className="settings-brand-actions">
            <DemoActionButton message="Logo upload started.">
              <span>Change Logo</span>
            </DemoActionButton>
            <p>PNG, JPG up to 2MB</p>
          </div>
        </div>

        <div className="form-fields settings-system-fields">
          <label className="field-span-full">
            <span>System Name</span>
            <input defaultValue={systemSettingsFields.systemName} />
          </label>
          <label>
            <span>Owner Name</span>
            <input defaultValue={systemSettingsFields.ownerName} />
          </label>
          <label>
            <span>NTN</span>
            <input defaultValue={systemSettingsFields.ntn} />
          </label>
          <label className="field-span-full">
            <span>Address</span>
            <input defaultValue={systemSettingsFields.address} />
          </label>
          <label>
            <span>Phone</span>
            <input defaultValue={systemSettingsFields.phone} />
          </label>
          <label>
            <span>Email</span>
            <input defaultValue={systemSettingsFields.email} type="email" />
          </label>
          <label>
            <span>Currency</span>
            <select defaultValue={systemSettingsFields.currency || ''}>
              <option value="">Select currency</option>
              <option>USD (US Dollar)</option>
              <option>PKR (Pakistani Rupee)</option>
            </select>
          </label>
          <label>
            <span>Date Format</span>
            <select defaultValue={systemSettingsFields.dateFormat || ''}>
              <option value="">Select date format</option>
              <option>DD MMM YYYY</option>
              <option>MM/DD/YYYY</option>
            </select>
          </label>
          <label>
            <span>Time Format</span>
            <select defaultValue={systemSettingsFields.timeFormat || ''}>
              <option value="">Select time format</option>
              <option>12 Hour (hh:mm AM/PM)</option>
              <option>24 Hour (hh:mm)</option>
            </select>
          </label>
          <label>
            <span>Fiscal Year Start</span>
            <select defaultValue={systemSettingsFields.fiscalYearStart || ''}>
              <option value="">Select month</option>
              <option>January</option>
              <option>April</option>
              <option>July</option>
            </select>
          </label>
          <label>
            <span>Tax Label</span>
            <input defaultValue={systemSettingsFields.taxLabel} />
          </label>
          <label>
            <span>Default Credit Limit (PKR)</span>
            <input defaultValue={systemSettingsFields.creditLimit} />
          </label>
          <label>
            <span>Items Per Page</span>
            <select defaultValue={systemSettingsFields.itemsPerPage || ''}>
              <option value="">Select count</option>
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </label>
        </div>

        <div className="settings-actions">
          <DemoActionButton message="System settings saved successfully.">
            <Save className="button-icon" />
            <span>Save Changes</span>
          </DemoActionButton>
        </div>
      </form>
      
      <ModuleToggles />
    </div>
  );
}
