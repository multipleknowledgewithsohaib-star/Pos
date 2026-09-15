import { Plus } from 'lucide-react';
import { ButtonLink, PageHeader } from '@/components/ui';
import { ClientsTable } from '@/app/(console)/clients/_components/clients-table';
import { readAdminData } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const { clients } = await readAdminData();

  return (
    <>
      <PageHeader
        title="Clients"
        action={<ButtonLink href="/clients/new" icon={Plus}>Add Client</ButtonLink>}
      />

      <ClientsTable clients={clients} />
    </>
  );
}
