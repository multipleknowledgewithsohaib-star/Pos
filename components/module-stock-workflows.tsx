'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

type MedicineItem = {
  id: number;
  medicineName: string;
  stock: number;
  lowStock: number;
};

type BatchItem = {
  medicineName?: string;
  batchNo: string;
  stock: number;
  expiryDate: string;
  purchasePrice: number;
};

type BatchPayload = {
  data?: {
    rows?: BatchItem[];
  };
};

function numberValue(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function StockAdjustmentFormClient() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [medicineResponse, batchResponse] = await Promise.all([
          fetch('/api/modules/inventory', { cache: 'no-store' }),
          fetch('/api/modules/inventory/batches', { cache: 'no-store' }),
        ]);
        const medicinePayload = (await medicineResponse.json()) as { data?: MedicineItem[] };
        const batchPayload = (await batchResponse.json()) as BatchPayload;

        if (!cancelled) {
          setMedicines((medicinePayload.data ?? []).filter((item) => item.id && item.medicineName));
          setBatches(batchPayload.data?.rows ?? []);
        }
      } catch {
        if (!cancelled) {
          setMessage('Inventory data load nahi ho saka.');
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedMedicine = medicines.find((medicine) => String(medicine.id) === selectedMedicineId) ?? null;
  const medicineBatches = useMemo(() => {
    if (!selectedMedicine) {
      return batches;
    }

    const selectedName = normalizeName(selectedMedicine.medicineName);
    return batches.filter((batch) => !batch.medicineName || normalizeName(batch.medicineName) === selectedName);
  }, [batches, selectedMedicine]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMedicine) {
      setMessage('Medicine select karein.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const qty = numberValue(form.get('quantity'));
    const type = String(form.get('type') ?? '');
    const batchNo = String(form.get('batchNo') ?? '');
    if (!qty || !type) {
      setMessage('Adjustment type aur quantity zaroori hai.');
      return;
    }

    const nextStock = type === 'Decrease'
      ? Math.max(0, selectedMedicine.stock - qty)
      : selectedMedicine.stock + qty;

    setBusy(true);
    setMessage('');

    try {
      const medicineResponse = await fetch(`/api/modules/inventory/${selectedMedicine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: nextStock }),
      });
      if (!medicineResponse.ok) {
        throw new Error('medicine update failed');
      }

      const batch = batches.find((item) => item.batchNo === batchNo);
      if (batch) {
        const nextBatchStock = type === 'Decrease' ? Math.max(0, batch.stock - qty) : batch.stock + qty;
        await fetch(`/api/modules/inventory/batches/${encodeURIComponent(batch.batchNo)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: nextBatchStock }),
        });
      }

      setMedicines((current) =>
        current.map((medicine) =>
          medicine.id === selectedMedicine.id ? { ...medicine, stock: nextStock } : medicine,
        ),
      );
      setBatches((current) =>
        current.map((item) => {
          if (item.batchNo !== batchNo) {
            return item;
          }
          return {
            ...item,
            stock: type === 'Decrease' ? Math.max(0, item.stock - qty) : item.stock + qty,
          };
        }),
      );
      setMessage(`${selectedMedicine.medicineName} stock updated: ${selectedMedicine.stock} -> ${nextStock}`);
    } catch {
      setMessage('Stock adjust nahi ho saka. Dobara try karein.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="module-stock-adjustment-form" onSubmit={handleSubmit}>
      <label className="module-field">
        <span>Medicine <b>*</b></span>
        <div className="module-select-shell">
          <select required value={selectedMedicineId} onChange={(event) => setSelectedMedicineId(event.target.value)}>
            <option disabled value="">
              Select medicine
            </option>
            {medicines.map((medicine) => (
              <option key={medicine.id} value={medicine.id}>
                {medicine.medicineName} ({medicine.stock})
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      </label>

      <label className="module-field">
        <span>Batch No.</span>
        <div className="module-select-shell">
          <select defaultValue="" name="batchNo">
            <option value="">No batch selected</option>
            {medicineBatches.map((batch) => (
              <option key={batch.batchNo} value={batch.batchNo}>
                {batch.batchNo} ({batch.stock})
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      </label>

      <label className="module-field">
        <span>Adjustment Type <b>*</b></span>
        <div className="module-select-shell">
          <select defaultValue="" name="type" required>
            <option disabled value="">
              Select type
            </option>
            <option>Increase</option>
            <option>Decrease</option>
          </select>
          <ChevronDown />
        </div>
      </label>

      <label className="module-field">
        <span>Quantity <b>*</b></span>
        <div className="module-control-shell">
          <input min="1" name="quantity" placeholder="Enter quantity" required type="number" />
        </div>
      </label>

      <label className="module-field module-full-width">
        <span>Reason</span>
        <div className="module-control-shell module-textarea-shell">
          <textarea name="reason" placeholder="Enter reason" rows={6} />
        </div>
      </label>

      {message ? <div className="module-form-status module-full-width" role="status">{message}</div> : null}

      <div className="module-form-actions module-full-width">
        <Link href="/modules/inventory">Cancel</Link>
        <button disabled={busy} type="submit">{busy ? 'Updating...' : 'Adjust Stock'}</button>
      </div>
    </form>
  );
}

export function StockTransferFormClient() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadMedicines() {
      try {
        const response = await fetch('/api/modules/inventory', { cache: 'no-store' });
        const payload = (await response.json()) as { data?: MedicineItem[] };
        if (!cancelled) {
          setMedicines(payload.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setMessage('Inventory data load nahi ho saka.');
        }
      }
    }

    void loadMedicines();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const medicineId = String(form.get('medicineId') ?? '');
    const qty = numberValue(form.get('quantity'));
    const fromBranch = String(form.get('fromBranch') ?? '');
    const toBranch = String(form.get('toBranch') ?? '');
    const medicine = medicines.find((item) => String(item.id) === medicineId);

    if (!medicine || !qty || !fromBranch || !toBranch || fromBranch === toBranch) {
      setMessage('Valid medicine, quantity, aur different branches select karein.');
      return;
    }

    if (qty > medicine.stock) {
      setMessage(`${medicine.medicineName} stock ${medicine.stock} hai. Transfer qty ${qty} nahi ho sakti.`);
      return;
    }

    const transferRecord = {
      id: `transfer-${Date.now()}`,
      medicineId,
      medicineName: medicine.medicineName,
      qty,
      fromBranch,
      toBranch,
      note: String(form.get('note') ?? ''),
      createdAt: new Date().toISOString(),
    };
    const storageKey = 'pharma-stock-transfers';
    const existing = JSON.parse(window.localStorage.getItem(storageKey) || '[]') as unknown[];
    window.localStorage.setItem(storageKey, JSON.stringify([transferRecord, ...existing]));
    setMessage(`${medicine.medicineName} ki ${qty} qty ${fromBranch} se ${toBranch} transfer record ho gayi.`);
  }

  return (
    <form className="module-stock-transfer-form" onSubmit={handleSubmit}>
      <label className="module-field">
        <span>From Branch <b>*</b></span>
        <div className="module-select-shell">
          <select defaultValue="" name="fromBranch" required>
            <option disabled value="">Select branch</option>
            <option>Main Branch</option>
            <option>Branch 2</option>
            <option>Branch 3</option>
          </select>
          <ChevronDown />
        </div>
      </label>

      <label className="module-field">
        <span>To Branch <b>*</b></span>
        <div className="module-select-shell">
          <select defaultValue="" name="toBranch" required>
            <option disabled value="">Select branch</option>
            <option>Branch 2</option>
            <option>Branch 3</option>
            <option>Main Branch</option>
          </select>
          <ChevronDown />
        </div>
      </label>

      <label className="module-field">
        <span>Medicine <b>*</b></span>
        <div className="module-select-shell">
          <select defaultValue="" name="medicineId" required>
            <option disabled value="">Select medicine</option>
            {medicines.map((medicine) => (
              <option key={medicine.id} value={medicine.id}>
                {medicine.medicineName} ({medicine.stock})
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      </label>

      <label className="module-field">
        <span>Quantity <b>*</b></span>
        <div className="module-control-shell">
          <input min="1" name="quantity" placeholder="Enter quantity" required type="number" />
        </div>
      </label>

      <label className="module-field module-full-width">
        <span>Note</span>
        <div className="module-control-shell module-textarea-shell">
          <textarea name="note" placeholder="Enter note (optional)" rows={4} />
        </div>
      </label>

      {message ? <div className="module-form-status module-full-width" role="status">{message}</div> : null}

      <div className="module-form-actions module-full-width">
        <Link href="/modules/inventory">Cancel</Link>
        <button type="submit">Transfer Stock</button>
      </div>
    </form>
  );
}