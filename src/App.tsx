import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { useSession } from '@/hooks/useSession';
import { useProfiles, useTransactions, useGoals } from '@/hooks/useFirestore';
import { useGameSession } from '@/hooks/useGameSession';
import { useChecklist } from '@/hooks/useChecklist';
import { usePartnerPromises } from '@/hooks/usePartnerPromises';
import { useHouseholdMembership } from '@/hooks/useHouseholdMembership';
import { THEMES, DEFAULT_PROFILES } from '@/lib/constants';
import { getTodayISO } from '@/lib/utils';
import { migrateLegacyToHouseholdIfNeeded } from '@/lib/migrateLegacyFirestore';
import { db } from '@/config/firebase';
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
  MeshBackdrop,
  DashboardWhimsy,
  WanderingPetsOverlay,
  MiniGames,
  MobileTabBar,
  ChecklistTab,
} from '@/components';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ViewType, TabType, NewTransaction, Profile, NewGoal } from '@/types';
import { profileHasPin } from '@/lib/profilePin';
import { buildMemberTotals } from '@/lib/transactionTotals';
import { inviteLabelForGameType } from '@/lib/gameCatalog';

export default function App() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [firestoreReady, setFirestoreReady] = useState(false);

  const { canWrite, membershipReady } = useHouseholdMembership(Boolean(user && db), user?.uid);

  useEffect(() => {
    if (!db || !user) {
      setFirestoreReady(true);
      return;
    }
    if (!membershipReady) return;
    let alive = true;
    migrateLegacyToHouseholdIfNeeded(db)
      .catch((e) => console.error('Legacy migration:', e))
      .finally(() => {
        if (alive) setFirestoreReady(true);
      });
    return () => {
      alive = false;
    };
  }, [user, membershipReady]);

  const dataEnabled = Boolean(user && db && membershipReady && firestoreReady);

  const { sessionProfileId, isSessionLoading, saveSession, clearSession } = useSession();
  const { profiles, updateProfile } = useProfiles(dataEnabled);
  const profileIds = useMemo(() => Object.keys(profiles).sort(), [profiles]);
  const { transactions, addTransaction, softDeleteTransaction } = useTransactions(
    dataEnabled,
    user?.uid
  );
  const { goals, addGoal, contributeToGoal, deleteGoal } = useGoals(dataEnabled);
  const {
    checklistItems,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    setChecklistCompleted,
  } = useChecklist(dataEnabled, user?.uid);
  const { partnerPromisesByProfileId, savePartnerPromise } = usePartnerPromises(dataEnabled);
  // View & Navigation State
  const [view, setView] = useState<ViewType>('login');
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [needsPinVerification, setNeedsPinVerification] = useState(false);

  const {
    session: gameSession,
    pendingInvite,
    createSession,
    joinSession,
    updateSession: updateGameSession,
    endSession,
  } = useGameSession(dataEnabled, currentProfileId);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTx, setNewTx] = useState<NewTransaction>({
    amount: '',
    date: getTodayISO(),
    note: '',
    goalId: undefined,
    category: 'general',
    entryKind: 'saving',
    spendSource: undefined,
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
      if (profileHasPin(profile)) {
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
  const partnerProfileId =
    profileIds.find((id) => id !== currentProfileId) ?? profileIds[0] ?? '';
  const partnerProfile = partnerProfileId ? profiles[partnerProfileId] : undefined;
  const currentTheme = currentProfile
    ? THEMES[currentProfile.theme]
    : THEMES.emerald;

  const totalSavings = useMemo(
    () => transactions.reduce((acc, t) => acc + Number(t.amount), 0),
    [transactions]
  );

  const userTotals = useMemo(
    () => buildMemberTotals(transactions, profileIds),
    [transactions, profileIds]
  );

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
    if (newTx.entryKind === 'spend' && !newTx.spendSource) {
      showToast('Choose whether this came from Pea, Cam, or joint', 'error');
      return;
    }

    setIsSubmitting(true);
    const wasSpend = newTx.entryKind === 'spend';

    try {
      const clientRequestId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `tx-${Date.now()}`;
      await addTransaction(currentProfileId, { ...newTx, clientRequestId });

      setShowAddModal(false);
      setNewTx({
        amount: '',
        date: getTodayISO(),
        note: '',
        goalId: undefined,
        category: 'general',
        entryKind: 'saving',
        spendSource: undefined,
      });
      showToast(wasSpend ? 'Spending recorded' : 'Saving recorded', 'success');
    } catch (error) {
      console.error('Failed to add transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to save: ${errorMessage}`, 'error');
      setShowAddModal(false);
      setNewTx({
        amount: '',
        date: getTodayISO(),
        note: '',
        goalId: undefined,
        category: 'general',
        entryKind: 'saving',
        spendSource: undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setShowAddModal(false);
    setNewTx({
      amount: '',
      date: getTodayISO(),
      note: '',
      goalId: undefined,
      category: 'general',
      entryKind: 'saving',
      spendSource: undefined,
    });
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

  const handleAcceptGame = async () => {
    await joinSession();
    setActiveTab('games');
  };

  const handleDeclineGame = async () => {
    await endSession();
  };

  // Show loading screen while checking session
  if (authLoading || isSessionLoading || (user && (!membershipReady || !firestoreReady))) {
    return (
      <div className="relative min-h-dvh overflow-hidden flex items-center justify-center">
        <MeshBackdrop />
        <ParticlesBackground color="#22d3ee" />
        <div className="text-center relative z-10 px-4">
          <Loader2 size={48} className="animate-spin text-[var(--accent-a)] mx-auto mb-4 drop-shadow-[0_0_12px_var(--border-glow)]" />
          <p className="text-[var(--text-dim)] font-display font-semibold tracking-wide">Syncing ledger…</p>
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
        onSignInWithGoogle={async () => {
          try {
            await signInWithGoogle();
          } catch (e) {
            console.error(e);
            showToast('Google sign-in failed', 'error');
          }
        }}
      />
    );
  }

  // Render Dashboard
  if (!currentProfile) return null;

  const tabs: TabType[] = ['overview', 'goals', 'checklist', 'analytics', 'games', 'settings'];

  return (
    <div className="relative min-h-dvh font-sans text-[var(--text)] pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 overflow-x-hidden">
      <MeshBackdrop />
      <DashboardWhimsy />

      <div className="relative z-10 max-md:px-4 md:px-0">
        <Header
          profile={currentProfile}
          theme={currentTheme}
          onAskCoach={() => setAiChatOpen(true)}
          onLogout={handleLogout}
        />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 md:pt-6 pb-4 md:pb-10 safe-area-px">
          {/* Tab Navigation — tablet & desktop */}
          <div className="hidden md:flex p-1 glass-panel rounded-2xl overflow-x-auto gap-0.5 mb-5 md:mb-8 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-h-11 py-2.5 px-3 text-sm font-display font-bold rounded-xl capitalize transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[var(--surface-raised)] text-[var(--text)] shadow-[0_0_0_1px_var(--border-glow),0_12px_28px_rgba(0,0,0,0.35)]'
                    : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]/40'
                }`}
              >
                {tab === 'goals'
                  ? '🎯 Goals'
                  : tab === 'checklist'
                    ? '✨ Together'
                    : tab === 'games'
                      ? '🎮 Games'
                      : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5 md:space-y-8"
            >
              <ErrorBoundary tabName={activeTab}>
                {activeTab === 'overview' && (
                  <Overview
                    currentProfile={currentProfile}
                    partnerProfile={partnerProfile}
                    currentTheme={currentTheme}
                    totalSavings={totalSavings}
                    userTotals={userTotals}
                    transactions={transactions}
                    profiles={profiles}
                    onDeleteTransaction={canWrite ? softDeleteTransaction : async () => {}}
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

                {activeTab === 'checklist' && currentProfileId && (
                  <ChecklistTab
                    items={checklistItems}
                    canWrite={canWrite}
                    currentTheme={currentTheme}
                    profiles={profiles}
                    profileIds={profileIds}
                    currentProfileId={currentProfileId}
                    partnerPromisesByProfileId={partnerPromisesByProfileId}
                    onSavePartnerPromise={savePartnerPromise}
                    onAdd={addChecklistItem}
                    onUpdate={updateChecklistItem}
                    onDelete={deleteChecklistItem}
                    onSetCompleted={setChecklistCompleted}
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

                {activeTab === 'games' && currentProfileId && (
                  <MiniGames
                    currentTheme={currentTheme}
                    currentProfileId={currentProfileId}
                    profiles={profiles}
                    session={gameSession}
                    onCreateSession={createSession}
                    onUpdateSession={updateGameSession}
                    onEndSession={endSession}
                  />
                )}

                {activeTab === 'settings' && (
                  <Settings
                    currentProfile={currentProfile}
                    currentTheme={currentTheme}
                    onUpdateProfile={handleUpdateProfile}
                  />
                )}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>

        <WanderingPetsOverlay />

        {/* Floating Action Button */}
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-chrome fixed z-40 right-4 md:right-6 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6 h-14 w-14 md:h-16 md:w-16 rounded-2xl md:rounded-2xl p-[2px] bg-transparent border-0 shadow-none active:scale-[0.96] transition-transform"
            aria-label="Add saving or spending"
          >
            <span className="flex h-full w-full items-center justify-center rounded-[0.875rem] md:rounded-[0.875rem] bg-[var(--surface-raised)] text-[var(--accent-a)]">
              <Plus size={28} className="sm:w-8 sm:h-8" strokeWidth={2.5} />
            </span>
          </button>
        )}

        <MobileTabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* Transaction Modal */}
        {showAddModal && (
          <TransactionModal
            theme={currentTheme}
            profiles={profiles}
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
          dataEnabled={dataEnabled}
          currentTheme={currentTheme}
          profiles={profiles}
          transactions={transactions}
          goals={goals}
          totalSavings={totalSavings}
          userTotals={userTotals}
          checklistItems={checklistItems}
          partnerPromisesByProfileId={partnerPromisesByProfileId}
        />

        {/* Game Invite Notification */}
        {pendingInvite && (
          <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 animate-slide-in-from-bottom-4 px-3 w-full max-w-sm safe-area-px">
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 sm:gap-4">
            <div className="text-3xl">{profiles[pendingInvite.initiator]?.emoji || '🎮'}</div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-[var(--text)] truncate">
                {profiles[pendingInvite.initiator]?.name || pendingInvite.initiator} wants to play!
              </p>
              <p className="text-sm text-[var(--text-dim)]">
                {inviteLabelForGameType(pendingInvite.gameType)}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDeclineGame}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/50 text-[var(--text-dim)] font-display font-bold text-sm hover:text-[var(--text)] transition-colors"
              >
                Nah
              </button>
              <button
                type="button"
                onClick={handleAcceptGame}
                className="px-3 py-2 rounded-xl text-white font-display font-bold text-sm bg-gradient-to-br from-[var(--accent-a)] to-[var(--accent-b)] shadow-lg shadow-black/30"
              >
                Join!
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
