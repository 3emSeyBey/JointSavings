import { Wallet, X, Target, ChevronDown } from 'lucide-react';
import type { Theme, NewTransaction, Goal } from '@/types';

interface TransactionModalProps {
  theme: Theme;
  newTx: NewTransaction;
  goals: Goal[];
  isSubmitting: boolean;
  onNewTxChange: (tx: NewTransaction) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function TransactionModal({
  theme,
  newTx,
  goals,
  isSubmitting,
  onNewTxChange,
  onSubmit,
  onClose,
}: TransactionModalProps) {
  // Filter goals that aren't complete yet
  const availableGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  const selectedGoal = goals.find(g => g.id === newTx.goalId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-in-from-bottom-4">
        <div className={`p-8 text-white ${theme.bgClass}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Wallet size={20} /> Add Saving
            </h3>
            <button 
              onClick={onClose}
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
              disabled={isSubmitting}
            >
              <X size={20} />
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
            placeholder="Note (e.g. Monthly share)"
            value={newTx.note}
            onChange={(e) => onNewTxChange({ ...newTx, note: e.target.value })}
            disabled={isSubmitting}
            className="w-full bg-slate-50 rounded-xl p-4 font-bold border-none outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
          />
          
          {/* Goal Selection */}
          {availableGoals.length > 0 && (
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
            disabled={isSubmitting || !newTx.amount}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${theme.bgClass} ${
              isSubmitting || !newTx.amount 
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
                Saving...
              </span>
            ) : (
              'Save Record'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
