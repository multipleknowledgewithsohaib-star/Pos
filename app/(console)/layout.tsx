import { ConsoleShell } from '@/components/console-shell';
import { readAdminData } from '@/lib/admin-store';

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { clients, branches } = await readAdminData();

  return (
    <ConsoleShell branches={branches} clients={clients}>
      {children}
    </ConsoleShell>
  );
}
