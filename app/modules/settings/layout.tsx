import type { ReactNode } from 'react';
import { ModuleShell } from '@/components/module-shell';

export default function SettingsModuleLayout({ children }: { children: ReactNode }) {
  return <ModuleShell active="Settings">{children}</ModuleShell>;
}
