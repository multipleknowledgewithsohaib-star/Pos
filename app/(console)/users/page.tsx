import { Plus, ShieldCheck, UserCheck, UserRoundX, Users } from 'lucide-react';
import {
  ButtonLink,
  PageHeader,
  SummaryTile,
} from '@/components/ui';
import { UsersTable } from '@/app/(console)/users/_components/users-table';
import { readAdminData } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const { users } = await readAdminData();
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === 'Active').length;
  const inactiveUsers = totalUsers - activeUsers;
  const rolesAssigned = new Set(users.map((user) => user.role)).size;

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage all users of the selected client."
        action={<ButtonLink href="/users/new" icon={Plus}>Add User</ButtonLink>}
      />

      <UsersTable users={users} />

      <section className="stats-grid compact-stats">
        <SummaryTile icon={Users} label="Total Users" value={totalUsers} tone="purple" />
        <SummaryTile icon={UserCheck} label="Active Users" value={activeUsers} tone="green" />
        <SummaryTile icon={UserRoundX} label="Inactive Users" value={inactiveUsers} tone="red" />
        <SummaryTile icon={ShieldCheck} label="Roles Assigned" value={rolesAssigned} tone="blue" />
      </section>
    </>
  );
}
