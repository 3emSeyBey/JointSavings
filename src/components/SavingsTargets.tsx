import { useState } from 'react';
import { 
  Target, Calendar, AlertTriangle, Clock,
  Settings2, X, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { THEMES } from '@/lib/constants';
import type { Profile, Theme, SavingsTarget, CutoffPeriod } from '@/types';

interface CurrentPeriodStats {
  startDate: string;
  endDate: string;
  contributions: { pea: number; cam: number };
  targetAmount: number;
  daysRemaining: number;
  totalDays: number;
  progress: { pea: number; cam: number };
  remaining: { pea: number; cam: number };
  isUrgent: boolean;
  isOverdue: boolean;
}

interface SavingsTargetsProps {
  target: SavingsTarget | null;
  currentPeriodStats: CurrentPeriodStats | null;
  cutoffPeriods: CutoffPeriod[];
  totalOwed: { pea: number; cam: number };
  profiles: Record<string, Profile>;
  currentTheme: Theme;
  onSetTarget: (amount: number, cutoffDays: number[]) => Promise<void>;
  onToggleTarget: (isActive: boolean) => Promise<void>;
}

export function SavingsTargets({
  target,
  currentPeriodStats,
  cutoffPeriods,
  totalOwed,
  profiles,
  currentTheme,
  onSetTarget,
  onToggleTarget,
}: SavingsTargetsProps) {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [targetAmount, setTargetAmount] = useState(target?.targetAmount?.toString() || '5000');
  const [cutoffDay1, setCutoffDay1] = useState('15');
  const [cutoffDay2, setCutoffDay2] = useState('0'); // 0 = last day
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTarget = async () => {
    setIsSaving(true);
    try {
      const amount = Number(targetAmount);
      const day1 = Number(cutoffDay1);
      const day2 = Number(cutoffDay2);
      
      if (amount <= 0) {
        alert('Please enter a valid target amount');
        return;
      }
      
      await onSetTarget(amount, [day1, day2]);
      setShowSetupModal(false);
    } catch (error) {
      console.error('Error saving target:', error);
      alert('Failed to save target');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const peaTheme = THEMES[profiles.pea?.theme || 'pink'];
  const camTheme = THEMES[profiles.cam?.theme || 'green'];

  // No target set
  if (!target) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={32} className="text-pink-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Bi-Monthly Savings Target</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Set a savings target for each cutoff period. Track your progress and see if either of you owes any amount!
          </p>
          <button
            onClick={() => setShowSetupModal(true)}
            className={`px-6 py-3 rounded-xl text-white font-bold shadow-lg ${currentTheme.bgClass}`}
          >
            Set Up Target
          </button>
        </div>
        
        {/* Setup Modal */}
        {showSetupModal && <SetupModal />}
      </div>
    );
  }

  function SetupModal() {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-in-from-bottom-4">
          <div className={`p-6 text-white ${currentTheme.bgClass}`}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Settings2 size={20} /> Target Settings
              </h3>
              <button onClick={() => setShowSetupModal(false)} className="hover:bg-white/20 p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
                Target Amount (per person, per cutoff)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl p-4 pl-10 font-bold outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="5000"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Each person should save this amount every cutoff period</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
                Cutoff Days
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">First Cutoff</label>
                  <select
                    value={cutoffDay1}
                    onChange={(e) => setCutoffDay1(e.target.value)}
                    className="w-full bg-slate-50 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {[...Array(28)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Second Cutoff</label>
                  <select
                    value={cutoffDay2}
                    onChange={(e) => setCutoffDay2(e.target.value)}
                    className="w-full bg-slate-50 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="0">Last day of month</option>
                    {[...Array(13)].map((_, i) => (
                      <option key={i + 16} value={i + 16}>Day {i + 16}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveTarget}
              disabled={isSaving}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg active:scale-95 transition-transform ${currentTheme.bgClass} ${isSaving ? 'opacity-50' : ''}`}
            >
              {isSaving ? 'Saving...' : 'Save Target'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Period Card */}
      {currentPeriodStats && target.isActive && (
        <div className={`rounded-3xl p-6 shadow-xl border ${
          currentPeriodStats.isOverdue 
            ? 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200' 
            : currentPeriodStats.isUrgent
              ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
              : 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-slate-700/50 text-white'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                currentPeriodStats.isOverdue || currentPeriodStats.isUrgent 
                  ? 'bg-white/80' 
                  : 'bg-white/10'
              }`}>
                {currentPeriodStats.isOverdue ? (
                  <AlertTriangle size={24} className="text-rose-500" />
                ) : currentPeriodStats.isUrgent ? (
                  <Clock size={24} className="text-amber-500" />
                ) : (
                  <Target size={24} className="text-pink-400" />
                )}
              </div>
              <div>
                <h3 className={`font-bold ${currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'text-slate-800' : ''}`}>
                  Current Cutoff Period
                </h3>
                <p className={`text-sm ${currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formatDate(currentPeriodStats.startDate)} - {formatDate(currentPeriodStats.endDate)}
                </p>
              </div>
            </div>
            <div className={`text-right px-3 py-1 rounded-full text-sm font-bold ${
              currentPeriodStats.isOverdue 
                ? 'bg-rose-100 text-rose-600'
                : currentPeriodStats.isUrgent
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-white/10 text-white'
            }`}>
              {currentPeriodStats.isOverdue 
                ? 'Overdue!' 
                : currentPeriodStats.daysRemaining === 0 
                  ? 'Last day!'
                  : `${currentPeriodStats.daysRemaining} days left`
              }
            </div>
          </div>

          {/* Target Info */}
          <div className={`text-center mb-6 py-3 rounded-xl ${
            currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'bg-white/50' : 'bg-white/5'
          }`}>
            <p className={`text-xs uppercase ${currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'text-slate-500' : 'text-slate-400'}`}>
              Target per person
            </p>
            <p className={`text-2xl font-bold ${currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'text-slate-800' : ''}`}>
              {formatCurrency(currentPeriodStats.targetAmount)}
            </p>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {/* Pea's Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{profiles.pea?.emoji || '🌸'}</span>
                  <span className={`font-bold text-sm ${currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'text-slate-700' : ''}`}>
                    {profiles.pea?.name || 'Pea'}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${peaTheme.textClass}`}>
                    {formatCurrency(currentPeriodStats.contributions.pea)}
                  </span>
                  {currentPeriodStats.remaining.pea > 0 && (
                    <span className={`text-xs ml-2 ${currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'text-slate-500' : 'text-slate-400'}`}>
                      ({formatCurrency(currentPeriodStats.remaining.pea)} to go)
                    </span>
                  )}
                </div>
              </div>
              <div className={`h-3 rounded-full overflow-hidden ${
                currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'bg-slate-200' : 'bg-white/10'
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${peaTheme.bgClass}`}
                  style={{ width: `${currentPeriodStats.progress.pea}%` }}
                />
              </div>
            </div>

            {/* Cam's Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{profiles.cam?.emoji || '📸'}</span>
                  <span className={`font-bold text-sm ${currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'text-slate-700' : ''}`}>
                    {profiles.cam?.name || 'Cam'}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${camTheme.textClass}`}>
                    {formatCurrency(currentPeriodStats.contributions.cam)}
                  </span>
                  {currentPeriodStats.remaining.cam > 0 && (
                    <span className={`text-xs ml-2 ${currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'text-slate-500' : 'text-slate-400'}`}>
                      ({formatCurrency(currentPeriodStats.remaining.cam)} to go)
                    </span>
                  )}
                </div>
              </div>
              <div className={`h-3 rounded-full overflow-hidden ${
                currentPeriodStats.isOverdue || currentPeriodStats.isUrgent ? 'bg-slate-200' : 'bg-white/10'
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${camTheme.bgClass}`}
                  style={{ width: `${currentPeriodStats.progress.cam}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owed Amounts Alert */}
      {(totalOwed.pea > 0 || totalOwed.cam > 0) && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={20} className="text-rose-500" />
            <h4 className="font-bold text-rose-700">Outstanding Amounts</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {totalOwed.pea > 0 && (
              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>{profiles.pea?.emoji || '🌸'}</span>
                  <span className="text-sm font-medium text-slate-600">{profiles.pea?.name || 'Pea'} owes</span>
                </div>
                <p className={`font-bold text-lg ${peaTheme.textClass}`}>{formatCurrency(totalOwed.pea)}</p>
              </div>
            )}
            {totalOwed.cam > 0 && (
              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>{profiles.cam?.emoji || '📸'}</span>
                  <span className="text-sm font-medium text-slate-600">{profiles.cam?.name || 'Cam'} owes</span>
                </div>
                <p className={`font-bold text-lg ${camTheme.textClass}`}>{formatCurrency(totalOwed.cam)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowSetupModal(true)}
          className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Settings2 size={18} />
          Edit Target
        </button>
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Calendar size={18} />
          History
        </button>
      </div>

      {/* Toggle Active */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-700">Target Tracking</p>
          <p className="text-sm text-slate-500">
            {target.isActive ? 'Currently tracking bi-monthly targets' : 'Target tracking is paused'}
          </p>
        </div>
        <button
          onClick={() => onToggleTarget(!target.isActive)}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
            target.isActive 
              ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' 
              : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
          }`}
        >
          {target.isActive ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* Setup Modal */}
      {showSetupModal && <SetupModal />}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl animate-slide-in-from-bottom-4">
            <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Calendar size={20} /> Cutoff History
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="hover:bg-white/20 p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {cutoffPeriods.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No completed cutoff periods yet
                </div>
              ) : (
                <div className="space-y-3">
                  {cutoffPeriods.map((period) => (
                    <div key={period.id} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-slate-700">
                          {formatDate(period.startDate)} - {formatDate(period.endDate)}
                        </span>
                        <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">
                          Target: {formatCurrency(period.targetAmount)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                            <span>{profiles.pea?.emoji}</span> {profiles.pea?.name || 'Pea'}
                          </div>
                          <p className={`font-bold ${peaTheme.textClass}`}>
                            {formatCurrency(period.contributions?.pea || 0)}
                          </p>
                          {(period.owedAmounts?.pea || 0) > 0 && (
                            <p className="text-xs text-rose-500">Owed: {formatCurrency(period.owedAmounts.pea)}</p>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                            <span>{profiles.cam?.emoji}</span> {profiles.cam?.name || 'Cam'}
                          </div>
                          <p className={`font-bold ${camTheme.textClass}`}>
                            {formatCurrency(period.contributions?.cam || 0)}
                          </p>
                          {(period.owedAmounts?.cam || 0) > 0 && (
                            <p className="text-xs text-rose-500">Owed: {formatCurrency(period.owedAmounts.cam)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

