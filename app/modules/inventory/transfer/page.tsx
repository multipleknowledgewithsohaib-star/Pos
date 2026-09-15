import { StockTransferForm, InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';

export default function StockTransferPage() {
  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Stock Transfer"
        subtitle="Transfer stock to another branch"
      />
      <StockTransferForm />
    </ModuleShell>
  );
}
