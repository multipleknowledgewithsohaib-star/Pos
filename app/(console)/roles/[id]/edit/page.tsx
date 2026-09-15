import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { AdminForm, DeleteRecordButton } from '@/components/admin-form';
import { ButtonLink, PageHeader } from '@/components/ui';
import { readAdminData } from '@/lib/admin-store';
import { rolePermissions } from '@/lib/demo-data';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const permissionActions = ['View', 'Create', 'Edit', 'Delete'] as const;

export const dynamic = 'force-dynamic';

export default async function EditRolePage({ params }: PageProps) {
  const { id } = await params;
  const { roles } = await readAdminData();
  const role = roles.find((item) => item.id === id);

  if (!role) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={`Edit ${role.name}`}
        description="Update role name, status, description, and module permissions."
        action={<ButtonLink href="/roles#roles" icon={ArrowLeft} variant="ghost">Back to Roles</ButtonLink>}
      />

      <AdminForm
        endpoint={`/api/admin/roles/${role.id}`}
        method="PUT"
        redirectTo="/roles#roles"
        successText={`${role.name} updated successfully.`}
      >
        <section className="form-section form-section-wide">
          <h2>1. Role Information</h2>
          <div className="form-fields three-cols">
            <label>
              <span>Role Name *</span>
              <input defaultValue={role.name} name="name" required />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={role.status} name="status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              <span>Users Assigned</span>
              <input defaultValue={role.users} name="users" type="number" />
            </label>
          </div>
        </section>

        <section className="form-section form-section-wide">
          <h2>2. Permission Builder</h2>
          <div className="permission-check-grid">
            {rolePermissions.map((permission) => {
              const Icon = permission.icon;
              return (
                <article key={permission.module}>
                  <div className="permission-module-title">
                    <Icon />
                    <strong>{permission.module}</strong>
                  </div>
                  <div className="permission-action-list">
                    {permissionActions.map((action, index) => (
                      <label key={action}>
                        <input
                          defaultChecked={index === 0 || permission.manager}
                          name="permissions"
                          type="checkbox"
                          value={`${permission.module}:${action}`}
                        />
                        <span>{action}</span>
                      </label>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="form-section form-section-wide">
          <h2>3. Notes</h2>
          <div className="form-fields">
            <label>
              <span>Description</span>
              <textarea defaultValue={role.description} name="description" />
            </label>
          </div>
        </section>

        <section className="form-section form-section-wide danger-zone" id="danger">
          <h2>Danger Zone</h2>
          <p>Delete this role when it is no longer needed. Assigned users should be moved first.</p>
          <DeleteRecordButton endpoint={`/api/admin/roles/${role.id}`} label="Delete Role" redirectTo="/roles#roles" />
        </section>

        <div className="form-actions form-section-wide">
          <Link className="button button-ghost" href="/roles#roles">Cancel</Link>
          <button className="button button-primary" type="submit">
            <Save className="button-icon" />
            <span>Save Role</span>
          </button>
        </div>
      </AdminForm>

      <div className="hidden-icons" aria-hidden="true">
        <ShieldCheck />
      </div>
    </>
  );
}
