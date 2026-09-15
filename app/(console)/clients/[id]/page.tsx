import { notFound } from 'next/navigation';
import { moduleAccess } from '@/lib/demo-data';
import { readAdminData } from '@/lib/admin-store';
import { StatusBadge } from '@/components/ui';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { branches, clients, users } = await readAdminData();
  const client = clients.find((item) => item.id === id);

  if (!client) {
    notFound();
  }

  return (
    <>
      <div className="detail-heading">
        <h1>{client.name}</h1>
      </div>

      <section className="detail-cards">
        <article>
          <h2>Plan</h2>
          <strong className="pill-value pill-blue">{client.plan}</strong>
        </article>
        <article>
          <h2>Modules</h2>
          <strong className="pill-value pill-green">{client.modules} Active</strong>
        </article>
        <article>
          <h2>Status</h2>
          <strong className="pill-value pill-green">{client.status}</strong>
        </article>
      </section>

      <section className="tabs-row">
        <a className="tab-active" href="#branches">
          Branches
        </a>
        <a href="#users">Users</a>
        <a href="#modules">Modules</a>
      </section>

      <section className="table-panel" id="branches">
        <table className="data-table">
          <tbody>
            {branches.slice(0, 3).map((branch) => (
              <tr key={branch.id}>
                <td>{branch.name}</td>
                <td>{branch.city === 'Karachi' ? 'Head Office' : branch.city}</td>
                <td>
                  <StatusBadge status={branch.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section-panel" id="users">
        <div className="section-heading">
          <div>
            <h2>Users</h2>
            <p>Assigned users for this client.</p>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 4).map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>{user.branch}</td>
                <td><StatusBadge status={user.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section-panel" id="modules">
        <div className="section-heading">
          <div>
            <h2>Modules</h2>
            <p>Modules enabled for this client.</p>
          </div>
        </div>

        <div className="cards-grid">
          {moduleAccess.slice(0, client.modules).map((module) => {
            const Icon = module.icon;
            return (
              <article className="mini-module-card" key={module.name}>
                <Icon />
                <strong>{module.name}</strong>
                <StatusBadge status={module.status} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="activity-info">
        <h2>Activity / Info</h2>
        <p>Client Created On {client.createdOn}</p>
        <p>Last Update On 2 Hr Ago</p>
        <p>{users.length} users are assigned to this client.</p>
      </section>
    </>
  );
}
