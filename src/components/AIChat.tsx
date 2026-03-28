import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { generateAIText } from '@/lib/aiClient';
import { useAIThread } from '@/hooks/useAIThread';
import type { ChatMessage, Profile, Transaction, Goal, Theme, SavingsTarget, CutoffPeriod } from '@/types';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  /** When true, thread is stored under the household in Firestore (D-001). */
  dataEnabled: boolean;
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
  dataEnabled,
  currentTheme,
  profiles,
  transactions,
  goals,
  totalSavings,
  userTotals,
  savingsTarget,
  cutoffPeriods
}: AIChatProps) {
  const { messages, pushMessage, clearThread } = useAIThread(dataEnabled);
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
    const memberIds = Object.keys(profiles).sort();
    if (cutoffPeriods.length > 0) {
      const recentCutoffs = cutoffPeriods.slice(0, 3);
      cutoffInfo = recentCutoffs.map((cp) => {
        const status = cp.isComplete ? '✅ Complete' : '⏳ In Progress';
        const memberLines = memberIds
          .map((pid) => {
            const saved = cp.contributions?.[pid] || 0;
            const owed = cp.owedAmounts?.[pid] || 0;
            const name = profiles[pid]?.name || pid;
            return `  - ${name}: Saved ${formatCurrency(saved)}${owed > 0 ? `, owes ${formatCurrency(owed)}` : ''}`;
          })
          .join('\n');
        return `${cp.startDate} to ${cp.endDate} (${status}):\n${memberLines}`;
      }).join('\n\n');
    }

    const totalOwedLines = memberIds
      .map((pid) => {
        const total = cutoffPeriods.reduce((sum, cp) => sum + (cp.owedAmounts?.[pid] || 0), 0);
        const name = profiles[pid]?.name || pid;
        return `- ${name} owes: ${formatCurrency(total)}`;
      })
      .join('\n');

    const contributionLines = memberIds
      .map((pid) => {
        const name = profiles[pid]?.name || pid;
        return `- ${name}'s contribution: ${formatCurrency(userTotals[pid] || 0)}`;
      })
      .join('\n');

    return `
You are a friendly, encouraging AI financial coach for a couple's joint savings app called "Money Mates".

CURRENT FINANCIAL STATUS:
- Total Combined Savings: ${formatCurrency(totalSavings)}
${contributionLines}

BI-MONTHLY SAVINGS TARGET:
${targetInfo}

CUTOFF PERIOD HISTORY (Most Recent):
${cutoffInfo || 'No cutoff periods tracked yet'}

OWED AMOUNTS (Accumulated):
${totalOwedLines || '- None recorded'}

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

    const trimmed = input.trim();
    setInput('');
    setIsLoading(true);

    const pendingUser: ChatMessage = {
      id: 'pending-user',
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    try {
      await pushMessage('user', trimmed);

      const historyForModel = [...messages, pendingUser].slice(-6);
      const conversationHistory = historyForModel
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `
Previous conversation:
${conversationHistory}

User: ${trimmed}

Respond naturally to the user's message, considering the conversation history.
      `.trim();

      const response = await generateAIText(prompt, buildContext());
      const text =
        response || "I'm having trouble responding right now. Please try again!";
      await pushMessage('assistant', text);
    } catch {
      await pushMessage(
        'assistant',
        "Sorry, I couldn't process that. Deploy the generateAI Cloud Function or configure AI for local dev — see README."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    void clearThread();
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
          type="button"
          onClick={onOpen}
          className="fixed z-40 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-900/25 flex items-center justify-center active:scale-95 transition-transform bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px)+5.25rem)] md:bottom-24"
          aria-label="Open AI coach chat"
        >
          <MessageCircle size={22} className="md:w-6 md:h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed z-[60] flex flex-col bg-white shadow-2xl overflow-hidden animate-slide-in-from-right-4 max-md:inset-0 max-md:max-h-[100dvh] max-md:rounded-none safe-area-pt md:bottom-6 md:right-6 md:left-auto md:top-auto md:w-[380px] md:max-w-[min(380px,calc(100vw-2rem))] md:h-[min(600px,calc(100dvh-5rem))] md:rounded-3xl md:border md:border-slate-200 md:ring-1 md:ring-slate-200/80">
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
          <div className="p-3 sm:p-4 border-t border-slate-100 shrink-0 safe-area-pb bg-white">
            <div className="flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                enterKeyHint="send"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 min-h-12 bg-slate-100 rounded-xl px-4 py-3 text-base sm:text-sm outline-none focus:ring-2 focus:ring-violet-200 transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`min-h-12 min-w-12 shrink-0 rounded-xl flex items-center justify-center transition-all ${
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

