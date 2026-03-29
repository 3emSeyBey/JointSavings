/** 8×8 line-clear puzzle — rules inspired by classic block-fill games (local logic only). */

export const LINE_PUZZLE_SIZE = 8;

export type LinePuzzleShape = {
  /** Occupied cells as [row, col] offsets from placement anchor (top-left of bounding box). */
  cells: [number, number][];
};

function normalizeCells(cells: [number, number][]): [number, number][] {
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  return cells
    .map(([r, c]) => [r - minR, c - minC] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** Normalized polyomino pool (no rotation — each entry is one fixed orientation). */
const SHAPE_CELLS: [number, number][][] = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 1], [1, 1], [2, 0], [2, 1]],
];

const CANONICAL_SHAPES: LinePuzzleShape[] = SHAPE_CELLS.map((cells) => ({
  cells: normalizeCells(cells),
}));

export function randomShape(): LinePuzzleShape {
  const src = CANONICAL_SHAPES[Math.floor(Math.random() * CANONICAL_SHAPES.length)]!;
  return { cells: src.cells.map(([r, c]) => [r, c] as [number, number]) };
}

export function emptyGrid(): number[][] {
  return Array.from({ length: LINE_PUZZLE_SIZE }, () =>
    Array.from({ length: LINE_PUZZLE_SIZE }, () => 0)
  );
}

export function canPlace(
  grid: number[][],
  shape: LinePuzzleShape,
  anchorRow: number,
  anchorCol: number
): boolean {
  const n = grid.length;
  for (const [dr, dc] of shape.cells) {
    const r = anchorRow + dr;
    const c = anchorCol + dc;
    if (r < 0 || r >= n || c < 0 || c >= n) return false;
    if (grid[r]![c] !== 0) return false;
  }
  return true;
}

/** Returns cleared grid and number of lines (rows + columns) removed in one pass. */
export function clearFullLines(grid: number[][]): { grid: number[][]; linesCleared: number } {
  const n = grid.length;
  const fullRows = new Set<number>();
  const fullCols = new Set<number>();
  for (let r = 0; r < n; r++) {
    if (grid[r]!.every((cell) => cell !== 0)) fullRows.add(r);
  }
  for (let c = 0; c < n; c++) {
    if (grid.every((row) => row[c] !== 0)) fullCols.add(c);
  }
  if (fullRows.size === 0 && fullCols.size === 0) {
    return { grid: grid.map((row) => [...row]), linesCleared: 0 };
  }
  const next = grid.map((row) => [...row]);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (fullRows.has(r) || fullCols.has(c)) next[r]![c] = 0;
    }
  }
  return { grid: next, linesCleared: fullRows.size + fullCols.size };
}

export function scoreForLines(linesCleared: number): number {
  if (linesCleared <= 0) return 0;
  return 10 * linesCleared * linesCleared;
}

/** Max Manhattan distance from the cell under the pointer to snap a valid anchor. */
export const SNAP_MAX_MANHATTAN = 4;
/** Keep the last good anchor while the pointer jitters within this distance (grid units). */
export const STICKY_PREV_MAX_MD = 2;

/**
 * Snap drag / hover to a valid placement: prefer exact cell, then sticky previous, then nearest valid.
 */
export function resolveSnapAnchor(
  grid: number[][],
  shape: LinePuzzleShape,
  raw: { row: number; col: number } | null,
  prev: { row: number; col: number } | null
): { row: number; col: number } | null {
  if (!raw) {
    return prev && canPlace(grid, shape, prev.row, prev.col) ? prev : null;
  }
  if (canPlace(grid, shape, raw.row, raw.col)) {
    return raw;
  }
  if (prev && canPlace(grid, shape, prev.row, prev.col)) {
    const md = Math.abs(raw.row - prev.row) + Math.abs(raw.col - prev.col);
    if (md <= STICKY_PREV_MAX_MD) {
      return prev;
    }
  }
  let bestR = -1;
  let bestC = -1;
  let bestD = 999;
  for (let r = 0; r < LINE_PUZZLE_SIZE; r++) {
    for (let c = 0; c < LINE_PUZZLE_SIZE; c++) {
      if (!canPlace(grid, shape, r, c)) continue;
      const d = Math.abs(r - raw.row) + Math.abs(c - raw.col);
      if (d > SNAP_MAX_MANHATTAN) continue;
      if (d < bestD) {
        bestD = d;
        bestR = r;
        bestC = c;
      }
    }
  }
  if (bestR >= 0) return { row: bestR, col: bestC };
  return null;
}

export function anyPlacementPossible(grid: number[][], queue: LinePuzzleShape[]): boolean {
  const n = grid.length;
  for (const shape of queue) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (canPlace(grid, shape, r, c)) return true;
      }
    }
  }
  return false;
}

export type LinePuzzleRuntimeState = {
  grid: number[][];
  queue: LinePuzzleShape[];
  score: number;
  gameOver: boolean;
};

export type PlacementOutcome = {
  state: LinePuzzleRuntimeState;
  linesCleared: number;
  /** Cells that had blocks removed this step (`"row,col"`). */
  clearedCellKeys: string[];
  /** Cells filled by this placement before line clear (`"row,col"`). */
  placedCellKeys: string[];
};

export function createInitialLinePuzzleState(): LinePuzzleRuntimeState {
  return {
    grid: emptyGrid(),
    queue: [randomShape(), randomShape(), randomShape()],
    score: 0,
    gameOver: false,
  };
}

/**
 * Places shape from queue[slotIndex] at (anchorRow, anchorCol).
 * Returns null if invalid. Otherwise outcome with new state and animation hints.
 */
export function applyPlacement(
  state: LinePuzzleRuntimeState,
  slotIndex: number,
  anchorRow: number,
  anchorCol: number
): PlacementOutcome | null {
  if (state.gameOver || slotIndex < 0 || slotIndex > 2) return null;
  const shape = state.queue[slotIndex];
  if (!shape) return null;
  if (!canPlace(state.grid, shape, anchorRow, anchorCol)) return null;

  const placedCellKeys: string[] = [];
  for (const [dr, dc] of shape.cells) {
    const r = anchorRow + dr;
    const c = anchorCol + dc;
    if (r >= 0 && r < LINE_PUZZLE_SIZE && c >= 0 && c < LINE_PUZZLE_SIZE) {
      placedCellKeys.push(`${r},${c}`);
    }
  }

  let grid = state.grid.map((row) => [...row]);
  for (const [dr, dc] of shape.cells) {
    grid[anchorRow + dr]![anchorCol + dc] = 1;
  }
  const { grid: afterClear, linesCleared } = clearFullLines(grid);
  const n = grid.length;
  const clearedCellKeys: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r]![c] !== 0 && afterClear[r]![c] === 0) {
        clearedCellKeys.push(`${r},${c}`);
      }
    }
  }

  const score = state.score + scoreForLines(linesCleared);

  const queue = [...state.queue] as LinePuzzleShape[];
  queue[slotIndex] = randomShape();

  const gameOver = !anyPlacementPossible(afterClear, queue);

  return {
    state: {
      grid: afterClear,
      queue,
      score,
      gameOver,
    },
    linesCleared,
    clearedCellKeys,
    placedCellKeys,
  };
}
