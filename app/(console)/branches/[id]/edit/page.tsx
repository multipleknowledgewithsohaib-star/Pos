import type { ReactElement } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { AdminForm, DeleteRecordButton } from '@/components/admin-form';
import { ButtonLink, PageHeader } from '@/components/ui';
import { readAdminData } from '@/lib/admin-store';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function BranchEditPage({ params }: PageProps): Promise<ReactElement> {
  const { id } = await params;
  const { branches, users } = await readAdminData();
  const branch = branches.find((item) => item.id === Number(id));

  if (!branch) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={`Edit ${branch.name}`}
        description="Update branch details, manager, operating status, and module access."
        action={<ButtonLink href="/branches" icon={ArrowLeft} variant="ghost">Back to Branches</ButtonLink>}
      />

      <AdminForm
        endpoint={`/api/admin/branches/${branch.id}`}
        method="PUT"
        redirectTo="/branches"
        successText={`${branch.name} updated successfully.`}
      >
        <section className="form-section form-section-wide">
          <h2>Branch Information</h2>
          <div className="form-fields three-cols">
            <label>
              <span>Branch Name *</span>
              <input defaultValue={branch.name} name="name" required />
            </label>
            <label>
              <span>City *</span>
              <input defaultValue={branch.city} name="city" required />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={branch.status} name="status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              <span>Manager</span>
              <select defaultValue={branch.manager} name="manager">
                <option>{branch.manager}</option>
                {users.map((user) => (
                  <option key={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Created On</span>
              <input defaultValue={branch.createdOn} name="createdOn" />
            </label>
            <label>
              <span>Contact Number</span>
              <input defaultValue={branch.phone ?? '0300-0000000'} name="phone" />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>Module Access</h2>
          <div className="check-list">
            {['Inventory', 'POS', 'Sales', 'Purchases'].map((module) => (
              <label key={module}>
                <input defaultChecked={branch.status === 'Active'} name="moduleAccess" type="checkbox" value={module} />
                <span>{module}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section danger-zone" id="danger">
          <h2>Danger Zone</h2>
          <p>Use this when the branch should be removed from active operations.</p>
          <DeleteRecordButton endpoint={`/api/admin/branches/${branch.id}`} label="Delete Branch" redirectTo="/branches" />
        </section>

        <div className="form-actions form-section-wide">
          <Link className="button button-ghost" href="/branches">Cancel</Link>
          <button className="button button-primary" type="submit">
            <Save className="button-icon" />
            <span>Save Branch</span>
          </button>
        </div>
      </AdminForm>
    </>
  );
}
