'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useModuleDateRange } from '@/components/module-date-range-context';
import { DEFAULT_MODULE_DATE_RANGE, type ModuleDateRange } from '@/lib/module-date-range';

type RangePreset = {
  label: string;
  range: ModuleDateRange;
};

type ActionLink = {
  label: string;
  href: string;
};

function buildRangePresets(): RangePreset[] {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return [
    { label: 'Today', range: { from: dateInputValue(now), to: dateInputValue(now) } },
    { label: 'This Week', range: { from: dateInputValue(weekStart), to: dateInputValue(weekEnd) } },
    { label: 'This Month', range: DEFAULT_MODULE_DATE_RANGE },
    {
      label: 'This Year',
      range: {
        from: dateInputValue(new Date(now.getFullYear(), 0, 1)),
        to: dateInputValue(new Date(now.getFullYear(), 11, 31)),
      },
    },
  ];
}

export function ModuleDashboardPanelAction({
  label,
  links = [],
  reportHref,
}: {
  label: string;
  links?: ActionLink[];
  reportHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(label);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { setRange } = useModuleDateRange();
  const hasRangeOptions = links.length === 0;
  const rangePresets = buildRangePresets();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="module-panel-action-wrap" ref={wrapperRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="module-panel-action-button"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        {selectedLabel}
        <ChevronDown />
      </button>

      {open ? (
        <div className="module-panel-action-menu" role="menu">
          {hasRangeOptions
            ? rangePresets.map((preset) => (
                <button
                  className={preset.label === selectedLabel ? 'active' : ''}
                  key={preset.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setSelectedLabel(preset.label);
                    setRange(preset.range);
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </button>
              ))
            : links.map((item) => (
                <Link href={item.href} key={item.href} role="menuitem" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              ))}
          {reportHref ? (
            <Link className="module-panel-action-primary" href={reportHref} role="menuitem" onClick={() => setOpen(false)}>
              Open report
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
