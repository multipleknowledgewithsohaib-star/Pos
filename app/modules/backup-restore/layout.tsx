import type { ReactNode } from 'react';
import { ModuleShell } from '@/components/module-shell';

export default function BackupRestoreModuleLayout({ children }: { children: ReactNode }) {
  return <ModuleShell active="Backup & Restore">{children}</ModuleShell>;
}
