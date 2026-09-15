import { redirect } from 'next/navigation';

export default function RestoreBackupPage() {
  redirect('/modules/backup-restore/restore');
}
