import Link from 'next/link';
import {
  BadgeDollarSign,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  CircleX,
  Eye,
  Package,
  PackageCheck,
  TriangleAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  moduleBatchSummary,
  moduleHistoryItems,
  type Medicine,
  type ModuleSummaryCard,
} from '@/lib/module-data';
import { readBatchSnapshot } from '@/lib/module-batch-store';
import { readMedicines } from '@/lib/module-inventory-store';
import { BatchForm, BatchRowActions } from '@/components/module-batch-workflows';
import { InventoryHistoryTableClient } from '@/components/module-history-table';
import { StockAdjustmentFormClient, StockTransferFormClient } from '@/components/module-stock-workflows';

const summaryIcons = {
  inventory: Package,
  stock: PackageCheck,
  alert: TriangleAlert,
  out: CircleX,
  expiring: CalendarClock,
  value: BadgeDollarSign,
} as const;

export function InventoryPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <section className="module-inventory-head">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="module-inventory-head-actions">{actions}</div> : null}
    </section>
  );
}

function formatMetric(value: number) {
  return value.toLocaleString('en-US');
}

function moneyMetric(value: number) {
  return Math.round(value).toLocaleString('en-US');
}

function activeMedicines(medicines: Medicine[]) {
  return medicines.filter((medicine) => medicine.active !== false);
}

