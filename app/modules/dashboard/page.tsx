import { ModuleShell } from '@/components/module-shell';
import { PosProvider } from '@/lib/pos-state';
import { readBatchSnapshot } from '@/lib/module-batch-store';
import { readMedicines } from '@/lib/module-inventory-store';
import {
  DashboardWorkspace,
  type DashboardInventorySummary,
} from './_components/dashboard-workspace';

export const dynamic = 'force-dynamic';

export default async function ModulesDashboardPage() {
  const [medicines, batchSnapshot] = await Promise.all([readMedicines(), readBatchSnapshot()]);
  const activeMedicines = medicines.filter((medicine) => medicine.active !== false);
  const inStockCount = activeMedicines.filter((medicine) => medicine.stock > medicine.lowStock).length;
  const lowStockCount = activeMedicines.filter((medicine) => medicine.stock > 0 && medicine.stock <= medicine.lowStock).length;
  const outOfStockCount = activeMedicines.filter((medicine) => medicine.stock <= 0).length;
  const expiringSoonCount = batchSnapshot.rows.filter((row) => {
    const days = daysUntil(row.expiryDate);
    return days !== null && days <= 90;
  }).length;
  const inventory: DashboardInventorySummary = {
    totalItems: activeMedicines.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
    stockSummaryCards: [
      { label: 'Total Items', value: String(activeMedicines.length), tone: 'purple' },
      { label: 'In Stock', value: String(inStockCount), tone: 'green' },
      { label: 'Low Stock', value: String(lowStockCount), tone: 'orange' },
      { label: 'Out of Stock', value: String(outOfStockCount), tone: 'red' },
    ],
    inventoryCosts: activeMedicines.map((medicine) => ({
      id: medicine.id,
      medicineName: medicine.medicineName,
      purchasePrice: Number(medicine.purchasePrice) || 0,
    })),
  };

  return (
    <ModuleShell active="Dashboard">
      <PosProvider>
        <DashboardWorkspace inventory={inventory} />
      </PosProvider>
    </ModuleShell>
  );
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

function parseDate(value: string) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return null;
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
  const parsed = new Date(year, month, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
