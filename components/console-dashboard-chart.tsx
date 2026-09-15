'use client';

export type ConsoleChartPoint = {
  label: string;
  value: number;
};

function compactMoney(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`;
  }

  return String(value);
}

export function ConsoleDashboardChart({ points }: { points: ConsoleChartPoint[] }) {
  const values = points.map((point) => point.value);
  const maxPoint = Math.max(...values, 1);
  const scaleMax = Math.max(10, Math.ceil(maxPoint / 10) * 10);
  const chartPoints = values
    .map((value, index) => {
      const x = 10 + index * 30;
      const y = 112 - (value / scaleMax) * 90;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="chart-card">
      <svg viewBox="0 0 300 140" role="img" aria-label="Monthly overview chart">
        <defs>
          <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f35d5" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#4f35d5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`10,120 ${chartPoints} 280,120`} fill="url(#lineFill)" stroke="none" />
        <polyline points={chartPoints} fill="none" stroke="#4f35d5" strokeLinecap="round" strokeWidth="3" />
        {values.map((value, index) => (
          <circle cx={10 + index * 30} cy={112 - (value / scaleMax) * 90} fill="#4f35d5" key={`${value}-${index}`} r="3">
            <title>{`${points[index].label}: ${value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="chart-axis">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
      <div className="chart-axis" style={{ marginTop: '0.35rem', opacity: 0.7 }}>
        <span>{compactMoney(scaleMax)}</span>
        <span>{compactMoney(scaleMax * 0.66)}</span>
        <span>{compactMoney(scaleMax * 0.33)}</span>
        <span>0</span>
      </div>
    </div>
  );
}
