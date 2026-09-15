import Link from 'next/link';
import { Edit3, Plus, Save, Trash2 } from 'lucide-react';
import { DemoActionButton } from '@/components/demo-submit-form';
import { SectionHero } from '@/components/section-hero';
import { IconButton, StatusBadge } from '@/components/ui';
import { roleManagementCards, roleManagementRows } from '@/lib/settings-content';

export default function RoleManagementPage() {
  return (
    <div className="settings-page">
      <SectionHero
        eyebrow="USER & ROLE MANAGEMENT"
        title="User & Role Management"
        description="Manage system users and their roles."
        action={
          <Link className="button button-primary" href="/users/new">
            <Plus className="button-icon" />
            <span>Add User</span>
          </Link>
        }
      />

      <section className="table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {roleManagementRows.length ? (
              roleManagementRows.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <IconButton href={`/users/${user.id}/edit`} icon={Edit3} label="Edit user" />
                      <IconButton href={`/users/${user.id}/edit#danger`} icon={Trash2} label="Delete user" tone="danger" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty-cell" colSpan={5}>No users configured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="role-management-section">
        <div className="section-heading">
          <div>
            <h2>Roles & Permissions</h2>
          </div>
        </div>

        <div className="settings-role-grid">
          {roleManagementCards.map((role, index) => {
            const Icon = role.icon;
            return (
              <article className="role-card settings-role-card" key={role.title}>
                <div className={`settings-role-icon settings-role-icon-${index + 1}`}>
                  <Icon />
                </div>
                <div>
                  <h3>{role.title}</h3>
                  <p>{role.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="settings-actions settings-actions-wide">
        <Link className="button button-ghost" href="/modules/settings">
          Cancel
        </Link>
        <DemoActionButton message="Role settings saved successfully.">
          <Save className="button-icon" />
          <span>Save Changes</span>
        </DemoActionButton>
      </div>
    </div>
  );
}
