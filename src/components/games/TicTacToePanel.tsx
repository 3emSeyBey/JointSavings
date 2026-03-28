import { useMemo } from 'react';
import { parseBoardPayload, initialBoardStateJson } from '@/lib/boardGameState';
import type { TttBoardPayload } from '@/lib/boardGameState';
import type { BoardGamePanelProps } from '@/components/games/boardGameTypes';

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function parseTtt(raw: string | undefined | null): TttBoardPayload {
  const p = parseBoardPayload(raw);
  if (p?.t === 'ttt' && Array.isArray(p.cells) && p.cells.length === 9) return p;
  return JSON.parse(initialBoardStateJson('ttt')) as TttBoardPayload;
}

function tttWinner(cells: (null | 'pea' | 'cam')[]): 'pea' | 'cam' | null {
  for (const [a, b, c] of LINES) {
    const x = cells[a];
    if (x && x === cells[b] && x === cells[c]) return x;
  }
  return null;
}

export function TicTacToePanel({
  session,
  currentProfileId,
  currentTheme,
  onUpdate,
}: BoardGamePanelProps) {
  const solo = session.solo === true;
  const payload = parseTtt(session.boardStateJson);
  const mySide: 'pea' | 'cam' = currentProfileId === 'pea' ? 'pea' : 'cam';

  const winner = useMemo(() => tttWinner(payload.cells), [payload.cells]);
  const full = useMemo(() => payload.cells.every(Boolean), [payload.cells]);

  const canPlay =
    winner === null &&
    !full &&
    (solo ? payload.next === 'pea' : payload.next === mySide);

  const persist = (next: TttBoardPayload) => onUpdate({ boardStateJson: JSON.stringify(next) });

  const play = async (idx: number) => {
    if (!canPlay || payload.cells[idx]) return;
    const cells = [...payload.cells] as (null | 'pea' | 'cam')[];
    cells[idx] = payload.next;
    let next: 'pea' | 'cam' = payload.next === 'pea' ? 'cam' : 'pea';

    let win = tttWinner(cells);
    if (win || cells.every(Boolean)) {
      await persist({ t: 'ttt', cells, next });
      return;
    }

    if (solo && next === 'cam') {
      const options = cells
        .map((v, i) => (v === null ? i : -1))
        .filter((i) => i >= 0);
      if (options.length > 0) {
        const pick = options[Math.floor(Math.random() * options.length)]!;
        cells[pick] = 'cam';
        next = 'pea';
      }
    }

    await persist({ t: 'ttt', cells, next });
  };

  const reset = () => {
    void persist(JSON.parse(initialBoardStateJson('ttt')) as TttBoardPayload);
  };

  const label = (v: null | 'pea' | 'cam') =>
    v === 'pea' ? '✕' : v === 'cam' ? '○' : '';

  return (
    <div className="space-y-4">
      {winner && (
        <p className="text-center text-lg font-bold text-emerald-600">
          {winner === 'pea' ? 'Pea' : 'Cam'} wins! 🎉
        </p>
      )}
      {full && !winner && <p className="text-center font-bold text-slate-500">Draw</p>}
      <p className="text-center text-sm text-slate-600">
        {winner || full
          ? 'Game over'
          : solo
            ? payload.next === 'pea'
              ? 'You are ✕ · House is ○'
              : 'House is playing…'
            : payload.next === mySide
              ? `Your turn (${mySide === 'pea' ? '✕' : '○'})`
              : 'Partner’s turn'}
      </p>

      <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
        {payload.cells.map((cell, i) => (
          <button
            key={i}
            type="button"
            disabled={!canPlay || cell !== null}
            onClick={() => void play(i)}
            className={`h-16 rounded-xl border-2 border-slate-200 text-3xl font-black flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40 ${
              cell === 'pea' ? 'text-rose-500' : cell === 'cam' ? 'text-slate-700' : 'bg-slate-50'
            }`}
          >
            {label(cell)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={reset}
        className={`w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg active:scale-[0.99] transition-transform ${currentTheme.bgClass}`}
      >
        New game
      </button>
    </div>
  );
}
