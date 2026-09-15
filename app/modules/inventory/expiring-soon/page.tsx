import { ExpiringSoonTable, InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';

export default function ExpiringSoonPage() {
  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Expiring Soon"
        subtitle="Medicines expiring within 30 days"
      />
      <ExpiringSoonTable />
    </ModuleShell>
  );
}
