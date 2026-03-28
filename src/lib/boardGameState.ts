import { DEFAULT_POSITION } from 'chess.js';
import { createInitialCheckersState } from '@/lib/checkersEngine';

export type BoardGameKind = 'chess' | 'checkers' | 'connect4' | 'ttt';

export type ChessBoardPayload = { t: 'chess'; fen: string };
export type CheckersBoardPayload = { t: 'checkers'; grid: number[][]; turn: 'pea' | 'cam' };
export type Connect4BoardPayload = {
  t: 'connect4';
  board: number[][];
  next: 'pea' | 'cam';
};
export type TttBoardPayload = { t: 'ttt'; cells: (null | 'pea' | 'cam')[]; next: 'pea' | 'cam' };

export type AnyBoardPayload = ChessBoardPayload | CheckersBoardPayload | Connect4BoardPayload | TttBoardPayload;

export function initialBoardStateJson(game: BoardGameKind): string {
  switch (game) {
    case 'chess':
      return JSON.stringify({ t: 'chess', fen: DEFAULT_POSITION } satisfies ChessBoardPayload);
    case 'checkers':
      return JSON.stringify(createInitialCheckersState());
    case 'connect4':
      return JSON.stringify({
        t: 'connect4',
        board: Array.from({ length: 6 }, () => Array(7).fill(0)),
        next: 'pea',
      } satisfies Connect4BoardPayload);
    case 'ttt':
      return JSON.stringify({
        t: 'ttt',
        cells: Array(9).fill(null) as (null | 'pea' | 'cam')[],
        next: 'pea',
      } satisfies TttBoardPayload);
    default:
      return '';
  }
}

export function parseBoardPayload(raw: string | undefined | null): AnyBoardPayload | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const o = JSON.parse(raw) as AnyBoardPayload;
    if (!o || typeof o !== 'object' || !('t' in o)) return null;
    return o;
  } catch {
    return null;
  }
}

export function chessPayloadOrDefault(raw: string | undefined | null): ChessBoardPayload {
  const p = parseBoardPayload(raw);
  if (p?.t === 'chess' && typeof p.fen === 'string') return p;
  return { t: 'chess', fen: DEFAULT_POSITION };
}
