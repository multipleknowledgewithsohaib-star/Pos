import { PosPageShell } from '@/components/pos-section';
import { PosSettingsWorkspace } from '../_components/pos-workspaces';

export default function PosSettingsPage() {
  return (
    <PosPageShell badge="15.18" title="POS SETTINGS" description="Configure POS preferences.">
      <PosSettingsWorkspace />
    </PosPageShell>
  );
}
