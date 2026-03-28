import { useCallback, useMemo } from 'react';
import { Chess, DEFAULT_POSITION } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { chessPayloadOrDefault } from '@/lib/boardGameState';
import type { BoardGamePanelProps } from '@/components/games/boardGameTypes';

/** react-chessboard piece id e.g. wP, bQ */
type BoardPiece = string;

function promotionLetter(pieceCode: string): 'q' | 'r' | 'b' | 'n' | undefined {
  const t = pieceCode[1];
  if (!t) return undefined;
  if (t === 'P' || t === 'p') return undefined;
  const map: Record<string, 'q' | 'r' | 'b' | 'n'> = {
    Q: 'q',
    R: 'r',
    B: 'b',
    N: 'n',
  };
  return map[t];
}

export function ChessGamePanel({
  session,
  currentProfileId,
  currentTheme,
  onUpdate,
}: BoardGamePanelProps) {
  const solo = session.solo === true;
  const payload = chessPayloadOrDefault(session.boardStateJson);
  const fen = payload.fen;

  const myColor = solo ? 'w' : currentProfileId === 'pea' ? 'w' : 'b';
  const boardOrientation = solo ? 'white' : currentProfileId === 'pea' ? 'white' : 'black';

  const statusText = useMemo(() => {
    try {
      const g = new Chess(fen);
      if (g.isCheckmate()) return g.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
      if (g.isDraw()) return 'Draw';
      if (g.isCheck()) return 'Check';
      return g.turn() === 'w' ? 'White to move' : 'Black to move';
    } catch {
      return '';
    }
  }, [fen]);

  const applyMoveToGame = useCallback(
    (game: Chess, sourceSquare: string, targetSquare: string, piece: BoardPiece) => {
      const promo = promotionLetter(piece);
      try {
        if (promo) {
          game.move({ from: sourceSquare, to: targetSquare, promotion: promo });
        } else {
          game.move({ from: sourceSquare, to: targetSquare });
        }
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string, piece: BoardPiece) => {
      const game = new Chess(fen);
      if (game.isGameOver()) return false;
      if (game.turn() !== myColor) return false;

      if (!applyMoveToGame(game, sourceSquare, targetSquare, piece)) return false;

      if (solo && !game.isGameOver()) {
        const aiMoves = game.moves({ verbose: true });
        if (aiMoves.length > 0) {
          const pick = aiMoves[Math.floor(Math.random() * aiMoves.length)]!;
          try {
            const m: { from: string; to: string; promotion?: string } = {
              from: pick.from,
              to: pick.to,
            };
            if (pick.promotion) m.promotion = pick.promotion;
            game.move(m);
          } catch {
            return false;
          }
        }
      }

      void onUpdate({
        boardStateJson: JSON.stringify({ t: 'chess', fen: game.fen() }),
      });
      return true;
    },
    [fen, myColor, onUpdate, solo, applyMoveToGame]
  );

  const handleNewGame = () => {
    void onUpdate({
      boardStateJson: JSON.stringify({ t: 'chess', fen: DEFAULT_POSITION }),
    });
  };

  const boardWidth = typeof window !== 'undefined' ? Math.min(340, window.innerWidth - 48) : 320;

  return (
    <div className="space-y-4 overflow-visible">
      <p className="text-center text-sm font-bold text-slate-600">{statusText}</p>
      <div className="flex justify-center overflow-visible [&_.react-chessboard]:rounded-xl">
        <Chessboard
          id="moneymates-chess"
          position={fen}
          boardOrientation={boardOrientation}
          boardWidth={boardWidth}
          onPieceDrop={onPieceDrop}
          allowDragOutsideBoard={false}
          snapToCursor
          promotionDialogVariant="vertical"
          customBoardStyle={{
            borderRadius: '12px',
            boxShadow: '0 12px 40px rgba(15,23,42,0.15)',
          }}
          isDraggablePiece={({ piece }) => {
            const color = piece[0] === 'w' ? 'w' : 'b';
            if (color !== myColor) return false;
            const g = new Chess(fen);
            if (g.isGameOver()) return false;
            return g.turn() === color;
          }}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500">
        <span>
          {solo ? 'You play White · House plays random Black' : 'Pea = White · Cam = Black'}
        </span>
      </div>
      <button
        type="button"
        onClick={handleNewGame}
        className={`w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg active:scale-[0.99] transition-transform ${currentTheme.bgClass}`}
      >
        New game
      </button>
    </div>
  );
}
