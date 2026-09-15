import { redirect } from 'next/navigation';

export default function CreateBackupPage() {
  redirect('/modules/backup-restore/create');
}
