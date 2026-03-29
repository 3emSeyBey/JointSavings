import { describe, it, expect } from 'vitest';
import {
  LINE_PUZZLE_SIZE,
  emptyGrid,
  canPlace,
  clearFullLines,
  scoreForLines,
  anyPlacementPossible,
  createInitialLinePuzzleState,
  applyPlacement,
  resolveSnapAnchor,
  type LinePuzzleShape,
} from './linePuzzleEngine';

describe('linePuzzleEngine', () => {
  it('creates an empty 8×8 grid', () => {
    const g = emptyGrid();
    expect(g.length).toBe(LINE_PUZZLE_SIZE);
    expect(g[0]!.length).toBe(LINE_PUZZLE_SIZE);
    expect(g.flat().every((c) => c === 0)).toBe(true);
  });

  it('canPlace respects bounds and occupancy', () => {
    const grid = emptyGrid();
    const mono: LinePuzzleShape = { cells: [[0, 0]] };
    expect(canPlace(grid, mono, 0, 0)).toBe(true);
    expect(canPlace(grid, mono, 7, 7)).toBe(true);
    expect(canPlace(grid, mono, 8, 0)).toBe(false);
    grid[4]![4] = 1;
    expect(canPlace(grid, mono, 4, 4)).toBe(false);
  });

  it('clearFullLines clears full rows and columns', () => {
    const grid = emptyGrid();
    for (let c = 0; c < LINE_PUZZLE_SIZE; c++) grid[0]![c] = 1;
    const { grid: out, linesCleared } = clearFullLines(grid);
    expect(linesCleared).toBe(1);
    expect(out[0]!.every((c) => c === 0)).toBe(true);
  });

  it('scoreForLines grows superlinearly', () => {
    expect(scoreForLines(1)).toBe(10);
    expect(scoreForLines(2)).toBe(40);
    expect(scoreForLines(3)).toBe(90);
  });

  it('resolveSnapAnchor snaps to nearest valid anchor when raw cell is invalid', () => {
    const grid = emptyGrid();
    const mono: LinePuzzleShape = { cells: [[0, 0]] };
    grid[3]![3] = 1;
    const raw = { row: 3, col: 3 };
    const snap = resolveSnapAnchor(grid, mono, raw, null);
    expect(snap).not.toBeNull();
    expect(canPlace(grid, mono, snap!.row, snap!.col)).toBe(true);
    expect(Math.abs(snap!.row - 3) + Math.abs(snap!.col - 3)).toBeLessThanOrEqual(4);
  });

  it('anyPlacementPossible is false when queue cannot fit', () => {
    const grid = emptyGrid();
    const tooWide: LinePuzzleShape = {
      cells: Array.from({ length: 9 }, (_, c) => [0, c] as [number, number]),
    };
    expect(anyPlacementPossible(grid, [tooWide])).toBe(false);
  });

  it('applyPlacement replaces queue slot and updates score on clear', () => {
    const state = createInitialLinePuzzleState();
    const rowFill: LinePuzzleShape = {
      cells: Array.from({ length: LINE_PUZZLE_SIZE }, (_, c) => [0, c] as [number, number]),
    };
    const s1: typeof state = {
      ...state,
      queue: [rowFill, state.queue[1]!, state.queue[2]!],
    };
    const out = applyPlacement(s1, 0, 0, 0);
    expect(out).not.toBeNull();
    expect(out!.state.score).toBeGreaterThan(0);
    expect(out!.linesCleared).toBeGreaterThan(0);
    expect(out!.clearedCellKeys.length).toBeGreaterThan(0);
    expect(out!.state.grid[0]!.every((c) => c === 0)).toBe(true);
  });
});
