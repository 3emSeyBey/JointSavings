import type { Profile, SpendSource, Transaction } from '@/types';

export function formatSpendSourceLabel(
  source: SpendSource | undefined,
  profiles: Record<string, Profile>
): string {
  if (!source) return '';
  if (source === 'joint') return 'Joint pool (split equally)';
  if (source === 'pea') return `${profiles.pea?.name ?? 'Pea'}'s savings`;
  if (source === 'cam') return `${profiles.cam?.name ?? 'Cam'}'s savings`;
  return source;
}

/** Short label for the spend-source picker buttons. */
export function spendPoolButtonLabel(
  source: SpendSource,
  profiles: Record<string, Profile>
): string {
  if (source === 'joint') return 'Joint (split equally)';
  if (source === 'pea') return profiles.pea?.name ?? 'Pea';
  if (source === 'cam') return profiles.cam?.name ?? 'Cam';
  return source;
}

/** Map pea/cam to real profile ids when those ids are not used (e.g. custom ids). */
export function resolveSpendPoolId(
  spendSource: SpendSource,
  profileIds: string[]
): string | null {
  if (spendSource === 'joint') return null;
  const sorted = [...profileIds].sort();
  if (sorted.includes(spendSource)) return spendSource;
  if (spendSource === 'pea') return sorted[0] ?? null;
  if (spendSource === 'cam') return sorted[1] ?? sorted[0] ?? null;
  return null;
}

/**
 * Net balance per profile: savings credited by `userId`, spending debited by pool
 * (Pea / Cam / joint split evenly across all profiles).
 */
export function buildMemberTotals(
  transactions: Transaction[],
  profileIds: string[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  profileIds.forEach((id) => {
    totals[id] = 0;
  });

  const n = profileIds.length || 1;

  for (const tx of transactions) {
    const amt = Number(tx.amount);
    if (tx.entryKind === 'spend') {
      const src = tx.spendSource;
      if (src === 'joint') {
        const share = amt / n;
        profileIds.forEach((id) => {
          totals[id] = (totals[id] ?? 0) + share;
        });
      } else if (src === 'pea' || src === 'cam') {
        const pid = resolveSpendPoolId(src, profileIds);
        if (pid) totals[pid] = (totals[pid] ?? 0) + amt;
      }
    } else {
      const uid = tx.userId;
      totals[uid] = (totals[uid] ?? 0) + amt;
    }
  }

  return totals;
}
