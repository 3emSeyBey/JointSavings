import { useMemo } from 'react';
import { parseBoardPayload, initialBoardStateJson } from '@/lib/boardGameState';
import type { Connect4BoardPayload } from '@/lib/boardGameState';
import type { BoardGamePanelProps } from '@/components/games/boardGameTypes';

function parseConnect4(raw: string | undefined | null): Connect4BoardPayload {
  const p = parseBoardPayload(raw);
  if (p?.t === 'connect4' && Array.isArray(p.board) && p.board.length === 6) return p;
  return JSON.parse(initialBoardStateJson('connect4')) as Connect4BoardPayload;
}

function connect4Winner(board: number[][]): 'pea' | 'cam' | null {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const v = board[r][c];
      if (!v) continue;
      for (const [dr, dc] of dirs) {
        let n = 1;
        for (let k = 1; k < 4; k++) {
          const r2 = r + dr * k;
          const c2 = c + dc * k;
          if (r2 < 0 || r2 >= 6 || c2 < 0 || c2 >= 7 || board[r2][c2] !== v) break;
          n++;
        }
        if (n >= 4) return v === 1 ? 'pea' : 'cam';
      }
    }
  }
  return null;
}

function columnLandingRow(board: number[][], col: number): number | null {
  for (let r = 5; r >= 0; r--) {
    if (board[r][col] === 0) return r;
  }
  return null;
}

function boardFull(board: number[][]): boolean {
  return board[0].every((c) => c !== 0);
}

export function ConnectFourPanel({
  session,
  currentProfileId,
  currentTheme,
  onUpdate,
}: BoardGamePanelProps) {
  const solo = session.solo === true;
  const payload = parseConnect4(session.boardStateJson);
  const mySide: 'pea' | 'cam' = currentProfileId === 'pea' ? 'pea' : 'cam';

  const winner = useMemo(() => connect4Winner(payload.board), [payload.board]);
  const full = useMemo(() => boardFull(payload.board), [payload.board]);

  const canPlay =
    winner === null &&
    !full &&
    (solo ? payload.next === 'pea' : payload.next === mySide);

  const persist = (next: Connect4BoardPayload) =>
    onUpdate({ boardStateJson: JSON.stringify(next) });

  const drop = async (col: number) => {
    if (!canPlay) return;
    const row = columnLandingRow(payload.board, col);
    if (row === null) return;

    const nextBoard = payload.board.map((r) => [...r]);
    const piece = payload.next === 'pea' ? 1 : 2;
    nextBoard[row][col] = piece;
    let nextTurn: 'pea' | 'cam' = payload.next === 'pea' ? 'cam' : 'pea';

    let win = connect4Winner(nextBoard);
    if (win || boardFull(nextBoard)) {
      await persist({ t: 'connect4', board: nextBoard, next: nextTurn });
      return;
    }

    if (solo && nextTurn === 'cam') {
      const cols = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
      for (const c of cols) {
        const rr = columnLandingRow(nextBoard, c);
        if (rr === null) continue;
        nextBoard[rr][c] = 2;
        nextTurn = 'pea';
        win = connect4Winner(nextBoard);
        break;
      }
    }

    await persist({ t: 'connect4', board: nextBoard, next: nextTurn });
  };

  const reset = () => {
    void persist(JSON.parse(initialBoardStateJson('connect4')) as Connect4BoardPayload);
  };

  return (
    <div className="space-y-4">
      {winner && (
        <p className="text-center text-lg font-bold text-emerald-600">
          {winner === 'pea' ? 'Pea' : 'Cam'} connects four! 🎉
        </p>
      )}
      {full && !winner && <p className="text-center font-bold text-slate-500">Draw</p>}
      <p className="text-center text-sm text-slate-600">
        {winner || full
          ? 'Game over'
          : solo
            ? payload.next === 'pea'
              ? 'Your turn — tap a column'
              : 'House is dropping…'
            : payload.next === mySide
              ? 'Your turn'
              : 'Partner’s turn'}
      </p>

      <div className="flex justify-center gap-1 sm:gap-1.5">
        {Array.from({ length: 7 }, (_, col) => (
          <button
            key={col}
            type="button"
            disabled={!canPlay || columnLandingRow(payload.board, col) === null}
            onClick={() => void drop(col)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-slate-300 text-xs font-bold transition-transform active:scale-95 disabled:opacity-30 ${
              canPlay && columnLandingRow(payload.board, col) !== null
                ? 'bg-slate-200 hover:bg-slate-300'
                : 'bg-slate-100'
            }`}
          >
            ↓
          </button>
        ))}
      </div>

      <div className="inline-block mx-auto rounded-xl overflow-hidden border-4 border-blue-900 bg-blue-800 p-1 shadow-lg">
        <div className="flex flex-col gap-0.5">
          {payload.board.map((row, r) => (
            <div key={r} className="flex gap-0.5">
              {row.map((cell, c) => (
                <div
                  key={c}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/40 flex items-center justify-center"
                >
                  {cell === 1 && <span className="w-6 h-6 rounded-full bg-rose-500 shadow-inner" />}
                  {cell === 2 && <span className="w-6 h-6 rounded-full bg-amber-200 shadow-inner" />}
                </div>
              ))}
            </div>
          ))}
        </div>
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
