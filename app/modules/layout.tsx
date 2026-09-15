import { ModuleDateRangeProvider } from '@/components/module-date-range-context';
import { CoreSettingsProvider } from '@/components/core-settings-provider';

export default function ModulesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CoreSettingsProvider>
      <ModuleDateRangeProvider>{children}</ModuleDateRangeProvider>
    </CoreSettingsProvider>
  );
}
