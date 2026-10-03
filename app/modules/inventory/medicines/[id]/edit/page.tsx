import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ModuleInventoryForm } from '@/components/module-inventory-form';
import { InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';
import { readMedicineById } from '@/lib/module-inventory-store';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function EditMedicinePage({ params }: PageProps) {
  const { id } = await params;
  const medicine = await readMedicineById(Number(id));

  if (!medicine) {
    notFound();
  }

  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Edit Item"
        subtitle="Update item details"
        actions={
          <Link className="module-page-button" href={`/modules/inventory/medicines/${medicine.id}`}>
            <ArrowLeft />
            <span>Back to Details</span>
          </Link>
        }
      />
      <ModuleInventoryForm
        cancelHref={`/modules/inventory/medicines/${medicine.id}`}
        medicine={medicine}
        mode="edit"
        redirectTo={`/modules/inventory/medicines/${medicine.id}`}
        submitLabel="Update Item"
      />
    </ModuleShell>
  );
}
