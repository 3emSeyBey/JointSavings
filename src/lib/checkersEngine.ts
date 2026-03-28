import type { CheckersBoardPayload } from '@/lib/boardGameState';

const PEA_MAN = 1;
const CAM_MAN = 2;
const PEA_KING = 3;
const CAM_KING = 4;

export type CheckersMove = {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  captureR?: number;
  captureC?: number;
};

function isPea(v: number): boolean {
  return v === PEA_MAN || v === PEA_KING;
}
function isCam(v: number): boolean {
  return v === CAM_MAN || v === CAM_KING;
}
function isKing(v: number): boolean {
  return v === PEA_KING || v === CAM_KING;
}

function inPlayable(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8 && (r + c) % 2 === 1;
}

export function createInitialCheckersState(): CheckersBoardPayload {
  const grid = Array.from({ length: 8 }, () => Array(8).fill(0));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) grid[r][c] = CAM_MAN;
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) grid[r][c] = PEA_MAN;
    }
  }
  return { t: 'checkers', grid, turn: 'pea' };
}

function stepDirsForPiece(v: number, turn: 'pea' | 'cam'): [number, number][] {
  if (isKing(v)) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }
  if (turn === 'pea') return [
    [-1, -1],
    [-1, 1],
  ];
  return [
    [1, -1],
    [1, 1],
  ];
}

export function getLegalCheckersMoves(grid: number[][], turn: 'pea' | 'cam'): CheckersMove[] {
  const jumps: CheckersMove[] = [];
  const slides: CheckersMove[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!inPlayable(r, c)) continue;
      const v = grid[r][c];
      if (v === 0) continue;
      if (turn === 'pea' && !isPea(v)) continue;
      if (turn === 'cam' && !isCam(v)) continue;

      const dirs = stepDirsForPiece(v, turn);
      for (const [dr, dc] of dirs) {
        const r1 = r + dr;
        const c1 = c + dc;
        if (!inPlayable(r1, c1)) continue;
        const mid = grid[r1][c1];
        const r2 = r + 2 * dr;
        const c2 = c + 2 * dc;
        if (inPlayable(r2, c2) && grid[r2][c2] === 0) {
          const enemy =
            turn === 'pea'
              ? isCam(mid)
              : isPea(mid);
          if (enemy) {
            jumps.push({ fromR: r, fromC: c, toR: r2, toC: c2, captureR: r1, captureC: c1 });
          }
        }
      }
      for (const [dr, dc] of dirs) {
        const r1 = r + dr;
        const c1 = c + dc;
        if (!inPlayable(r1, c1) || grid[r1][c1] !== 0) continue;
        slides.push({ fromR: r, fromC: c, toR: r1, toC: c1 });
      }
    }
  }

  return jumps.length > 0 ? jumps : slides;
}

function promoteIfNeeded(v: number, toR: number): number {
  if (v === PEA_MAN && toR === 0) return PEA_KING;
  if (v === CAM_MAN && toR === 7) return CAM_KING;
  return v;
}

export function applyCheckersMove(grid: number[][], move: CheckersMove): number[][] {
  const next = grid.map((row) => [...row]);
  const v = next[move.fromR][move.fromC];
  next[move.fromR][move.fromC] = 0;
  if (move.captureR != null && move.captureC != null) {
    next[move.captureR][move.captureC] = 0;
  }
  next[move.toR][move.toC] = promoteIfNeeded(v, move.toR);
  return next;
}

export function pickRandomCheckersMove(moves: CheckersMove[]): CheckersMove | null {
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)]!;
}

export function checkersPieceCounts(grid: number[][]): { pea: number; cam: number } {
  let pea = 0;
  let cam = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const v = grid[r][c];
      if (v === PEA_MAN || v === PEA_KING) pea++;
      if (v === CAM_MAN || v === CAM_KING) cam++;
    }
  }
  return { pea, cam };
}

/** `playerToMove` is whose turn it is; if they have no legal moves (and pieces remain), they lose. */
export function checkersOutcome(
  grid: number[][],
  playerToMove: 'pea' | 'cam'
): { winner: 'pea' | 'cam' | null } {
  const { pea, cam } = checkersPieceCounts(grid);
  if (pea === 0) return { winner: 'cam' };
  if (cam === 0) return { winner: 'pea' };
  if (getLegalCheckersMoves(grid, playerToMove).length === 0) {
    return { winner: playerToMove === 'pea' ? 'cam' : 'pea' };
  }
  return { winner: null };
}
