import { AddBatchForm, InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';

export default function AddBatchPage() {
  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader title="Add New Batch" subtitle="Add new batch for this item" />
      <AddBatchForm />
    </ModuleShell>
  );
}
