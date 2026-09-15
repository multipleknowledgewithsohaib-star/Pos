import { ModuleShell } from '@/components/module-shell';
import { ReportShell } from '@/components/report-shell';

export default function ModulesReportsPage() {
  return (
    <ModuleShell active="Reports">
      <ReportShell />
    </ModuleShell>
  );
}
