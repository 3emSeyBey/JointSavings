/**
 * Streak helpers (E-001). Count consecutive calendar days with activity.
 */
export function longestStreakFromSortedDates(sortedIsoDates: string[]): number {
  if (sortedIsoDates.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedIsoDates.length; i++) {
    const prev = new Date(`${sortedIsoDates[i - 1]}T12:00:00`);
    const cur = new Date(`${sortedIsoDates[i]}T12:00:00`);
    const diff = (cur.getTime() - prev.getTime()) / (86400000);
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else if (diff > 1) {
      run = 1;
    }
  }
  return best;
}
