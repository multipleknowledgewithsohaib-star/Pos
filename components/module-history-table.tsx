'use client';

import { CalendarDays, ChevronDown, Filter } from 'lucide-react';
import { useMemo, useRef, useState, type RefObject } from 'react';
import { useModuleDateRange } from '@/components/module-date-range-context';
import type { ModuleHistoryItem } from '@/lib/module-data';
import {
  filterModuleHistoryItems,
  formatModuleDateField,
} from '@/lib/module-date-range';

type HistoryFilters = {
  activityType: ModuleHistoryItem['activityType'] | 'All';
};

const activityOptions: HistoryFilters['activityType'][] = ['All', 'Stock Added', 'Stock Adjustment', 'Stock Transfer'];

export function InventoryHistoryTableClient({ items }: { items: ModuleHistoryItem[] }) {
  const { range, setFrom, setTo } = useModuleDateRange();
  const [draftActivityType, setDraftActivityType] = useState<HistoryFilters['activityType']>('All');
  const [activeActivityType, setActiveActivityType] = useState<HistoryFilters['activityType']>('All');
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    return filterModuleHistoryItems(items, range, activeActivityType);
  }, [activeActivityType, items, range]);

  function openPicker(ref: RefObject<HTMLInputElement | null>) {
    const input = ref.current;
    if (!input) return;

    if (typeof (input as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
      return;
    }

    input.click();
  }

  function renderDateField(
    label: string,
    value: string,
    onChange: (next: string) => void,
    ref: RefObject<HTMLInputElement | null>,
  ) {
    return (
      <label className="module-field module-history-field">
        <span>{label}</span>
        <div className="module-filter-shell">
          <input
            readOnly
            placeholder="dd/mm/yyyy"
            value={value ? formatModuleDateField(value) : ''}
            onClick={() => openPicker(ref)}
          />
          <input
            ref={ref}
            className="module-filter-native-date"
            type="date"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-hidden="true"
            tabIndex={-1}
          />
          <button
            className="module-filter-icon-button"
            type="button"
            aria-label={`Open ${label.toLowerCase()} calendar`}
            onClick={() => openPicker(ref)}
          >
            <CalendarDays />
          </button>
        </div>
      </label>
    );
  }

  return (
      <section className="module-history-wrap">
      <div className="module-history-filters">
        {renderDateField(
          'Date From',
          range.from,
          (value) => setFrom(value),
          fromRef,
        )}
        {renderDateField(
          'Date To',
          range.to,
          (value) => setTo(value),
          toRef,
        )}

        <label className="module-field module-history-field">
          <span>Activity Type</span>
          <div className="module-filter-select">
            <select
              value={draftActivityType}
              onChange={(event) => setDraftActivityType(event.target.value as HistoryFilters['activityType'])}
            >
              {activityOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>

        <button
          className="module-page-button module-page-button-primary module-history-filter-button"
          type="button"
          onClick={() => setActiveActivityType(draftActivityType)}
        >
          <Filter />
          <span>Filter</span>
        </button>
      </div>

      <section className="module-detail-table-card">
        <table className="module-detail-table module-history-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Activity Type</th>
              <th>Medicine</th>
              <th>Batch No.</th>
              <th>Quantity</th>
              <th>User</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const quantityTone = item.quantity.startsWith('+') ? 'positive' : 'negative';

                return (
                  <tr key={`${item.dateTime}-${item.batchNo}`}>
                    <td>{item.dateTime}</td>
                    <td>{item.activityType}</td>
                    <td>{item.medicine}</td>
                    <td>{item.batchNo}</td>
                    <td>
                      <span className={`module-quantity module-quantity-${quantityTone}`}>{item.quantity}</span>
                    </td>
                    <td>{item.user}</td>
                    <td>{item.note}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="module-empty-cell" colSpan={7}>
                  No history found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </section>
  );
}
