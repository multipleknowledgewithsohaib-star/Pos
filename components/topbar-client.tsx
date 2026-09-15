'use client';

import { Bell, CircleHelp, Menu, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AdminBranch, AdminClient } from '@/lib/admin-types';

export function TopbarClient({
  clients,
  branches,
  sidebarOpen = false,
  onMenuClick,
}: {
  clients: AdminClient[];
  branches: AdminBranch[];
  sidebarOpen?: boolean;
  onMenuClick?: () => void;
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? '');
  const [branchId, setBranchId] = useState(String(branches[0]?.id ?? ''));
  const [notice, setNotice] = useState('');

  const visibleBranches = useMemo(() => {
    if (!clientId) {
      return branches;
    }

    const selected = clients.find((client) => client.id === clientId);
    if (!selected?.branch) {
      return branches;
    }

    return branches.filter((branch) => branch.name === selected.branch || branch.city === selected.branch);
  }, [branches, clientId, clients]);

  return (
    <header className="topbar">
      <button
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        className="console-topbar-menu-button"
        type="button"
        onClick={() => onMenuClick?.()}
      >
        {sidebarOpen ? <X /> : <Menu />}
      </button>

      <div className="tenant-filters">
        <label>
          <span>Client</span>
          <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
            {clients.length ? (
              clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))
            ) : (
              <option value="">No clients available</option>
            )}
          </select>
        </label>
        <label>
          <span>Branch</span>
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            {visibleBranches.length ? (
              visibleBranches.map((branch) => (
                <option key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </option>
              ))
            ) : (
              <option value="">No branches available</option>
            )}
          </select>
        </label>
      </div>

      <div className="topbar-actions">
        <button
          className="topbar-icon"
          type="button"
          title="Search"
          onClick={() => setNotice('Use page search boxes to filter tables.')}
        >
          <Search className="topbar-icon-svg" />
        </button>
        <button
          className="topbar-icon topbar-icon-alert"
          type="button"
          title="Notifications"
          onClick={() => setNotice('No new notifications.')}
        >
          <Bell className="topbar-icon-svg" />
          <span>0</span>
        </button>
        <button
          className="topbar-icon"
          type="button"
          title="Help"
          onClick={() => setNotice('Pharma console help: use sidebar modules for POS, inventory, and reports.')}
        >
          <CircleHelp className="topbar-icon-svg" />
        </button>
        <div className="profile-menu">
          <div className="avatar">U</div>
          <div>
            <strong>User</strong>
            <span>Admin</span>
          </div>
        </div>
      </div>

      {notice ? <p className="sr-only" role="status">{notice}</p> : null}
    </header>
  );
}
