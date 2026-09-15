import { redirect } from 'next/navigation';

export default async function BackupDetailsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  redirect(`/modules/backup-restore/details/${id}`);
}
