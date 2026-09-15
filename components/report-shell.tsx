'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  Filter,
  PackageX,
  Search,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  defaultReportRange,
  inventoryBreakdown,
  inventoryReportRows,
  inventorySummary,
  paymentReportRows,
  paymentSummary,
  profitLossBreakdown,
  profitLossMargin,
  profitLossSummaryRows,
  purchaseReportRows,
  purchaseTrend,
  reportOverviewCards,
  salesReportRows,
  salesTrend,
  expiryBreakdown,
  expiryReportRows,
  expirySummary,
  supplierReportRows,
  taxSummaryRows,
  customerReportRows,
  reportRouteKeys,
  type ReportKey,
} from '@/lib/report-data';
import {
  formatModuleDateRangeLabel,
  normalizeModuleDateRange,
  type ModuleDateRange,
} from '@/lib/module-date-range';

type ReportTone = 'purple' | 'green' | 'red' | 'blue' | 'orange';
type BadgeTone = 'green' | 'orange' | 'red' | 'blue' | 'purple';
type AnyReportRow = Record<string, unknown> & {
  date?: string;
  status?: string;
  label?: string;
};

type SharedProps = {
  range: ModuleDateRange;
  setRange: (range: ModuleDateRange) => void;
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
};

type MetricCard = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone: ReportTone;
};

type Segment = {
  label: string;
  value: number;
  tone: BadgeTone | 'sky' | 'pink' | 'yellow';
};

const metricToneClasses: Record<ReportTone, string> = {
  purple: 'report-metric-icon-purple',
  green: 'report-metric-icon-green',
  red: 'report-metric-icon-red',
  blue: 'report-metric-icon-blue',
  orange: 'report-metric-icon-orange',
};

const badgeToneClasses: Record<BadgeTone, string> = {
  green: 'report-badge-green',
  orange: 'report-badge-orange',
  red: 'report-badge-red',
  blue: 'report-badge-blue',
  purple: 'report-badge-purple',
};

const segmentToneHex: Record<BadgeTone, string> = {
  green: '#16a34a',
  orange: '#fb923c',
  red: '#ef4444',
  blue: '#2563eb',
  purple: '#6d28ff',
};

const extendedSegmentToneHex: Record<Segment['tone'], string> = {
  ...segmentToneHex,
  sky: '#0ea5e9',
  pink: '#d9468d',
  yellow: '#d97706',
};

const statusOptionsByReport: Partial<Record<ReportKey, string[]>> = {
  inventory: ['All', 'Normal Stock', 'Low Stock', 'Out of Stock', 'Expiring Soon'],
  expiry: ['All', 'Expiring in 5 Days', 'Expiring in 10 Days', 'Expiring in 15 Days', 'Expiring in 20 Days'],
  payment: ['All', 'Paid', 'Pending', 'Refunded'],
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
}

