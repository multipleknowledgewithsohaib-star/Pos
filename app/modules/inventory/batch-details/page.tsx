import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { BatchStockDetails, InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';

export const dynamic = 'force-dynamic';

export default function BatchDetailsPage() {
  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Batch / Stock Details"
        subtitle="Manage batches and stock information"
        actions={
          <>
            <Link className="module-page-button" href="/modules/inventory">
              <ArrowLeft />
              <span>Back to Items</span>
            </Link>
            <Link className="module-page-button module-page-button-primary" href="/modules/inventory/batch/new">
              <Plus />
              <span>Add Batch</span>
            </Link>
          </>
        }
      />
      <BatchStockDetails />
    </ModuleShell>
  );
}
