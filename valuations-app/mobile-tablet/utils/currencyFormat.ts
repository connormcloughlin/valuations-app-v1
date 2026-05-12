/**
 * Format values as South African Rand for display (en-ZA, ZAR).
 */
export function formatZarCurrency(input: string | number | null | undefined): string {
  if (input === undefined || input === null) return '—';
  if (typeof input === 'string') {
    const t = input.trim();
    if (t === '' || t === 'N/A' || t === 'Not specified') return t;
  }
  const raw =
    typeof input === 'number'
      ? input
      : parseFloat(String(input).replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(raw)) return String(input);
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(raw);
}
