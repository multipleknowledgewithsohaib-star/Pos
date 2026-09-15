import { InventoryPageHeader, LowStockTable } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';

export default function LowStockPage() {
  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Low Stock Items"
        subtitle="Medicines which are low in stock"
      />
      <LowStockTable />
    </ModuleShell>
  );
}
