import { AlertCircle } from 'lucide-react';
import { FIREBASE_REQUIRED_ENV_KEYS } from '@/lib/env';

interface SetupMissingConfigProps {
  missing: string[];
}

export function SetupMissingConfig({ missing }: SetupMissingConfigProps) {
  return (
    <div className="min-h-dvh bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 safe-area-pt safe-area-pb safe-area-px">
      <div className="max-w-lg w-full bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="text-amber-400" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Configuration required</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Firebase environment variables are missing. Create a <code className="text-pink-300">.env</code> file in the project root and add the keys below. See <code className="text-pink-300">.env.example</code> and the README.
            </p>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Missing or empty</p>
          <ul className="space-y-1 font-mono text-sm text-rose-300">
            {missing.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500 mt-6">
          Required keys: {FIREBASE_REQUIRED_ENV_KEYS.join(', ')}
        </p>
      </div>
    </div>
  );
}
