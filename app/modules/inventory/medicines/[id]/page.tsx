import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { DeleteRecordButton } from '@/components/admin-form';
import { InventoryPageHeader } from '@/components/module-inventory-sections';
import { ModuleShell } from '@/components/module-shell';
import { readMedicineById } from '@/lib/module-inventory-store';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function MedicineDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const medicine = await readMedicineById(Number(id));

  if (!medicine) {
    notFound();
  }

  return (
    <ModuleShell active="Inventory">
      <InventoryPageHeader
        title="Item Details"
        subtitle="View and manage item information"
        actions={
          <>
            <Link className="module-page-button" href="/modules/inventory/medicines">
              <ArrowLeft />
              <span>Back to Items</span>
            </Link>
            <Link className="module-page-button module-page-button-primary" href={`/modules/inventory/medicines/${medicine.id}/edit`}>
              <PencilLine />
              <span>Edit Item</span>
            </Link>
          </>
        }
      />

      <section className="module-detail-table-card">
        <table className="module-detail-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Generic Name</th>
              <th>Category</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{medicine.medicineName}</td>
              <td>{medicine.genericName || '-'}</td>
              <td>{medicine.category}</td>
              <td>{medicine.unit}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="module-detail-table-card" style={{ marginTop: 18 }}>
        <table className="module-detail-table">
          <thead>
            <tr>
              <th>Purchase Price (PKR)</th>
              <th>Sale Price (PKR)</th>
              <th>Low Stock Alert</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{medicine.purchasePrice ?? 0}</td>
              <td>{medicine.price.toFixed(2)}</td>
              <td>{medicine.lowStock}</td>
              <td>{medicine.stock}</td>
              <td>
                <span className={`module-status-pill ${medicine.status === 'In Stock' ? 'in' : medicine.status === 'Low Stock' ? 'low' : 'out'}`}>
                  {medicine.status}
                </span>
              </td>
              <td>{medicine.active ? 'Yes' : 'No'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {medicine.description ? (
        <section className="module-detail-table-card" style={{ marginTop: 18 }}>
          <table className="module-detail-table">
            <thead>
              <tr>
                <th>Item Details / Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{medicine.description}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}

      <div className="module-centered-cta" style={{ marginTop: 24 }}>
        <DeleteRecordButton endpoint={`/api/modules/inventory/${medicine.id}`} label="Delete Item" redirectTo="/modules/inventory/medicines" />
      </div>
    </ModuleShell>
  );
}
