'use client';

import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  formatModuleDateRangeLabel,
  getDefaultMonthRange,
  normalizeModuleDateRange,
  type ModuleDateRange,
} from '@/lib/module-date-range';

const DEFAULT_DASHBOARD_RANGE: ModuleDateRange = getDefaultMonthRange();

export function DashboardDateRangePicker() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<ModuleDateRange>(DEFAULT_DASHBOARD_RANGE);
  const [draftRange, setDraftRange] = useState<ModuleDateRange>(DEFAULT_DASHBOARD_RANGE);

  const label = useMemo(() => formatModuleDateRangeLabel(range), [range]);

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }

    setDraftRange(range);
    setOpen(true);
  }

  return (
    <div className="module-date-popover-wrap">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="date-range"
        type="button"
        onClick={toggleOpen}
      >
        <span>{label}</span>
        <CalendarDays className="date-range-icon" />
      </button>

      {open ? (
        <>
          <button
            aria-label="Close date panel"
            className="module-panel-backdrop"
            type="button"
            onClick={() => setOpen(false)}
          />
          <div className="module-date-popover" role="dialog" aria-label="Select dashboard date range">
          <label className="module-date-popover-field">
            <span>Date From</span>
            <input
              type="date"
              value={draftRange.from}
              onChange={(event) =>
                setDraftRange((current) =>
                  normalizeModuleDateRange({ ...current, from: event.target.value }),
                )
              }
            />
          </label>

          <label className="module-date-popover-field">
            <span>Date To</span>
            <input
              type="date"
              value={draftRange.to}
              onChange={(event) =>
                setDraftRange((current) =>
                  normalizeModuleDateRange({ ...current, to: event.target.value }),
                )
              }
            />
          </label>

          <div className="module-date-popover-actions">
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setRange(draftRange);
                setOpen(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
        </>
      ) : null}
    </div>
  );
}
