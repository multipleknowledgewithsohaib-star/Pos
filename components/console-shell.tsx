'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopbarClient } from '@/components/topbar-client';
import type { AdminBranch, AdminClient } from '@/lib/admin-types';
import { readAuthSession } from '@/lib/auth-session';
import { useRouter } from 'next/navigation';

const MOBILE_QUERY = '(max-width: 1024px)';

export function ConsoleShell({
  clients,
  branches,
  children,
}: {
  clients: AdminClient[];
  branches: AdminBranch[];
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState(readAuthSession());
  const router = useRouter();

  useEffect(() => {
    setSession(readAuthSession());
  }, []);

  useEffect(() => {
    if (session === undefined) return; // Wait for client-side hydration
    if (!session) {
      router.push('/login');
    } else if (session.role !== 'admin') {
      router.push('/modules/dashboard');
    }
  }, [session, router]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((current) => !current), []);

  useEffect(() => {
    document.body.classList.toggle('console-menu-open', sidebarOpen);
    return () => document.body.classList.remove('console-menu-open');
  }, [sidebarOpen]);

  useEffect(() => {
    function onResize() {
      if (!window.matchMedia(MOBILE_QUERY).matches) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className={`console-shell ${sidebarOpen ? 'console-shell-sidebar-open' : ''}`} data-sidebar-open={sidebarOpen ? 'true' : 'false'}>
      <div className="console-main">
        <TopbarClient clients={clients} branches={branches} onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="content">{children}</main>
      </div>
      <Sidebar onNavigate={closeSidebar} onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <button
        aria-label="Close menu"
        className="console-sidebar-backdrop"
        type="button"
        onClick={closeSidebar}
        hidden={!sidebarOpen}
      />
    </div>
  );
}
