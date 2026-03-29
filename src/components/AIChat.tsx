import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { generateAIText } from '@/lib/aiClient';
import { useAIThread } from '@/hooks/useAIThread';
import type {
  ChatMessage,
  Profile,
  Transaction,
  Goal,
  Theme,
  ChecklistItem,
  ChecklistItemKind,
  PartnerPromise,
} from '@/types';
import { formatDueLabel, isChecklistOverdue, sortChecklistItems } from '@/lib/checklistDue';
import { checklistPlainTextPreview, sanitizeChecklistHtml } from '@/lib/checklistHtml';

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
  /** "Together" tab — shared intentions, tasks, buys, life goals */
  checklistItems: ChecklistItem[];
  /** Solemn one-per-person promises (Together tab) */
  partnerPromisesByProfileId: Record<string, PartnerPromise>;
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
  checklistItems,
  partnerPromisesByProfileId,
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

    const memberIds = Object.keys(profiles).sort();

    const contributionLines = memberIds
      .map((pid) => {
        const name = profiles[pid]?.name || pid;
        return `- ${name}'s contribution: ${formatCurrency(userTotals[pid] || 0)}`;
      })
      .join('\n');

    const kindLabel = (k: ChecklistItemKind) =>
      k === 'task' ? 'task' : k === 'purchase' ? 'to buy' : k === 'life_us' ? 'for both' : 'relationship';

    const togetherLines =
      checklistItems.length === 0
        ? 'No items yet'
        : [...checklistItems]
            .sort(sortChecklistItems)
            .slice(0, 24)
            .map((c) => {
              const due = formatDueLabel(c.dueKind, c.dueValue);
              const overdue = isChecklistOverdue(c);
              const horizon = c.horizon === 'short' ? 'this season' : 'long arc';
              const status = c.completed ? 'done' : overdue ? 'overdue' : 'active';
              const note = checklistPlainTextPreview(sanitizeChecklistHtml(c.descriptionHtml), 160);
              const cq = c.consequence?.trim() ?? '';
              const cons = cq ? ` If missed: ${cq.slice(0, 120)}${cq.length > 120 ? '…' : ''}` : '';
              const dueBit = due ? ` · due ${due}${overdue && !c.completed ? ' (past due)' : ''}` : '';
              const noteBit = note ? ` — ${note}` : '';
              return `- [${status}] ${kindLabel(c.kind)} · ${horizon}${dueBit}: "${c.title}"${noteBit}${cons}`;
            })
            .join('\n');

    const promiseLines = memberIds
      .map((pid) => {
        const name = profiles[pid]?.name || pid;
        const p = partnerPromisesByProfileId[pid];
        if (!p?.text?.trim()) return `- ${name}: (no promise declared yet)`;
        return `- ${name}: "${p.text.trim()}" (declared ${p.declaredAt?.slice(0, 10) || 'unknown date'})`;
      })
      .join('\n');

    return `
You are a friendly, encouraging AI financial coach for a couple's joint savings app called "Money Mates".

CURRENT FINANCIAL STATUS:
- Total Combined Savings: ${formatCurrency(totalSavings)}
${contributionLines}

RECENT TRANSACTIONS:
${recentTx || 'No transactions yet'}

SAVINGS GOALS:
${goalsInfo || 'No goals set yet'}

OUR WORD (solemn promises — each partner’s one commitment on the Together tab; treat with weight, never mock):
${promiseLines}

TOGETHER (shared intentions — tasks, things to buy, life & relationship goals from the "Together" tab):
${togetherLines}

INSTRUCTIONS:
- Be supportive, warm, and encouraging
- Give practical financial advice tailored to their situation
- Celebrate their wins and progress
- Keep responses concise (2-4 sentences usually)
- Use emojis sparingly for friendliness
- If they ask about their data, reference the actual numbers above
- If they ask about savings goals, use SAVINGS GOALS
- If they ask about promises, vows, or "our word", use OUR WORD — honor the tone; never belittle commitments
- If they ask about "Together", intentions, shared to-dos, or relationship goals, use the TOGETHER section — cheer progress, gently nudge on overdue items without shame
- If partner balances look uneven, encourage communication and small steps — there is no separate "owed" ledger in this app
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
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Something went wrong.';
      await pushMessage(
        'assistant',
        `Sorry — I couldn’t reach the coach right now.\n\n${detail}`
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
    'How are we doing?',
    'Goal progress?',
    'Who saved more lately?',
    'Motivate us! 💪',
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
        <div className="fixed z-[60] flex flex-col text-[var(--text)] bg-[var(--surface)] shadow-2xl overflow-hidden animate-slide-in-from-right-4 max-md:inset-0 max-md:max-h-[100dvh] max-md:rounded-none safe-area-pt md:bottom-6 md:right-6 md:left-auto md:top-auto md:w-[380px] md:max-w-[min(380px,calc(100vw-2rem))] md:h-[min(600px,calc(100dvh-5rem))] md:rounded-3xl md:border md:border-[var(--border)] md:ring-1 md:ring-[color-mix(in_srgb,var(--border-glow)_40%,transparent)]">
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
                <div className="w-16 h-16 rounded-full bg-[color-mix(in_srgb,var(--accent-b)_22%,var(--surface-raised))] flex items-center justify-center mb-4 ring-1 ring-[var(--border)]">
                  <Bot size={32} className="text-[var(--accent-a)]" />
                </div>
                <h4 className="font-bold text-[var(--text)] mb-2">Hi there! 👋</h4>
                <p className="text-[var(--text-dim)] text-sm mb-6 max-w-[280px]">
                  I'm your AI financial coach. Ask me anything about your savings, goals, or get personalized tips!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-2 rounded-full text-sm font-medium transition-colors bg-[var(--surface-raised)] text-[var(--accent-a)] border border-[var(--border)] hover:border-[var(--border-glow)] hover:bg-[color-mix(in_srgb,var(--accent-a)_12%,var(--surface-raised))]"
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
                        : 'bg-[color-mix(in_srgb,var(--accent-b)_20%,var(--surface-raised))] text-[var(--accent-a)] ring-1 ring-[var(--border)]'
                    }`}
                  >
                    {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? `${currentTheme.bgClass} text-white rounded-br-md`
                        : 'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap text-inherit">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--accent-b)_20%,var(--surface-raised))] flex items-center justify-center shrink-0 ring-1 ring-[var(--border)]">
                  <Bot size={16} className="text-[var(--accent-a)]" />
                </div>
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-bl-md">
                  <Loader2 size={18} className="animate-spin text-[var(--accent-a)]" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-[var(--border)] shrink-0 safe-area-pb bg-[color-mix(in_srgb,var(--surface-raised)_55%,var(--surface))]">
            <div className="flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                enterKeyHint="send"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 min-h-12 rounded-xl px-4 py-3 text-base sm:text-sm outline-none transition-all bg-[var(--surface-raised)] text-[var(--text)] placeholder:text-[var(--text-dim)] border border-[var(--border)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-a)_45%,transparent)] focus:border-[var(--border-glow)]"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`min-h-12 min-w-12 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-black/25 hover:opacity-95'
                    : 'bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)] opacity-70'
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

