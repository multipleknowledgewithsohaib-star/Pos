'use client';

import Link from 'next/link';
import { Crown, FileText, PackageCheck, RefreshCw } from 'lucide-react';
import { DemoActionButton } from '@/components/demo-submit-form';
import { PageHeader, StatusBadge } from '@/components/ui';
import { billingHistory, moduleAccess as initialModuleAccess, planDetails, usageLimits } from '@/lib/demo-data';
import { useEffect, useState } from 'react';
import {
  saveCoreSettingsToServer,
  syncCoreSettings,
  writeCoreSettings,
  type CoreSettings,
} from '@/lib/core-settings';
import { moduleNameToSettingsKey } from '@/lib/rbac';

export default function PlanSettingsPage() {
  const [settings, setSettings] = useState<CoreSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void syncCoreSettings().then((next) => setSettings(next));
  }, []);

  const handleToggle = async (moduleName: string) => {
    if (!settings) return;

    const key = moduleNameToSettingsKey(moduleName);
    if (!key) {
      return;
    }

    const nextSettings = { ...settings, [key]: !settings[key] };
    setSettings(nextSettings);
    setSaving(true);
    writeCoreSettings(nextSettings);
    await saveCoreSettingsToServer(nextSettings);
    setSaving(false);
  };

  return (
    <>
      <PageHeader
        title="Settings - Module Access / Plan"
        description="Manage plan details and module access for the selected client."
      />

      <section className="plan-card">
        <div className="plan-main">
          <div className="plan-icon">
            <Crown />
          </div>
          <div>
            <h2>{planDetails.name}</h2>
            <dl className="plan-details">
              <div>
                <dt>Status</dt>
                <dd><StatusBadge status={planDetails.status} /></dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{planDetails.duration}</dd>
              </div>
              <div>
                <dt>Auto Renew</dt>
                <dd>{planDetails.autoRenew}</dd>
              </div>
              <div>
                <dt>Next Renewal</dt>
                <dd>{planDetails.nextRenewal}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="plan-metrics">
          <span>Total Modules <strong>{planDetails.totalModules}</strong></span>
          <span>Active Modules <strong>{planDetails.activeModules}</strong></span>
          <span>Remaining Modules <strong>{planDetails.remainingModules}</strong></span>
          <span>Users Allowed <strong>{planDetails.usersAllowed}</strong></span>
          <span>Storage <strong>{planDetails.storage}</strong></span>
        </div>

        <div className="plan-actions">
          <DemoActionButton message="Upgrade request sent to billing.">
            <PackageCheck className="button-icon" />
            <span>Upgrade Plan</span>
          </DemoActionButton>
          <DemoActionButton message="Plan change request prepared." tone="secondary">
            <RefreshCw className="button-icon" />
            <span>Change Plan</span>
          </DemoActionButton>
          <Link className="button button-secondary" href="#billing">
            <FileText className="button-icon" />
            <span>View Invoices</span>
          </Link>
        </div>
      </section>

      <div className="tabs-row compact-tabs">
        <a className="tab-active" href="#access">Module Access</a>
        <a href="#plan">Plan Details</a>
        <a href="#usage">Usage &amp; Limits</a>
        <a href="#billing">Billing History</a>
      </div>

      <section className="table-panel" id="access">
        <div className="module-access-heading">
          <h2>Module Access</h2>
          <p>Enable or disable modules for this client.</p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Status</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {initialModuleAccess.map((module) => {
              const Icon = module.icon;
              let isChecked = module.access;

              if (settings) {
                const key = moduleNameToSettingsKey(module.name);
                if (key) {
                  isChecked = settings[key];
                }
              }

              return (
                <tr key={module.name}>
                  <td>
                    <div className="module-cell">
                      <Icon className="module-cell-icon" />
                      <span>{module.name}</span>
                    </div>
                  </td>
                  <td><StatusBadge status={isChecked ? 'Active' : 'Inactive'} /></td>
                  <td>
                    <label className="switch">
                      <input
                        checked={isChecked}
                        disabled={saving || !moduleNameToSettingsKey(module.name)}
                        type="checkbox"
                        onChange={() => void handleToggle(module.name)}
                      />
                      <span />
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="section-panel" id="plan">
        <div className="section-heading">
          <div>
            <h2>Plan Details</h2>
            <p>Subscription, renewal, storage, and module allowance details.</p>
          </div>
        </div>
        <div className="info-grid">
          <article>
            <span>Plan Name</span>
            <strong>{planDetails.name}</strong>
          </article>
          <article>
            <span>Duration</span>
            <strong>{planDetails.duration}</strong>
          </article>
          <article>
            <span>Auto Renew</span>
            <strong>{planDetails.autoRenew}</strong>
          </article>
          <article>
            <span>Next Renewal</span>
            <strong>{planDetails.nextRenewal}</strong>
          </article>
          <article>
            <span>Total Modules</span>
            <strong>{planDetails.totalModules}</strong>
          </article>
          <article>
            <span>Storage</span>
            <strong>{planDetails.storage}</strong>
          </article>
        </div>
      </section>

      <section className="section-panel" id="usage">
        <div className="section-heading">
          <div>
            <h2>Usage &amp; Limits</h2>
            <p>Current consumption against the selected plan limits.</p>
          </div>
        </div>
        {usageLimits.length ? (
          <div className="progress-list">
            {usageLimits.map((item) => {
              const percent = Math.round((item.used / item.total) * 100);
              return (
                <div className="progress-row" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.used.toLocaleString()} / {item.total.toLocaleString()} {item.suffix}</span>
                  </div>
                  <div className="progress-track">
                    <span className="progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <b>{percent}%</b>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="table-empty-cell">No usage limits configured yet.</div>
        )}
      </section>

      <section className="table-panel section-table" id="billing">
        <div className="module-access-heading">
          <h2>Billing History</h2>
          <p>Recent invoices for this client subscription.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {billingHistory.length ? (
              billingHistory.map((invoice) => (
                <tr key={invoice.invoice}>
                  <td>{invoice.invoice}</td>
                  <td>{invoice.date}</td>
                  <td>{invoice.amount}</td>
                  <td><span className="status-badge status-active">{invoice.status}</span></td>
                  <td><Link className="table-link table-link-inline" href="#billing">Download</Link></td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty-cell" colSpan={5}>No billing history found yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="note-bar">
        Changes to module access are applied instantly for all branches and module users on this network.
        {saving ? ' Saving...' : ''}
      </div>
    </>
  );
}
