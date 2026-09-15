import type { ReactNode } from 'react';
import { PosProvider } from '@/lib/pos-state';

export default function CustomersLayout({ children }: { children: ReactNode }) {
  return <PosProvider>{children}</PosProvider>;
}
