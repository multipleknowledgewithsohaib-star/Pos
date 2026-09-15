'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Medicine } from '@/lib/module-data';

const categorySuggestions = [
  'General Items',
  'OTC Product',
  'Other Option',
  'Medicine',
  'Prescription Medicine',
  'Baby Care',
  'Pain Relief',
  'Antibiotic',
  'Antihistamine',
  'Gastric',
  'Supplement',
  'Diabetes',
  'Respiratory',
];

type ModuleInventoryFormProps = {
  medicine?: Medicine;
  cancelHref?: string;
  redirectTo?: string;
  mode?: 'create' | 'edit';
  submitLabel?: string;
};

export function ModuleInventoryForm({
  medicine,
  cancelHref = '/modules/inventory/medicines',
  redirectTo = '/modules/inventory/medicines',
  mode = 'create',
  submitLabel,
}: ModuleInventoryFormProps = {}) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('saving');
    const form = new FormData(event.currentTarget);
    let response: Response;
    const endpoint = mode === 'edit' && medicine ? `/api/modules/inventory/${medicine.id}` : '/api/modules/inventory';

    try {
      response = await fetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineName: form.get('medicineName'),
          genericName: form.get('genericName'),
          category: form.get('category'),
          unit: form.get('unit'),
          purchasePrice: form.get('purchasePrice'),
          price: form.get('price'),
          stock: form.get('stock'),
          lowStock: form.get('lowStock'),
          description: form.get('description'),
          active: form.get('active') === 'on',
        }),
      });
    } catch {
      setState('error');
      return;
    }

    if (!response.ok) {
      setState('error');
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form className="module-medicine-form" onSubmit={handleSubmit}>
      <label>
        <span>Medicine Name <b>*</b></span>
        <input defaultValue={medicine?.medicineName ?? ''} name="medicineName" placeholder="Enter medicine name" required />
      </label>
      <label>
        <span>Generic Name</span>
        <input defaultValue={medicine?.genericName ?? ''} name="genericName" placeholder="Enter generic name" />
      </label>
      <label>
        <span>Category <b>*</b></span>
        <input
          defaultValue={medicine?.category ?? ''}
          list="medicine-category-options"
          name="category"
          placeholder="Type or choose a category"
          required
        />
        <datalist id="medicine-category-options">
          {categorySuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <span className="module-field-hint">Type your own category if you want a custom value.</span>
      </label>
      <label>
        <span>Unit Type <b>*</b></span>
        <select defaultValue={medicine?.unit ?? ''} name="unit" required>
          <option disabled value="">Select unit type</option>
          <option>Tablet</option>
          <option>Capsule</option>
          <option>Syrup</option>
          <option>Injection</option>
          <option>Inhaler</option>
        </select>
      </label>
      <label>
        <span>Purchase Price (PKR) <b>*</b></span>
        <input defaultValue={medicine?.purchasePrice ?? ''} min="0" name="purchasePrice" placeholder="Enter purchase price" required type="number" />
      </label>
      <label>
        <span>Sale Price (PKR) <b>*</b></span>
        <input defaultValue={medicine?.price ?? ''} min="0" name="price" placeholder="Enter sale price" required type="number" />
      </label>
      <label>
        <span>Current Stock <b>*</b></span>
        <input defaultValue={medicine?.stock ?? 0} min="0" name="stock" placeholder="Enter current stock" required type="number" />
      </label>
      <label>
        <span>Low Stock Alert <b>*</b></span>
        <input defaultValue={medicine?.lowStock ?? ''} min="0" name="lowStock" placeholder="Enter low stock quantity" required type="number" />
      </label>
      <label>
        <span>Medicine Kis Liye Hai / Notes</span>
        <textarea
          defaultValue={medicine?.description ?? ''}
          name="description"
          placeholder="Example: fever, pain relief, cough, stomach issues, or any special notes"
          rows={4}
        />
      </label>
      <div className="module-form-active-row">
        <label>
          <input defaultChecked={medicine?.active ?? true} name="active" type="checkbox" />
          <span>Active</span>
        </label>
      </div>

      {state === 'error' ? <p className="module-form-error">Medicine save nahi hui. Dobara try karein.</p> : null}

      <div className="module-form-actions">
        <Link href={cancelHref}>Cancel</Link>
        <button disabled={state === 'saving'} type="submit">
          {state === 'saving'
            ? mode === 'edit'
              ? 'Updating...'
              : 'Saving...'
            : submitLabel ?? (mode === 'edit' ? 'Update Medicine' : 'Save Medicine')}
        </button>
      </div>
    </form>
  );
}