function buildInventorySummaryCards(medicines: Medicine[], batchStockTotal: number): ModuleSummaryCard[] {
  const active = activeMedicines(medicines);
  const medicineStockTotal = active.reduce((sum, medicine) => sum + Math.max(0, Number(medicine.stock) || 0), 0);
  const totalStock = Math.max(medicineStockTotal, batchStockTotal);
  const lowStockCount = active.filter((medicine) => {
    const stock = Math.max(0, Number(medicine.stock) || 0);
    const lowStock = Math.max(0, Number(medicine.lowStock) || 0);
    return stock > 0 && stock <= lowStock;
  }).length;
  const outOfStockCount = active.filter((medicine) => Math.max(0, Number(medicine.stock) || 0) <= 0).length;
  const totalValue = active.reduce(
    (sum, medicine) => sum + Math.max(0, Number(medicine.stock) || 0) * Math.max(0, Number(medicine.price) || 0),
    0,
  );

  return [
    { label: 'Total Items', value: formatMetric(active.length), tone: 'blue', icon: 'inventory', href: '/modules/inventory/medicines' },
    { label: 'Total Stock (Items)', value: formatMetric(totalStock), tone: 'green', icon: 'stock', href: '/modules/inventory/batch-details' },
    { label: 'Low Stock Items', value: formatMetric(lowStockCount), tone: 'orange', icon: 'alert', href: '/modules/inventory/low-stock' },
    { label: 'Out of Stock Items', value: formatMetric(outOfStockCount), tone: 'red', icon: 'out', href: '/modules/inventory/low-stock' },
    { label: 'Expiring Soon', value: formatMetric(0), tone: 'purple', icon: 'expiring', href: '/modules/inventory/expiring-soon' },
    { label: 'Total Value (PKR)', value: moneyMetric(totalValue), tone: 'sky', icon: 'value', href: '/modules/inventory/history' },
  ];
}

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysUntil(value: string) {
  const expiry = parseDate(value);
  if (!expiry) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

export async function InventorySummaryCards() {
  const [medicines, batchSnapshot] = await Promise.all([readMedicines(), readBatchSnapshot()]);
  const expiringSoon = batchSnapshot.rows.filter((row) => {
    const days = daysUntil(row.expiryDate);
    return days !== null && days >= 0 && days <= 90;
  }).length;
  const cards = buildInventorySummaryCards(medicines, batchSnapshot.totalStock).map((card) =>
    card.label === 'Expiring Soon' ? { ...card, value: formatMetric(expiringSoon) } : card,
  );

  return (
    <section className="module-summary-grid" aria-label="Inventory summary metrics">
      {cards.map((card) => {
        const Icon = summaryIcons[card.icon];

        return (
          <Link
            aria-label={`Open ${card.label}`}
            className={`module-summary-card module-summary-${card.tone}`}
            href={card.href}
            key={card.label}
          >
            <i aria-hidden="true">
              <Icon />
            </i>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export async function ExpiringSoonTable() {
  const snapshot = await readBatchSnapshot();
  const items = snapshot.rows
    .map((row) => {
      const daysLeft = daysUntil(row.expiryDate);
      return daysLeft === null ? null : { ...row, daysLeft };
    })
    .filter((row): row is NonNullable<typeof row> => {
      if (!row) {
        return false;
      }
      return row.daysLeft >= 0 && row.daysLeft <= 90;
    })
    .sort((left, right) => left.daysLeft - right.daysLeft);

  return (
    <>
      <section className="module-detail-table-card">
        <table className="module-detail-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Batch No.</th>
              <th>Expiry Date</th>
              <th>Days Left</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((item) => (
              <tr key={item.batchNo}>
                <td>{item.medicineName || snapshot.medicineName}</td>
                <td>{item.batchNo}</td>
                <td>{item.expiryDate}</td>
                <td>
                  <span className={`module-days-left module-days-left-${item.daysLeft <= 30 ? 'orange' : 'green'}`}>
                    {item.daysLeft}
                  </span>
                </td>
                <td>
                  <Link
                    className="module-inline-icon"
                    href={`/modules/inventory/batch-details/${encodeURIComponent(item.batchNo)}`}
                    aria-label={`View ${item.medicineName || item.batchNo}`}
                  >
                    <Eye />
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="module-empty-cell" colSpan={5}>No expiring batches found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="module-centered-cta">
        <Link className="module-page-button module-page-button-primary" href="/modules/inventory/batch-details">
          View All Expiring
        </Link>
      </div>
    </>
  );
}

export async function LowStockTable() {
  const medicines = activeMedicines(await readMedicines())
    .filter((medicine) => {
      const stock = Math.max(0, Number(medicine.stock) || 0);
      const lowStock = Math.max(0, Number(medicine.lowStock) || 0);
      return stock <= lowStock;
    })
    .sort((left, right) => left.stock - right.stock);

  return (
    <>
      <section className="module-detail-table-card">
        <table className="module-detail-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Batch No.</th>
              <th>Stock</th>
              <th>Low Stock Alert</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {medicines.length ? medicines.map((item) => (
              <tr key={item.id}>
                <td>{item.medicineName}</td>
                <td>-</td>
                <td>{item.stock}</td>
                <td>
                  <span className="module-alert-box">{item.lowStock}</span>
                </td>
                <td>
                  <span className={`module-status-pill ${item.status === 'Out of Stock' ? 'out' : 'low'}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="module-empty-cell" colSpan={5}>No low stock items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="module-centered-cta">
        <Link className="module-page-button module-page-button-primary" href="/modules/inventory">
          View All Inventory
        </Link>
      </div>
    </>
  );
}

export function InventoryHistoryTable() {
  return <InventoryHistoryTableClient items={moduleHistoryItems} />;
}

export async function BatchStockDetails() {
  const snapshot = await readBatchSnapshot();

  return (
    <>
      <section className="module-batch-summary">
        <div>
              <span>Item</span>
          <strong>{snapshot.medicineName}</strong>
        </div>
        <div>
          <span>Total Stock</span>
          <strong className="module-batch-total">{snapshot.totalStock}</strong>
        </div>
        <div>
          <span>Low Stock Alert</span>
          <strong className="module-batch-alert">{snapshot.lowStockAlert}</strong>
        </div>
        <div>
          <span>Unit</span>
          <strong>{snapshot.unit}</strong>
        </div>
      </section>

      <section className="module-detail-table-card">
        <table className="module-detail-table module-batch-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Batch No.</th>
              <th>Mfg. Date</th>
              <th>Expiry Date</th>
              <th>Purchase Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.map((row) => (
              <tr key={row.batchNo}>
                <td>{row.medicineName || snapshot.medicineName}</td>
                <td>{row.batchNo}</td>
                <td>{row.mfgDate}</td>
                <td>{row.expiryDate}</td>
                <td>{row.purchasePrice.toFixed(2)}</td>
                <td>{row.stock}</td>
                <td>
                  <span className={`module-status-pill ${row.tone === 'green' ? 'in' : 'low'}`}>{row.status}</span>
                </td>
                <td>
                  <BatchRowActions batchNo={row.batchNo} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export function AddBatchForm() {
  return (
    <BatchForm
      cancelHref="/modules/inventory/batch-details"
      medicineName={moduleBatchSummary.medicineName}
      mode="create"
      redirectTo="/modules/inventory/batch-details"
      submitLabel="Save Batch"
    />
  );
}

export function StockAdjustmentForm() {
  return <StockAdjustmentFormClient />;
}

export function StockTransferForm() {
  return <StockTransferFormClient />;
}
