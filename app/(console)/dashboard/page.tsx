import Link from 'next/link';
import {
  Boxes,
  Building2,
  Crown,
  PackageCheck,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { PageHeader, StatCard, SummaryTile } from '@/components/ui';
import { DashboardDateRangePicker } from '@/components/dashboard-date-range-picker';
import { ConsoleDashboardChart } from '@/components/console-dashboard-chart';
import { recentActivity } from '@/lib/demo-data';
import { readAdminData } from '@/lib/admin-store';
import { buildConsoleOverviewPoints } from '@/lib/console-dashboard';
import { getApiSummary } from '@/lib/pharma-api';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { clients, users } = await readAdminData();
  const api = await getApiSummary();
  const activeClients = clients.filter((client) => client.status === 'Active').length;
  const activeUsers = users.filter((user) => user.status === 'Active').length;
  const overviewPoints = buildConsoleOverviewPoints(api, activeUsers);

  return (
    <>
      <PageHeader title="Dashboard" action={<DashboardDateRangePicker />} />

      <section className="stats-grid">
        <StatCard
          icon={Building2}
          label="Total Clients"
          value={clients.length}
          tone="purple"
          link={{ href: '/clients', label: 'View all clients' }}
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={users.length}
          tone="orange"
          link={{ href: '/users', label: 'View all users' }}
        />
        <StatCard
          icon={Boxes}
          label="Active Modules"
          value={api.activeModules}
          tone="green"
          link={{ href: '/settings/plan', label: 'View modules' }}
        />
        <StatCard
          icon={Crown}
          label="Current Plan"
          value="Enterprise"
          tone="purple"
          link={{ href: '/settings/plan', label: 'View plan' }}
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-title-row">
            <h2>Overview (This Month)</h2>
          </div>

          <div className="mini-stats">
            <SummaryTile icon={UserPlus} label="User Registrations" value={users.length} tone="purple" />
            <SummaryTile icon={Users} label="Active Users" value={activeUsers} tone="green" />
            <SummaryTile icon={PackageCheck} label="Active Modules" value={api.activeModules} tone="blue" />
          </div>

          <ConsoleDashboardChart points={overviewPoints} />
        </article>

        <article className="panel">
          <div className="panel-title-row">
            <h2>Recent Activity</h2>
            <Link href="/users">View all activity</Link>
          </div>

          <div className="activity-list">
            {recentActivity.length ? (
              recentActivity.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="activity-item" key={item.text}>
                    <div className={`activity-icon activity-${item.tone}`}>
                      <Icon className="activity-icon-svg" />
                    </div>
                    <strong>{item.text}</strong>
                    <span>{item.time}</span>
                  </div>
                );
              })
            ) : api.recentMovements.length ? (
              api.recentMovements.map((movement) => (
                <div className="activity-item" key={movement.id}>
                  <div className="activity-icon activity-blue">
                    <PackageCheck className="activity-icon-svg" />
                  </div>
                  <strong>
                    {movement.movementType} {movement.quantity} units
                    {movement.batch?.product?.name ? ` — ${movement.batch.product.name}` : ''}
                  </strong>
                  <span>{new Date(movement.createdAt).toLocaleString('en-GB')}</span>
                </div>
              ))
            ) : (
              <div className="table-empty-cell">No recent activity yet.</div>
            )}
          </div>
        </article>
      </section>

      <section className="stats-grid compact-stats">
        <SummaryTile icon={ShieldCheck} label="API Online" value={api.online ? 'Yes' : 'No'} tone={api.online ? 'green' : 'red'} />
        <SummaryTile icon={PackageCheck} label="Pharma Products" value={api.products} tone="blue" />
        <SummaryTile icon={Boxes} label="Stock Units" value={api.totalStock} tone="orange" />
        <SummaryTile icon={Building2} label="Active Clients" value={activeClients} tone="purple" />
      </section>
    </>
  );
}
