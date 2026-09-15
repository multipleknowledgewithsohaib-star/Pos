import { redirect } from 'next/navigation';

export default function BackupSchedulePage() {
  redirect('/modules/backup-restore/schedule');
}
