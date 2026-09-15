import { redirect } from 'next/navigation';

export default function BackupSettingsPage() {
  redirect('/modules/backup-restore/settings');
}
