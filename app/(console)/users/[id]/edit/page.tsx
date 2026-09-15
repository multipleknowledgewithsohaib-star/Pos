import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { AdminForm, DeleteRecordButton } from '@/components/admin-form';
import { ButtonLink, PageHeader } from '@/components/ui';
import { readAdminData } from '@/lib/admin-store';
import { PasswordInput } from '@/components/password-input';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;
  const { branches, users } = await readAdminData();
  const user = users.find((item) => item.id === Number(id));

  if (!user) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={`Edit ${user.name}`}
        description="Update profile, role, branch access, and account status."
        action={<ButtonLink href="/users" icon={ArrowLeft} variant="ghost">Back to Users</ButtonLink>}
      />

      <AdminForm
        endpoint={`/api/admin/users/${user.id}`}
        method="PUT"
        redirectTo="/users"
        successText={`${user.name} updated successfully.`}
      >
        <section className="form-section form-section-wide">
          <h2>1. User Information</h2>
          <div className="form-fields three-cols">
            <label>
              <span>Full Name *</span>
              <input defaultValue={user.name} name="name" required />
            </label>
            <label>
              <span>Email Address *</span>
              <input defaultValue={user.email} name="email" required type="email" />
            </label>
            <label>
              <span>Phone Number</span>
              <input defaultValue={user.phone} name="phone" />
            </label>
            <label>
              <span>Role *</span>
              <select defaultValue={user.role} name="role">
                <option>{user.role}</option>
                <option>Admin</option>
                <option>Manager</option>
                <option>Pharmacist</option>
                <option>Cashier</option>
                <option>Viewer</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={user.status} name="status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              <span>Reset Password</span>
              <PasswordInput name="password" placeholder="Leave blank to keep current password" />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>2. Branch Access</h2>
          <input name="branch" type="hidden" value={user.branch} />
          <div className="check-list">
            {branches.slice(0, 6).map((branch) => (
              <label key={branch.id}>
                <input defaultChecked={branch.name === user.branch || branch.status === 'Active'} name="branchAccess" type="checkbox" value={branch.name} />
                <span>{branch.name} - {branch.city}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section danger-zone" id="danger">
          <h2>Danger Zone</h2>
          <p>Deactivate or remove this user from the selected client.</p>
          <DeleteRecordButton endpoint={`/api/admin/users/${user.id}`} label="Delete User" redirectTo="/users" />
        </section>

        <div className="form-actions form-section-wide">
          <Link className="button button-ghost" href="/users">Cancel</Link>
          <button className="button button-primary" type="submit">
            <Save className="button-icon" />
            <span>Save User</span>
          </button>
        </div>
      </AdminForm>
    </>
  );
}
