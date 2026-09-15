'use client';

import { useEffect, useState } from 'react';

/** True only after the browser has mounted — avoids SSR/client markup mismatches. */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const mounted = useClientMounted();
  return mounted ? children : fallback;
}
