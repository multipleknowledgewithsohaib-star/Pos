import { StockAdjustmentForm, InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';

export default function StockAdjustmentPage() {
  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Stock Adjustment"
        subtitle="Adjust stock quantity"
      />
      <StockAdjustmentForm />
    </ModuleShell>
  );
}
