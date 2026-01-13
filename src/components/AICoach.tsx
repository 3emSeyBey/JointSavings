import { BrainCircuit, X } from 'lucide-react';

interface AICoachProps {
  isOpen: boolean;
  isLoading: boolean;
  response: string;
  onClose: () => void;
}

export function AICoach({ isOpen, isLoading, response, onClose }: AICoachProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-violet-100 overflow-hidden z-[60] animate-slide-in-from-right-4">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <BrainCircuit size={20} />
          <span className="font-bold">✨ AI Coach</span>
        </div>
        <button 
          onClick={onClose}
          className="hover:bg-white/20 p-1 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="h-20 flex items-center justify-center text-violet-400 font-bold animate-pulse">
            Consulting Gemini...
          </div>
        ) : (
          <p className="text-slate-700 italic leading-relaxed">"{response}"</p>
        )}
      </div>
    </div>
  );
}

