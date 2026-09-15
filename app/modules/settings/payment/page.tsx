import Link from 'next/link';
import { Save } from 'lucide-react';
import { DemoActionButton } from '@/components/demo-submit-form';
import { FormPersistenceLoader } from '@/components/form-persistence';
import { SectionHero } from '@/components/section-hero';
import { paymentMethods, paymentSettings } from '@/lib/settings-content';

export default function PaymentSettingsPage() {
  return (
    <div className="settings-page">
      <SectionHero
        badge="11.12"
        eyebrow="PAYMENT SETTINGS"
        title="Payment Settings"
        description="Configure payment methods and preferences."
      />

      <form className="settings-grid settings-form-shell">
        <FormPersistenceLoader />
        <article className="settings-card settings-list-card">
          <div className="settings-heading">
            <h2>Payment Methods</h2>
          </div>
          <div className="settings-toggle-list">
            {paymentMethods.map((item) => (
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
            <h2>Method Preferences</h2>
          </div>
          <div className="settings-inline-fields">
            <label className="settings-inline-field field-span-full">
              <span>Default Payment Method</span>
              <select defaultValue={paymentSettings.defaultMethod || ''}>
                <option value="">Select payment method</option>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>JazzCash</option>
                <option>EasyPaisa</option>
              </select>
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Rounding</span>
              <select defaultValue={paymentSettings.rounding || ''}>
                <option value="">Select rounding</option>
                <option>No Rounding</option>
                <option>Round Up</option>
                <option>Round Down</option>
              </select>
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Sales Discount (%)</span>
              <input defaultValue={paymentSettings.salesDiscount} />
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Maximum Discount (%)</span>
              <input defaultValue={paymentSettings.maximumDiscount} />
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Receipt Footer Message</span>
              <textarea defaultValue={paymentSettings.footerMessage} rows={4} />
            </label>
          </div>
        </article>

        <div className="settings-actions settings-actions-wide">
          <Link className="button button-ghost" href="/modules/settings">
            Cancel
          </Link>
          <DemoActionButton message="Payment settings saved successfully.">
            <Save className="button-icon" />
            <span>Save Changes</span>
          </DemoActionButton>
        </div>
      </form>
    </div>
  );
}
