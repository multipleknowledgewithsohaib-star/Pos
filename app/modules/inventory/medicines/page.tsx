import { readMedicines } from '@/lib/module-inventory-store';
import { InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleInventoryTable } from '@/components/module-inventory-table';
import { ModuleShell } from '@/components/module-shell';

export const dynamic = 'force-dynamic';

export default async function MedicinesPage() {
  const medicines = await readMedicines();

  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Medicine Inventory"
        subtitle="Manage all medicines in your stock"
      />
      <ModuleInventoryTable medicines={medicines} />
    </ModuleShell>
  );
}
