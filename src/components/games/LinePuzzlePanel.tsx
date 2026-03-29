import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import type { Theme } from '@/types';
import {
  LINE_PUZZLE_SIZE,
  createInitialLinePuzzleState,
  applyPlacement,
  canPlace,
  resolveSnapAnchor,
  type LinePuzzleRuntimeState,
  type LinePuzzleShape,
  type PlacementOutcome,
} from '@/lib/linePuzzleEngine';
import {
  emptyBoardCellStyle,
  filledBlockStyle,
  hexToRgba,
  LINE_PUZZLE_GAME_THEME,
  previewInvalidStyle,
  previewValidStyle,
  primaryButtonStyle,
} from '@/lib/linePuzzleThemeUi';

const DRAG_THRESHOLD_PX = 8;

function shapeKey(shape: LinePuzzleShape): string {
  return shape.cells.map(([r, c]) => `${r},${c}`).join('|');
}

function shapeBounds(shape: LinePuzzleShape): { rows: number; cols: number } {
  let maxR = 0;
  let maxC = 0;
  for (const [r, c] of shape.cells) {
    maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c);
  }
  return { rows: maxR + 1, cols: maxC + 1 };
}

/** Fixed cell size so 1×N / N×1 shapes don’t collapse (1fr tracks often go to 0px in flex parents). */
const MINI_CELL = '0.75rem'; // Tailwind h-3 / w-3

function MiniShapePreview({ shape, theme }: { shape: LinePuzzleShape; theme: Theme }) {
  const { rows, cols } = shapeBounds(shape);
  const safeCols = Math.max(cols, 1);
  const safeRows = Math.max(rows, 1);
  const set = new Set(shape.cells.map(([r, c]) => `${r},${c}`));
  return (
    <div
      className="inline-grid w-fit gap-0.5 p-1"
      style={{
        gridTemplateColumns: `repeat(${safeCols}, minmax(${MINI_CELL}, ${MINI_CELL}))`,
        gridTemplateRows: `repeat(${safeRows}, minmax(${MINI_CELL}, ${MINI_CELL}))`,
      }}
    >
      {Array.from({ length: safeRows * safeCols }, (_, i) => {
        const r = Math.floor(i / safeCols);
        const c = i % safeCols;
        const on = set.has(`${r},${c}`);
        if (on) {
          return (
            <div
              key={i}
              style={{
                ...filledBlockStyle(theme),
                borderWidth: 1,
                boxSizing: 'border-box',
                width: '0.75rem',
                height: '0.75rem',
              }}
              className="shrink-0 rounded-sm"
            />
          );
        }
        return (
          <div
            key={i}
            style={{
              backgroundColor: hexToRgba(theme.color, 0.12),
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: hexToRgba(theme.color, 0.24),
              boxSizing: 'border-box',
              width: '0.75rem',
              height: '0.75rem',
            }}
            className="shrink-0 rounded-sm"
          />
        );
      })}
    </div>
  );
}

/** In-bounds cells covered by `shape` with top-left anchor (ar, ac). */
function footprintKeys(ar: number, ac: number, shape: LinePuzzleShape): Set<string> {
  const keys = new Set<string>();
  for (const [dr, dc] of shape.cells) {
    const r = ar + dr;
    const c = ac + dc;
    if (r >= 0 && r < LINE_PUZZLE_SIZE && c >= 0 && c < LINE_PUZZLE_SIZE) {
      keys.add(`${r},${c}`);
    }
  }
  return keys;
}

type DragPaint = {
  slot: number;
  hoverRow: number | null;
  hoverCol: number | null;
};

type DragSession = {
  slot: number;
  pointerId: number;
  x0: number;
  y0: number;
  active: boolean;
};

type PlacementFx = {
  tick: number;
  placed: Set<string>;
  cleared: Set<string>;
  linesCleared: number;
};

type PreviewState = { valid: boolean; keys: Set<string> } | null;

function cellSurface(
  theme: Theme,
  cell: number,
  row: number,
  col: number,
  preview: PreviewState
): { style: CSSProperties; className: string } {
  const key = `${row},${col}`;
  const inPv = preview?.keys.has(key);
  if (inPv && preview) {
    if (preview.valid) {
      return {
        style: previewValidStyle(theme),
        className: 'absolute inset-0 rounded-md overflow-hidden disabled:opacity-60',
      };
    }
    return {
      style: previewInvalidStyle(theme),
      className: 'absolute inset-0 rounded-md overflow-hidden disabled:opacity-60',
    };
  }
  if (cell !== 0) {
    return {
      style: filledBlockStyle(theme),
      className: 'absolute inset-0 rounded-md overflow-hidden disabled:opacity-60 shadow-sm',
    };
  }
  return {
    style: emptyBoardCellStyle(theme),
    className: 'absolute inset-0 rounded-md overflow-hidden disabled:opacity-60 hover:brightness-[1.04]',
  };
}

