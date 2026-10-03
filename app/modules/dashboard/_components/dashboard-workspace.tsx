'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import { ModuleDashboardPanelAction } from '@/components/module-dashboard-panel-action';
import { ModuleHashScroll } from '@/components/module-hash-scroll';
import { useModuleDateRange } from '@/components/module-date-range-context';
import { reportOverviewCards } from '@/lib/report-data';
import { moduleStats } from '@/lib/module-data';
import {
  formatMoney,
  usePosStore,
  type PosCartLine,
  type PosSaleRecord,
} from '@/lib/pos-state';

type StockSummaryCard = {
  label: string;
  value: string;
  tone: 'purple' | 'green' | 'orange' | 'red';
};

type InventoryCost = {
  id: number;
  medicineName: string;
  purchasePrice: number;
};

export type DashboardInventorySummary = {
  totalItems: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  stockSummaryCards: StockSummaryCard[];
  inventoryCosts: InventoryCost[];
};

const topItemColors = ['#6d28ff', '#10b981', '#f59e0b', '#0ea5e9', '#d7dce8'];

export function DashboardWorkspace({ inventory }: { inventory: DashboardInventorySummary }) {
  const { state } = usePosStore();
  const { range } = useModuleDateRange();
  const completedSales = state.completedSales;
  const rangeSales = useMemo(() => filterSalesByRange(completedSales, range.from, range.to), [completedSales, range.from, range.to]);
  const visibleSales = rangeSales;
  const costLookup = useMemo(() => buildCostLookup(inventory.inventoryCosts), [inventory.inventoryCosts]);

  const totalSales = visibleSales.reduce((sum, sale) => sum + sale.total, 0);
  // Keep the dashboard order counter at zero.
  // Sales/transactions can still be shown from the existing POS data.
  const totalOrders = 0;
  const totalProfit = calculateProfit(visibleSales, costLookup);
  const topItems = buildTopItems(visibleSales);
  const trend = buildSalesTrend(visibleSales, range.from, range.to);
  const recentSales = visibleSales.slice(0, 5);
  const dashboardStats = moduleStats.map((stat) => {
    if (stat.label === 'Total Sales') {
      return {
        ...stat,
        value: `PKR ${formatMoney(totalSales)}`,
        helper: totalSales > 0 ? 'Live' : '0%',
        href: '/modules/reports/sales',
      };
    }
    if (stat.label === 'Total Profit') {
      return {
        ...stat,
        value: `PKR ${formatMoney(totalProfit)}`,
        helper: totalProfit > 0 ? 'Live' : '0%',
        href: '/modules/reports/profit-loss',
      };
    }
    if (stat.label === 'Total Orders') {
      return {
        ...stat,
        value: String(totalOrders),
        helper: totalOrders > 0 ? 'Live' : '0%',
        href: '/modules/pos/sales-history',
      };
    }
    if (stat.label === 'Low Stock Items') {
      return {
        ...stat,
        value: String(inventory.lowStockCount),
        helper: inventory.lowStockCount > 0 ? 'View' : '0%',
        href: '/modules/inventory/low-stock',
      };
    }
    if (stat.label === 'Expiring Soon') {
      return {
        ...stat,
        value: String(inventory.expiringSoonCount),
        helper: inventory.expiringSoonCount > 0 ? 'View' : '0%',
        href: '/modules/inventory/expiring-soon',
      };
    }
    return { ...stat, href: '/modules/dashboard' };
  });

  return (
    <>
      <ModuleHashScroll />
      <section className="module-dashboard-head">
        <h1>Dashboard</h1>
        <p>Welcome back</p>
      </section>

      <section className="module-stats-grid">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link className={`module-stat-card module-stat-${stat.tone}`} href={stat.href} key={stat.label}>
              <div>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
                <span>{stat.helper}</span>
              </div>
              <i><Icon /></i>
            </Link>
          );
        })}
      </section>

      <section className="module-dashboard-grid">
        <article className="module-panel module-sales-panel">
          <PanelTitle title="Sales Overview">
            <ModuleDashboardPanelAction label="This Month" reportHref="/modules/reports/sales" />
          </PanelTitle>
          <DashboardSalesChart points={trend} />
        </article>

        <article className="module-panel">
          <PanelTitle title="Top Selling Items">
            <ModuleDashboardPanelAction label="This Month" reportHref="/modules/reports/sales" />
          </PanelTitle>
          <div className="module-donut-row">
            <div className="module-donut" style={{ background: buildDonutGradient(topItems) }} />
            <div className="module-donut-legend">
              {topItems.length ? (
                topItems.map((item) => (
                  <div key={item.label}>
                    <i style={{ background: item.color }} />
                    <span>{item.label}</span>
                    <strong>{item.percent}%</strong>
                  </div>
                ))
              ) : (
                <div className="module-empty-state">No sales yet.</div>
              )}
            </div>
          </div>
        </article>

        <article className="module-panel">
          <PanelTitle title="Recent Transactions">
            <ModuleDashboardPanelAction
              label="View All"
              links={[
                { label: 'Sales History', href: '/modules/pos/sales-history' },
                { label: 'New Sale', href: '/modules/pos/new-sale' },
                { label: 'POS Dashboard', href: '/modules/pos' },
              ]}
            />
          </PanelTitle>
          <table className="module-transactions-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length ? (
                recentSales.map((sale) => (
                  <tr key={sale.invoice}>
                    <td>{sale.invoice}</td>
                    <td>{sale.customer.name}</td>
                    <td>PKR {formatMoney(sale.total)}</td>
                    <td>
                      <span className="paid">{sale.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="module-empty-state" colSpan={4}>
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className="module-panel">
          <PanelTitle title="Stock Summary">
            <ModuleDashboardPanelAction
              label="View All"
              links={[
                { label: 'All Items', href: '/modules/inventory/medicines' },
                { label: 'Low Stock', href: '/modules/inventory/low-stock' },
                { label: 'Expiring Soon', href: '/modules/inventory/expiring-soon' },
              ]}
            />
          </PanelTitle>
          <div className="module-stock-grid">
            {inventory.stockSummaryCards.map((item) => (
              <Link className={`module-stock-card module-stock-${item.tone}`} href={stockHrefFor(item.label)} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="module-reports-panel" id="reports">
        <div className="module-reports-head">
          <div>
            <h2>Reports Overview</h2>
            <p>Get insights and analytics about your business.</p>
          </div>
          <Link className="module-reports-link" href="/modules/reports">
            Open Full Reports
          </Link>
        </div>

        <div className="module-reports-grid">
          {reportOverviewCards.map((report) => {
            const Icon = report.icon;
            return (
              <Link className="module-report-card" href={report.href} key={report.key}>
                <span className={`module-report-icon module-report-icon-${report.tone}`}>
                  <Icon />
                </span>
                <strong>{report.title}</strong>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function PanelTitle({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="module-panel-title">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function DashboardSalesChart({
  points,
}: {
  points: Array<{ label: string; value: number; salesCount: number }>;
}) {
  const values = points.map((point) => point.value);
  const maxPoint = Math.max(...values, 1);
  const chartPoints = values
    .map((value, index) => {
      const x = 12 + index * 24;
      const y = 170 - (value / maxPoint) * 142;
      return `${x},${y}`;
    })
    .join(' ');
  const fillPoints = `12,176 ${chartPoints} 396,176`;
  const scaleMax = Math.max(1000, Math.ceil(maxPoint / 1000) * 1000);
  const dateLabels = labelsForChart(points);

  return (
    <>
      <div className="module-chart-wrap">
        <div className="module-chart-scale">
          <span>{compactMoney(scaleMax)}</span>
          <span>{compactMoney(scaleMax * 0.66)}</span>
          <span>{compactMoney(scaleMax * 0.33)}</span>
          <span>0</span>
        </div>
        <svg viewBox="0 0 410 190" role="img" aria-label="Sales overview chart">
          <defs>
            <linearGradient id="moduleLineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6d28ff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6d28ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M ${fillPoints} Z`} fill="url(#moduleLineFill)" />
          <polyline points={chartPoints} fill="none" stroke="#6d28ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          {values.map((value, index) => (
            <circle cx={12 + index * 24} cy={170 - (value / maxPoint) * 142} fill="#6d28ff" key={`${value}-${index}`} r="3.8">
              <title>{`${points[index].label}: PKR ${formatMoney(points[index].value)} (${points[index].salesCount} sales)`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="module-chart-dates">
        {dateLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </>
  );
}

function buildCostLookup(items: InventoryCost[]) {
  return {
    byId: new Map(items.map((item) => [item.id, item.purchasePrice])),
    byName: new Map(items.map((item) => [normalizeName(item.medicineName), item.purchasePrice])),
  };
}

function calculateProfit(
  sales: PosSaleRecord[],
  lookup: ReturnType<typeof buildCostLookup>,
) {
  return sales.reduce((sum, sale) => {
    const cost = sale.items.reduce((itemSum, item) => itemSum + purchaseCostFor(item, lookup) * item.qty, 0);
    return sum + Math.max(0, sale.total - cost);
  }, 0);
}

function purchaseCostFor(line: PosCartLine, lookup: ReturnType<typeof buildCostLookup>) {
  const byId = line.medicineId === null ? undefined : lookup.byId.get(line.medicineId);
  return byId ?? lookup.byName.get(normalizeName(line.name)) ?? 0;
}

function buildTopItems(sales: PosSaleRecord[]) {
  const qtyByName = new Map<string, number>();

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      qtyByName.set(item.name, (qtyByName.get(item.name) ?? 0) + item.qty);
    });
  });

  const rows = Array.from(qtyByName.entries())
    .map(([label, qty]) => ({ label, qty }))
    .sort((left, right) => right.qty - left.qty)
    .slice(0, 5);
  const total = rows.reduce((sum, item) => sum + item.qty, 0);

  return rows.map((item, index) => ({
    ...item,
    color: topItemColors[index] ?? '#d7dce8',
    percent: total > 0 ? Math.round((item.qty / total) * 100) : 0,
  }));
}

function buildDonutGradient(items: ReturnType<typeof buildTopItems>) {
  if (!items.length) {
    return '#e5e7eb';
  }

  let start = 0;
  const stops = items.map((item) => {
    const end = start + item.percent;
    const stop = `${item.color} ${start}% ${end}%`;
    start = end;
    return stop;
  });

  if (start < 100) {
    stops.push(`#d7dce8 ${start}% 100%`);
  }

  return `conic-gradient(${stops.join(', ')})`;
}

function buildSalesTrend(sales: PosSaleRecord[], from: string, to: string) {
  const points = Array.from({ length: 17 }, (_, index) => {
    const date = dateForPoint(index, from, to);
    return {
      label: formatDayLabel(date),
      value: 0,
      salesCount: 0,
      date,
    };
  });

  sales.forEach((sale) => {
    const saleDate = parseSaleDate(sale.createdAt);
    if (!saleDate) {
      points[points.length - 1].value += sale.total;
      return;
    }

    const index = closestPointIndex(points, saleDate);
    points[index].value += sale.total;
    points[index].salesCount += 1;
  });

  return points.map(({ label, value, salesCount }) => ({ label, value, salesCount }));
}

function labelsForChart(points: Array<{ label: string; value: number }>) {
  if (points.length <= 5) {
    return points.map((point) => point.label);
  }

  return [0, 5, 10, 15, points.length - 1].map((index) => points[index]?.label ?? '').filter(Boolean);
}

function closestPointIndex(points: Array<{ date: Date }>, date: Date) {
  let selected = 0;
  let distance = Number.POSITIVE_INFINITY;

  points.forEach((point, index) => {
    const nextDistance = Math.abs(point.date.getTime() - date.getTime());
    if (nextDistance < distance) {
      selected = index;
      distance = nextDistance;
    }
  });

  return selected;
}

function dateForPoint(index: number, from: string, to: string) {
  const fromDate = parseDateInput(from) ?? startOfCurrentMonth();
  const toDate = parseDateInput(to) ?? endOfMonth(fromDate);
  const totalDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000));
  const offset = Math.round((index / 16) * totalDays);
  const date = new Date(fromDate);
  date.setDate(fromDate.getDate() + offset);
  return date;
}

function filterSalesByRange(sales: PosSaleRecord[], from: string, to: string) {
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);
  if (!fromDate && !toDate) {
    return sales;
  }

  const normalizedTo = toDate ? new Date(toDate) : null;
  normalizedTo?.setHours(23, 59, 59, 999);

  return sales.filter((sale) => {
    const saleDate = parseSaleDate(sale.createdAt);
    if (!saleDate) {
      return true;
    }

    return (!fromDate || saleDate >= fromDate) && (!normalizedTo || saleDate <= normalizedTo);
  });
}

function parseSaleDate(value: string) {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  const [, day, monthName, year, hourValue, minuteValue, period] = match;
  const month = monthIndexFor(monthName);
  if (month < 0) {
    return null;
  }

  let hour = Number(hourValue);
  if (period.toUpperCase() === 'AM') {
    hour = hour === 12 ? 0 : hour;
  } else {
    hour = hour === 12 ? 12 : hour + 12;
  }

  const parsed = new Date(Number(year), month, Number(day), hour, Number(minuteValue));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateInput(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function compactMoney(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return Math.round(value).toLocaleString('en-US');
}

function stockHrefFor(label: string) {
  if (label === 'Low Stock') {
    return '/modules/inventory/low-stock';
  }
  if (label === 'Out of Stock') {
    return '/modules/inventory/low-stock';
  }
  return '/modules/inventory/medicines';
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function monthIndexFor(value: string) {
  return [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ].indexOf(value.toLowerCase());
}
