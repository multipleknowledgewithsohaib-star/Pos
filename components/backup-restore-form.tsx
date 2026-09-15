'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { listBackups } from '@/lib/backup-store';

export function BackupRestoreForm() {
  const backups = useMemo(() => listBackups().filter((backup) => backup.status === 'Success'), []);
  const [selected, setSelected] = useState(backups[0]?.slug ?? '');
  const [message, setMessage] = useState('');

  function handleRestore() {
    const backup = backups.find((row) => row.slug === selected);
    if (!backup) {
      setMessage('Select a backup to restore.');
      return;
    }

    setMessage(`Restore queued for ${backup.name}.`);
  }

  return (
    <form
      className="backup-restore-grid"
      onSubmit={(event) => {
        event.preventDefault();
        handleRestore();
      }}
    >
      <section className="section-panel">
        <div className="form-fields">
          <label className="field-span-full">
            <span>Select Backup</span>
            <select value={selected} onChange={(event) => setSelected(event.target.value)}>
              {backups.length ? (
                backups.map((backup) => (
                  <option key={backup.slug} value={backup.slug}>
                    {backup.name} ({backup.datetime})
                  </option>
                ))
              ) : (
                <option value="">No backups available</option>
              )}
            </select>
          </label>
        </div>

        <div className="backup-create-actions">
          <Link className="button button-ghost" href="/modules/backup-restore">
            Cancel
          </Link>
          <button className="button button-success" disabled={!backups.length} type="submit">
            <RotateCcw className="button-icon" />
            <span>Restore Backup</span>
          </button>
        </div>

        {message ? (
          <div className="success-banner form-section-wide" role="status">
            <CheckCircle2 />
            <span>{message}</span>
          </div>
        ) : null}
      </section>
    </form>
  );
}
