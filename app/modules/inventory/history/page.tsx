import { InventoryHistoryTable, InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';

export default function InventoryHistoryPage() {
  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Inventory History"
        subtitle="Track all inventory activities"
      />
      <InventoryHistoryTable />
    </ModuleShell>
  );
}
