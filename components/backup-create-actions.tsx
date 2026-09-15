'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, CloudUpload } from 'lucide-react';
import { buildDataSummary, createBackup } from '@/lib/backup-store';

export function BackupCreateActions() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const summary = useMemo(() => buildDataSummary(), []);
  const estimatedSize = useMemo(() => {
    const products = Number(summary.find((row) => row.label === 'Products')?.value ?? '0');
    return `${(products / 120).toFixed(1)} MB`;
  }, [summary]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('backupName') ?? '');
    const description = String(formData.get('backupDescription') ?? '');
    const record = createBackup({ name, description });
    setMessage('Backup created successfully.');
    router.push(`/modules/backup-restore/details/${record.slug}`);
  }

  return (
    <form className="backup-create-grid" onSubmit={handleSubmit}>
      <section className="section-panel backup-create-form">
        <div className="form-fields">
          <label className="field-span-full">
            <span>Backup Name</span>
            <input name="backupName" placeholder="pharma-backup-2026-06-03" />
          </label>
          <label className="field-span-full">
            <span>Backup Description (Optional)</span>
            <textarea name="backupDescription" rows={4} />
          </label>
        </div>

        <div className="settings-heading backup-subheading">
          <h2>Include in Backup</h2>
        </div>

        <div className="check-list backup-check-list">
          {[
            'All Data (Recommended)',
            'Inventory Data',
            'Customer Data',
            'Supplier Data',
            'Transaction Data',
            'Settings & Configuration',
          ].map((item) => (
            <label key={item}>
              <input defaultChecked name="backupItems" type="checkbox" value={item} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>

      <aside className="section-panel backup-summary-panel">
        <div className="section-heading">
          <div>
            <h2>Backup Information</h2>
          </div>
        </div>

        <div className="backup-info-list">
          <div className="backup-info-row">
            <span>Estimated Size</span>
            <strong>{estimatedSize}</strong>
          </div>
          <div className="backup-info-row">
            <span>Compression</span>
            <strong>gzip</strong>
          </div>
          <div className="backup-info-row">
            <span>Encryption</span>
            <strong>AES-256</strong>
          </div>
          <div className="backup-info-row">
            <span>Estimated Time</span>
            <strong>2-4 min</strong>
          </div>
        </div>
      </aside>

      <div className="backup-create-actions">
        <Link className="button button-ghost" href="/modules/backup-restore">
          Cancel
        </Link>
        <button className="button button-primary" type="submit">
          <CloudUpload className="button-icon" />
          <span>Create Backup</span>
        </button>
      </div>

      {message ? (
        <div className="success-banner form-section-wide" role="status">
          <CheckCircle2 />
          <span>{message}</span>
        </div>
      ) : null}
    </form>
  );
}
