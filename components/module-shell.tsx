'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Plus } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { moduleNavItems } from '@/lib/module-data';
import { ModuleTopbar } from '@/components/module-topbar';
import { useCoreSettings } from '@/components/core-settings-provider';
import { readAuthSession, clearAuthSession, AUTH_COOKIE_NAME } from '@/lib/auth-session';
import { isRouteAllowed } from '@/lib/rbac';

const MOBILE_QUERY = '(max-width: 1024px)';

export function ModuleShell({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [session, setSession] = useState(readAuthSession());
  const { settings, ready: settingsReady } = useCoreSettings();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSession(readAuthSession());
  }, [pathname]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches) {
      setSidebarOpen((current) => !current);
      return;
    }

    setSidebarCollapsed((current) => !current);
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('module-menu-open', sidebarOpen);
    return () => {
      document.body.classList.remove('module-menu-open');
    };
  }, [sidebarOpen]);

  useEffect(() => {
    document.documentElement.dataset.moduleSidebar = sidebarOpen ? 'open' : 'closed';
  }, [sidebarOpen]);

  useEffect(() => {
    let frame = 0;

    function onResize() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!window.matchMedia(MOBILE_QUERY).matches) {
          setSidebarOpen(false);
        }
      });
    }

    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeSidebar();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeSidebar, sidebarOpen]);

  useEffect(() => {
    if (!settingsReady || !session) {
      return;
    }

    if (!isRouteAllowed(session.role, pathname, settings)) {
      router.replace('/modules/dashboard?module=disabled');
    }
  }, [session, settings, settingsReady, pathname, router]);

  const shellClassName = [
    'module-shell',
    sidebarCollapsed ? 'module-shell-collapsed' : '',
    sidebarOpen ? 'module-shell-sidebar-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!session) {
      router.push('/modules/login');
    }
  }, [session, router]);

  const filteredNavItems = isMounted && session && settingsReady
    ? moduleNavItems.filter((item) => isRouteAllowed(session.role, item.href, settings))
    : [];

  return (
    <main className={shellClassName} data-sidebar-open={sidebarOpen ? 'true' : 'false'}>
      <section className="module-main">
        <ModuleTopbar
          sidebarCollapsed={sidebarCollapsed}
          sidebarOpen={sidebarOpen}
          onMenuClick={toggleSidebar}
        />
        <div className="module-page-content">{children}</div>
      </section>

      <aside
        className="module-sidebar"
        aria-hidden={sidebarOpen ? undefined : true}
        data-open={sidebarOpen ? 'true' : 'false'}
      >
        <Link className="module-sidebar-brand" href="/modules/dashboard" onClick={closeSidebar} style={{ gap: '0.65rem', alignItems: 'center' }}>
          <Image
            src="/solutionir-icon.png"
            alt="SolutionIR Logo"
            width={34}
            height={34}
            style={{ borderRadius: '6px', objectFit: 'contain' }}
          />
          <strong style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>SolutionIR<br />POS</strong>
        </Link>


        <nav className="module-side-nav" aria-label="Module navigation">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className={item.label === active ? 'active' : ''}
                href={item.href}
                key={item.label}
                onClick={closeSidebar}
              >
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {isMounted && session ? (
          <div
            className="module-user-card"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (window.confirm('Do you want to sign out?')) {
                clearAuthSession();
                document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
                window.location.assign('/modules/login');
              }
            }}
          >
            <div className="module-user-avatar">{session.email[0].toUpperCase()}</div>
            <div>
              <strong>{session.role}</strong>
              <span>{session.email}</span>
            </div>
            <ChevronDown />
          </div>
        ) : null}
      </aside>

      <button
        aria-label="Close menu"
        className="module-sidebar-backdrop"
        type="button"
        onClick={closeSidebar}
        tabIndex={sidebarOpen ? 0 : -1}
        hidden={!sidebarOpen}
      />
    </main>
  );
}
