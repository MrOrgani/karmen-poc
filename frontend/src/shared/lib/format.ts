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

/** Non-breaking space — prevents widow units (e.g. "12 mois" wrapping after the digit). */
export const NBSP = ' ';

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  // Intl.NumberFormat fr-FR already uses NBSP between value and "€".
  return CURRENCY.format(value);
}

/** Backend convention: value is in percentage points (5.2 → "5,2 %"). */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return PERCENT.format(value / 100);
}

export function formatDelta(current: number, previous: number | null): string {
  if (previous === null || !Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return '—';
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}${NBSP}%`;
}

export function formatMonths(n: number): string {
  return `${n}${NBSP}mois`;
}

export function formatDays(n: number): string {
  return `${n}${NBSP}jours`;
}

