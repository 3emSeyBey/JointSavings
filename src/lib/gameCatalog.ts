import {
  Swords,
  Dices,
  Hash,
  Sparkles,
  Crown,
  CircleDot,
  Grid3x3,
  Circle,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import type { GameSession } from '@/hooks/useGameSession';

export type CatalogGameId = GameSession['gameType'];

export type GameCategoryId = 'quick' | 'board' | 'solo';

export interface CatalogGameMeta {
  id: CatalogGameId;
  title: string;
  description: string;
  icon: LucideIcon;
  emoji: string;
  category: GameCategoryId;
}

/** Library-backed vs local implementations (for UI hints / docs). */
export const GAME_IMPLEMENTATION_NOTE: Partial<Record<CatalogGameId, string>> = {
  chess: 'chess.js + react-chessboard',
  checkers: 'Custom engine (8×8, jumps & slides)',
  connect4: 'Built-in grid',
  ttt: 'Built-in grid',
  linePuzzle: 'Local state only — solo line-clear puzzle',
};

export const GAME_CATALOG: CatalogGameMeta[] = [
  {
    id: 'rps',
    title: 'Rock Paper Scissors',
    description: 'Settle it together!',
    icon: Swords,
    emoji: '✊',
    category: 'quick',
  },
  {
    id: 'roulette',
    title: 'Random Roulette',
    description: 'Spin to decide anything',
    icon: Dices,
    emoji: '🎰',
    category: 'quick',
  },
  {
    id: 'rng',
    title: 'Number Generator',
    description: 'Pick a random number',
    icon: Hash,
    emoji: '🔢',
    category: 'quick',
  },
  {
    id: 'decide',
    title: 'Decide For Me',
    description: 'AI helps you decide',
    icon: Sparkles,
    emoji: '🤔',
    category: 'quick',
  },
  {
    id: 'chess',
    title: 'Chess',
    description: 'Classic chess — synced for two or vs House solo',
    icon: Crown,
    emoji: '♟️',
    category: 'board',
  },
  {
    id: 'checkers',
    title: 'Checkers',
    description: '8×8 draughts-style jumps on dark squares',
    icon: CircleDot,
    emoji: '⚫',
    category: 'board',
  },
  {
    id: 'connect4',
    title: 'Connect Four',
    description: 'Drop discs — four in a row wins',
    icon: Circle,
    emoji: '🔴',
    category: 'board',
  },
  {
    id: 'ttt',
    title: 'Tic-Tac-Toe',
    description: 'Quick 3×3 — perfect for a rematch',
    icon: Grid3x3,
    emoji: '⭕',
    category: 'board',
  },
  {
    id: 'linePuzzle',
    title: 'Line clear puzzle',
    description: 'Fill rows & columns on an 8×8 board — solo, on this device',
    icon: LayoutGrid,
    emoji: '🧩',
    category: 'solo',
  },
];

export function catalogMeta(id: CatalogGameId): CatalogGameMeta | undefined {
  return GAME_CATALOG.find((g) => g.id === id);
}

export function inviteLabelForGameType(gameType: CatalogGameId): string {
  switch (gameType) {
    case 'rps':
      return '✊ Rock Paper Scissors';
    case 'roulette':
      return '🎰 Random Roulette';
    case 'rng':
      return '🔢 Number Generator';
    case 'decide':
      return '🤔 Decide For Me';
    case 'chess':
      return '♟️ Chess';
    case 'checkers':
      return '⚫ Checkers';
    case 'connect4':
      return '🔴 Connect Four';
    case 'ttt':
      return '⭕ Tic-Tac-Toe';
    case 'linePuzzle':
      return '🧩 Line clear puzzle';
    default:
      return '🎮 Mini game';
  }
}
