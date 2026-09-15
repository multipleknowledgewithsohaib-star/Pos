import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Eye, Info, Plus, ShieldCheck, XCircle } from 'lucide-react';
import { ButtonLink, PageHeader } from '@/components/ui';
import { AdminForm } from '@/components/admin-form';
import { PasswordInput } from '@/components/password-input';
import { readAdminData } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export default async function AddUserPage() {
  const { branches } = await readAdminData();
  const hasBranches = branches.length > 0;
  const defaultBranch = branches[0]?.name ?? '';

  return (
    <>
      <PageHeader
        title="Add New User"
        description="Create a new user and set role, branch, and permissions."
        action={<ButtonLink href="/users" icon={ArrowLeft} variant="ghost">Back to Users</ButtonLink>}
      />

      <AdminForm
        endpoint="/api/admin/users"
        redirectTo="/users"
        successText="New user created successfully. Login credentials are ready to send."
      >
        <section className="form-section form-section-wide">
          <h2>1. User Information</h2>
          <div className="form-fields three-cols">
            <label>
              <span>Full Name *</span>
              <input name="name" placeholder="Enter full name" required />
            </label>
            <label>
              <span>Email Address *</span>
              <input name="email" placeholder="Enter email address" required type="email" />
            </label>
            <label>
              <span>Phone Number</span>
              <div className="phone-row">
                <select defaultValue="+92" name="countryCode">
                  <option>+92</option>
                  <option>+1</option>
                </select>
                <input name="phone" placeholder="Enter phone number" />
              </div>
            </label>
            <label>
              <span>Username *</span>
              <input name="username" placeholder="Enter username" />
            </label>
            <label>
              <span>Password *</span>
              <PasswordInput name="password" placeholder="Enter password" required />
            </label>
            <label>
              <span>Confirm Password *</span>
              <PasswordInput name="confirmPassword" placeholder="Confirm password" required />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue="Active" name="status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              <span>Language</span>
              <select defaultValue="English" name="language">
                <option>English</option>
                <option>Urdu</option>
              </select>
            </label>
            <label>
              <span>Joining Date</span>
              <input defaultValue="" name="joiningDate" type="date" />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>2. Role & Permission</h2>
          <label>
            <span>Role *</span>
            <select defaultValue="Pharmacist" name="role">
              <option>Pharmacist</option>
              <option>Admin</option>
              <option>Manager</option>
              <option>Cashier</option>
            </select>
          </label>

          <div className="success-note">
            <CheckCircle2 />
            <span>Permissions will be applied based on the selected role.</span>
          </div>

          <div className="permission-summary">
            <article>
              <CheckCircle2 />
              <strong>23</strong>
              <span>Allowed</span>
            </article>
            <article>
              <XCircle />
              <strong>5</strong>
              <span>Not Allowed</span>
            </article>
            <article>
              <Eye />
              <strong>8</strong>
              <span>View Only</span>
            </article>
          </div>

          <button className="button button-secondary" type="button">
            <ShieldCheck className="button-icon" />
            <span>View Full Permissions</span>
          </button>
        </section>

        <section className="form-section">
          <h2>3. Branch Access</h2>
          <input name="branch" type="hidden" value={defaultBranch} />
          <div className="radio-stack">
            <label>
              <input name="access" type="radio" />
              <span>All Branches</span>
            </label>
            <label>
              <input defaultChecked name="access" type="radio" />
              <span>Select Specific Branches</span>
            </label>
          </div>

          <div className="check-list">
            {hasBranches ? (
              branches.slice(0, 5).map((branch, index) => (
                <label key={branch.id}>
                  <input defaultChecked={index < 2} name="branchAccess" type="checkbox" value={branch.name} />
                  <span>{branch.name} - {branch.city}</span>
                </label>
              ))
            ) : (
              <div className="table-empty-cell" style={{ gridColumn: '1 / -1' }}>
                No branches available yet.
              </div>
            )}
          </div>
        </section>

        <section className="form-section form-section-wide">
          <h2>4. Additional Information (Optional)</h2>
          <div className="form-fields two-cols">
            <label>
              <span>Address</span>
              <textarea name="address" placeholder="Enter address" />
            </label>
            <label>
              <span>Notes</span>
              <textarea name="notes" placeholder="Enter notes (optional)" />
            </label>
          </div>
        </section>

        <div className="form-actions form-section-wide">
          <Link className="button button-ghost" href="/users">
            Cancel
          </Link>
          <button className="button button-primary" type="submit">
            <Plus className="button-icon" />
            <span>Create User</span>
          </button>
        </div>

        <div className="info-bar form-section-wide">
          <Info />
          <span>New user will receive login credentials on their email after account is created.</span>
        </div>
      </AdminForm>
    </>
  );
}
