'use client';

import { useMemo } from 'react';
import {
  PosDonutPanel,
  PosLineChart,
  PosMetricGrid,
  PosPanel,
} from '@/components/pos-section';
import {
  posDashboardMetrics,
  type PosSegment,
  type PosTone,
  type PosTrendPoint,
} from '@/lib/pos-data';
import {
  formatMoney,
  usePosStore,
  type PosPaymentMethod,
  type PosSaleRecord,
} from '@/lib/pos-state';

const trendBuckets = [
  { label: '12 AM', startHour: 0 },
  { label: '02 AM', startHour: 2 },
  { label: '04 AM', startHour: 4 },
  { label: '08 AM', startHour: 8 },
  { label: '12 PM', startHour: 12 },
  { label: '04 PM', startHour: 16 },
  { label: '08 PM', startHour: 20 },
  { label: '10 PM', startHour: 22 },
  { label: '11 PM', startHour: 23 },
];

const paymentTone: Record<PosPaymentMethod, PosTone> = {
  Cash: 'green',
  'Bank Transfer': 'blue',
  Card: 'purple',
  JazzCash: 'orange',
  EasyPaisa: 'sky',
};

export function PosDashboardWorkspace() {
  const { state } = usePosStore();

  const todaySales = useMemo(() => filterSalesForToday(state.completedSales), [state.completedSales]);
  const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = todaySales.length;
  const totalItemsSold = todaySales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.qty, 0), 0);
  const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
  const recentRows = todaySales.slice(0, 5);

  const metrics = useMemo(
    () =>
      posDashboardMetrics.map((metric) => {
        if (metric.label === 'Total Sales (PKR)') {
          return { ...metric, value: formatMoney(totalSales) };
        }
        if (metric.label === 'Total Orders') {
          return { ...metric, value: String(totalOrders) };
        }
        if (metric.label === 'Avg. Order Value (PKR)') {
          return { ...metric, value: formatMoney(averageOrder) };
        }
        if (metric.label === 'Total Items Sold') {
          return { ...metric, value: String(totalItemsSold) };
        }
        return metric;
      }),
    [averageOrder, totalItemsSold, totalOrders, totalSales],
  );

  const salesTrend = useMemo(() => buildSalesTrend(todaySales), [todaySales]);
  const paymentSegments = useMemo(() => buildPaymentSegments(todaySales), [todaySales]);

  return (
    <>
      <PosMetricGrid items={metrics} />

      <section className="pos-dashboard-grid">
        <PosLineChart title="Sales Overview (Today)" points={salesTrend} />

        <PosDonutPanel
          title="Payment Methods"
          segments={paymentSegments}
          centerValue={formatMoney(totalSales)}
          centerLabel="Total Sales"
        />
      </section>

      <PosPanel title="Recent Transactions">
        <table className="data-table pos-table-panel">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No.</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentRows.length ? (
              recentRows.map((sale, index) => {
                const { time } = splitSaleDateTime(sale.createdAt);
                return (
                  <tr key={sale.invoice}>
                    <td>{index + 1}</td>
                    <td>
                      <strong className="pos-table-link">{sale.invoice}</strong>
                    </td>
                    <td>{sale.customer.name}</td>
                    <td>{formatMoney(sale.total)}</td>
                    <td>{sale.paymentMethod}</td>
                    <td>{time}</td>
                    <td>
                      <span className="status-badge status-active">{sale.status}</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="table-empty-cell" colSpan={7}>No transactions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </PosPanel>
    </>
  );
}

function buildPaymentSegments(sales: PosSaleRecord[]): PosSegment[] {
  const totals = new Map<PosPaymentMethod, number>();

  sales.forEach((sale) => {
    totals.set(sale.paymentMethod, (totals.get(sale.paymentMethod) ?? 0) + sale.total);
  });

  return Array.from(totals.entries())
    .filter(([, value]) => value > 0)
    .map(([method, value]) => ({
      label: method,
      value,
      tone: paymentTone[method],
    }));
}

function buildSalesTrend(sales: PosSaleRecord[]): PosTrendPoint[] {
  const totals = trendBuckets.map((bucket) => ({
    label: bucket.label,
    value: 0,
    salesCount: 0,
  }));

  sales.forEach((sale) => {
    const date = parseSaleDate(sale.createdAt);
    const hour = date?.getHours() ?? 12;
    const index = bucketIndexForHour(hour);
    totals[index].value += sale.total;
    totals[index].salesCount += 1;
  });

  return totals;
}

function filterSalesForToday(sales: PosSaleRecord[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return sales.filter((sale) => {
    const saleDate = parseSaleDate(sale.createdAt);
    if (!saleDate) {
      return false;
    }

    return saleDate >= today && saleDate < tomorrow;
  });
}

function bucketIndexForHour(hour: number) {
  let selectedIndex = 0;

  trendBuckets.forEach((bucket, index) => {
    if (hour >= bucket.startHour) {
      selectedIndex = index;
    }
  });

  return selectedIndex;
}

function splitSaleDateTime(value: string) {
  const [date = '', time = ''] = value.split(',');
  return {
    date: date.trim(),
    time: time.trim() || value,
  };
}

function parseSaleDate(value: string) {
  const match = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    const direct = new Date(value);
    return Number.isNaN(direct.getTime()) ? null : direct;
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
