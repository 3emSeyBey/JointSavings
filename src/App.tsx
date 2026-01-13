import { useState, useMemo, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useProfiles, useTransactions, useGoals } from '@/hooks/useFirestore';
import { useSavingsTarget } from '@/hooks/useSavingsTarget';
import { THEMES, DEFAULT_PROFILES } from '@/lib/constants';
import { getTodayISO } from '@/lib/utils';
import {
  LoginView,
  Header,
  Overview,
  Settings,
  TransactionModal,
  Goals,
  Analytics,
  AIChat,
  ParticlesBackground,
  SavingsTargets,
} from '@/components';
import type { ViewType, TabType, NewTransaction, Profile, NewGoal } from '@/types';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { sessionProfileId, isSessionLoading, saveSession, clearSession } = useSession();
  const { profiles, updateProfile } = useProfiles(!!user);
  const { transactions, addTransaction, deleteTransaction } = useTransactions(!!user);
  const { goals, addGoal, contributeToGoal, contributeToGoalById, deleteGoal } = useGoals(!!user);
  const { 
    target, 
    currentPeriodStats, 
    cutoffPeriods, 
    totalOwed,
    setTargetSettings, 
    toggleTarget
  } = useSavingsTarget(!!user, transactions);

  // View & Navigation State
  const [view, setView] = useState<ViewType>('login');
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [needsPinVerification, setNeedsPinVerification] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTx, setNewTx] = useState<NewTransaction>({
    amount: '',
    date: getTodayISO(),
    note: '',
    goalId: undefined,
  });

  // AI Chat State
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Restore session when profiles are loaded
  useEffect(() => {
    if (isSessionLoading || authLoading) return;
    if (!sessionProfileId) return;
    if (currentProfileId) return; // Already logged in

    const profile = profiles[sessionProfileId];
    if (profile) {
      // Check if profile has PIN
      if (profile.pin && profile.pin.trim() !== '') {
        // Require PIN verification
        setNeedsPinVerification(true);
        setView('login');
      } else {
        // Auto-login without PIN
        setCurrentProfileId(sessionProfileId);
        setView('dashboard');
      }
    }
  }, [sessionProfileId, profiles, isSessionLoading, authLoading, currentProfileId]);

  // Computed values
  const currentProfile = currentProfileId ? profiles[currentProfileId] : null;
  const partnerProfileId = currentProfileId === 'pea' ? 'cam' : 'pea';
  const partnerProfile = profiles[partnerProfileId];
  const currentTheme = currentProfile
    ? THEMES[currentProfile.theme]
    : THEMES.emerald;

  const totalSavings = useMemo(
    () => transactions.reduce((acc, t) => acc + Number(t.amount), 0),
    [transactions]
  );

  const userTotals = useMemo(() => {
    const totals: Record<string, number> = { pea: 0, cam: 0 };
    transactions.forEach((t) => {
      if (totals[t.userId] !== undefined) {
        totals[t.userId] += Number(t.amount);
      }
    });
    return totals;
  }, [transactions]);

  // Handlers
  const handleProfileSelect = (profileId: string) => {
    setCurrentProfileId(profileId);
    setView('dashboard');
    saveSession(profileId); // Persist session
    setNeedsPinVerification(false);
  };

  const handleLogout = () => {
    setCurrentProfileId(null);
    setView('login');
    setActiveTab('overview');
    setAiChatOpen(false);
    clearSession(); // Clear persisted session
    setNeedsPinVerification(false);
  };

  const handleAddTransaction = async () => {
    if (!newTx.amount || !currentProfileId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const txId = await addTransaction(currentProfileId, newTx);
      
      if (txId && newTx.goalId) {
        try {
          await contributeToGoalById(newTx.goalId, Number(newTx.amount));
        } catch (goalError) {
          console.error('Failed to update goal:', goalError);
        }
      }
      
      setShowAddModal(false);
      setNewTx({ amount: '', date: getTodayISO(), note: '', goalId: undefined });
    } catch (error) {
      console.error('Failed to add transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save: ${errorMessage}`);
      setShowAddModal(false);
      setNewTx({ amount: '', date: getTodayISO(), note: '', goalId: undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setShowAddModal(false);
    setNewTx({ amount: '', date: getTodayISO(), note: '', goalId: undefined });
  };

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (!currentProfileId) return;
    const currentData = profiles[currentProfileId] || DEFAULT_PROFILES[currentProfileId];
    await updateProfile(currentProfileId, { ...currentData, ...updates });
  };

  const handleAddGoal = async (newGoal: NewGoal) => {
    if (!currentProfileId) return;
    await addGoal(currentProfileId, newGoal);
  };

  // Show loading screen while checking session
  if (authLoading || isSessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <ParticlesBackground color="#ec4899" />
        <div className="text-center relative z-10">
          <Loader2 size={48} className="animate-spin text-pink-400 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Render Login View
  if (view === 'login') {
    return (
      <LoginView 
        profiles={profiles} 
        onProfileSelect={handleProfileSelect}
        pendingSessionProfileId={needsPinVerification ? sessionProfileId : null}
      />
    );
  }

  // Render Dashboard
  if (!currentProfile) return null;

  const tabs: TabType[] = ['overview', 'targets', 'goals', 'analytics', 'settings'];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0 font-sans">
      <Header
        profile={currentProfile}
        theme={currentTheme}
        onAskCoach={() => setAiChatOpen(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-200 rounded-xl overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold rounded-lg capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'goals' ? '🎯 Goals' : tab === 'targets' ? '📅 Targets' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <Overview
            currentProfile={currentProfile}
            partnerProfile={partnerProfile}
            currentTheme={currentTheme}
            totalSavings={totalSavings}
            userTotals={userTotals}
            transactions={transactions}
            profiles={profiles}
            onDeleteTransaction={deleteTransaction}
          />
        )}

        {activeTab === 'targets' && (
          <SavingsTargets
            target={target}
            currentPeriodStats={currentPeriodStats}
            cutoffPeriods={cutoffPeriods}
            totalOwed={totalOwed}
            profiles={profiles}
            currentTheme={currentTheme}
            onSetTarget={setTargetSettings}
            onToggleTarget={toggleTarget}
          />
        )}

        {activeTab === 'goals' && (
          <Goals
            goals={goals}
            currentTheme={currentTheme}
            onAddGoal={handleAddGoal}
            onContribute={contributeToGoal}
            onDeleteGoal={deleteGoal}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            transactions={transactions}
            profiles={profiles}
            currentTheme={currentTheme}
            totalSavings={totalSavings}
            userTotals={userTotals}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            currentProfile={currentProfile}
            currentTheme={currentTheme}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white active:scale-90 transition-all z-40 ${currentTheme.bgClass} hover:shadow-2xl`}
      >
        <Plus size={32} />
      </button>

      {/* Transaction Modal */}
      {showAddModal && (
        <TransactionModal
          theme={currentTheme}
          newTx={newTx}
          goals={goals}
          isSubmitting={isSubmitting}
          onNewTxChange={setNewTx}
          onSubmit={handleAddTransaction}
          onClose={handleCloseModal}
        />
      )}

      {/* AI Chat */}
      <AIChat
        isOpen={aiChatOpen}
        onOpen={() => setAiChatOpen(true)}
        onClose={() => setAiChatOpen(false)}
        currentTheme={currentTheme}
        profiles={profiles}
        transactions={transactions}
        goals={goals}
        totalSavings={totalSavings}
        userTotals={userTotals}
        savingsTarget={target}
        cutoffPeriods={cutoffPeriods}
      />
    </div>
  );
}
