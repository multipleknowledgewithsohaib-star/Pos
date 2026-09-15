import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { AdminForm, DeleteRecordButton } from '@/components/admin-form';
import { ButtonLink, PageHeader } from '@/components/ui';
import { moduleAccess } from '@/lib/demo-data';
import { readAdminData } from '@/lib/admin-store';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const { clients } = await readAdminData();
  const client = clients.find((item) => item.id === id);

  if (!client) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={`Edit ${client.name}`}
        description="Update client profile, plan, status, and enabled modules."
        action={<ButtonLink href="/clients" icon={ArrowLeft} variant="ghost">Back to Clients</ButtonLink>}
      />

      <AdminForm
        endpoint={`/api/admin/clients/${client.id}`}
        method="PUT"
        redirectTo="/clients"
        successText={`${client.name} updated successfully.`}
      >
        <section className="form-section form-section-wide">
          <h2>Client Information</h2>
          <div className="form-fields three-cols">
            <label>
              <span>Client Name *</span>
              <input defaultValue={client.name} name="name" required />
            </label>
            <label>
              <span>Client Type</span>
              <select defaultValue={client.type} name="type">
                <option>Hospital</option>
                <option>Clinic</option>
                <option>Lab</option>
                <option>Pharmacy</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={client.status} name="status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              <span>Plan</span>
              <select defaultValue={client.plan} name="plan">
                <option>Premium</option>
                <option>Standard</option>
                <option>Basic</option>
              </select>
            </label>
            <label>
              <span>Primary Branch</span>
              <input defaultValue={client.branch} name="branch" />
            </label>
            <label>
              <span>Created On</span>
              <input defaultValue={client.createdOn} name="createdOn" />
            </label>
          </div>
        </section>

        <section className="form-section form-section-wide">
          <h2>Module Access</h2>
          <div className="check-list check-list-grid">
            {moduleAccess.map((module, index) => (
              <label key={module.name}>
                <input defaultChecked={index < client.modules} name="moduleAccess" type="checkbox" value={module.name} />
                <span>{module.name}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section form-section-wide danger-zone" id="danger">
          <h2>Danger Zone</h2>
          <p>Deactivate this client if their access should be temporarily disabled.</p>
          <DeleteRecordButton endpoint={`/api/admin/clients/${client.id}`} label="Delete Client" redirectTo="/clients" />
        </section>

        <div className="form-actions form-section-wide">
          <Link className="button button-ghost" href={`/clients/${client.id}`}>View Details</Link>
          <button className="button button-primary" type="submit">
            <Save className="button-icon" />
            <span>Save Client</span>
          </button>
        </div>
      </AdminForm>

      <div className="hidden-icons" aria-hidden="true">
        <ShieldCheck />
      </div>
    </>
  );
}
