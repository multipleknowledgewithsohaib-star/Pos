'use client';

import Link from 'next/link';
import { LogOut, Menu, Plus, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/demo-data';

export function Sidebar({
  sidebarOpen = false,
  onMenuClick,
  onNavigate,
}: {
  sidebarOpen?: boolean;
  onMenuClick?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span />
        </div>
        <div className="brand-copy">
          <strong>Core SaaS</strong>
        </div>
        <button
          className="sidebar-menu console-mobile-menu-button"
          type="button"
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          onClick={() => onMenuClick?.()}
        >
          {sidebarOpen ? <X className="sidebar-menu-icon" /> : <Menu className="sidebar-menu-icon" />}
        </button>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {navItems
          .filter((item) => {
            const label = item.label.trim().toLowerCase();
            return label !== 'settings' && label !== 'backup & restore';
          })
          .map((item) => {
          const active =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              className={active ? 'nav-item nav-item-active' : 'nav-item'}
              href={item.href}
              key={item.href}
              onClick={() => onNavigate?.()}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <Link className="nav-item nav-item-compact" href="/users/new" onClick={() => onNavigate?.()}>
          <Plus className="nav-icon" />
          <span>Add User</span>
        </Link>
        <Link className="nav-item nav-item-compact" href="/login" onClick={() => onNavigate?.()}>
          <LogOut className="nav-icon" />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
