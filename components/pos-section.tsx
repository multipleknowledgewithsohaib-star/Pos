import Link from 'next/link';
import { type ComponentType, type ReactNode } from 'react';
import { ModuleShell } from '@/components/module-shell';
import { SectionHero } from '@/components/section-hero';
import type { PosMetric, PosQuickAction, PosSegment, PosTone } from '@/lib/pos-data';
import { formatMoney } from '@/lib/pos-state';

type Icon = ComponentType<{ className?: string }>;

export function PosPageShell({
  badge,
  eyebrow,
  title,
  description,
  action,
  children,
  className = '',
}: {
  badge?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ModuleShell active="POS">
      <div className={`pos-page ${className}`.trim()}>
        <SectionHero badge={badge} eyebrow={eyebrow} title={title} description={description} action={action} />
        {children}
      </div>
    </ModuleShell>
  );
}

export function PosPanel({
  title,
  description,
  action,
  className = '',
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`panel pos-panel ${className}`.trim()}>
      <div className="panel-title-row">
        <div>
          <h2>{title}</h2>
          {description ? <p className="pos-panel-description">{description}</p> : null}
        </div>
        {action ? <div className="pos-panel-action">{action}</div> : null}
      </div>
      {children}
    </article>
  );
}

export function PosMetricGrid({ items }: { items: PosMetric[] }) {
  return (
    <section className="pos-metric-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article className={`pos-metric-card pos-metric-card-${item.tone}`} key={item.label}>
            <div className={`pos-metric-icon pos-metric-icon-${item.tone}`}>
              <Icon className="pos-metric-icon-svg" />
            </div>
            <div className="pos-metric-copy">
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function PosLineChart({
  title,
  description,
  points,
  color = '#4f35d5',
}: {
  title: string;
  description?: string;
  points: { label: string; value: number; salesCount?: number }[];
  color?: string;
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const scaleMax = Math.max(1000, Math.ceil(maxValue / 1000) * 1000);
  const scaleStep = scaleMax / 4;
  const width = 410;
  const height = 190;
  const leftPadding = 12;
  const rightPadding = 10;
  const topPadding = 12;
  const bottomPadding = 18;
  const chartHeight = height - topPadding - bottomPadding;
  const step = points.length > 1 ? (width - leftPadding - rightPadding) / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = leftPadding + index * step;
    const y = height - bottomPadding - (point.value / scaleMax) * chartHeight;
    return { x, y };
  });
  const linePoints = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `${leftPadding},${height - bottomPadding} ${linePoints} ${width - rightPadding},${height - bottomPadding}`;

  return (
    <PosPanel title={title} description={description} className="pos-chart-panel">
      <div className="pos-chart-wrap">
        <div className="pos-chart-scale">
          <span>{compactMoney(scaleMax)}</span>
          <span>{compactMoney(scaleStep * 3)}</span>
          <span>{compactMoney(scaleStep * 2)}</span>
          <span>{compactMoney(scaleStep)}</span>
          <span>0</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <defs>
            <linearGradient id="posChartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M ${areaPoints} Z`} fill="url(#posChartFill)" />
          <polyline points={linePoints} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          {coords.map((point, index) => (
            <circle
              cx={point.x}
              cy={point.y}
              fill={color}
              key={`${points[index].label}-${points[index].value}`}
              r="3.8"
            >
              <title>{`${points[index].label}: PKR ${formatMoney(points[index].value)}${points[index].salesCount ? ` (${points[index].salesCount} sales)` : ''}`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="pos-chart-dates">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </PosPanel>
  );
}

export function PosDonutPanel({
  title,
  description,
  segments,
  centerValue,
  centerLabel,
  className = '',
}: {
  title: string;
  description?: string;
  segments: PosSegment[];
  centerValue: string;
  centerLabel: string;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const hasData = segments.length > 0 && total > 0;
  const colors: Record<PosTone, string> = {
    green: '#16a34a',
    blue: '#2563eb',
    purple: '#6d28ff',
    orange: '#f97316',
    red: '#ef4444',
    sky: '#0ea5e9',
  };
  const stops = hasData
    ? segments
        .map((segment, index) => {
          const start = segments
            .slice(0, index)
            .reduce((sum, previous) => sum + (previous.value / total) * 100, 0);
          const end = start + (segment.value / total) * 100;
          return `${colors[segment.tone]} ${start}% ${end}%`;
        })
        .join(', ')
    : '';

  return (
    <PosPanel title={title} description={description} className={`pos-donut-panel ${className}`.trim()}>
      <div className="pos-donut-row">
        <div className="pos-donut" style={{ background: hasData ? `conic-gradient(${stops})` : '#e5e7eb' }}>
          <div className="pos-donut-hole">
            <strong>{centerValue}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>

        <div className="pos-donut-legend">
          {hasData ? (
            segments.map((segment) => (
              <div key={segment.label}>
                <span className="pos-donut-dot" style={{ backgroundColor: colors[segment.tone] }} />
                <span>{segment.label}</span>
                <strong>{segment.value.toLocaleString('en-US')}</strong>
              </div>
            ))
          ) : (
            <div className="pos-donut-empty">No sales data yet.</div>
          )}
        </div>
      </div>
    </PosPanel>
  );
}

export function PosActionGrid({ items }: { items: PosQuickAction[] }) {
  return (
    <section className="pos-action-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            aria-label={`${item.title}: ${item.description}`}
            className={`pos-action-card pos-action-card-${item.tone}`}
            href={item.href}
            key={item.title}
            title={item.description}
          >
            <span className={`pos-action-icon pos-action-icon-${item.tone}`}>
              <Icon className="pos-action-icon-svg" />
            </span>
            <strong>{item.title}</strong>
          </Link>
        );
      })}
    </section>
  );
}

function compactMoney(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`;
  }

  return String(value);
}
