import { useState } from 'react';
import { Target, Plus, X, Trash2, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Goal, NewGoal, Theme } from '@/types';

const GOAL_EMOJIS = ['🎯', '🏠', '✈️', '🚗', '💍', '🎓', '💻', '🏖️', '👶', '💰'];

interface GoalsProps {
  goals: Goal[];
  currentTheme: Theme;
  onAddGoal: (goal: NewGoal) => void;
  onContribute: (goalId: string, currentAmount: number, contribution: number) => void;
  onDeleteGoal: (id: string) => void;
}

export function Goals({ goals, currentTheme, onAddGoal, onContribute, onDeleteGoal }: GoalsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState<NewGoal>({
    title: '',
    targetAmount: '',
    deadline: '',
    emoji: '🎯'
  });
  const [contribution, setContribution] = useState('');

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount) return;
    onAddGoal(newGoal);
    setNewGoal({ title: '', targetAmount: '', deadline: '', emoji: '🎯' });
    setShowAddModal(false);
  };

  const handleContribute = () => {
    if (!showContributeModal || !contribution) return;
    onContribute(showContributeModal.id, showContributeModal.currentAmount, Number(contribution));
    setContribution('');
    setShowContributeModal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this goal?')) {
      onDeleteGoal(id);
    }
  };

  const getProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysLeft = (deadline: string) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Savings Goals</h2>
          <p className="text-slate-500 text-sm">Track progress towards your dreams</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all ${currentTheme.bgClass}`}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-600 mb-2">No goals yet</h3>
          <p className="text-slate-400 mb-6">Start by creating your first savings goal!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className={`px-6 py-3 rounded-xl text-white font-bold ${currentTheme.bgClass}`}
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const daysLeft = getDaysLeft(goal.deadline);
            const isComplete = progress >= 100;

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden group transition-all hover:shadow-md ${
                  isComplete ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        isComplete ? 'bg-emerald-100' : currentTheme.lightBg
                      }`}>
                        {goal.emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{goal.title}</h3>
                        {daysLeft !== null && (
                          <div className={`flex items-center gap-1 text-xs ${
                            daysLeft < 0 ? 'text-rose-500' : daysLeft < 30 ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            <Calendar size={12} />
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? 'bg-emerald-500' : currentTheme.bgClass
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-lg font-bold ${isComplete ? 'text-emerald-600' : currentTheme.textClass}`}>
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-slate-400 text-sm"> / {formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                      isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  {/* Actions */}
                  {!isComplete && (
                    <button
                      onClick={() => setShowContributeModal(goal)}
                      className={`w-full mt-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${currentTheme.lightBg} ${currentTheme.textClass} hover:opacity-80`}
                    >
                      <TrendingUp size={16} />
                      Add Progress
                    </button>
                  )}

                  {isComplete && (
                    <div className="mt-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-600 font-bold text-sm flex items-center justify-center gap-2">
                      <Sparkles size={16} />
                      Goal Achieved!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-in-from-bottom-4">
            <div className={`p-6 text-white ${currentTheme.bgClass}`}>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Target size={20} /> New Goal
                </h3>
                <button onClick={() => setShowAddModal(false)} className="hover:bg-white/20 p-1 rounded-full">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Emoji Selector */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewGoal({ ...newGoal, emoji })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        newGoal.emoji === emoji
                          ? `${currentTheme.bgClass} text-white shadow-lg scale-110`
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g., New Car, Vacation, Emergency Fund"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full bg-slate-50 rounded-xl p-4 font-medium outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    placeholder="100,000"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    className="w-full bg-slate-50 rounded-xl p-4 pl-10 font-bold outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Target Date (Optional)</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full bg-slate-50 rounded-xl p-4 font-medium outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <button
                onClick={handleAddGoal}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg active:scale-95 transition-transform ${currentTheme.bgClass}`}
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-in-from-bottom-4">
            <div className={`p-6 text-white ${currentTheme.bgClass}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{showContributeModal.emoji}</span>
                  <h3 className="font-bold text-lg">{showContributeModal.title}</h3>
                </div>
                <button onClick={() => setShowContributeModal(null)} className="hover:bg-white/20 p-1 rounded-full">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-slate-500 text-sm mb-1">Current Progress</p>
                <p className="text-2xl font-bold text-slate-800">
                  {formatCurrency(showContributeModal.currentAmount)}
                  <span className="text-slate-400 text-lg"> / {formatCurrency(showContributeModal.targetAmount)}</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Add Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-50 rounded-xl p-4 pl-10 text-2xl font-bold outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <button
                onClick={handleContribute}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg active:scale-95 transition-transform ${currentTheme.bgClass}`}
              >
                Add to Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

