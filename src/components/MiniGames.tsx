import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Swords, Dices, Hash, X, Plus, RotateCcw, Sparkles, Send } from 'lucide-react';
import { callGemini } from '@/lib/utils';
import { GEMINI_API_KEY } from '@/config/firebase';
import type { Theme, Profile } from '@/types';
import type { GameSession } from '@/hooks/useGameSession';

type RPSChoice = 'rock' | 'paper' | 'scissors';

const GAMES = [
  { id: 'rps' as const, title: 'Rock Paper Scissors', description: 'Settle it together!', icon: Swords, emoji: '✊' },
  { id: 'roulette' as const, title: 'Random Roulette', description: 'Spin to decide anything', icon: Dices, emoji: '🎰' },
  { id: 'rng' as const, title: 'Number Generator', description: 'Pick a random number', icon: Hash, emoji: '🔢' },
  { id: 'decide' as const, title: 'Decide For Me', description: 'AI helps you decide', icon: Sparkles, emoji: '🤔' },
];

const RPS_CHOICES: { id: RPSChoice; emoji: string; label: string }[] = [
  { id: 'rock', emoji: '🪨', label: 'Rock' },
  { id: 'paper', emoji: '📄', label: 'Paper' },
  { id: 'scissors', emoji: '✂️', label: 'Scissors' },
];

function getWinner(a: RPSChoice, b: RPSChoice): 'a' | 'b' | 'draw' {
  if (a === b) return 'draw';
  if ((a === 'rock' && b === 'scissors') || (a === 'paper' && b === 'rock') || (a === 'scissors' && b === 'paper')) return 'a';
  return 'b';
}

interface SubGameProps {
  session: GameSession;
  currentProfileId: string;
  profiles: Record<string, Profile>;
  currentTheme: Theme;
  onUpdate: (updates: Record<string, unknown>) => Promise<void>;
}

// ─── Rock Paper Scissors ────────────────────────────────────────────────────────

