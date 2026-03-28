/**
 * Simple forward projection for savings (C-002 baseline).
 */
export function projectBalanceLinear(
  currentTotal: number,
  averageMonthlyContribution: number,
  monthsAhead: number
): number {
  if (monthsAhead <= 0) return currentTotal;
  return currentTotal + averageMonthlyContribution * monthsAhead;
}
