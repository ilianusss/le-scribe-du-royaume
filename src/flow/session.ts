import { HAND_SIZE, type CardId, type Family, type Mode } from '@/data/cards';
import type { CursedItemId } from '@/data/cursedItems';
import { optimise } from '@/engine/optimise';
import type { DiscardCounts, ScoreResult } from '@/engine/types';

import { bonusPool, bonusSources, needsLicorne, needsPlayerCount, neededDiscardFamilies } from './steps';

export interface ScoringSession {
  mode: Mode | null;
  hand: CardId[];
  cursedItems: CursedItemId[];
  bonusCard: CardId | null;
  bonusSkipped: boolean;
  playerCount: number | null;
  discardCounts: DiscardCounts;
}

export type SessionAction =
  | { type: 'START'; mode: Mode }
  | { type: 'NEW_HAND' }
  | { type: 'ADD_CARD'; id: CardId }
  | { type: 'REMOVE_CARD'; id: CardId }
  | { type: 'ADD_CURSED'; id: CursedItemId }
  | { type: 'REMOVE_CURSED'; id: CursedItemId }
  | { type: 'SET_BONUS'; id: CardId }
  | { type: 'SKIP_BONUS' }
  | { type: 'SET_PLAYER_COUNT'; count: number }
  | { type: 'SET_DISCARD'; family: Family; count: number }
  | { type: 'SET_LICORNE'; value: boolean };

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const MAX_DISCARD = 12;

export const EMPTY_SESSION: ScoringSession = {
  mode: null,
  hand: [],
  cursedItems: [],
  bonusCard: null,
  bonusSkipped: false,
  playerCount: null,
  discardCounts: {},
};

function prune(session: ScoringSession): ScoringSession {
  let { bonusCard, bonusSkipped, playerCount, discardCounts } = session;
  if (bonusSources(session).length === 0) {
    bonusCard = null;
    bonusSkipped = false;
  } else if (bonusCard && !bonusPool(session).some((card) => card.id === bonusCard)) {
    bonusCard = null;
  }
  const withBonus = { ...session, bonusCard };
  if (!needsPlayerCount(withBonus)) playerCount = null;
  const families = neededDiscardFamilies(withBonus);
  const kept: DiscardCounts = {};
  for (const family of families) if (discardCounts[family] !== undefined) kept[family] = discardCounts[family];
  if (needsLicorne(withBonus) && discardCounts.licorne !== undefined) kept.licorne = discardCounts.licorne;
  return { ...session, bonusCard, bonusSkipped, playerCount, discardCounts: kept };
}

export function sessionReducer(session: ScoringSession, action: SessionAction): ScoringSession {
  switch (action.type) {
    case 'START':
      return { ...EMPTY_SESSION, mode: action.mode };
    case 'NEW_HAND':
      return { ...EMPTY_SESSION, mode: session.mode };
    case 'ADD_CARD':
      if (!session.mode || session.hand.includes(action.id) || session.hand.length >= HAND_SIZE[session.mode])
        return session;
      return prune({ ...session, hand: [...session.hand, action.id] });
    case 'REMOVE_CARD':
      return prune({ ...session, hand: session.hand.filter((id) => id !== action.id) });
    case 'ADD_CURSED':
      if (session.mode !== 'EXTENSION' || session.cursedItems.includes(action.id)) return session;
      return prune({ ...session, cursedItems: [...session.cursedItems, action.id] });
    case 'REMOVE_CURSED':
      return prune({ ...session, cursedItems: session.cursedItems.filter((id) => id !== action.id) });
    case 'SET_BONUS':
      if (!bonusPool(session).some((card) => card.id === action.id)) return session;
      return prune({ ...session, bonusCard: action.id, bonusSkipped: false });
    case 'SKIP_BONUS':
      return prune({ ...session, bonusCard: null, bonusSkipped: true });
    case 'SET_PLAYER_COUNT':
      if (action.count < MIN_PLAYERS || action.count > MAX_PLAYERS) return session;
      return { ...session, playerCount: action.count };
    case 'SET_DISCARD': {
      const count = Math.min(MAX_DISCARD, Math.max(0, action.count));
      return { ...session, discardCounts: { ...session.discardCounts, [action.family]: count } };
    }
    case 'SET_LICORNE':
      return { ...session, discardCounts: { ...session.discardCounts, licorne: action.value } };
  }
}

export function scoreSession(session: ScoringSession): ScoreResult | null {
  if (!session.mode) return null;
  const hand = session.bonusCard ? [...session.hand, session.bonusCard] : session.hand;
  return optimise(hand, {
    mode: session.mode,
    playerCount: session.playerCount,
    discard: session.discardCounts,
    cursedItems: session.cursedItems,
  });
}