function RPSGame({ session, currentProfileId, profiles, currentTheme, onUpdate }: SubGameProps) {
  const [animating, setAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const prevBothPicked = useRef(false);

  const myField = currentProfileId === 'pea' ? 'peaChoice' : 'camChoice';
  const myChoice = (currentProfileId === 'pea' ? session.peaChoice : session.camChoice) as RPSChoice | null;
  const partnerChoice = (currentProfileId === 'pea' ? session.camChoice : session.peaChoice) as RPSChoice | null;
  const partnerId = currentProfileId === 'pea' ? 'cam' : 'pea';
  const partnerName = profiles[partnerId]?.name || partnerId;
  const bothPicked = myChoice !== null && partnerChoice !== null;

  useEffect(() => {
    if (bothPicked && !prevBothPicked.current) {
      setAnimating(true);
      setTimeout(() => { setShowResult(true); setAnimating(false); }, 1000);
    }
    if (!bothPicked) setShowResult(false);
    prevBothPicked.current = bothPicked;
  }, [bothPicked]);

  const handlePick = async (choice: RPSChoice) => {
    if (myChoice || animating) return;
    await onUpdate({ [myField]: choice });
  };

  const handlePlayAgain = async () => {
    const winner = getWinner(session.peaChoice as RPSChoice, session.camChoice as RPSChoice);
    await onUpdate({
      peaChoice: null,
      camChoice: null,
      rpsRound: session.rpsRound + 1,
      rpsScorePea: session.rpsScorePea + (winner === 'a' ? 1 : 0),
      rpsScoreCam: session.rpsScoreCam + (winner === 'b' ? 1 : 0),
    });
  };

  const handleResetScore = async () => {
    await onUpdate({ peaChoice: null, camChoice: null, rpsRound: 1, rpsScorePea: 0, rpsScoreCam: 0 });
  };

  const result = bothPicked ? getWinner(session.peaChoice as RPSChoice, session.camChoice as RPSChoice) : null;

  return (
    <div className="space-y-6">
      {/* Scoreboard */}
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <div className="text-2xl mb-1">{profiles.pea?.emoji || '🌸'}</div>
          <div className="text-sm font-bold text-slate-600">{profiles.pea?.name || 'Pea'}</div>
          <div className="text-3xl font-bold text-slate-800">{session.rpsScorePea}</div>
        </div>
        <div className="text-slate-300 text-2xl font-bold">vs</div>
        <div className="text-center">
          <div className="text-2xl mb-1">{profiles.cam?.emoji || '📸'}</div>
          <div className="text-sm font-bold text-slate-600">{profiles.cam?.name || 'Cam'}</div>
          <div className="text-3xl font-bold text-slate-800">{session.rpsScoreCam}</div>
        </div>
      </div>

      {/* Game Area */}
      {animating ? (
        <div className="py-8 text-center">
          <div className="text-5xl animate-bounce">🤜🤛</div>
          <p className="text-slate-400 mt-4 font-medium">Revealing...</p>
        </div>
      ) : showResult && bothPicked ? (
        <div className="text-center space-y-4 animate-slide-in-from-bottom-4">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-sm font-bold text-slate-400 mb-2">{profiles.pea?.emoji} {profiles.pea?.name}</div>
              <div className="text-5xl">{RPS_CHOICES.find(c => c.id === session.peaChoice)?.emoji}</div>
            </div>
            <div className="text-2xl font-bold text-slate-300">vs</div>
            <div className="text-center">
              <div className="text-sm font-bold text-slate-400 mb-2">{profiles.cam?.emoji} {profiles.cam?.name}</div>
              <div className="text-5xl">{RPS_CHOICES.find(c => c.id === session.camChoice)?.emoji}</div>
            </div>
          </div>
          <div className={`text-xl font-bold py-3 px-6 rounded-2xl inline-block ${
            result === 'draw' ? 'bg-slate-100 text-slate-600'
            : result === 'a' ? 'bg-pink-100 text-pink-600'
            : 'bg-green-100 text-green-600'
          }`}>
            {result === 'draw' ? "It's a draw! 🤝"
              : result === 'a' ? `${profiles.pea?.emoji} ${profiles.pea?.name} wins!`
              : `${profiles.cam?.emoji} ${profiles.cam?.name} wins!`}
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={handlePlayAgain} className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-transform ${currentTheme.bgClass}`}>
              Play Again
            </button>
            <button onClick={handleResetScore} className="px-4 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          {!myChoice ? (
            <>
              <div className={`inline-block px-4 py-2 rounded-xl text-sm font-bold text-white ${currentTheme.bgClass}`}>
                Pick your move!
              </div>
              {partnerChoice && <p className="text-xs text-slate-400">{partnerName} is ready! 👀</p>}
              <div className="flex justify-center gap-4 pt-2">
                {RPS_CHOICES.map(c => (
                  <button key={c.id} onClick={() => handlePick(c.id)}
                    className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all">
                    <span className="text-4xl">{c.emoji}</span>
                    <span className="text-xs font-bold text-slate-500">{c.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="py-6">
              <div className="text-5xl mb-3">{RPS_CHOICES.find(c => c.id === myChoice)?.emoji}</div>
              <p className="text-slate-600 font-bold">You picked {RPS_CHOICES.find(c => c.id === myChoice)?.label}!</p>
              <p className="text-slate-400 text-sm mt-2">Waiting for {partnerName}...</p>
              <div className="mt-3 flex justify-center"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Random Roulette ────────────────────────────────────────────────────────────

function RouletteGame({ session, currentTheme, onUpdate }: SubGameProps) {
  const [newItem, setNewItem] = useState('');
  const [animating, setAnimating] = useState(false);
  const [displayItem, setDisplayItem] = useState<string | null>(session.rouletteResult);
  const prevSpinTs = useRef(session.rouletteSpinTs);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (session.rouletteSpinTs && session.rouletteSpinTs !== prevSpinTs.current) {
      prevSpinTs.current = session.rouletteSpinTs;
      runAnimation(session.rouletteItems, session.rouletteResult!);
    }
  }, [session.rouletteSpinTs]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const runAnimation = (items: string[], finalResult: string) => {
    setAnimating(true);
    let count = 0;
    const totalTicks = 20 + Math.floor(Math.random() * 8);
    let delay = 50;
    const tick = () => {
      count++;
      if (count >= totalTicks) {
        setDisplayItem(finalResult);
        setAnimating(false);
        return;
      }
      setDisplayItem(items[Math.floor(Math.random() * items.length)]);
      delay = 50 + (count / totalTicks) * 250;
      timeoutRef.current = setTimeout(tick, delay);
    };
    tick();
  };

  const addItem = async () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    await onUpdate({ rouletteItems: [...session.rouletteItems, trimmed], rouletteResult: null });
    setNewItem('');
  };

  const removeItem = async (index: number) => {
    await onUpdate({ rouletteItems: session.rouletteItems.filter((_: string, i: number) => i !== index), rouletteResult: null });
  };

  const spin = async () => {
    if (session.rouletteItems.length < 2 || animating) return;
    const result = session.rouletteItems[Math.floor(Math.random() * session.rouletteItems.length)];
    await onUpdate({ rouletteResult: result, rouletteSpinTs: Date.now() });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Add Options</label>
        <div className="flex gap-2">
          <input type="text" placeholder="e.g., Pizza, Sushi, Burger..." value={newItem}
            onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()}
            className="flex-1 bg-slate-50 rounded-xl p-3 font-medium outline-none focus:ring-2 focus:ring-slate-200" />
          <button onClick={addItem} className={`px-4 rounded-xl text-white font-bold ${currentTheme.bgClass}`}>
            <Plus size={20} />
          </button>
        </div>
      </div>
      {session.rouletteItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {session.rouletteItems.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
              {item}
              <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="bg-slate-50 rounded-2xl p-8 text-center min-h-[120px] flex flex-col items-center justify-center">
        {animating || session.rouletteResult ? (
          <div className={`text-3xl font-bold transition-all ${animating ? 'animate-pulse text-slate-400' : currentTheme.textClass}`}>
            {displayItem}
          </div>
        ) : session.rouletteItems.length < 2 ? (
          <p className="text-slate-400 text-sm">Add at least 2 options to spin</p>
        ) : (
          <p className="text-slate-400 text-sm">Press spin to decide!</p>
        )}
        {session.rouletteResult && !animating && <div className="mt-2 text-sm font-bold text-slate-500">Winner! 🎉</div>}
      </div>
      <button onClick={spin} disabled={session.rouletteItems.length < 2 || animating}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed ${currentTheme.bgClass}`}>
        {animating ? '🎰 Spinning...' : '🎰 Spin!'}
      </button>
    </div>
  );
}

// ─── Random Number Generator ────────────────────────────────────────────────────

function RNGGame({ session, currentTheme, onUpdate }: SubGameProps) {
  const [localMin, setLocalMin] = useState(String(session.rngMin));
  const [localMax, setLocalMax] = useState(String(session.rngMax));
  const [animating, setAnimating] = useState(false);
  const [displayNum, setDisplayNum] = useState<number | null>(session.rngResult);
  const prevRollTs = useRef(session.rngRollTs);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocalMin(String(session.rngMin)); }, [session.rngMin]);
  useEffect(() => { setLocalMax(String(session.rngMax)); }, [session.rngMax]);

  useEffect(() => {
    if (session.rngRollTs && session.rngRollTs !== prevRollTs.current) {
      prevRollTs.current = session.rngRollTs;
      runAnimation(session.rngMin, session.rngMax, session.rngResult!);
    }
  }, [session.rngRollTs]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const runAnimation = (lo: number, hi: number, finalResult: number) => {
    setAnimating(true);
    let count = 0;
    const totalTicks = 15 + Math.floor(Math.random() * 8);
    let delay = 40;
    const tick = () => {
      count++;
      if (count >= totalTicks) { setDisplayNum(finalResult); setAnimating(false); return; }
      setDisplayNum(Math.floor(Math.random() * (hi - lo + 1)) + lo);
      delay = 40 + (count / totalTicks) * 200;
      timeoutRef.current = setTimeout(tick, delay);
    };
    tick();
  };

  const syncMin = async () => { const n = parseInt(localMin); if (!isNaN(n)) await onUpdate({ rngMin: n }); };
  const syncMax = async () => { const n = parseInt(localMax); if (!isNaN(n)) await onUpdate({ rngMax: n }); };

  const generate = async () => {
    const lo = session.rngMin;
    const hi = session.rngMax;
    if (lo >= hi || animating) return;
    const result = Math.floor(Math.random() * (hi - lo + 1)) + lo;
    await onUpdate({ rngResult: result, rngRollTs: Date.now() });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Min</label>
          <input type="number" value={localMin} onChange={e => setLocalMin(e.target.value)} onBlur={syncMin}
            className="w-full bg-slate-50 rounded-xl p-3 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-slate-200" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Max</label>
          <input type="number" value={localMax} onChange={e => setLocalMax(e.target.value)} onBlur={syncMax}
            className="w-full bg-slate-50 rounded-xl p-3 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-slate-200" />
        </div>
      </div>
      <div className="bg-slate-50 rounded-2xl p-10 text-center">
        <div className={`text-6xl font-bold tabular-nums transition-all ${
          animating ? 'animate-pulse text-slate-300' : session.rngResult !== null ? currentTheme.textClass : 'text-slate-200'
        }`}>
          {displayNum !== null ? displayNum : '?'}
        </div>
        {session.rngResult !== null && !animating && <div className="mt-3 text-sm font-bold text-slate-500">Your number! 🎲</div>}
      </div>
      <button onClick={generate} disabled={animating || session.rngMin >= session.rngMax}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed ${currentTheme.bgClass}`}>
        {animating ? '🎲 Rolling...' : '🎲 Generate!'}
      </button>
    </div>
  );
}

// ─── Decide For Me (AI) ─────────────────────────────────────────────────────────

async function callGeminiForDecide(
  type: 'random' | 'think_question' | 'think_conclude',
  question: string,
  options: string[],
  chat: Array<{ role: string; text: string }>
): Promise<string> {
  const optionsStr = options.join(', ');
  let systemPrompt: string;
  let prompt: string;

  if (type === 'random') {
    systemPrompt = 'You are a fun, spontaneous decision maker. Never over-explain. No bullet points. No caveats. No mentioning randomness or AI.';
    prompt = `"${question}"\nChoices: ${optionsStr}\n\nPick one. Give a fun, confident one-sentence answer that sounds like a friend making the call.`;
  } else {
    const chatStr = chat.map(m => `${m.role === 'ai' ? 'You' : 'User'}: ${m.text}`).join('\n');
    systemPrompt = 'You are a direct, no-nonsense decision helper. Never over-explain. No bullet points. No preambles like "Based on" or "Considering". No caveats or alternatives. Be a decisive friend who just tells it straight.';

    if (type === 'think_question') {
      prompt = `Dilemma: "${question}"\nChoices: ${optionsStr}\n${chatStr ? `\nSo far:\n${chatStr}\n` : ''}\nAsk ONE short question (max 8 words) to help narrow it down. Just the question, nothing else.`;
    } else {
      prompt = `Dilemma: "${question}"\nChoices: ${optionsStr}\n\nConversation:\n${chatStr}\n\nGive your final answer in ONE sentence. Pick one specific option from the choices. Be decisive, confident, and say something the user wants to hear.`;
    }
  }

  console.log('[DecideForMe] Calling Gemini', { type, hasApiKey: !!GEMINI_API_KEY, apiKeyPrefix: GEMINI_API_KEY?.slice(0, 8) + '...' });
  console.log('[DecideForMe] System prompt:', systemPrompt);
  console.log('[DecideForMe] User prompt:', prompt);

  try {
    const response = await callGemini(prompt, GEMINI_API_KEY, systemPrompt);
    console.log('[DecideForMe] Gemini response:', response);
    return response?.trim() || 'Go with your gut!';
  } catch (err) {
    console.error('[DecideForMe] Gemini call FAILED:', err);
    throw err;
  }
}

function DecideGame({ session, currentTheme, onUpdate }: SubGameProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [mode, setMode] = useState<'think' | 'random'>('think');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const chat = (session.decideChat || []) as Array<{ role: string; text: string }>;
  const isSetup = !session.decideQuestion;
  const isDone = !!session.decideResult;
  const aiCount = chat.filter(m => m.role === 'ai').length;
  const isWaitingForUser = !isDone && !session.decideLoading && chat.length > 0 && chat[chat.length - 1].role === 'ai' && session.decideMode === 'think';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);

  const addOption = () => {
    const t = newOption.trim();
    if (t && !options.includes(t)) { setOptions([...options, t]); setNewOption(''); }
  };

  const handleStart = async () => {
    if (!question.trim() || options.length < 2 || loading) return;
    console.log('[DecideForMe] handleStart fired', { question, options, mode });
    setLoading(true);
    const q = question.trim();
    const opts = [...options];
    const m = mode;

    console.log('[DecideForMe] Writing setup to Firestore...');
    await onUpdate({ decideQuestion: q, decideOptions: opts, decideMode: m, decideLoading: true });
    console.log('[DecideForMe] Firestore updated, calling AI...');

    try {
      const response = await callGeminiForDecide(m === 'random' ? 'random' : 'think_question', q, opts, []);
      console.log('[DecideForMe] AI responded, writing result to Firestore...');
      const updates: Record<string, unknown> = { decideChat: [{ role: 'ai', text: response }], decideLoading: false };
      if (m === 'random') updates.decideResult = response;
      await onUpdate(updates);
      console.log('[DecideForMe] Done!');
    } catch (err) {
      console.error('[DecideForMe] handleStart error:', err);
      await onUpdate({ decideLoading: false });
    }
    setLoading(false);
  };

  const handleAnswer = async () => {
    const answer = userInput.trim();
    if (!answer || loading) return;
    console.log('[DecideForMe] handleAnswer fired', { answer, aiCount });
    setUserInput('');
    setLoading(true);

    const newChat = [...chat, { role: 'user', text: answer }];
    await onUpdate({ decideChat: newChat, decideLoading: true });

    try {
      const type = aiCount >= 3 ? 'think_conclude' : 'think_question';
      console.log('[DecideForMe] Next AI call type:', type);
      const response = await callGeminiForDecide(type, session.decideQuestion, session.decideOptions, newChat);
      const finalChat = [...newChat, { role: 'ai', text: response }];
      const updates: Record<string, unknown> = { decideChat: finalChat, decideLoading: false };
      if (type === 'think_conclude') updates.decideResult = response;
      await onUpdate(updates);
      console.log('[DecideForMe] Answer round done!');
    } catch (err) {
      console.error('[DecideForMe] handleAnswer error:', err);
      await onUpdate({ decideLoading: false });
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setQuestion(''); setOptions([]); setNewOption(''); setMode('think'); setUserInput('');
    await onUpdate({ decideQuestion: '', decideOptions: [], decideMode: 'think', decideChat: [], decideResult: null, decideLoading: false });
  };

  // ── Setup phase ──
  if (isSetup) {
    return (
      <div className="space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">What do you need to decide?</label>
          <input type="text" placeholder="e.g., Where to eat tonight?" value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full bg-slate-50 rounded-xl p-3 font-medium outline-none focus:ring-2 focus:ring-slate-200" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Options</label>
          <div className="flex gap-2">
            <input type="text" placeholder="Add an option..." value={newOption}
              onChange={e => setNewOption(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOption()}
              className="flex-1 bg-slate-50 rounded-xl p-3 font-medium outline-none focus:ring-2 focus:ring-slate-200" />
            <button onClick={addOption} className={`px-4 rounded-xl text-white font-bold ${currentTheme.bgClass}`}>
              <Plus size={20} />
            </button>
          </div>
          {options.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
                  {opt}
                  <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Decision Mode</label>
          <div className="flex gap-2">
            <button onClick={() => setMode('think')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'think' ? `${currentTheme.bgClass} text-white shadow-lg` : 'bg-slate-100 text-slate-500'}`}>
              🧠 Think Through
            </button>
            <button onClick={() => setMode('random')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'random' ? `${currentTheme.bgClass} text-white shadow-lg` : 'bg-slate-100 text-slate-500'}`}>
              🎲 Pick Randomly
            </button>
          </div>
        </div>
        <button onClick={handleStart} disabled={!question.trim() || options.length < 2 || loading}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed ${currentTheme.bgClass}`}>
          {loading ? '✨ Thinking...' : '✨ Decide!'}
        </button>
      </div>
    );
  }

  // ── Conversation / Result phase ──
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-3">
        <p className="text-sm font-bold text-slate-700">&ldquo;{session.decideQuestion}&rdquo;</p>
        <p className="text-xs text-slate-400 mt-1">{(session.decideOptions || []).join(' · ')}</p>
        {session.decideMode === 'think' && !isDone && (
          <p className="text-xs text-slate-300 mt-1">Question {Math.min(aiCount, 3)} of 3</p>
        )}
      </div>

      <div className="space-y-3 max-h-[280px] overflow-y-auto">
        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.role === 'ai'
                ? 'bg-slate-100 text-slate-800 rounded-bl-md'
                : `${currentTheme.bgClass} text-white rounded-br-md`
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {session.decideLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {isDone && (
        <div className="text-center space-y-4 pt-2 animate-slide-in-from-bottom-4">
          <div className={`inline-block px-5 py-3 rounded-2xl font-bold ${currentTheme.lightBg} ${currentTheme.textClass}`}>
            🎯 {session.decideResult}
          </div>
          <div>
            <button onClick={handleReset} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              Ask something else
            </button>
          </div>
        </div>
      )}

      {isWaitingForUser && !isDone && (
        <div className="flex gap-2">
          <input type="text" placeholder="Your answer..." value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnswer()}
            className="flex-1 bg-slate-50 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200"
            autoFocus />
          <button onClick={handleAnswer} disabled={!userInput.trim() || loading}
            className={`px-4 rounded-xl text-white font-bold disabled:opacity-40 ${currentTheme.bgClass}`}>
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main MiniGames Component ───────────────────────────────────────────────────

interface MiniGamesProps {
  currentTheme: Theme;
  currentProfileId: string;
  profiles: Record<string, Profile>;
  session: GameSession | null;
  onCreateSession: (gameType: 'rps' | 'roulette' | 'rng' | 'decide') => Promise<void>;
  onUpdateSession: (updates: Record<string, unknown>) => Promise<void>;
  onEndSession: () => Promise<void>;
}

export function MiniGames({ currentTheme, currentProfileId, profiles, session, onCreateSession, onUpdateSession, onEndSession }: MiniGamesProps) {
  const partnerId = currentProfileId === 'pea' ? 'cam' : 'pea';
  const partnerName = profiles[partnerId]?.name || partnerId;

  const showModal = session && (
    session.status === 'active' ||
    (session.status === 'pending' && session.initiator === currentProfileId)
  );

  const activeGameMeta = session ? GAMES.find(g => g.id === session.gameType) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Gamepad2 size={24} /> Mini Games
        </h2>
        <p className="text-slate-500 text-sm">Challenge your partner across devices!</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map(game => {
          const Icon = game.icon;
          const hasSession = !!session;
          return (
            <button key={game.id} onClick={() => !hasSession && onCreateSession(game.id)} disabled={hasSession}
              className={`bg-white rounded-2xl border border-slate-100 p-6 text-left shadow-sm transition-all group ${
                hasSession ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
              }`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4 ${currentTheme.lightBg}`}>
                {game.emoji}
              </div>
              <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                {game.title}
                <Icon size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </h3>
              <p className="text-slate-400 text-sm">{game.description}</p>
            </button>
          );
        })}
      </div>

      {hasSession(session) && !showModal && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-amber-700 text-sm font-medium">
            {partnerName} started a game — check your notification!
          </p>
        </div>
      )}

      {/* Game Modal */}
      {showModal && session && activeGameMeta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
            <div className={`p-6 text-white ${currentTheme.bgClass} shrink-0`}>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  {activeGameMeta.emoji} {activeGameMeta.title}
                </h3>
                <button onClick={onEndSession} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {session.status === 'pending' ? (
                <div className="text-center space-y-4 py-4">
                  <div className="text-5xl">⏳</div>
                  <h3 className="text-lg font-bold text-slate-800">Waiting for {partnerName} to join...</h3>
                  <p className="text-slate-400 text-sm">They&apos;ll get a notification to join</p>
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /></div>
                  <button onClick={onEndSession} className="px-6 py-2 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {session.gameType === 'rps' && (
                    <RPSGame session={session} currentProfileId={currentProfileId} profiles={profiles} currentTheme={currentTheme} onUpdate={onUpdateSession} />
                  )}
                  {session.gameType === 'roulette' && (
                    <RouletteGame session={session} currentProfileId={currentProfileId} profiles={profiles} currentTheme={currentTheme} onUpdate={onUpdateSession} />
                  )}
                  {session.gameType === 'rng' && (
                    <RNGGame session={session} currentProfileId={currentProfileId} profiles={profiles} currentTheme={currentTheme} onUpdate={onUpdateSession} />
                  )}
                  {session.gameType === 'decide' && (
                    <DecideGame session={session} currentProfileId={currentProfileId} profiles={profiles} currentTheme={currentTheme} onUpdate={onUpdateSession} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hasSession(session: GameSession | null): session is GameSession {
  return session !== null;
}
