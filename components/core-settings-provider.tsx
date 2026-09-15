'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  defaultCoreSettings,
  readCoreSettings,
  subscribeCoreSettings,
  syncCoreSettings,
  type CoreSettings,
} from '@/lib/core-settings';

type CoreSettingsContextValue = {
  settings: CoreSettings;
  ready: boolean;
  refresh: () => Promise<void>;
};

const CoreSettingsContext = createContext<CoreSettingsContextValue | null>(null);

export function CoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CoreSettings>(defaultCoreSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const local = readCoreSettings();
      if (active) {
        setSettings(local);
      }

      const remote = await syncCoreSettings();
      if (active) {
        setSettings(remote);
        setReady(true);
      }
    }

    void load();

    const unsubscribe = subscribeCoreSettings((next) => {
      if (active) {
        setSettings(next);
      }
    });

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void syncCoreSettings().then((next) => {
        if (active) {
          setSettings(next);
        }
      });
    }, window.matchMedia('(max-width: 1024px)').matches ? 30000 : 15000);

    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  const value: CoreSettingsContextValue = {
    settings,
    ready,
    refresh: async () => {
      const next = await syncCoreSettings();
      setSettings(next);
    },
  };

  return <CoreSettingsContext.Provider value={value}>{children}</CoreSettingsContext.Provider>;
}

export function useCoreSettings() {
  const context = useContext(CoreSettingsContext);
  if (!context) {
    return {
      settings: defaultCoreSettings,
      ready: false,
      refresh: async () => undefined,
    };
  }
  return context;
}
