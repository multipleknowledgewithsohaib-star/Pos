'use client';

import { Bell, CalendarDays, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useModuleDateRange } from '@/components/module-date-range-context';
import { formatModuleDateRangeLabel } from '@/lib/module-date-range';

export function ModuleTopbar({
  sidebarOpen,
  onMenuClick,
}: {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { range, setFrom, setTo } = useModuleDateRange();
  const label = useMemo(() => {
    if (!range.from || !range.to) {
      return 'Select date range';
    }
    return formatModuleDateRangeLabel(range);
  }, [range]);

  const [notifications, setNotifications] = useState([
    {
      id: 'low-stock',
      title: 'Low stock alert',
      description: 'Open low stock medicines list.',
      href: '/modules/inventory/low-stock'
    },
    {
      id: 'pending-purchases',
      title: 'Pending purchases',
      description: 'Receive purchase items into inventory.',
      href: '/modules/purchases/receive'
    }
  ]);

  const closePanels = useCallback(() => {
    setDateOpen(false);
    setNotifyOpen(false);
  }, []);

  useEffect(() => {
    if (!dateOpen && !notifyOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePanels();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closePanels, dateOpen, notifyOpen]);

  function handleMenuClick() {
    closePanels();
    onMenuClick();
  }

  return (
    <header className="module-topbar">
      {(dateOpen || notifyOpen) ? (
        <button
          aria-label="Close panel"
          className="module-panel-backdrop"
          type="button"
          onClick={closePanels}
        />
      ) : null}

      <button
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        className="module-menu-button"
        type="button"
        onClick={handleMenuClick}
      >
        {sidebarOpen ? <X /> : <Menu />}
      </button>

      <div className="module-top-actions">
        <div className={`module-date-popover-wrap ${dateOpen ? 'is-open' : ''}`}>
          <button
            aria-expanded={dateOpen}
            aria-haspopup="dialog"
            className="module-date-button"
            type="button"
            onClick={() => {
              setNotifyOpen(false);
              setDateOpen((current) => !current);
            }}
          >
            <span className="module-date-button-label">{label}</span>
            <CalendarDays />
          </button>

          {dateOpen ? (
            <div className="module-date-popover" role="dialog" aria-label="Select date range">
              <label className="module-date-popover-field">
                <span>Date From</span>
                <input type="date" value={range.from} onChange={(event) => setFrom(event.target.value)} />
              </label>
              <label className="module-date-popover-field">
                <span>Date To</span>
                <input type="date" value={range.to} onChange={(event) => setTo(event.target.value)} />
              </label>
              <div className="module-date-popover-actions">
                <button type="button" onClick={() => setDateOpen(false)}>
                  Close
                </button>
                <button type="button" onClick={() => setDateOpen(false)}>
                  Apply
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className={`module-notify-popover-wrap ${notifyOpen ? 'is-open' : ''}`}>
          <button
            aria-expanded={notifyOpen}
            aria-haspopup="menu"
            className="module-notify-button"
            type="button"
            onClick={() => {
              setDateOpen(false);
              setNotifyOpen((current) => !current);
            }}
          >
            <Bell />
            {notifications.length > 0 ? (
              <span className="module-notify-badge">{notifications.length}</span>
            ) : null}
          </button>

          {notifyOpen ? (
            <div className="module-notify-popover" role="menu" aria-label="Notifications">
              <div className="module-notify-head">
                <strong>Notifications</strong>
                {notifications.length > 0 ? (
                  <button type="button" onClick={() => setNotifications([])}>
                    Mark all read
                  </button>
                ) : null}
              </div>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    role="menuitem"
                    onClick={() => {
                      closePanels();
                      setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                    }}
                  >
                    <strong>{n.title}</strong>
                    <span>{n.description}</span>
                  </Link>
                ))
              ) : (
                <div className="module-notify-empty" style={{ padding: '16px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                  No new notifications
                </div>
              )}
              <Link
                className="module-notify-settings"
                href="/modules/settings/notifications"
                role="menuitem"
                onClick={closePanels}
              >
                Notification Settings
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
