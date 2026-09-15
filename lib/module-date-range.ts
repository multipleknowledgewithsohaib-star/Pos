import type { ModuleHistoryItem } from '@/lib/module-data';

export type ModuleDateRange = {
  from: string;
  to: string;
};

export const DEFAULT_MODULE_DATE_RANGE: ModuleDateRange = {
  from: '2019-01-01',
  to: '2019-01-31',
};

const monthMap: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

export function normalizeModuleDateRange(range: Partial<ModuleDateRange> = {}): ModuleDateRange {
  const from = isDateInputValue(range.from) ? range.from : '';
  const to = isDateInputValue(range.to) ? range.to : '';

  if (from && to) {
    const fromDate = parseDateInputValue(from);
    const toDate = parseDateInputValue(to);

    if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      return { from: to, to: from };
    }
  }

  return { from, to };
}

export function formatModuleDateLabel(value: string) {
  const date = parseDateInputValue(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatModuleDateField(value: string) {
  const date = parseDateInputValue(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatModuleDateRangeLabel(range: ModuleDateRange) {
  if (!range.from && !range.to) {
    return `${formatModuleDateLabel(DEFAULT_MODULE_DATE_RANGE.from)} - ${formatModuleDateLabel(DEFAULT_MODULE_DATE_RANGE.to)}`;
  }

  if (range.from && !range.to) {
    return `${formatModuleDateLabel(range.from)} - Select end date`;
  }

  if (!range.from && range.to) {
    return `Select start date - ${formatModuleDateLabel(range.to)}`;
  }

  return `${formatModuleDateLabel(range.from)} - ${formatModuleDateLabel(range.to)}`;
}

export function parseHistoryDate(value: string) {
  const match = value.match(
    /^(\d{1,2}) ([A-Za-z]{3}) (\d{4}) (\d{2}):(\d{2}) (AM|PM)$/,
  );

  if (!match) return null;

  const [, day, monthLabel, year, hourValue, minute, period] = match;
  const month = monthMap[monthLabel];
  if (month === undefined) return null;

  let hour = Number(hourValue);
  if (period === 'AM') {
    hour = hour === 12 ? 0 : hour;
  } else {
    hour = hour === 12 ? 12 : hour + 12;
  }

  const date = new Date(Number(year), month, Number(day), hour, Number(minute));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function filterModuleHistoryItems(
  items: ModuleHistoryItem[],
  range: ModuleDateRange,
  activityType: ModuleHistoryItem['activityType'] | 'All',
) {
  const normalizedRange = normalizeModuleDateRange(range);
  const fromDate = normalizedRange.from ? parseDateInputValue(normalizedRange.from) : null;
  const toDate = normalizedRange.to ? parseDateInputValue(normalizedRange.to) : null;

  return items.filter((item) => {
    const itemDate = parseHistoryDate(item.dateTime);
    const matchesType = activityType === 'All' || item.activityType === activityType;
    const matchesFrom = !fromDate || (itemDate ? itemDate >= fromDate : true);
    const matchesTo = !toDate || (itemDate ? itemDate <= toDate : true);
    return matchesType && matchesFrom && matchesTo;
  });
}

function isDateInputValue(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function parseDateInputValue(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function currentMonthRange(): ModuleDateRange {
  const now = new Date();
  return {
    from: dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: dateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}
