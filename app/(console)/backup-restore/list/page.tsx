import { redirect } from 'next/navigation';

export default function BackupListPage() {
  redirect('/modules/backup-restore/list');
}
