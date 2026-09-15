'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_MODULE_DATE_RANGE,
  normalizeModuleDateRange,
  type ModuleDateRange,
} from '@/lib/module-date-range';

function readCurrentMonthRange(): ModuleDateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
    to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
  };
}

type ModuleDateRangeContextValue = {
  range: ModuleDateRange;
  setRange: (next: ModuleDateRange) => void;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
  ready: boolean;
};

const ModuleDateRangeContext = createContext<ModuleDateRangeContextValue | null>(null);

export function ModuleDateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRangeState] = useState<ModuleDateRange>(DEFAULT_MODULE_DATE_RANGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRangeState(readCurrentMonthRange());
    setReady(true);
  }, []);

  const value = useMemo<ModuleDateRangeContextValue>(
    () => ({
      range,
      ready,
      setRange: (next) => setRangeState(normalizeModuleDateRange(next)),
      setFrom: (from) =>
        setRangeState((current) => normalizeModuleDateRange({ ...current, from })),
      setTo: (to) =>
        setRangeState((current) => normalizeModuleDateRange({ ...current, to })),
    }),
    [range, ready],
  );

  return <ModuleDateRangeContext.Provider value={value}>{children}</ModuleDateRangeContext.Provider>;
}

export function useModuleDateRange() {
  const context = useContext(ModuleDateRangeContext);

  if (!context) {
    throw new Error('useModuleDateRange must be used within a ModuleDateRangeProvider');
  }

  return context;
}
