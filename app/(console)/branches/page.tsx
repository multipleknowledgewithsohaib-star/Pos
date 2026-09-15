import { CheckCircle2, Plus, Store, UserRound, XCircle } from 'lucide-react';
import {
  ButtonLink,
  PageHeader,
  SummaryTile,
} from '@/components/ui';
import { BranchesTable } from '@/app/(console)/branches/_components/branches-table';
import { readAdminData } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export default async function BranchesPage() {
  const { branches } = await readAdminData();
  const totalBranches = branches.length;
  const activeBranches = branches.filter((branch) => branch.status === 'Active').length;
  const inactiveBranches = totalBranches - activeBranches;
  const totalManagers = new Set(branches.map((branch) => branch.manager)).size;

  return (
    <>
      <PageHeader
        title="Branches"
        description="Manage all branches of the selected client."
        action={<ButtonLink href="/branches/new" icon={Plus}>Add Branch</ButtonLink>}
      />

      <BranchesTable branches={branches} />

      <section className="stats-grid compact-stats">
        <SummaryTile icon={Store} label="Total Branches" value={totalBranches} tone="purple" />
        <SummaryTile icon={CheckCircle2} label="Active Branches" value={activeBranches} tone="green" />
        <SummaryTile icon={XCircle} label="Inactive Branches" value={inactiveBranches} tone="red" />
        <SummaryTile icon={UserRound} label="Total Managers" value={totalManagers} tone="orange" />
      </section>
    </>
  );
}