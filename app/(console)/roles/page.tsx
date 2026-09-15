import { Plus, Edit3, Trash2 } from 'lucide-react';
import { ButtonLink, IconButton, PageHeader, StatusBadge } from '@/components/ui';
import { RolesPermissionsPanel } from '@/app/(console)/roles/_components/roles-permissions-panel';
import { readAdminData } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const { roles } = await readAdminData();

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Manage roles and set permissions for modules."
        action={<ButtonLink href="/roles/new" icon={Plus}>Add Role</ButtonLink>}
      />

      <div className="tabs-row compact-tabs">
        <a className="tab-active" href="#matrix">Permission Matrix</a>
        <a href="#roles">Roles List</a>
      </div>

      <RolesPermissionsPanel />

      <section className="section-panel" id="roles">
        <div className="section-heading">
          <div>
            <h2>Roles List</h2>
            <p>All configured roles for the selected client.</p>
          </div>
          <ButtonLink href="/roles/new" icon={Plus} variant="secondary">Create Role</ButtonLink>
        </div>

        <div className="role-list-grid">
          {roles.length ? (
            roles.map((role) => (
              <article className="role-card" key={role.name}>
                <div>
                  <h3>{role.name}</h3>
                  <p>{role.description}</p>
                </div>
                <div className="role-card-meta">
                  <span>{role.users} users</span>
                  <span>{role.modules} modules</span>
                  <StatusBadge status={role.status} />
                </div>
                <div className="row-actions">
                  <IconButton href={`/roles/${role.id}/edit`} icon={Edit3} label="Edit role" />
                  <IconButton href={`/roles/${role.id}/edit#danger`} icon={Trash2} label="Delete role" tone="danger" />
                </div>
              </article>
            ))
          ) : (
            <div className="table-empty-cell" style={{ gridColumn: '1 / -1' }}>
              No roles configured yet.
            </div>
          )}
        </div>
      </section>

      <div className="note-bar">
        <strong>Note:</strong> Super Admin has all permissions by default and cannot be edited.
      </div>
    </>
  );
}
