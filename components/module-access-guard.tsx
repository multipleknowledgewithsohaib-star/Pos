'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCoreSettings } from '@/components/core-settings-provider';
import { readAuthSession } from '@/lib/auth-session';
import { isRouteAllowed } from '@/lib/rbac';

export function ModuleAccessGuard({
  children,
  paths,
}: {
  children: React.ReactNode;
  paths: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { settings, ready } = useCoreSettings();

  useEffect(() => {
    if (!ready) {
      return;
    }

    const session = readAuthSession();
    if (!session) {
      router.replace('/modules/login');
      return;
    }

    const blocked = paths.some((path) => !isRouteAllowed(session.role, path, settings));
    if (blocked || !isRouteAllowed(session.role, pathname, settings)) {
      router.replace('/modules/dashboard?module=disabled');
    }
  }, [paths, pathname, ready, router, settings]);

  if (!ready) {
    return null;
  }

  return children;
}
