/**
 * Formats a numeric price into localized currency string with dot thousands separator (e.g. $24.000).
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0';
  }
  return `$${Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export const formatPrice = formatCurrency;