function formatSignedMoney(value: number) {
  const formatted = formatMoney(value);
  return value < 0 ? `(${formatted})` : formatted;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function toTimestamp(value?: string) {
  if (!value) return null;
  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function rowMatchesDateRange(row: AnyReportRow, range: ModuleDateRange) {
  const rowTime = toTimestamp(row.date);
  if (rowTime === null) return true;

  const from = toTimestamp(range.from);
  const to = toTimestamp(range.to);

  if (from !== null && rowTime < from) return false;
  if (to !== null && rowTime > to + 24 * 60 * 60 * 1000 - 1) return false;
  return true;
}

function rowMatchesSearch(row: AnyReportRow, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return Object.values(row)
    .map((value) => String(value).toLowerCase())
    .join(' ')
    .includes(needle);
}

function rowMatchesStatus(row: AnyReportRow, status: string) {
  if (!status || status === 'All') return true;
  return typeof row.status === 'string' ? row.status === status : true;
}

function filterRows<T extends AnyReportRow>(rows: T[], range: ModuleDateRange, search: string, status: string) {
  return rows.filter((row) => rowMatchesDateRange(row, range) && rowMatchesSearch(row, search) && rowMatchesStatus(row, status));
}

function filterTrendPoints(points: { date: string; label: string; value: number }[], range: ModuleDateRange) {
  return points.filter((point) => rowMatchesDateRange({ date: point.date }, range));
}

function exportCsv(rows: AnyReportRow[], filename: string) {
  if (!rows.length) return;

  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [
    keys.join(','),
    ...rows.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          const text = value === null || value === undefined ? '' : String(value);
          return `"${text.replaceAll('"', '""')}"`;
        })
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toneFromStatus(value: string): BadgeTone {
  const normalized = value.toLowerCase();
  if (normalized.includes('paid') || normalized.includes('normal') || normalized.includes('in stock') || normalized.includes('safe')) {
    return 'green';
  }
  if (normalized.includes('low') || normalized.includes('pending') || normalized.includes('expiring')) {
    return 'orange';
  }
  if (normalized.includes('out') || normalized.includes('expired') || normalized.includes('refund') || normalized.includes('due')) {
    return 'red';
  }
  return 'blue';
}

function ReportBadge({ tone, children }: { tone: BadgeTone; children: string }) {
  return <span className={`report-badge ${badgeToneClasses[tone]}`}>{children}</span>;
}

function MetricCardGrid({ cards }: { cards: MetricCard[] }) {
  return (
    <section className="report-metric-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        const hasIcon = Boolean(Icon);
        return (
          <article
            className={`report-metric-card report-metric-card-${card.tone} ${
              hasIcon ? 'report-metric-card-icon' : 'report-metric-card-plain'
            }`}
            key={card.label}
          >
            {Icon ? (
              <div className={`report-metric-icon ${metricToneClasses[card.tone]}`}>
                <Icon className="report-metric-icon-svg" />
              </div>
            ) : null}
            <div className="report-metric-copy">
              <p>{card.label}</p>
              <strong>{card.value}</strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function DateRangeButton({
  value,
  onApply,
}: {
  value: ModuleDateRange;
  onApply: (range: ModuleDateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(value);

  return (
    <div className="module-date-popover-wrap">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="date-range"
        type="button"
        onClick={() => {
          if (!open) {
            setDraftRange(value);
          }
          setOpen((current) => !current);
        }}
      >
        <span>{formatModuleDateRangeLabel(value)}</span>
        <CalendarDays className="date-range-icon" />
      </button>

      {open ? (
        <div className="module-date-popover" role="dialog" aria-label="Select report date range">
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
                onApply(draftRange);
                setOpen(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterButton({
  value,
  status,
  onApply,
  statusOptions,
  placeholder = 'Search report...',
}: {
  value: string;
  status: string;
  onApply: (next: { search: string; status: string }) => void;
  statusOptions?: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftSearch, setDraftSearch] = useState(value);
  const [draftStatus, setDraftStatus] = useState(status);

  return (
    <div className="module-date-popover-wrap">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="button button-primary"
        type="button"
        onClick={() => {
          if (!open) {
            setDraftSearch(value);
            setDraftStatus(status);
          }
          setOpen((current) => !current);
        }}
      >
        <Filter className="button-icon" />
        <span>Filter</span>
      </button>

      {open ? (
        <div className="module-date-popover" role="dialog" aria-label="Filter report data">
          <label className="module-date-popover-field">
            <span>Search</span>
            <div className="report-search-row">
              <Search className="report-search-icon" />
              <input
                placeholder={placeholder}
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
              />
            </div>
          </label>

          {statusOptions ? (
            <label className="module-date-popover-field">
              <span>Status</span>
              <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="module-date-popover-actions">
            <button
              type="button"
              onClick={() => {
                setDraftSearch('');
                setDraftStatus('All');
                onApply({ search: '', status: 'All' });
                setOpen(false);
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                onApply({ search: draftSearch, status: draftStatus });
                setOpen(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ExportButton({
  rows,
  filename,
}: {
  rows: AnyReportRow[];
  filename: string;
}) {
  return (
    <button
      className="button button-secondary report-export-button"
      type="button"
      onClick={() => exportCsv(rows, filename)}
      disabled={!rows.length}
    >
      <Download className="button-icon" />
      <span>Export Report</span>
    </button>
  );
}

function LineChartPanel({
  title,
  subtitle,
  points,
  color = '#1d4ed8',
}: {
  title: string;
  subtitle?: string;
  points: { date: string; label: string; value: number }[];
  color?: string;
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const width = 620;
  const height = 240;
  const axisLeft = 42;
  const axisRight = 18;
  const paddingTop = 20;
  const paddingBottom = 34;
  const chartHeight = height - paddingTop - paddingBottom;
  const scaleMax = Math.max(50000, maxValue);
  const step = points.length > 1 ? (width - axisLeft - axisRight) / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = axisLeft + index * step;
    const y = height - paddingBottom - (point.value / scaleMax) * chartHeight;
    return { x, y };
  });

  const linePoints = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `${axisLeft},${height - paddingBottom} ${linePoints} ${width - axisRight},${height - paddingBottom}`;
  const ticks = [0, 10000, 20000, 30000, 40000, 50000];

  return (
    <article className="panel report-chart-panel">
      <div className="panel-title-row">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="report-panel-note">{subtitle}</p> : null}
        </div>
      </div>

      {points.length ? (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
            <defs>
              <linearGradient id="reportLineFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.24" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1={axisLeft} y1={paddingTop} x2={axisLeft} y2={height - paddingBottom} stroke="#d8dce6" strokeWidth="1" />
            {ticks.map((tick) => {
              const y = height - paddingBottom - (tick / scaleMax) * chartHeight;
              return (
                <g key={tick}>
                  <line x1={axisLeft} x2={width - axisRight} y1={y} y2={y} stroke="#edf1f6" strokeDasharray="4 4" />
                  <text x={0} y={y + 4} fill="#64748b" fontSize="11">
                    {tick === 0 ? '0' : `${tick / 1000}K`}
                  </text>
                </g>
              );
            })}
            <polyline points={areaPoints} fill="url(#reportLineFill)" stroke="none" />
            <polyline
              points={linePoints}
              fill="none"
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {coords.map((point, index) => (
              <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r="4" fill={color}>
                <title>{`${points[index].label}: ${points[index].value.toLocaleString('en-US')}`}</title>
              </circle>
            ))}
          </svg>

          <div className="chart-axis report-chart-axis">
            {points.length > 5
              ? points
                  .filter((_, index) =>
                    [0, Math.floor((points.length - 1) / 4), Math.floor((points.length - 1) / 2), Math.floor(((points.length - 1) * 3) / 4), points.length - 1].includes(index),
                  )
                  .map((point) => <span key={point.label}>{point.label}</span>)
              : points.map((point) => <span key={point.label}>{point.label}</span>)}
          </div>
        </>
      ) : (
        <div className="report-empty-state">No data available for the selected range.</div>
      )}
    </article>
  );
}

function BarChartPanel({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle?: string;
  points: { date: string; label: string; value: number }[];
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const width = 620;
  const height = 240;
  const axisLeft = 42;
  const axisRight = 18;
  const paddingTop = 20;
  const paddingBottom = 34;
  const chartHeight = height - paddingTop - paddingBottom;
  const scaleMax = Math.max(50000, maxValue);
  const paddingX = axisLeft;
  const barWidth = points.length ? Math.min(14, (width - axisLeft - axisRight) / points.length - 4) : 12;
  const gap = points.length > 1 ? (width - axisLeft - axisRight - barWidth * points.length) / (points.length - 1) : 0;
  const palette = ['#4f35d5', '#4f35d5', '#4f35d5', '#1d5bd6', '#4f35d5'];
  const ticks = [0, 10000, 20000, 30000, 40000, 50000];

  return (
    <article className="panel report-chart-panel">
      <div className="panel-title-row">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="report-panel-note">{subtitle}</p> : null}
        </div>
      </div>

      {points.length ? (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
            <line x1={axisLeft} y1={paddingTop} x2={axisLeft} y2={height - paddingBottom} stroke="#d8dce6" strokeWidth="1" />
            {ticks.map((tick) => {
              const y = height - paddingBottom - (tick / scaleMax) * chartHeight;
              return (
                <g key={tick}>
                  <line x1={axisLeft} x2={width - axisRight} y1={y} y2={y} stroke="#eef1f6" strokeDasharray="4 4" />
                  <text x="2" y={y + 4} fill="#64748b" fontSize="10">
                    {tick === 0 ? '0' : `${tick / 1000}K`}
                  </text>
                </g>
              );
            })}

            {points.map((point, index) => {
              const heightValue = (point.value / scaleMax) * chartHeight;
              const x = paddingX + index * (barWidth + gap);
              const y = height - paddingBottom - heightValue;
              return (
                <rect
                  key={`${point.label}-${index}`}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={heightValue}
                  rx="2"
                  fill={palette[index % palette.length]}
                >
                  <title>{`${point.label}: ${point.value.toLocaleString('en-US')}`}</title>
                </rect>
              );
            })}
          </svg>

          <div className="chart-axis report-chart-axis">
            {points.length > 5
              ? points
                  .filter((_, index) =>
                    [0, Math.floor((points.length - 1) / 4), Math.floor((points.length - 1) / 2), Math.floor(((points.length - 1) * 3) / 4), points.length - 1].includes(index),
                  )
                  .map((point) => <span key={point.label}>{point.label}</span>)
              : points.map((point) => <span key={point.label}>{point.label}</span>)}
          </div>
        </>
      ) : (
        <div className="report-empty-state">No data available for the selected range.</div>
      )}
    </article>
  );
}

function DonutPanel({
  title,
  segments,
  centerValue,
  centerLabel,
  legendLayout = 'grid',
  showLegend = true,
  variant = 'default',
}: {
  title: string;
  segments: Segment[];
  centerValue?: string;
  centerLabel?: string;
  legendLayout?: 'grid' | 'table';
  showLegend?: boolean;
  variant?: 'default' | 'profit';
}) {
  if (variant === 'profit') {
    const hasProfitData = profitLossMargin > 0;
    const greenPortion = hasProfitData ? Math.max(0, Math.min(100, 100 - profitLossMargin)) : 0;
    const profitRing = hasProfitData
      ? `conic-gradient(from -90deg, #16a34a 0 ${greenPortion}%, #d1d5db ${greenPortion}% 100%)`
      : '#e5e7eb';

    return (
      <article className="panel report-donut-panel report-donut-panel-centered report-profit-panel">
        <div className="panel-title-row">
          <h2>{title}</h2>
        </div>

        <div className="report-donut-layout report-donut-layout-centered">
          <div className="report-donut report-profit-donut" style={{ background: profitRing }}>
            <div className="report-donut-hole report-profit-donut-hole">
              {centerValue ? <strong>{centerValue}</strong> : null}
              {centerLabel ? <span>{centerLabel}</span> : null}
            </div>
          </div>
        </div>
      </article>
    );
  }

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const hasData = segments.length > 0 && total > 0;
  const stops = hasData
    ? segments
        .map((segment, index) => {
          const start = segments
            .slice(0, index)
            .reduce((sum, previous) => sum + (previous.value / total) * 100, 0);
          const end = start + (segment.value / total) * 100;
          return `${extendedSegmentToneHex[segment.tone]} ${start}% ${end}%`;
        })
        .join(', ')
    : '';

  return (
    <article className={`panel report-donut-panel${showLegend ? '' : ' report-donut-panel-centered'}`}>
      <div className="panel-title-row">
        <h2>{title}</h2>
      </div>

      <div className={`report-donut-layout${showLegend ? '' : ' report-donut-layout-centered'}`}>
        <div className="report-donut" style={{ background: hasData ? `conic-gradient(${stops})` : '#e5e7eb' }}>
          <div className="report-donut-hole">
            {centerValue ? <strong>{centerValue}</strong> : null}
            {centerLabel ? <span>{centerLabel}</span> : null}
          </div>
        </div>

        {showLegend ? (
          <div className={legendLayout === 'grid' ? 'report-donut-legend' : 'report-donut-legend report-donut-legend-table'}>
            {hasData ? (
              segments.map((segment) => (
                <div key={segment.label}>
                  <span className="report-donut-dot" style={{ backgroundColor: extendedSegmentToneHex[segment.tone] }} />
                  <span>{segment.label}</span>
                  <strong>
                    {formatInteger(segment.value)}{' '}
                    {title === 'Profit Overview' ? '' : total > 0 ? `(${((segment.value / total) * 100).toFixed(1)}%)` : ''}
                  </strong>
                </div>
              ))
            ) : (
              <div className="report-donut-empty">No data available.</div>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SectionExportRow({
  rows,
  filename,
}: {
  rows: AnyReportRow[];
  filename: string;
}) {
  return (
    <div className="report-export-row">
      <ExportButton rows={rows} filename={filename} />
    </div>
  );
}

function OverviewView({ range, setRange }: Pick<SharedProps, 'range' | 'setRange'>) {
  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Reports Overview</h1>
          <p>Get insights and analytics about your business.</p>
        </div>
        <div className="report-header-actions">
          <DateRangeButton value={range} onApply={setRange} />
        </div>
      </div>

      <section className="report-overview-grid">
        {reportOverviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link className={`report-overview-card report-overview-card-${card.tone}`} href={card.href} key={card.key}>
              <div className={`report-overview-icon report-overview-icon-${card.tone}`}>
                <Icon className="report-overview-icon-svg" />
              </div>
              <div className="report-overview-copy">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function SalesView(props: SharedProps) {
  const rows = useMemo(
    () => filterRows(salesReportRows, props.range, props.search, props.status),
    [props.range, props.search, props.status],
  );
  const visibleTrend = useMemo(() => filterTrendPoints(salesTrend, props.range), [props.range]);
  const totalSales = rows.reduce((sum, row) => sum + row.totalSales, 0);
  const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);
  const totalOrders = 0;
  const averageOrderValue = totalOrders ? totalSales / totalOrders : 0;

  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Sales Report</h1>
          <p>Detailed sales report for selected period.</p>
        </div>
        <div className="report-header-actions">
          <DateRangeButton value={props.range} onApply={props.setRange} />
          <FilterButton
            value={props.search}
            status={props.status}
            onApply={({ search, status }) => {
              props.setSearch(search);
              props.setStatus(status);
            }}
            placeholder="Search medicines or customers..."
          />
        </div>
      </div>

      <MetricCardGrid
        cards={[
          { label: 'Total Sales (PKR)', value: formatMoney(totalSales), tone: 'green' },
          { label: 'Total Profit (PKR)', value: formatMoney(totalProfit), tone: 'blue' },
          { label: 'Total Orders', value: formatInteger(totalOrders), tone: 'purple' },
          { label: 'Average Order Value', value: formatMoney(averageOrderValue), tone: 'orange' },
        ]}
      />

      <LineChartPanel title="Sales Overview" points={visibleTrend} color="#1d5bd6" />

      <section className="table-panel report-table-panel">
        <div className="section-heading">
          <div>
            <h2>Top Selling Medicines</h2>
          </div>
        </div>
        <table className="data-table report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Quantity Sold</th>
              <th>Total Sales (PKR)</th>
              <th>Profit (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td>{row.rank}</td>
                <td>{row.medicine}</td>
                <td>{formatInteger(row.quantitySold)}</td>
                <td>{formatMoney(row.totalSales)}</td>
                <td>{formatMoney(row.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="report-empty-state report-empty-inline">No sales found for this period.</div> : null}
      </section>

      <SectionExportRow rows={rows} filename="sales-report.csv" />
    </div>
  );
}

function PurchaseView(props: SharedProps) {
  const rows = useMemo(
    () => filterRows(purchaseReportRows, props.range, props.search, props.status),
    [props.range, props.search, props.status],
  );
  const visibleTrend = useMemo(() => filterTrendPoints(purchaseTrend, props.range), [props.range]);
  const totalPurchases = rows.reduce((sum, row) => sum + row.totalPurchase, 0);
  const totalPaid = 0;
  const totalDue = 0;
  const totalBills = 0;

  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Purchase Report</h1>
          <p>Detailed purchase report for selected period.</p>
        </div>
        <div className="report-header-actions">
          <DateRangeButton value={props.range} onApply={props.setRange} />
          <FilterButton
            value={props.search}
            status={props.status}
            onApply={({ search, status }) => {
              props.setSearch(search);
              props.setStatus(status);
            }}
            placeholder="Search medicines..."
          />
        </div>
      </div>

      <MetricCardGrid
        cards={[
          { label: 'Total Purchases (PKR)', value: formatMoney(totalPurchases), icon: ShoppingCart, tone: 'green' },
          { label: 'Total Paid (PKR)', value: formatMoney(totalPaid), icon: Wallet, tone: 'blue' },
          { label: 'Total Due (PKR)', value: formatMoney(totalDue), icon: CreditCard, tone: 'red' },
          { label: 'Total Bills', value: formatInteger(totalBills), icon: FileText, tone: 'purple' },
        ]}
      />

      <BarChartPanel title="Purchase Overview" subtitle="PKR" points={visibleTrend} />

      <section className="table-panel report-table-panel">
        <div className="section-heading">
          <div>
            <h2>Top Purchased Items</h2>
          </div>
        </div>
        <table className="data-table report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Quantity</th>
              <th>Total Purchase (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td>{row.rank}</td>
                <td>{row.medicine}</td>
                <td>{formatInteger(row.quantity)}</td>
                <td>{formatMoney(row.totalPurchase)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="report-empty-state report-empty-inline">No purchases found for this period.</div> : null}
      </section>

      <SectionExportRow rows={rows} filename="purchase-report.csv" />
    </div>
  );
}

function InventoryView(props: SharedProps) {
  const rows = useMemo(
    () => filterRows(inventoryReportRows, props.range, props.search, props.status),
    [props.range, props.search, props.status],
  );

  const totals = inventorySummary;
  const visibleSegments = inventoryBreakdown;

  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Inventory Report</h1>
          <p>Current stock and inventory valuation.</p>
        </div>
        <div className="report-header-actions">
          <FilterButton
            value={props.search}
            status={props.status}
            statusOptions={statusOptionsByReport.inventory}
            onApply={({ search, status }) => {
              props.setSearch(search);
              props.setStatus(status);
            }}
            placeholder="Search medicine or batch..."
          />
        </div>
      </div>

      <MetricCardGrid
        cards={[
          { label: 'Total Items', value: formatInteger(totals.totalItems), tone: 'green' },
          { label: 'Total Stock Value (PKR)', value: formatMoney(totals.totalStockValue), tone: 'blue' },
          { label: 'Low Stock Items', value: formatInteger(totals.lowStockItems), tone: 'orange' },
          { label: 'Out of Stock Items', value: formatInteger(totals.outOfStockItems), tone: 'red' },
        ]}
      />

      <DonutPanel title="Stock Summary" segments={visibleSegments} />

      <section className="table-panel report-table-panel">
        <div className="section-heading">
          <div>
            <h2>Top Stock Items</h2>
          </div>
        </div>
        <table className="data-table report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Batch No.</th>
              <th>Stock</th>
              <th>Unit</th>
              <th>Value (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td>{row.rank}</td>
                <td>{row.medicine}</td>
                <td>{row.batchNo}</td>
                <td>{formatInteger(row.stock)}</td>
                <td>{row.unit}</td>
                <td>{formatMoney(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="report-empty-state report-empty-inline">No inventory items match the filters.</div> : null}
      </section>

      <SectionExportRow rows={rows} filename="inventory-report.csv" />
    </div>
  );
}

function ExpiryView(props: SharedProps) {
  const rows = useMemo(
    () => filterRows(expiryReportRows, props.range, props.search, props.status),
    [props.range, props.search, props.status],
  );

  const visibleSegments = expiryBreakdown;

  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Expiry Report</h1>
          <p>Medicines near expiry and expired.</p>
        </div>
        <div className="report-header-actions">
          <FilterButton
            value={props.search}
            status={props.status}
            statusOptions={statusOptionsByReport.expiry}
            onApply={({ search, status }) => {
              props.setSearch(search);
              props.setStatus(status);
            }}
            placeholder="Search medicine or batch..."
          />
        </div>
      </div>

      <MetricCardGrid
        cards={[
          { label: 'Expiring in 30 Days', value: formatInteger(expirySummary.expiring30), icon: CalendarClock, tone: 'orange' },
          { label: 'Expiring in 60 Days', value: formatInteger(expirySummary.expiring60), icon: CalendarDays, tone: 'blue' },
          { label: 'Expired Items', value: formatInteger(expirySummary.expired), icon: PackageX, tone: 'red' },
          { label: 'Total At Risk', value: formatInteger(expirySummary.totalAtRisk), icon: AlertTriangle, tone: 'purple' },
        ]}
      />

      <DonutPanel title="Expiry Summary" segments={visibleSegments} />

      <section className="table-panel report-table-panel">
        <div className="section-heading">
          <div>
            <h2>Expiring Soon</h2>
          </div>
        </div>
        <table className="data-table report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Batch No.</th>
              <th>Expiry Date</th>
              <th>Days Left</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td>{row.rank}</td>
                <td>{row.medicine}</td>
                <td>{row.batchNo}</td>
                <td>{row.expiryDate}</td>
                <td>{formatInteger(row.daysLeft)}</td>
                <td>{formatInteger(row.stock)}</td>
                <td>
                  <ReportBadge tone={toneFromStatus(row.status)}>{row.status}</ReportBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="report-empty-state report-empty-inline">No expiring items found for the selected filters.</div> : null}
      </section>

      <SectionExportRow rows={rows} filename="expiry-report.csv" />
    </div>
  );
}

function ProfitLossView(props: SharedProps) {
  const rows = useMemo(
    () => filterRows(profitLossSummaryRows, props.range, props.search, props.status),
    [props.range, props.search, props.status],
  );

  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Profit &amp; Loss Report</h1>
          <p>Business profit and loss statement.</p>
        </div>
        <div className="report-header-actions">
          <DateRangeButton value={props.range} onApply={props.setRange} />
          <FilterButton
            value={props.search}
            status={props.status}
            onApply={({ search, status }) => {
              props.setSearch(search);
              props.setStatus(status);
            }}
            placeholder="Search summary items..."
          />
        </div>
      </div>

      <section className="report-split-grid">
        <article className="panel report-summary-panel">
          <div className="panel-title-row">
            <h2>Summary</h2>
          </div>
          <table className="data-table report-summary-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className={row.amount < 0 ? 'report-negative' : 'report-positive'}>
                    {formatSignedMoney(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? <div className="report-empty-state report-empty-inline">No summary rows found for the selected filters.</div> : null}
        </article>

        <DonutPanel
          title="Profit Overview"
          segments={profitLossBreakdown}
          centerValue={`${profitLossMargin.toFixed(2)}%`}
          centerLabel="Net Profit Margin"
          showLegend={false}
          variant="profit"
        />
      </section>

      <SectionExportRow rows={rows} filename="profit-loss-report.csv" />
    </div>
  );
}

function CustomerView(props: SharedProps) {
  const rows = useMemo(
    () => filterRows(customerReportRows, props.range, props.search, props.status),
    [props.range, props.search, props.status],
  );

  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Customer Report</h1>
          <p>Customer sales and due report.</p>
        </div>
        <div className="report-header-actions">
          <FilterButton
            value={props.search}
            status={props.status}
            onApply={({ search, status }) => {
              props.setSearch(search);
              props.setStatus(status);
            }}
            placeholder="Search customer..."
          />
        </div>
      </div>

      <section className="table-panel report-table-panel">
        <div className="section-heading">
          <div>
            <h2>Top Customers</h2>
          </div>
        </div>
        <table className="data-table report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Total Sales (PKR)</th>
              <th>Paid (PKR)</th>
              <th>Due (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td>{row.rank}</td>
                <td>{row.customer}</td>
                <td>{formatMoney(row.totalSales)}</td>
                <td>{formatMoney(row.paid)}</td>
                <td>{formatMoney(row.due)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="report-empty-state report-empty-inline">No customer rows match the filters.</div> : null}
      </section>

      <SectionExportRow rows={rows} filename="customer-report.csv" />
    </div>
  );
}

function SupplierView(props: SharedProps) {
  const rows = useMemo(
    () => filterRows(supplierReportRows, props.range, props.search, props.status),
    [props.range, props.search, props.status],
  );

  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Supplier Report</h1>
          <p>Supplier purchases and due report.</p>
        </div>
        <div className="report-header-actions">
          <FilterButton
            value={props.search}
            status={props.status}
            onApply={({ search, status }) => {
              props.setSearch(search);
              props.setStatus(status);
            }}
            placeholder="Search supplier..."
          />
        </div>
      </div>

      <section className="table-panel report-table-panel">
        <div className="section-heading">
          <div>
            <h2>Top Suppliers</h2>
          </div>
        </div>
        <table className="data-table report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Supplier</th>
              <th>Total Purchases (PKR)</th>
              <th>Paid (PKR)</th>
              <th>Due (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td>{row.rank}</td>
                <td>{row.supplier}</td>
                <td>{formatMoney(row.totalPurchases)}</td>
                <td>{formatMoney(row.paid)}</td>
                <td>{formatMoney(row.due)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="report-empty-state report-empty-inline">No supplier rows match the filters.</div> : null}
      </section>

      <SectionExportRow rows={rows} filename="supplier-report.csv" />
    </div>
  );
}

function TaxView(props: SharedProps) {
  const rows = useMemo(
    () => filterRows(taxSummaryRows, props.range, props.search, props.status),
    [props.range, props.search, props.status],
  );

  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Tax Report</h1>
          <p>Tax summary and details.</p>
        </div>
        <div className="report-header-actions">
          <DateRangeButton value={props.range} onApply={props.setRange} />
          <FilterButton
            value={props.search}
            status={props.status}
            onApply={({ search, status }) => {
              props.setSearch(search);
              props.setStatus(status);
            }}
            placeholder="Search tax items..."
          />
        </div>
      </div>

      <section className="table-panel report-table-panel">
        <table className="data-table report-summary-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className={row.amount < 0 ? 'report-negative' : 'report-positive'}>
                  {formatSignedMoney(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="report-empty-state report-empty-inline">No tax rows match the filters.</div> : null}
      </section>

      <SectionExportRow rows={rows} filename="tax-report.csv" />
    </div>
  );
}

function PaymentView(props: SharedProps) {
  const rows = useMemo(
    () => filterRows(paymentReportRows, props.range, props.search, props.status),
    [props.range, props.search, props.status],
  );

  return (
    <div className="report-shell">
      <div className="page-header report-header">
        <div>
          <h1>Payment Report</h1>
          <p>All payment transactions and balances.</p>
        </div>
        <div className="report-header-actions">
          <DateRangeButton value={props.range} onApply={props.setRange} />
          <FilterButton
            value={props.search}
            status={props.status}
            statusOptions={statusOptionsByReport.payment}
            onApply={({ search, status }) => {
              props.setSearch(search);
              props.setStatus(status);
            }}
            placeholder="Search payment reference..."
          />
        </div>
      </div>

      <MetricCardGrid
        cards={[
          { label: 'Total Payments', value: formatInteger(paymentSummary.totalPayments), icon: Wallet, tone: 'purple' },
          { label: 'Received (PKR)', value: formatMoney(paymentSummary.received), icon: Banknote, tone: 'green' },
          { label: 'Pending (PKR)', value: formatMoney(paymentSummary.pending), icon: CreditCard, tone: 'orange' },
          { label: 'Overdue (PKR)', value: formatMoney(paymentSummary.overdue), icon: FileText, tone: 'red' },
        ]}
      />

      <section className="table-panel report-table-panel">
        <div className="section-heading">
          <div>
            <h2>Payment Transactions</h2>
            <p>Payments recorded within the selected period.</p>
          </div>
        </div>
        <table className="data-table report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Reference</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Amount (PKR)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td>{row.rank}</td>
                <td>{row.reference}</td>
                <td>{row.customer}</td>
                <td>{row.method}</td>
                <td>{formatMoney(row.amount)}</td>
                <td>
                  <ReportBadge tone={toneFromStatus(row.status)}>{row.status}</ReportBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="report-empty-state report-empty-inline">No payment rows match the filters.</div> : null}
      </section>

      <SectionExportRow rows={rows} filename="payment-report.csv" />
    </div>
  );
}

export function ReportShell({ report }: { report?: ReportKey }) {
  const [range, setRange] = useState<ModuleDateRange>(defaultReportRange);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');

  if (!report) {
    return <OverviewView range={range} setRange={setRange} />;
  }

  if (!reportRouteKeys.includes(report)) {
    return <OverviewView range={range} setRange={setRange} />;
  }

  const sharedProps: SharedProps = {
    range,
    setRange,
    search,
    setSearch,
    status,
    setStatus,
  };

  switch (report) {
    case 'sales':
      return <SalesView {...sharedProps} />;
    case 'purchase':
      return <PurchaseView {...sharedProps} />;
    case 'inventory':
      return <InventoryView {...sharedProps} />;
    case 'expiry':
      return <ExpiryView {...sharedProps} />;
    case 'profit-loss':
      return <ProfitLossView {...sharedProps} />;
    case 'customer':
      return <CustomerView {...sharedProps} />;
    case 'supplier':
      return <SupplierView {...sharedProps} />;
    case 'tax':
      return <TaxView {...sharedProps} />;
    case 'payment':
      return <PaymentView {...sharedProps} />;
    default:
      return <OverviewView range={range} setRange={setRange} />;
  }
}
