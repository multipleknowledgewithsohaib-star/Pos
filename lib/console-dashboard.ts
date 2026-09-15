import type { ApiSummary } from '@/lib/pharma-api';

export type ConsoleChartPoint = {
  label: string;
  value: number;
};

export function buildConsoleOverviewPoints(api: ApiSummary, activeUsers: number) {
  const movementTotals = api.recentMovements.reduce<Record<string, number>>((totals, movement) => {
    const day = new Date(movement.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    totals[day] = (totals[day] ?? 0) + Math.abs(movement.quantity);
    return totals;
  }, {});

  const movementPoints = Object.entries(movementTotals)
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  if (movementPoints.length >= 4) {
    return movementPoints;
  }

  const seed = [
    { label: 'Users', value: activeUsers },
    { label: 'Products', value: api.products },
    { label: 'Batches', value: api.batches },
    { label: 'Stock', value: Math.round(api.totalStock / 100) },
    { label: 'Moves', value: api.movements },
    { label: 'Low', value: api.lowStock },
    { label: 'Expiry', value: api.expiringSoon },
  ];

  return seed.filter((point) => point.value > 0).slice(0, 8);
}
