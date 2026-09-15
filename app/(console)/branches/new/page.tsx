import Link from 'next/link';
import { ArrowLeft, MapPin, Save } from 'lucide-react';
import { AdminForm } from '@/components/admin-form';
import { ButtonLink, PageHeader } from '@/components/ui';
import { readAdminData } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export default async function AddBranchPage() {
  const { users } = await readAdminData();
  const hasUsers = users.length > 0;
  const managerValue = hasUsers ? users[0].name : '';

  return (
    <>
      <PageHeader
        title="Add New Branch"
        description="Create a new branch and assign manager, city, status, and operating details."
        action={<ButtonLink href="/branches" icon={ArrowLeft} variant="ghost">Back to Branches</ButtonLink>}
      />

      <AdminForm
        endpoint="/api/admin/branches"
        redirectTo="/branches"
        successText="Branch created successfully and added to the selected client."
      >
        <section className="form-section form-section-wide">
          <h2>1. Branch Details</h2>
          <div className="form-fields three-cols">
            <label>
              <span>Branch Name *</span>
              <input name="name" placeholder="Enter branch name" required />
            </label>
            <label>
              <span>City *</span>
              <input name="city" placeholder="Enter city" required />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue="Active" name="status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              <span>Manager</span>
              <select defaultValue={managerValue} disabled={!hasUsers} name="manager">
                {!hasUsers ? <option value="">No users available</option> : null}
                {users.map((user) => (
                  <option key={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Created On</span>
              <input defaultValue="" name="createdOn" type="date" />
            </label>
            <label>
              <span>Contact Number</span>
              <input name="phone" placeholder="0300-0000000" />
            </label>
          </div>
        </section>

        <section className="form-section form-section-wide">
          <h2>2. Address & Operations</h2>
          <div className="form-fields two-cols">
            <label>
              <span>Address</span>
              <textarea name="address" placeholder="Enter complete branch address" />
            </label>
            <label>
              <span>Notes</span>
              <textarea name="notes" placeholder="Operational notes for this branch" />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>3. Working Days</h2>
          <div className="check-list">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <label key={day}>
                <input defaultChecked name="workingDays" type="checkbox" value={day} />
                <span>{day}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section">
          <h2>4. Branch Access</h2>
          <div className="check-list">
            {['Inventory', 'POS', 'Sales', 'Purchases'].map((module) => (
              <label key={module}>
                <input defaultChecked name="moduleAccess" type="checkbox" value={module} />
                <span>{module}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="form-actions form-section-wide">
          <Link className="button button-ghost" href="/branches">Cancel</Link>
          <button className="button button-primary" type="submit">
            <Save className="button-icon" />
            <span>Create Branch</span>
          </button>
        </div>
      </AdminForm>

      <div className="hidden-icons" aria-hidden="true">
        <MapPin />
      </div>
    </>
  );
}
