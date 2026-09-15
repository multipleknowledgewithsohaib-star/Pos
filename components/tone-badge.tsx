import type { ReactNode } from 'react';

export type ToneBadgeTone = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export function ToneBadge({
  tone,
  children,
}: {
  tone: ToneBadgeTone;
  children: ReactNode;
}) {
  return <span className={`tone-badge tone-badge-${tone}`}>{children}</span>;
}
