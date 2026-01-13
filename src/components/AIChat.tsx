import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { callGemini, formatCurrency } from '@/lib/utils';
import { GEMINI_API_KEY } from '@/config/firebase';
import type { ChatMessage, Profile, Transaction, Goal, Theme, SavingsTarget, CutoffPeriod } from '@/types';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  currentTheme: Theme;
  profiles: Record<string, Profile>;
  transactions: Transaction[];
  goals: Goal[];
  totalSavings: number;
  userTotals: Record<string, number>;
  savingsTarget: SavingsTarget | null;
  cutoffPeriods: CutoffPeriod[];
}

export function AIChat({
  isOpen,
  onClose,
  onOpen,
  currentTheme,
  profiles,
  transactions,
  goals,
  totalSavings,
  userTotals,
  savingsTarget,
  cutoffPeriods
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Build context for AI
  const buildContext = () => {
    const recentTx = transactions.slice(0, 10).map(tx => 
      `${profiles[tx.userId]?.name || tx.userId}: ₱${tx.amount} on ${tx.date} (${tx.note || 'no note'})`
    ).join('\n');

    const goalsInfo = goals.map(g => 
      `${g.emoji} ${g.title}: ₱${g.currentAmount}/₱${g.targetAmount} (${((g.currentAmount/g.targetAmount)*100).toFixed(0)}%)`
    ).join('\n');

    // Build savings target info
    let targetInfo = 'No bi-monthly target set';
    if (savingsTarget?.isActive) {
      const cutoffDayText = savingsTarget.cutoffDays.map(d => d === 0 ? 'last day' : `${d}th`).join(' and ');
      targetInfo = `Active target: ₱${formatCurrency(savingsTarget.targetAmount)} per person per cutoff (cutoffs on ${cutoffDayText} of each month)`;
    }

    // Build cutoff periods info
    let cutoffInfo = '';
    if (cutoffPeriods.length > 0) {
      const recentCutoffs = cutoffPeriods.slice(0, 3);
      cutoffInfo = recentCutoffs.map(cp => {
        const peaOwed = cp.owedAmounts?.pea || 0;
        const camOwed = cp.owedAmounts?.cam || 0;
        const status = cp.isComplete ? '✅ Complete' : '⏳ In Progress';
        return `${cp.startDate} to ${cp.endDate} (${status}):
  - ${profiles.pea?.name || 'Pea'}: Saved ${formatCurrency(cp.contributions?.pea || 0)}${peaOwed > 0 ? `, owes ${formatCurrency(peaOwed)}` : ''}
  - ${profiles.cam?.name || 'Cam'}: Saved ${formatCurrency(cp.contributions?.cam || 0)}${camOwed > 0 ? `, owes ${formatCurrency(camOwed)}` : ''}`;
      }).join('\n\n');
    }

    // Calculate total owed amounts
    const totalPeaOwed = cutoffPeriods.reduce((sum, cp) => sum + (cp.owedAmounts?.pea || 0), 0);
    const totalCamOwed = cutoffPeriods.reduce((sum, cp) => sum + (cp.owedAmounts?.cam || 0), 0);

    return `
You are a friendly, encouraging AI financial coach for a couple's joint savings app called "Money Mates".

CURRENT FINANCIAL STATUS:
- Total Combined Savings: ${formatCurrency(totalSavings)}
- ${profiles.pea?.name || 'Pea'}'s contribution: ${formatCurrency(userTotals.pea || 0)}
- ${profiles.cam?.name || 'Cam'}'s contribution: ${formatCurrency(userTotals.cam || 0)}

BI-MONTHLY SAVINGS TARGET:
${targetInfo}

CUTOFF PERIOD HISTORY (Most Recent):
${cutoffInfo || 'No cutoff periods tracked yet'}

OWED AMOUNTS (Accumulated):
- ${profiles.pea?.name || 'Pea'} owes: ${formatCurrency(totalPeaOwed)}
- ${profiles.cam?.name || 'Cam'} owes: ${formatCurrency(totalCamOwed)}

RECENT TRANSACTIONS:
${recentTx || 'No transactions yet'}

SAVINGS GOALS:
${goalsInfo || 'No goals set yet'}

INSTRUCTIONS:
- Be supportive, warm, and encouraging
- Give practical financial advice tailored to their situation
- Celebrate their wins and progress
- Keep responses concise (2-4 sentences usually)
- Use emojis sparingly for friendliness
- If they ask about their data, reference the actual numbers above
- If they ask about targets or cutoffs, explain their bi-monthly target progress
- If someone owes money, gently encourage them to catch up
- Suggest ways to improve if asked
- Be a cheerleader for their financial journey together
    `.trim();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!GEMINI_API_KEY) {
        throw new Error('API key not configured');
      }

      // Build conversation history for context
      const conversationHistory = messages
        .slice(-6) // Last 6 messages for context
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `
Previous conversation:
${conversationHistory}

User: ${input.trim()}

Respond naturally to the user's message, considering the conversation history.
      `.trim();

      const response = await callGemini(prompt, GEMINI_API_KEY, buildContext());

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "I'm having trouble responding right now. Please try again!",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: GEMINI_API_KEY 
          ? "Sorry, I couldn't process that. Please try again!" 
          : "AI Chat requires a Gemini API key. Please add VITE_GEMINI_API_KEY to your .env file.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Suggested prompts
  const suggestedPrompts = [
    "How are we doing?",
    "Target progress?",
    "Who owes more?",
    "Motivate us! 💪"
  ];

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all z-40"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col animate-slide-in-from-right-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold">AI Money Coach</h3>
                <p className="text-xs text-white/70">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Clear chat"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                  <Bot size={32} className="text-violet-600" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Hi there! 👋</h4>
                <p className="text-slate-500 text-sm mb-6">
                  I'm your AI financial coach. Ask me anything about your savings, goals, or get personalized tips!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-2 bg-violet-50 text-violet-600 rounded-full text-sm font-medium hover:bg-violet-100 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === 'user'
                        ? `${currentTheme.bgClass} text-white`
                        : 'bg-violet-100 text-violet-600'
                    }`}
                  >
                    {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? `${currentTheme.bgClass} text-white rounded-br-md`
                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-violet-600" />
                </div>
                <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <Loader2 size={18} className="animate-spin text-violet-500" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200 transition-all"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

