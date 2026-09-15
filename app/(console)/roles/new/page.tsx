import Link from 'next/link';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { AdminForm } from '@/components/admin-form';
import { ButtonLink, PageHeader } from '@/components/ui';
import { rolePermissions } from '@/lib/demo-data';

const permissionActions = ['View', 'Create', 'Edit', 'Delete'] as const;

export default function AddRolePage() {
  return (
    <>
      <PageHeader
        title="Add New Role"
        description="Create a custom role and define module-level permissions."
        action={<ButtonLink href="/roles" icon={ArrowLeft} variant="ghost">Back to Roles</ButtonLink>}
      />

      <AdminForm
        endpoint="/api/admin/roles"
        redirectTo="/roles#roles"
        successText="Role created successfully. Permissions are ready to assign to users."
      >
        <section className="form-section form-section-wide">
          <h2>1. Role Information</h2>
          <div className="form-fields three-cols">
            <label>
              <span>Role Name *</span>
              <input name="name" placeholder="Enter role name" required />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue="Active" name="status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              <span>Default Landing Page</span>
              <select defaultValue="Dashboard" name="landingPage">
                <option>Dashboard</option>
                <option>Users</option>
                <option>Inventory</option>
              </select>
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
              <textarea name="description" placeholder="Explain what this role can do" />
            </label>
          </div>
        </section>

        <div className="form-actions form-section-wide">
          <Link className="button button-ghost" href="/roles">Cancel</Link>
          <button className="button button-primary" type="submit">
            <Save className="button-icon" />
            <span>Create Role</span>
          </button>
        </div>
      </AdminForm>

      <div className="hidden-icons" aria-hidden="true">
        <ShieldCheck />
      </div>
    </>
  );
}
