'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CheckCircle2, Download, Upload } from 'lucide-react';
import { getImportConfig, type ImportEntityConfig } from '@/lib/import-export-config';
import type { ImportEntity, ImportPreview } from '@/lib/import-export-types';
import { buildImportPreview } from '@/lib/import-export-validate';
import { downloadTemplate, parseWorkbookFile } from '@/lib/import-export-xlsx';
import { usePosStore } from '@/lib/pos-state';
import { usePurchaseStore } from '@/lib/purchase-state';
import { todayIso } from '@/lib/purchase-data';
import { ButtonLink } from '@/components/ui';
import { SectionHero } from '@/components/section-hero';

type Step = 'upload' | 'review' | 'success';

export function ImportExportImportFlow({ entity }: { entity: ImportEntity }) {
  const config = getImportConfig(entity);
  const { state: posState, addCustomer } = usePosStore();
  const { state: purchaseState, addSupplier } = usePurchaseStore();
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState({ imported: 0, skipped: 0 });

  const existingKeys = useMemo(() => {
    if (entity === 'customers') {
      return new Set(posState.customers.map((customer) => customer.phone.trim()));
    }
    if (entity === 'suppliers') {
      return new Set(purchaseState.suppliers.map((supplier) => supplier.phone.trim()));
    }
    return new Set<string>();
  }, [entity, posState.customers, purchaseState.suppliers]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');
    setBusy(true);
    setFileName(file.name);

    try {
      const rows = await parseWorkbookFile(file);
      if (!rows.length) {
        setError('No data rows found in the uploaded file.');
        setPreview(null);
        return;
      }

      const nextPreview = buildImportPreview(entity, rows);
      const duplicateFiltered = filterDuplicates(entity, nextPreview, existingKeys);
      setPreview(duplicateFiltered);
      setStep('review');
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Failed to read Excel file.');
      setPreview(null);
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  async function handleImport() {
    if (!preview?.valid.length) {
      setError('No valid records to import.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (entity === 'products' || entity === 'opening-stock') {
        const endpoint =
          entity === 'products'
            ? '/api/modules/import-export/products'
            : '/api/modules/import-export/opening-stock';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: preview.valid.map((row) => row.data) }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Import failed.');
        }
        setResult({ imported: payload.imported ?? 0, skipped: payload.skipped ?? 0 });
      }

      if (entity === 'customers') {
        let imported = 0;
        let skipped = 0;
        for (const row of preview.valid) {
          const phone = String(row.data.phone ?? '').trim();
          if (existingKeys.has(phone)) {
            skipped += 1;
            continue;
          }
          addCustomer({
            name: String(row.data.name ?? '').trim(),
            phone,
            email: String(row.data.email ?? '').trim(),
            address: String(row.data.address ?? '').trim(),
            note: String(row.data.notes ?? '').trim(),
          });
          existingKeys.add(phone);
          imported += 1;
        }
        setResult({ imported, skipped });
      }

      if (entity === 'suppliers') {
        let imported = 0;
        let skipped = 0;
        for (const row of preview.valid) {
          const phone = String(row.data.phone ?? '').trim();
          if (existingKeys.has(phone)) {
            skipped += 1;
            continue;
          }
          addSupplier({
            name: String(row.data.name ?? '').trim(),
            phone,
            email: String(row.data.email ?? '').trim(),
            city: String(row.data.city ?? '').trim(),
            contactPerson: String(row.data.contactPerson ?? '').trim(),
            status: String(row.data.status ?? 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
            notes: String(row.data.notes ?? '').trim(),
            balance: 0,
            lastOrderDate: todayIso(),
          });
          existingKeys.add(phone);
          imported += 1;
        }
        setResult({ imported, skipped });
      }

      setStep('success');
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="import-export-page">
      <SectionHero
        badge="Import"
        eyebrow="ADMINISTRATION"
        title={config.title}
        description={config.description}
        backHref="/modules/administration/import-export"
        backLabel="Back to Import / Export"
      />

      <ImportSteps current={step} />

      {error ? <p className="import-export-error" role="alert">{error}</p> : null}

      {step === 'upload' ? (
        <ImportUploadStep busy={busy} config={config} fileName={fileName} onFileChange={handleFileChange} />
      ) : null}

      {step === 'review' && preview ? (
        <ImportReviewStep
          busy={busy}
          preview={preview}
          onCancel={() => {
            setStep('upload');
            setPreview(null);
            setFileName('');
          }}
          onImport={() => void handleImport()}
        />
      ) : null}

      {step === 'success' ? (
        <ImportSuccessStep imported={result.imported} skipped={result.skipped} />
      ) : null}
    </div>
  );
}

function ImportSteps({ current }: { current: Step }) {
  const steps = [
    { id: 'upload', label: 'Upload File' },
    { id: 'review', label: 'Review & Confirm' },
    { id: 'success', label: 'Import Success' },
  ] as const;

  return (
    <ol className="import-export-steps">
      {steps.map((step, index) => {
        const active = step.id === current;
        const done = steps.findIndex((item) => item.id === current) > index;
        return (
          <li className={active ? 'active' : done ? 'done' : ''} key={step.id}>
            <span>{index + 1}</span>
            <strong>{step.label}</strong>
          </li>
        );
      })}
    </ol>
  );
}

function ImportUploadStep({
  config,
  fileName,
  busy,
  onFileChange,
}: {
  config: ImportEntityConfig;
  fileName: string;
  busy: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="import-export-panel">
      <div className="import-export-panel-block">
        <h2>Step 1: Download Template</h2>
        <p>Use the official Excel template. Do not rename columns.</p>
        <button
          className="button button-primary"
          type="button"
          onClick={() => downloadTemplate(config.templateFile, config.columns, config.sampleRows)}
        >
          <Download />
          Download Template
        </button>
        <div className="import-export-template-preview">
          <table>
            <thead>
              <tr>
                {config.columns.map((column) => (
                  <th key={column.key}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.sampleRows.map((row, index) => (
                <tr key={index}>
                  {config.columns.map((column) => (
                    <td key={column.key}>{String(row[column.header] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="import-export-panel-block">
        <h2>Step 2: Upload Excel File</h2>
        <p>Supported formats: .xlsx and .csv</p>
        <label className="import-export-upload">
          <Upload />
          <span>{fileName || 'Choose File'}</span>
          <input accept=".xlsx,.xls,.csv" disabled={busy} type="file" onChange={onFileChange} />
        </label>
        {busy ? <p className="import-export-muted">Reading file...</p> : null}
      </div>
    </section>
  );
}

function ImportReviewStep({
  preview,
  busy,
  onImport,
  onCancel,
}: {
  preview: ImportPreview;
  busy: boolean;
  onImport: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="import-export-panel">
      <div className="import-export-summary-grid">
        <article>
          <span>Total Records Found</span>
          <strong>{preview.total}</strong>
        </article>
        <article className="tone-green">
          <span>Valid Records</span>
          <strong>{preview.valid.length}</strong>
        </article>
        <article className="tone-red">
          <span>Invalid Records</span>
          <strong>{preview.invalid.length}</strong>
        </article>
      </div>

      {preview.invalid.length ? (
        <div className="import-export-invalid">
          <h3>Invalid Records</h3>
          <div className="import-export-invalid-table">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {preview.invalid.slice(0, 20).map((row) => (
                  <tr key={row.row}>
                    <td>{row.row}</td>
                    <td>{row.errors.join(' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="import-export-confirm">
        <p>Do you want to import valid records?</p>
        <div className="import-export-confirm-actions">
          <button className="button button-outline" disabled={busy} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="button button-primary" disabled={busy || !preview.valid.length} type="button" onClick={onImport}>
            {busy ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </section>
  );
}

function ImportSuccessStep({ imported, skipped }: { imported: number; skipped: number }) {
  return (
    <section className="import-export-success">
      <CheckCircle2 />
      <h2>Import Completed Successfully!</h2>
      <p>
        {imported} records imported successfully.
        {skipped ? ` ${skipped} records were skipped.` : ''}
      </p>
      <ButtonLink href="/modules/administration/import-export">Back to Import / Export</ButtonLink>
    </section>
  );
}

function filterDuplicates(
  entity: ImportEntity,
  preview: ImportPreview,
  existingKeys: Set<string>,
): ImportPreview {
  if (entity !== 'customers' && entity !== 'suppliers') {
    return preview;
  }

  const valid: ImportPreview['valid'] = [];
  const invalid = [...preview.invalid];

  for (const row of preview.valid) {
    const phone = String(row.data.phone ?? '').trim();
    if (existingKeys.has(phone)) {
      invalid.push({
        ...row,
        valid: false,
        errors: [...row.errors, 'Duplicate phone number — skipped.'],
      });
      continue;
    }
    valid.push(row);
  }

  return {
    total: preview.total,
    valid,
    invalid,
  };
}
