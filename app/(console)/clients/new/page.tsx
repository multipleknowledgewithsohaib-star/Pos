import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle2, Save, Store } from 'lucide-react';
import { AdminForm } from '@/components/admin-form';
import { ButtonLink, PageHeader } from '@/components/ui';
import { moduleAccess } from '@/lib/demo-data';

export default function AddClientPage() {
  return (
    <>
      <PageHeader
        title="Add New Client"
        description="Create a client, assign plan, enable modules, and set the first branch."
        action={<ButtonLink href="/clients" icon={ArrowLeft} variant="ghost">Back to Clients</ButtonLink>}
      />

      <AdminForm
        endpoint="/api/admin/clients"
        redirectTo="/clients"
        successText="Client profile created successfully. Modules and branch access are ready."
      >
        <section className="form-section form-section-wide">
          <h2>1. Client Information</h2>
          <div className="form-fields three-cols">
            <label>
              <span>Client Name *</span>
              <input name="name" placeholder="Enter client name" required />
            </label>
            <label>
              <span>Client Type *</span>
              <select defaultValue="Hospital" name="type">
                <option>Hospital</option>
                <option>Clinic</option>
                <option>Lab</option>
                <option>Pharmacy</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select defaultValue="Active" name="status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              <span>Primary Contact</span>
              <input name="contactName" placeholder="Owner or admin name" />
            </label>
            <label>
              <span>Email Address *</span>
              <input name="email" placeholder="admin@example.com" required type="email" />
            </label>
            <label>
              <span>Phone Number</span>
              <input name="phone" placeholder="0300-0000000" />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>2. Plan Details</h2>
          <div className="form-fields">
            <label>
              <span>Plan *</span>
              <select defaultValue="Premium" name="plan">
                <option>Premium</option>
                <option>Standard</option>
                <option>Basic</option>
              </select>
            </label>
            <label>
              <span>Users Allowed</span>
              <input defaultValue="50" name="usersAllowed" type="number" />
            </label>
            <label>
              <span>Storage Limit</span>
              <select defaultValue="100 GB" name="storage">
                <option>100 GB</option>
                <option>50 GB</option>
                <option>25 GB</option>
              </select>
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>3. Module Access</h2>
          <div className="check-list">
            {moduleAccess.slice(0, 8).map((module) => (
              <label key={module.name}>
                <input defaultChecked={module.access} name="moduleAccess" type="checkbox" value={module.name} />
                <span>{module.name}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section form-section-wide">
          <h2>4. First Branch Setup</h2>
          <div className="form-fields three-cols">
            <label>
              <span>Branch Name *</span>
              <input name="branchName" placeholder="Main Branch" required />
            </label>
            <label>
              <span>City *</span>
              <input name="city" placeholder="Karachi" required />
            </label>
            <label>
              <span>Manager</span>
              <input name="manager" placeholder="Assign manager" />
            </label>
            <label>
              <span>Address</span>
              <input name="address" placeholder="Branch address" />
            </label>
            <label>
              <span>Opening Date</span>
              <input name="createdOn" type="date" />
            </label>
            <label>
              <span>Branch Status</span>
              <select defaultValue="Active" name="branchStatus">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
        </section>

        <div className="info-bar form-section-wide">
          <CheckCircle2 />
          <span>New clients get dashboard, user, branch, role, and module sections by default.</span>
        </div>

        <div className="form-actions form-section-wide">
          <Link className="button button-ghost" href="/clients">Cancel</Link>
          <button className="button button-primary" type="submit">
            <Save className="button-icon" />
            <span>Create Client</span>
          </button>
        </div>
      </AdminForm>

      <div className="hidden-icons" aria-hidden="true">
        <Building2 />
        <Store />
      </div>
    </>
  );
}
