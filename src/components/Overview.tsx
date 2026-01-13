import { Trash2 } from 'lucide-react';
import { THEMES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import type { Profile, Transaction, Theme } from '@/types';

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
  const handleDelete = (id: string) => {
    if (confirm('Delete this saving item?')) {
      onDeleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <div className="rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-700/50">
        <p className="text-slate-400 font-medium mb-1">Combined Savings</p>
        <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          {formatCurrency(totalSavings)}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{currentProfile.emoji}</span>
              <p className="text-xs uppercase text-slate-400">Me</p>
            </div>
            <p className={`text-xl font-bold ${currentTheme.textClass}`}>
              {formatCurrency(userTotals[currentProfile.id] || 0)}
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{partnerProfile?.emoji || '👤'}</span>
              <p className="text-xs uppercase text-slate-400">
                {partnerProfile?.name || 'Partner'}
              </p>
            </div>
            <p
              className={`text-xl font-bold ${
                partnerProfile ? THEMES[partnerProfile.theme].textClass : 'text-slate-100'
              }`}
            >
              {formatCurrency(userTotals[partnerProfile?.id || ''] || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b font-bold text-slate-800 bg-slate-50">
          Recent Savings
        </div>
        <div className="divide-y divide-slate-100">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-300">No records yet.</div>
          ) : (
            transactions.map((tx) => {
              const txProfile = profiles[tx.userId];
              const txTheme = THEMES[txProfile?.theme || 'emerald'];
              return (
                <div
                  key={tx.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 group transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${txTheme.lightBg}`}
                    >
                      {txProfile?.emoji || '💰'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {tx.note || 'Saving'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`font-bold ${txTheme.textClass}`}>
                        +{formatCurrency(tx.amount)}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase">
                        {tx.period}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