export function LinePuzzlePanel() {
  const gameTheme: Theme = LINE_PUZZLE_GAME_THEME;
  const [game, setGame] = useState<LinePuzzleRuntimeState>(() => createInitialLinePuzzleState());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [dragPaint, setDragPaint] = useState<DragPaint | null>(null);
  const [tapBoardHover, setTapBoardHover] = useState<{ row: number; col: number } | null>(null);
  const [placementFx, setPlacementFx] = useState<PlacementFx | null>(null);
  const [glowKey, setGlowKey] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const dragSessionRef = useRef<DragSession | null>(null);
  const fxClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStickyRef = useRef<{ row: number; col: number } | null>(null);
  const tapStickyRef = useRef<{ row: number; col: number } | null>(null);

  const getHoverCell = useCallback((clientX: number, clientY: number): { row: number; col: number } | null => {
    const root = gridRef.current;
    if (!root) return null;
    const el = document.elementFromPoint(clientX, clientY);
    const cell = el?.closest('[data-line-cell]');
    if (!cell || !root.contains(cell as Node)) return null;
    const row = cell.getAttribute('data-row');
    const col = cell.getAttribute('data-col');
    if (row == null || col == null) return null;
    return { row: Number(row), col: Number(col) };
  }, []);

  const placementPreview = useMemo(() => {
    if (game.gameOver) return null;

    let slot: number | null = null;
    let ar: number | null = null;
    let ac: number | null = null;

    if (
      dragPaint &&
      dragPaint.hoverRow !== null &&
      dragPaint.hoverCol !== null
    ) {
      slot = dragPaint.slot;
      ar = dragPaint.hoverRow;
      ac = dragPaint.hoverCol;
    } else if (selectedSlot !== null && tapBoardHover !== null) {
      slot = selectedSlot;
      ar = tapBoardHover.row;
      ac = tapBoardHover.col;
    }

    if (slot === null || ar === null || ac === null) return null;
    const shape = game.queue[slot];
    if (!shape) return null;

    const valid = canPlace(game.grid, shape, ar, ac);
    return { valid, keys: footprintKeys(ar, ac, shape) };
  }, [game, dragPaint, selectedSlot, tapBoardHover]);

  const clearFxLater = useCallback(() => {
    if (fxClearTimeoutRef.current) clearTimeout(fxClearTimeoutRef.current);
    fxClearTimeoutRef.current = setTimeout(() => {
      setPlacementFx(null);
      fxClearTimeoutRef.current = null;
    }, 520);
  }, []);

  const commitOutcome = useCallback(
    (out: PlacementOutcome | null) => {
      if (!out) return;
      setGame(out.state);
      setSelectedSlot(null);
      setTapBoardHover(null);
      tapStickyRef.current = null;
      setPlacementFx({
        tick: performance.now(),
        placed: new Set(out.placedCellKeys),
        cleared: new Set(out.clearedCellKeys),
        linesCleared: out.linesCleared,
      });
      if (out.linesCleared > 0) {
        setGlowKey(performance.now());
      }
      clearFxLater();
    },
    [clearFxLater]
  );

  useEffect(
    () => () => {
      if (fxClearTimeoutRef.current) clearTimeout(fxClearTimeoutRef.current);
    },
    []
  );

  const reset = useCallback(() => {
    setGame(createInitialLinePuzzleState());
    setSelectedSlot(null);
    setDragPaint(null);
    setTapBoardHover(null);
    setPlacementFx(null);
    dragSessionRef.current = null;
    dragStickyRef.current = null;
    tapStickyRef.current = null;
    if (fxClearTimeoutRef.current) clearTimeout(fxClearTimeoutRef.current);
  }, []);

  const endDragSession = useCallback((target: HTMLElement, pointerId: number) => {
    try {
      target.releasePointerCapture(pointerId);
    } catch {
      /* already released or not captured */
    }
    dragSessionRef.current = null;
    dragStickyRef.current = null;
    setDragPaint(null);
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (game.gameOver || selectedSlot === null) return;
    commitOutcome(applyPlacement(game, selectedSlot, row, col));
  };

  const handleGridPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (game.gameOver) return;
    if (dragPaint !== null) return;
    if (selectedSlot === null) {
      setTapBoardHover(null);
      tapStickyRef.current = null;
      return;
    }
    const g = gameRef.current;
    const shape = g.queue[selectedSlot];
    if (!shape) return;
    const raw = getHoverCell(e.clientX, e.clientY);
    const anchor = resolveSnapAnchor(g.grid, shape, raw, tapStickyRef.current);
    if (anchor) tapStickyRef.current = anchor;
    else tapStickyRef.current = null;
    setTapBoardHover(anchor);
  };

  const handleGridPointerLeave = () => {
    setTapBoardHover(null);
    tapStickyRef.current = null;
  };

  const handlePiecePointerDown = (e: React.PointerEvent<HTMLButtonElement>, slot: number) => {
    if (game.gameOver || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStickyRef.current = null;
    setTapBoardHover(null);
    tapStickyRef.current = null;
    dragSessionRef.current = {
      slot,
      pointerId: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      active: false,
    };
  };

  const handlePiecePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = dragSessionRef.current;
    if (!s || e.pointerId !== s.pointerId) return;
    const dist = Math.hypot(e.clientX - s.x0, e.clientY - s.y0);
    if (!s.active && dist > DRAG_THRESHOLD_PX) {
      s.active = true;
      setSelectedSlot(null);
      setTapBoardHover(null);
    }
    if (s.active) {
      const g = gameRef.current;
      const shape = g.queue[s.slot];
      if (!shape) return;
      const raw = getHoverCell(e.clientX, e.clientY);
      const anchor = resolveSnapAnchor(g.grid, shape, raw, dragStickyRef.current);
      if (anchor) dragStickyRef.current = anchor;
      else dragStickyRef.current = null;
      setDragPaint({
        slot: s.slot,
        hoverRow: anchor?.row ?? null,
        hoverCol: anchor?.col ?? null,
      });
    }
  };

  const handlePiecePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = dragSessionRef.current;
    if (!s || e.pointerId !== s.pointerId) return;

    const target = e.currentTarget;

    if (s.active) {
      const g = gameRef.current;
      const shape = g.queue[s.slot];
      endDragSession(target, e.pointerId);
      if (shape) {
        const raw = getHoverCell(e.clientX, e.clientY);
        const anchor = resolveSnapAnchor(g.grid, shape, raw, dragStickyRef.current);
        dragStickyRef.current = null;
        if (anchor) {
          commitOutcome(applyPlacement(g, s.slot, anchor.row, anchor.col));
        }
      } else {
        dragStickyRef.current = null;
      }
      return;
    }

    endDragSession(target, e.pointerId);
    setSelectedSlot((prev) => (prev === s.slot ? null : s.slot));
  };

  const handlePiecePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = dragSessionRef.current;
    if (!s || e.pointerId !== s.pointerId) return;
    endDragSession(e.currentTarget, e.pointerId);
  };

  const handlePieceLostCapture = () => {
    dragSessionRef.current = null;
    dragStickyRef.current = null;
    setDragPaint(null);
  };

  const gridChromeStyle: CSSProperties = {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: hexToRgba(gameTheme.color, 0.28),
  };

  return (
    <motion.div
      className="game-modal-light space-y-4 rounded-2xl border border-blue-200/90 bg-white p-4 shadow-sm"
      initial={{ opacity: 0.92, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <p className="text-[11px] leading-snug text-[#1e3a5f]">
        Solo puzzle — runs on this device only. Fill rows or columns to clear them. Not affiliated with any
        other app.
      </p>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#1e40af]">Score</div>
          <div className={`text-2xl font-bold tabular-nums ${gameTheme.textClass} min-h-[2rem] flex items-center`}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={game.score}
                initial={{ scale: 1.45, y: -10, opacity: 0.6 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.85, y: 6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 560, damping: 24 }}
                className="inline-block origin-left"
              >
                {game.score}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={reset}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-blue-950 bg-blue-100 hover:bg-blue-200 border border-blue-300/90 transition-colors"
        >
          <motion.span
            animate={{ rotate: 0 }}
            whileHover={{ rotate: -35 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            <RotateCcw size={16} />
          </motion.span>
          New game
        </motion.button>
      </div>

      <div className="relative mx-auto w-fit">
        <AnimatePresence>
          {glowKey != null && (
            <motion.div
              key={glowKey}
              className="pointer-events-none absolute -inset-3 rounded-3xl z-0"
              style={{ backgroundColor: hexToRgba(gameTheme.color, 0.18) }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: [0, 0.95, 0], scale: [0.92, 1.03, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              onAnimationComplete={() => setGlowKey(null)}
            />
          )}
        </AnimatePresence>
        <div
          ref={gridRef}
          className="relative z-[1] grid gap-1 p-2 rounded-2xl"
          style={{
            ...gridChromeStyle,
            gridTemplateColumns: `repeat(${LINE_PUZZLE_SIZE}, minmax(0, 1fr))`,
          }}
          onPointerMove={handleGridPointerMove}
          onPointerLeave={handleGridPointerLeave}
          onPointerCancel={handleGridPointerLeave}
        >
        {game.grid.map((line, row) =>
          line.map((cell, col) => {
            const key = `${row},${col}`;
            const surf = cellSurface(gameTheme, cell, row, col, placementPreview);
            const inPreview = placementPreview?.keys.has(key) ?? false;
            const previewValid = placementPreview?.valid ?? false;
            const showPlacePop = placementFx?.placed.has(key) ?? false;
            const showClearBurst = placementFx?.cleared.has(key) ?? false;
            const rot = ((row + col) % 2 === 0 ? 1 : -1) * 14;

            return (
              <div key={key} className="relative h-7 w-7 sm:h-8 sm:w-8">
                <motion.button
                  type="button"
                  data-line-cell
                  data-row={row}
                  data-col={col}
                  disabled={game.gameOver}
                  onClick={() => handleCellClick(row, col)}
                  className={surf.className}
                  style={surf.style}
                  aria-label={`Cell ${row + 1}, ${col + 1}`}
                  animate={
                    inPreview && previewValid
                      ? { scale: [1, 1.06, 1] }
                      : showPlacePop
                        ? { scale: [0.72, 1.08, 1] }
                        : { scale: 1 }
                  }
                  transition={
                    inPreview && previewValid
                      ? { duration: 1.15, repeat: Infinity, ease: 'easeInOut' }
                      : showPlacePop
                        ? { type: 'spring', stiffness: 520, damping: 22 }
                        : { duration: 0.2 }
                  }
                />
                <AnimatePresence>
                  {showClearBurst && (
                    <motion.div
                      key={`burst-${placementFx?.tick}-${key}`}
                      className="pointer-events-none absolute inset-0 z-20 rounded-md shadow-lg"
                      style={filledBlockStyle(gameTheme)}
                      initial={{ scale: 1, opacity: 0.92, y: 0, rotate: 0 }}
                      animate={{
                        scale: 1.5,
                        opacity: 0,
                        y: -10,
                        rotate: rot,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.48,
                        delay: (row + col) * 0.018,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
          {game.queue.map((shape, i) => {
            const active = selectedSlot === i;
            return (
              <motion.button
                key={`${i}-${shapeKey(shape)}`}
                type="button"
                layout="position"
                disabled={game.gameOver}
                onPointerDown={(e) => handlePiecePointerDown(e, i)}
                onPointerMove={handlePiecePointerMove}
                onPointerUp={handlePiecePointerUp}
                onPointerCancel={handlePiecePointerCancel}
                onLostPointerCapture={handlePieceLostCapture}
                initial={{ scale: 0.82, opacity: 0, rotate: -6, y: 8 }}
                animate={{
                  scale: active ? 1.04 : 1,
                  opacity: 1,
                  rotate: 0,
                  y: 0,
                }}
                whileHover={game.gameOver ? {} : { scale: 1.05, y: -3 }}
                whileTap={game.gameOver ? {} : { scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className="game-modal-light touch-none select-none rounded-2xl border-2 p-2 bg-slate-50 disabled:opacity-50"
                style={{
                  borderColor: active
                    ? hexToRgba(gameTheme.color, 0.75)
                    : hexToRgba(gameTheme.color, 0.3),
                  boxShadow: active
                    ? `0 4px 14px ${hexToRgba(gameTheme.color, 0.25)}`
                    : `0 1px 0 ${hexToRgba('#ffffff', 0.95)} inset`,
                }}
                aria-pressed={active}
                aria-label={`Piece ${i + 1} of 3 — drag to board or tap to select`}
              >
                <MiniShapePreview shape={shape} theme={gameTheme} />
              </motion.button>
            );
          })}
      </div>

      <AnimatePresence>
        {game.gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="text-center rounded-2xl border border-blue-200 bg-blue-50 py-4 px-3 overflow-hidden"
          >
            <motion.p
              className="font-bold text-blue-950"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 }}
            >
              No moves left
            </motion.p>
            <motion.p
              className="text-sm text-blue-800/75 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              Start a new game to play again.
            </motion.p>
            <motion.button
              type="button"
              onClick={reset}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, type: 'spring', stiffness: 400, damping: 24 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="mt-3 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={primaryButtonStyle(gameTheme)}
            >
              Play again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
