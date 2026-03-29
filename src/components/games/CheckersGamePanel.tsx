import { useMemo, useState } from 'react';
import { parseBoardPayload, initialBoardStateJson } from '@/lib/boardGameState';
import type { CheckersBoardPayload } from '@/lib/boardGameState';
import {
  applyCheckersMove,
  checkersOutcome,
  createInitialCheckersState,
  getLegalCheckersMoves,
  pickRandomCheckersMove,
} from '@/lib/checkersEngine';
import type { BoardGamePanelProps } from '@/components/games/boardGameTypes';

function parseCheckers(raw: string | undefined | null): CheckersBoardPayload {
  const p = parseBoardPayload(raw);
  if (p?.t === 'checkers' && Array.isArray(p.grid) && p.grid.length === 8) return p;
  return createInitialCheckersState();
}

function pieceLabel(v: number): string {
  switch (v) {
    case 1:
      return '●';
    case 2:
      return '○';
    case 3:
      return '♔';
    case 4:
      return '♚';
    default:
      return '';
  }
}

export function CheckersGamePanel({
  session,
  currentProfileId,
  currentTheme,
  onUpdate,
}: BoardGamePanelProps) {
  const solo = session.solo === true;
  const payload = parseCheckers(session.boardStateJson);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  const mySide: 'pea' | 'cam' = currentProfileId === 'pea' ? 'pea' : 'cam';
  const outcome = useMemo(
    () => checkersOutcome(payload.grid, payload.turn),
    [payload.grid, payload.turn]
  );

  /** Solo: you always play the Pea (red) side; House is Cam. */
  const canInteract =
    outcome.winner === null && (solo ? payload.turn === 'pea' : payload.turn === mySide);

  const legalFromSelected = useMemo(() => {
    if (!selected) return [];
    return getLegalCheckersMoves(payload.grid, payload.turn).filter(
      (m) => m.fromR === selected.r && m.fromC === selected.c
    );
  }, [payload.grid, payload.turn, selected]);

  const persist = async (next: CheckersBoardPayload) => {
    await onUpdate({ boardStateJson: JSON.stringify(next) });
  };

  const runAfterUserMove = async (grid: number[][], nextTurn: 'pea' | 'cam') => {
    let g = grid;
    let t = nextTurn;
    let win = checkersOutcome(g, t).winner;
    if (win) {
      await persist({ t: 'checkers', grid: g, turn: t });
      return;
    }
    if (solo && t === 'cam') {
      const aiPick = pickRandomCheckersMove(getLegalCheckersMoves(g, 'cam'));
      if (aiPick) {
        g = applyCheckersMove(g, aiPick);
        t = 'pea';
      }
    }
    await persist({ t: 'checkers', grid: g, turn: t });
  };

  const onCellClick = async (r: number, c: number) => {
    if (!canInteract || (r + c) % 2 === 0) return;
    const v = payload.grid[r][c];

    if (selected) {
      const move = legalFromSelected.find((m) => m.toR === r && m.toC === c);
      if (move) {
        const nextGrid = applyCheckersMove(payload.grid, move);
        const nextTurn = payload.turn === 'pea' ? 'cam' : 'pea';
        setSelected(null);
        await runAfterUserMove(nextGrid, nextTurn);
      } else {
        setSelected(null);
      }
      return;
    }

    if (v === 0) return;
    if (payload.turn === 'pea' && (v === 1 || v === 3)) setSelected({ r, c });
    if (payload.turn === 'cam' && (v === 2 || v === 4)) setSelected({ r, c });
  };

  const reset = () => {
    setSelected(null);
    void persist(JSON.parse(initialBoardStateJson('checkers')) as CheckersBoardPayload);
  };

  const winnerLabel =
    outcome.winner === 'pea'
      ? 'Pea wins'
      : outcome.winner === 'cam'
        ? 'Cam wins'
        : null;

  return (
    <div className="game-modal-light space-y-4">
      {winnerLabel && (
        <p className="text-center text-lg font-bold text-emerald-600">{winnerLabel} 🎉</p>
      )}
      <p className="text-center text-sm text-slate-600">
        {outcome.winner === null
          ? solo
            ? payload.turn === 'pea'
              ? 'Your turn (red)'
              : 'House is thinking…'
            : payload.turn === mySide
              ? `Your turn (${mySide === 'pea' ? 'red' : 'white'})`
              : 'Waiting for partner…'
          : 'Game over'}
      </p>

      <div className="inline-block mx-auto border-2 border-amber-900/40 rounded-lg overflow-hidden shadow-inner">
        <div className="grid grid-cols-8 gap-0 bg-amber-100">
          {payload.grid.map((row, r) =>
            row.map((cell, c) => {
              const dark = (r + c) % 2 === 1;
              const isSel = selected?.r === r && selected?.c === c;
              const highlight = legalFromSelected.some((m) => m.toR === r && m.toC === c);
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  disabled={!dark || !canInteract}
                  onClick={() => void onCellClick(r, c)}
                  className={`h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center text-lg leading-none transition-colors ${
                    dark ? 'bg-amber-800/90' : 'bg-amber-200/50 pointer-events-none'
                  } ${isSel ? 'ring-2 ring-cyan-300 ring-inset' : ''} ${
                    highlight ? 'ring-2 ring-lime-300 ring-inset' : ''
                  } ${canInteract && dark ? 'hover:brightness-110 active:brightness-95' : ''}`}
                >
                  <span
                    className={
                      cell === 1 || cell === 3
                        ? 'text-rose-300 drop-shadow'
                        : cell === 2 || cell === 4
                          ? 'text-slate-100 drop-shadow'
                          : ''
                    }
                  >
                    {pieceLabel(cell)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <p className="text-xs text-center text-slate-500">
        Dark squares only · jumps capture · simplified house rules (not tournament strict)
      </p>

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
