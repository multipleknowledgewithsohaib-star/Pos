import { ModuleShell } from '@/components/module-shell';
import { InventoryPageHeader, InventorySummaryCards } from '@/components/module-inventory-sections';

export default function ModuleInventoryPage() {
  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader title="Inventory Summary" subtitle="Overview of your inventory" />
      <InventorySummaryCards />
    </ModuleShell>
  );
}
