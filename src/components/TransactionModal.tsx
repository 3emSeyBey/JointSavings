import { Wallet, X, Target, ChevronDown, TrendingDown } from 'lucide-react';
import type { Theme, NewTransaction, Goal, Profile } from '@/types';
import { spendPoolButtonLabel } from '@/lib/transactionTotals';

interface TransactionModalProps {
  theme: Theme;
  profiles: Record<string, Profile>;
  newTx: NewTransaction;
  goals: Goal[];
  isSubmitting: boolean;
  onNewTxChange: (tx: NewTransaction) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function TransactionModal({
  theme,
  profiles,
  newTx,
  goals,
  isSubmitting,
  onNewTxChange,
  onSubmit,
  onClose,
}: TransactionModalProps) {
  const isSpend = newTx.entryKind === 'spend';
  // Filter goals that aren't complete yet
  const availableGoals = goals.filter((g) => g.currentAmount < g.targetAmount);
  const selectedGoal = goals.find((g) => g.id === newTx.goalId);

  const setKind = (entryKind: 'saving' | 'spend') => {
    onNewTxChange({
      ...newTx,
      entryKind,
      goalId: entryKind === 'spend' ? undefined : newTx.goalId,
      spendSource: entryKind === 'saving' ? undefined : newTx.spendSource,
    });
  };

  const canSubmit =
    Boolean(newTx.amount) && (!isSpend || Boolean(newTx.spendSource));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-md safe-area-pt">
      <div className="bg-white w-full sm:max-w-sm max-h-[min(92dvh,100%)] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl animate-slide-in-from-bottom-4 ring-1 ring-slate-200/80">
        <div className={`p-8 text-white ${isSpend ? 'bg-rose-500' : theme.bgClass}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-xl flex items-center gap-2">
              {isSpend ? <TrendingDown size={20} /> : <Wallet size={20} />}
              {isSpend ? 'Record spending' : 'Add saving'}
            </h3>
            <button 
              onClick={onClose}
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex rounded-xl bg-white/15 p-1 mb-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setKind('saving')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                !isSpend ? 'bg-white text-slate-800' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Saving
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setKind('spend')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                isSpend ? 'bg-white text-rose-600' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Spending
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-medium opacity-80">
              ₱
            </span>
            <input
              type="number"
              value={newTx.amount}
              onChange={(e) => onNewTxChange({ ...newTx, amount: e.target.value })}
              placeholder="0"
              autoFocus
              disabled={isSubmitting}
              className="w-full bg-transparent text-6xl font-bold focus:outline-none pl-10 disabled:opacity-50"
            />
          </div>
        </div>
        <div className="p-8 space-y-4">
          <input
            type="date"
            value={newTx.date}
            onChange={(e) => onNewTxChange({ ...newTx, date: e.target.value })}
            disabled={isSubmitting}
            className="w-full bg-slate-50 rounded-xl p-4 font-bold border-none outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder={isSpend ? 'What was it for? (optional)' : 'Note (e.g. Monthly share)'}
            value={newTx.note}
            onChange={(e) => onNewTxChange({ ...newTx, note: e.target.value })}
            disabled={isSubmitting}
            className="w-full bg-slate-50 rounded-xl p-4 font-bold border-none outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
          />

          {isSpend && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
                Taken from
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(['pea', 'cam', 'joint'] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onNewTxChange({ ...newTx, spendSource: src })}
                    className={`w-full py-3 rounded-xl font-bold text-sm border-2 transition-colors ${
                      newTx.spendSource === src
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {spendPoolButtonLabel(src, profiles)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSpend && (
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Category</label>
            <select
              value={newTx.category || 'general'}
              onChange={(e) => onNewTxChange({ ...newTx, category: e.target.value })}
              disabled={isSubmitting}
              className="w-full bg-slate-50 rounded-xl p-4 font-bold border-none outline-none focus:ring-2 focus:ring-slate-200 appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="general">General</option>
              <option value="salary">Salary / income</option>
              <option value="gift">Gift</option>
              <option value="investment">Investment</option>
              <option value="bill">Bill / expense offset</option>
              <option value="other">Other</option>
            </select>
          </div>
          )}

          {/* Goal Selection */}
          {!isSpend && availableGoals.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-1">
                <Target size={12} />
                Contribute to Goal (Optional)
              </label>
              <div className="relative">
                <select
                  value={newTx.goalId || ''}
                  onChange={(e) => onNewTxChange({ ...newTx, goalId: e.target.value || undefined })}
                  disabled={isSubmitting}
                  className="w-full bg-slate-50 rounded-xl p-4 font-bold border-none outline-none focus:ring-2 focus:ring-slate-200 appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">No goal selected</option>
                  {availableGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.emoji} {goal.title} ({Math.round((goal.currentAmount / goal.targetAmount) * 100)}%)
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  size={20} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
                />
              </div>
              
              {/* Selected Goal Preview */}
              {selectedGoal && (
                <div className={`mt-3 p-3 rounded-xl ${theme.lightBg} border ${theme.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{selectedGoal.emoji}</span>
                    <span className={`font-bold text-sm ${theme.textClass}`}>{selectedGoal.title}</span>
                  </div>
                  <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${theme.bgClass}`}
                      style={{ width: `${Math.min((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    ₱{selectedGoal.currentAmount.toLocaleString()} / ₱{selectedGoal.targetAmount.toLocaleString()}
                    {newTx.amount && (
                      <span className={`${theme.textClass} font-bold`}>
                        {' '}→ ₱{(selectedGoal.currentAmount + Number(newTx.amount)).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={isSubmitting || !canSubmit}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
              isSpend ? 'bg-rose-500 hover:bg-rose-600' : theme.bgClass
            } ${
              isSubmitting || !canSubmit
                ? 'opacity-50 cursor-not-allowed' 
                : 'active:scale-95 hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isSpend ? 'Recording...' : 'Saving...'}
              </span>
            ) : isSpend ? (
              'Record spending'
            ) : (
              'Save record'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
