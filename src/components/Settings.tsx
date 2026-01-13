import { useState } from 'react';
import { Key } from 'lucide-react';
import type { Profile, Theme } from '@/types';

interface SettingsProps {
  currentProfile: Profile;
  currentTheme: Theme;
  onUpdateProfile: (updates: Partial<Profile>) => void;
}

export function Settings({ currentProfile, currentTheme, onUpdateProfile }: SettingsProps) {
  const [editingName, setEditingName] = useState(currentProfile.name);
  const [newPin, setNewPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Partial<Profile> = {};
      
      if (editingName !== currentProfile.name) {
        updates.name = editingName;
      }
      
      if (newPin === 'REMOVE') {
        updates.pin = null;
      } else if (newPin !== '') {
        updates.pin = newPin;
      }
      
      if (Object.keys(updates).length > 0) {
        await onUpdateProfile(updates);
      }
      
      setNewPin('');
      alert('Profile updated!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePin = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({ pin: null });
      setNewPin('');
      alert('PIN disabled!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-8 max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${currentTheme.bgClass} text-white shadow-lg`}
        >
          {currentProfile.emoji}
        </div>
        <div>
          <h3 className="text-xl font-bold">{currentProfile.name}</h3>
          <p className="text-slate-500 text-sm">Profile Customization</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
            Display Name
          </label>
          <input
            className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none border border-transparent focus:border-slate-200 transition-colors"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
          />
        </div>

        {/* PIN Security */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
            PIN Security
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="password"
                maxLength={4}
                placeholder={currentProfile.pin ? '••••' : 'Set 4-digit PIN'}
                className="w-full bg-slate-50 pl-10 pr-4 py-3 rounded-xl font-bold placeholder:font-normal outline-none border border-transparent focus:border-slate-200 transition-colors"
                value={newPin === 'REMOVE' ? '' : newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            {currentProfile.pin && (
              <button
                onClick={handleRemovePin}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
              >
                Disable PIN
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            PIN will be required every time you login.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 ${currentTheme.bgClass} ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
