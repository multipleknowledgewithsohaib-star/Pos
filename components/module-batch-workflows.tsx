'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronDown, PencilLine, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { BatchRecord } from '@/lib/module-batch-store';

type BatchFormMode = 'create' | 'edit';

type BatchFormProps = {
  cancelHref: string;
  redirectTo: string;
  medicineName: string;
  mode: BatchFormMode;
  batch?: BatchRecord;
  submitLabel?: string;
};

export function BatchForm({
  batch,
  cancelHref,
  redirectTo,
  medicineName,
  mode,
  submitLabel,
}: BatchFormProps) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('saving');

    const form = new FormData(event.currentTarget);
    const endpoint =
      mode === 'edit' && batch ? `/api/modules/inventory/batches/${encodeURIComponent(batch.batchNo)}` : '/api/modules/inventory/batches';

    try {
      const response = await fetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineName,
          batchNo: form.get('batchNo'),
          mfgDate: form.get('mfgDate'),
          expiryDate: form.get('expiryDate'),
          purchasePrice: form.get('purchasePrice'),
          quantity: form.get('quantity'),
          supplier: form.get('supplier'),
        }),
      });

      if (!response.ok) {
        setState('error');
        return;
      }
    } catch {
      setState('error');
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form className="module-batch-form" onSubmit={handleSubmit}>
      <div className="module-readonly-card module-full-width">
        <span>Medicine</span>
        <strong>{medicineName}</strong>
      </div>

      <label className="module-field">
        <span>Batch No. <b>*</b></span>
        <div className="module-control-shell">
          <input
            defaultValue={batch?.batchNo ?? ''}
            name="batchNo"
            placeholder="Enter batch number"
            readOnly={mode === 'edit'}
            required
            type="text"
          />
        </div>
      </label>

      <label className="module-field">
        <span>Mfg. Date <b>*</b></span>
        <div className="module-control-shell">
          <input defaultValue={batch?.mfgDate ?? ''} name="mfgDate" placeholder="dd/mm/yyyy" required type="text" />
          <CalendarDays />
        </div>
      </label>

      <label className="module-field">
        <span>Expiry Date <b>*</b></span>
        <div className="module-control-shell">
          <input defaultValue={batch?.expiryDate ?? ''} name="expiryDate" placeholder="dd/mm/yyyy" required type="text" />
          <CalendarDays />
        </div>
      </label>

      <label className="module-field">
        <span>Purchase Price (PKR) <b>*</b></span>
        <div className="module-control-shell">
          <input
            defaultValue={batch?.purchasePrice ?? ''}
            min="0"
            name="purchasePrice"
            placeholder="Enter purchase price"
            required
            type="number"
          />
        </div>
      </label>

      <label className="module-field">
        <span>Quantity <b>*</b></span>
        <div className="module-control-shell">
          <input defaultValue={batch?.stock ?? ''} min="0" name="quantity" placeholder="Enter quantity" required type="number" />
        </div>
      </label>

      <label className="module-field">
        <span>Supplier</span>
        <div className="module-select-shell">
          <select defaultValue={batch?.supplier ?? ''} name="supplier">
            <option disabled value="">
              Select supplier (optional)
            </option>
            <option>MediPlus</option>
            <option>HealthCare</option>
            <option>City Pharma</option>
          </select>
          <ChevronDown />
        </div>
      </label>

      {state === 'error' ? <p className="module-form-error module-full-width">Batch save nahi hui. Dobara try karein.</p> : null}

      <div className="module-form-actions module-full-width">
        <Link href={cancelHref}>Cancel</Link>
        <button disabled={state === 'saving'} type="submit">
          {state === 'saving' ? (mode === 'edit' ? 'Updating...' : 'Saving...') : submitLabel ?? (mode === 'edit' ? 'Update Batch' : 'Save Batch')}
        </button>
      </div>
    </form>
  );
}

type BatchRowActionsProps = {
  batchNo: string;
};

export function BatchRowActions({ batchNo }: BatchRowActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'deleting' | 'error'>('idle');

  async function handleDelete() {
    const confirmed = window.confirm('Are you sure you want to delete this batch?');
    if (!confirmed) return;

    setState('deleting');

    try {
      const response = await fetch(`/api/modules/inventory/batches/${encodeURIComponent(batchNo)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setState('error');
        return;
      }
    } catch {
      setState('error');
      return;
    }

    router.refresh();
  }

  return (
    <div className="module-row-actions">
      <Link
        className="module-inline-icon module-inline-icon-primary"
        href={`/modules/inventory/batch-details/${encodeURIComponent(batchNo)}/edit`}
        aria-label={`Edit ${batchNo}`}
      >
        <PencilLine />
      </Link>
      <button
        className="module-inline-icon module-inline-icon-danger"
        type="button"
        aria-label={`Delete ${batchNo}`}
        disabled={state === 'deleting'}
        onClick={handleDelete}
      >
        <Trash2 />
      </button>
    </div>
  );
}
