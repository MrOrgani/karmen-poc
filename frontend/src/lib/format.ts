const CURRENCY = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const PERCENT = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return CURRENCY.format(value);
}

/** Backend convention: value is expressed in percentage points (e.g. 5.2 → "5.2 %"). */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return PERCENT.format(value / 100);
}

export function formatDelta(current: number, previous: number): string {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return '—';
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}
