import { useState, useEffect } from 'react';
import { PiggyBank, Lock, ShieldCheck, LogIn } from 'lucide-react';
import { THEMES } from '@/lib/constants';
import { ParticlesBackground } from './ParticlesBackground';
import type { Profile } from '@/types';

interface LoginViewProps {
  profiles: Record<string, Profile>;
  onProfileSelect: (profileId: string) => void;
  pendingSessionProfileId?: string | null;
}

export function LoginView({ profiles, onProfileSelect, pendingSessionProfileId }: LoginViewProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAttempt, setPinAttempt] = useState('');
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);

  // Auto-show PIN modal for pending session
  useEffect(() => {
    if (pendingSessionProfileId && profiles[pendingSessionProfileId]) {
      const profile = profiles[pendingSessionProfileId];
      if (profile.pin && profile.pin.trim() !== '') {
        setPendingProfileId(pendingSessionProfileId);
        setShowPinModal(true);
        setPinAttempt('');
      }
    }
  }, [pendingSessionProfileId, profiles]);

  const handleProfileClick = (profileId: string) => {
    const profile = profiles[profileId];
    if (profile?.pin && profile.pin.trim() !== '') {
      setPendingProfileId(profileId);
      setShowPinModal(true);
      setPinAttempt('');
      setPinError(false);
    } else {
      onProfileSelect(profileId);
    }
  };

  const verifyPin = () => {
    if (!pendingProfileId) return;
    
    if (pinAttempt === profiles[pendingProfileId].pin) {
      onProfileSelect(pendingProfileId);
      setShowPinModal(false);
      setPinAttempt('');
      setPendingProfileId(null);
      setPinError(false);
    } else {
      setPinAttempt('');
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
    }
  };

  const pendingProfile = pendingProfileId ? profiles[pendingProfileId] : null;
  const isRestoringSession = pendingSessionProfileId === pendingProfileId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Particles Background */}
      <ParticlesBackground color="#ec4899" />
      
      <div className="max-w-md w-full relative z-10">
        {/* Decorative gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/10">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
            <PiggyBank size={40} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Money Mates</h1>
          <p className="text-slate-400 mb-10 text-lg">Who's tracking today?</p>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.values(profiles).map((profile) => {
              const theme = THEMES[profile.theme];
              const isSessionProfile = pendingSessionProfileId === profile.id;
              
              return (
                <button
                  key={profile.id}
                  onClick={() => handleProfileClick(profile.id)}
                  className={`group relative p-6 rounded-2xl bg-white/5 border transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-xl ${
                    isSessionProfile 
                      ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {isSessionProfile && (
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <LogIn size={10} />
                      Last session
                    </div>
                  )}
                  <div 
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110 ${theme.bgClass}`}
                  >
                    {profile.emoji}
                  </div>
                  <span className={`text-xl font-bold ${theme.textClass}`}>
                    {profile.name}
                  </span>
                  {profile.pin && profile.pin.trim() !== '' && (
                    <div className="absolute top-3 left-3 text-slate-500">
                      <Lock size={14} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && pendingProfile && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-slate-800 rounded-3xl p-8 w-full max-w-xs shadow-2xl border border-slate-700 ${
            pinError ? 'animate-shake' : 'animate-zoom-in-95'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl ${THEMES[pendingProfile.theme].bgClass}`}>
              {pendingProfile.emoji}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              {isRestoringSession ? 'Welcome back!' : 'Enter PIN'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {isRestoringSession 
                ? `Unlock to continue as ${pendingProfile.name}`
                : `Security for ${pendingProfile.name}`
              }
            </p>
            <input
              type="password"
              maxLength={4}
              className={`w-full text-center text-3xl tracking-[1em] font-bold bg-slate-900 rounded-xl p-4 mb-2 text-white border outline-none transition-colors ${
                pinError ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
              }`}
              value={pinAttempt}
              onChange={(e) => setPinAttempt(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
              autoFocus
            />
            {pinError && (
              <p className="text-rose-400 text-sm mb-4">Incorrect PIN. Try again.</p>
            )}
            {!pinError && <div className="h-6 mb-4" />}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPendingProfileId(null);
                  setPinError(false);
                }}
                className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={verifyPin}
                disabled={pinAttempt.length < 4}
                className={`flex-1 py-3 font-bold text-white rounded-xl shadow-lg transition-colors ${
                  pinAttempt.length < 4 
                    ? 'bg-slate-600 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
