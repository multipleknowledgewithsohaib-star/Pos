import Link from 'next/link';
import { Save } from 'lucide-react';
import { DemoActionButton } from '@/components/demo-submit-form';
import { FormPersistenceLoader } from '@/components/form-persistence';
import { SectionHero } from '@/components/section-hero';
import { securitySettings, securityToggles } from '@/lib/settings-content';

export default function SecuritySettingsPage() {
  return (
    <div className="settings-page">
      <SectionHero
        badge="11.13"
        eyebrow="SECURITY SETTINGS"
        title="Security Settings"
        description="Configure security preferences."
      />

      <form className="section-panel settings-security-panel">
        <FormPersistenceLoader />
        <div className="settings-toggle-list settings-toggle-list-compact">
          {securityToggles.map((item) => (
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

          <div className="settings-inline-fields settings-inline-fields-security">
            <label className="settings-inline-field field-span-full">
              <span>Session Timeout (Minutes)</span>
              <input defaultValue={securitySettings.sessionTimeout} />
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Login Attempt Limit</span>
              <input defaultValue={securitySettings.loginAttempts} />
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Password Expiry (Days)</span>
              <input defaultValue={securitySettings.passwordExpiry} />
            </label>
          </div>
        </div>

        <div className="settings-actions">
          <Link className="button button-ghost" href="/modules/settings">
            Cancel
          </Link>
          <DemoActionButton message="Security settings saved successfully.">
            <Save className="button-icon" />
            <span>Save Changes</span>
          </DemoActionButton>
        </div>
      </form>
    </div>
  );
}
