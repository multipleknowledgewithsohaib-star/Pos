import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BatchForm } from '@/components/module-batch-workflows';
import { InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';
import { moduleBatchSummary } from '@/lib/module-data';
import { readBatchByNo } from '@/lib/module-batch-store';

type PageProps = {
  params: Promise<{
    batchNo: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function EditBatchPage({ params }: PageProps) {
  const { batchNo } = await params;
  const batch = await readBatchByNo(batchNo);

  if (!batch) {
    notFound();
  }

  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Edit Batch"
        subtitle="Update batch stock information"
        actions={
          <Link className="module-page-button" href="/modules/inventory/batch-details">
            <ArrowLeft />
            <span>Back to Batches</span>
          </Link>
        }
      />
      <BatchForm
        batch={batch}
        cancelHref="/modules/inventory/batch-details"
        medicineName={moduleBatchSummary.medicineName}
        mode="edit"
        redirectTo="/modules/inventory/batch-details"
        submitLabel="Update Batch"
      />
    </ModuleShell>
  );
}
