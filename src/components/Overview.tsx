import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, TrendingDown, ArrowUpRight } from 'lucide-react';
import { THEMES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import type { Profile, Transaction, Theme } from '@/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatSpendSourceLabel } from '@/lib/transactionTotals';

interface OverviewProps {
  currentProfile: Profile;
  partnerProfile: Profile | undefined;
  currentTheme: Theme;
  totalSavings: number;
  userTotals: Record<string, number>;
  transactions: Transaction[];
  profiles: Record<string, Profile>;
  onDeleteTransaction: (id: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.035, type: 'spring', stiffness: 400, damping: 32 },
  }),
};

export function Overview({
  currentProfile,
  partnerProfile,
  currentTheme,
  totalSavings,
  userTotals,
  transactions,
  profiles,
  onDeleteTransaction,
}: OverviewProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <motion.div
      className="space-y-5 sm:space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Bento hero */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 auto-rows-min">
        <motion.div
          variants={item}
          className="col-span-12 lg:col-span-8 glass-panel rounded-3xl p-5 sm:p-7 relative overflow-hidden group"
        >
          <div
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{
              background: `conic-gradient(from 210deg, var(--accent-a), var(--accent-b), var(--accent-c), var(--accent-a))`,
            }}
          />
          <div className="relative z-10">
            <div className="pointer-events-none absolute -top-1 right-0 flex items-center gap-1.5 text-lg motion-reduce:opacity-25 opacity-50">
              <span className="inline-block mm-overview-float" aria-hidden>
                ✨
              </span>
              <span className="inline-block text-base mm-overview-float-alt" aria-hidden>
                💰
              </span>
              <span className="inline-block text-sm mm-overview-sparkle" aria-hidden>
                🌟
              </span>
            </div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-[var(--text-dim)] mb-2">
              Combined ledger
            </p>
            <p className="font-mono-nums text-3xl xs:text-4xl sm:text-5xl font-bold leading-tight text-gradient-aurora mb-1">
              {formatCurrency(totalSavings)}
            </p>
            <p className="text-sm text-[var(--text-dim)] flex items-center gap-2 mt-3">
              <ArrowUpRight size={16} className="text-[var(--accent-a)]" />
              Live balance · deposits minus spends
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="col-span-6 lg:col-span-4 glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[120px] border-t-4"
          style={{ borderTopColor: 'var(--accent-a)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{currentProfile.emoji}</span>
            <span className="font-display text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
              You
            </span>
          </div>
          <p className={`font-mono-nums text-xl sm:text-2xl font-bold ${currentTheme.textClass}`}>
            {formatCurrency(userTotals[currentProfile.id] || 0)}
          </p>
        </motion.div>

        <motion.div
          variants={item}
          className="col-span-6 lg:col-span-4 glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[120px] border-t-4"
          style={{ borderTopColor: 'var(--accent-b)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{partnerProfile?.emoji || '👤'}</span>
            <span className="font-display text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
              Partner
            </span>
          </div>
          <p
            className={`font-mono-nums text-xl sm:text-2xl font-bold ${
              partnerProfile ? THEMES[partnerProfile.theme].textClass : 'text-[var(--text)]'
            }`}
          >
            {formatCurrency(userTotals[partnerProfile?.id || ''] || 0)}
          </p>
        </motion.div>

        <motion.div
          variants={item}
          className="col-span-12 lg:col-span-4 glass-panel rounded-2xl p-4 flex items-center gap-4 border border-dashed border-[var(--border)]"
        >
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, var(--accent-a) 35%, transparent), color-mix(in srgb, var(--accent-b) 25%, transparent))`,
            }}
          >
            <TrendingDown className="text-[var(--accent-c)]" size={26} />
          </div>
          <div>
            <p className="font-display font-bold text-[var(--text)] text-sm">Spending pools</p>
            <p className="text-xs text-[var(--text-dim)] leading-snug">
              Pea · Cam · Joint split tracked on every withdrawal.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Data table — dense, editorial */}
      <motion.div variants={item} className="glass-panel rounded-2xl sm:rounded-3xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2 bg-[var(--surface-raised)]/40">
          <div>
            <h3 className="font-display font-bold text-[var(--text)] text-base sm:text-lg tracking-tight">
              Ledger stream
            </h3>
            <p className="text-[11px] text-[var(--text-dim)] font-medium uppercase tracking-wider">
              Newest first · tap row to remove
            </p>
          </div>
          <span className="font-mono-nums text-xs text-[var(--accent-a)] px-2 py-1 rounded-lg bg-[var(--surface-raised)]/80 border border-[var(--border)]">
            {transactions.length} lines
          </span>
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-dim)] text-sm font-medium">
              No ledger lines yet — tap + to inscribe the first one.
            </div>
          ) : (
            <table className="w-full text-sm min-w-[320px] border-collapse">
              <thead>
                <tr className="text-left border-b border-[var(--border)] bg-[var(--surface-raised)]/30">
                  <th className="font-display font-extrabold text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)] px-4 py-3">
                    Kind
                  </th>
                  <th className="font-display font-extrabold text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)] px-4 py-3">
                    Detail
                  </th>
                  <th className="font-display font-extrabold text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)] px-4 py-3 hidden sm:table-cell">
                    Period
                  </th>
                  <th className="font-display font-extrabold text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)] px-4 py-3 text-right font-mono-nums">
                    Amount
                  </th>
                  <th className="w-12 px-2 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => {
                  const isSpend = tx.entryKind === 'spend';
                  const txProfile = profiles[tx.userId];
                  const txTheme = THEMES[txProfile?.theme || 'emerald'];
                  return (
                    <motion.tr
                      key={tx.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className="group border-b border-[var(--border)]/60 hover:bg-[var(--surface-raised)]/25 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
                            isSpend
                              ? 'border-rose-500/40 text-rose-300 bg-rose-500/10'
                              : 'border-emerald-500/35 text-emerald-300 bg-emerald-500/10'
                          }`}
                        >
                          {isSpend ? (
                            <>
                              <TrendingDown size={12} /> Out
                            </>
                          ) : (
                            <>In</>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border border-[var(--border)] ${
                              isSpend ? 'bg-rose-500/15 border-rose-500/25' : 'bg-[var(--surface-raised)]/70'
                            }`}
                          >
                            {isSpend ? '↘' : txProfile?.emoji || '💰'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text)] truncate">
                              {tx.note || (isSpend ? 'Spending' : 'Saving')}
                            </p>
                            <p className="text-xs text-[var(--text-dim)]">
                              {new Date(tx.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                              {isSpend && tx.spendSource && (
                                <span className="block text-rose-300/90 font-medium mt-0.5">
                                  {formatSpendSourceLabel(tx.spendSource, profiles)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-[var(--text-dim)] text-xs hidden sm:table-cell max-w-[140px] truncate">
                        {tx.period}
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <span
                          className={`font-mono-nums font-bold tabular-nums ${
                            isSpend ? 'text-rose-300' : txTheme.textClass
                          }`}
                        >
                          {isSpend ? '' : '+'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(tx.id)}
                          className="p-2 rounded-xl text-[var(--text-dim)] opacity-0 group-hover:opacity-100 sm:opacity-40 sm:group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          aria-label="Remove entry"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Strike this line?"
        message="It vanishes from the ledger (soft delete). History may still exist in backups."
        confirmLabel="Remove"
        danger
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) onDeleteTransaction(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </motion.div>
  );
}
