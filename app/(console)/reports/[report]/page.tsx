import { notFound, redirect } from 'next/navigation';
import { reportRouteKeys, type ReportKey } from '@/lib/report-data';

export function generateStaticParams() {
  return reportRouteKeys.map((report) => ({ report }));
}

export default async function ReportPage({
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

  redirect(`/modules/reports/${report}`);
}
