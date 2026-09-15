import { PurchasePageShell } from '@/components/purchase-section';
import { PurchaseOrderDetailsWorkspace } from '../../_components/purchase-workspaces';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PurchaseOrderDetailsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PurchasePageShell
      badge="16.10"
      eyebrow="PURCHASE ORDER DETAILS"
      title="Purchase Order Details"
      description="View purchase order details."
      backHref="/modules/purchases/list"
    >
      <PurchaseOrderDetailsWorkspace orderId={id} />
    </PurchasePageShell>
  );
}
