import { notFound } from 'next/navigation';
import { ModuleShell } from '@/components/module-shell';
import { ReportShell } from '@/components/report-shell';
import { reportRouteKeys, type ReportKey } from '@/lib/report-data';

export function generateStaticParams() {
  return reportRouteKeys.map((report) => ({ report }));
}

export default async function ModulesReportPage({
  params,
}: {
  params: Promise<{
    report: string;
  }>;
}) {
  const { report } = await params;

  if (!reportRouteKeys.includes(report as ReportKey)) {
    notFound();
  }

  return (
    <ModuleShell active="Reports">
      <ReportShell report={report as ReportKey} />
    </ModuleShell>
  );
}
