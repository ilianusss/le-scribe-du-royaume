import type { Mode } from '@/data/cards';

import {
  EMPTY_SESSION,
  scoreSession,
  sessionDiscard,
  sessionReducer,
  type GameContext,
  type ScoringSession,
  type SessionAction,
} from './session';
import { finalHand } from './steps';

export interface Game {
  mode: Mode;
  playerCount: number;
  names: string[];
  finished: ScoringSession[];
}

export interface AppState {
  session: ScoringSession;
  game: Game | null;
}

export type GameAction =
  | { type: 'START_GAME'; mode: Mode; playerCount: number; names?: string[] }
  | { type: 'NEXT_PLAYER' }
  | { type: 'PREVIOUS_PLAYER' }
  | { type: 'NEW_GAME' }
  | { type: 'END_GAME' };

export type AppAction = SessionAction | GameAction;

export const INITIAL_STATE: AppState = { session: EMPTY_SESSION, game: null };

export function gameContext(game: Game): GameContext {
  return {
    playerCount: game.playerCount,
    unavailableCards: game.finished.flatMap(finalHand),
    unavailableCursed: game.finished.flatMap((session) => session.cursedItems),
    discard: game.finished.reduce((discard, session) => ({ ...discard, ...sessionDiscard(session) }), {}),
  };
}

export function currentPlayer(game: Game): number {
  return game.finished.length + 1;
}

export function playerName(game: Game, player: number): string | null {
  return game.names[player - 1]?.trim() || null;
}

function startGame(mode: Mode, playerCount: number, names: string[]): AppState {
  const game: Game = {
    mode,
    playerCount,
    names: Array.from({ length: playerCount }, (_, i) => names[i]?.trim() ?? ''),
    finished: [],
  };
  return { game, session: sessionReducer(EMPTY_SESSION, { type: 'START', mode, game: gameContext(game) }) };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  const { game, session } = state;
  switch (action.type) {
    case 'START_GAME':
      return startGame(action.mode, action.playerCount, action.names ?? []);
    case 'NEW_GAME':
      return game ? startGame(game.mode, game.playerCount, game.names) : state;
    case 'END_GAME':
      return INITIAL_STATE;
    case 'NEXT_PLAYER': {
      if (!game || game.finished.length >= game.playerCount) return state;
      const next: Game = { ...game, finished: [...game.finished, session] };
      if (next.finished.length === next.playerCount) return { game: next, session };
      return { game: next, session: sessionReducer(EMPTY_SESSION, { type: 'START', mode: game.mode, game: gameContext(next) }) };
    }
    case 'PREVIOUS_PLAYER':
      if (!game || game.finished.length === 0) return state;
      return {
        game: { ...game, finished: game.finished.slice(0, -1) },
        session: game.finished[game.finished.length - 1],
      };
    case 'START':
      return { game: null, session: sessionReducer(session, action) };
    default:
      return { game, session: sessionReducer(session, action) };
  }
}

export interface Standing {
  player: number;
  total: number;
  tieBreak: number;
  rank: number;
  tieBreakUsed: boolean;
}

export function standings(game: Game): Standing[] {
  const scored = game.finished.map((session, index) => {
    const result = scoreSession(session);
    return { player: index + 1, total: result?.total ?? 0, tieBreak: result?.tieBreak ?? 0 };
  });
  const beats = (a: (typeof scored)[number], b: (typeof scored)[number]) =>
    a.total > b.total || (a.total === b.total && a.tieBreak < b.tieBreak);
  return scored
    .map((entry) => ({
      ...entry,
      rank: 1 + scored.filter((other) => beats(other, entry)).length,
      tieBreakUsed: scored.some((other) => other !== entry && other.total === entry.total),
    }))
    .sort((a, b) => a.rank - b.rank || a.player - b.player);
}
