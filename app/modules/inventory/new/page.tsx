import { ModuleInventoryForm } from '@/components/module-inventory-form';
import { InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';

export default function AddMedicinePage() {
  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Add New Medicine"
        subtitle="Add medicine to inventory"
      />
      <ModuleInventoryForm cancelHref="/modules/inventory/medicines" redirectTo="/modules/inventory/medicines" />
    </ModuleShell>
  );
}
