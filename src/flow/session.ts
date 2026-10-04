import { HAND_SIZE, hasCursedItems, type CardId, type Family, type Mode } from '@/data/cards';
import type { CursedItemId } from '@/data/cursedItems';
import { scoreHand } from '@/engine/score';
import type { DiscardCounts, ScoreResult } from '@/engine/types';

import {
  angelTargets,
  bonusPool,
  bonusSources,
  bookFamilies,
  bookTargets,
  hasBook,
  islandTargets,
  jokersInHand,
  jokerTargets,
  needsLicorne,
  needsPlayerCount,
  neededDiscardFamilies,
  type JokerId,
} from './steps';

export type CardChoice = CardId | 'NONE';

export type BookChoice = { target: CardId; family: Family } | 'NONE';

export interface GameContext {
  playerCount: number;
  unavailableCards: CardId[];
  unavailableCursed: CursedItemId[];
  discard: DiscardCounts;
}

export interface ScoringSession {
  mode: Mode | null;
  game: GameContext | null;
  hand: CardId[];
  cursedItems: CursedItemId[];
  bonusCard: CardId | null;
  bonusSkipped: boolean;
  jokerChoices: Partial<Record<JokerId, CardChoice>>;
  bookChoice: BookChoice | null;
  islandChoice: CardChoice | null;
  angelChoice: CardChoice | null;
  playerCount: number | null;
  discardCounts: DiscardCounts;
}

export type SessionAction =
  | { type: 'START'; mode: Mode; game?: GameContext }
  | { type: 'NEW_HAND' }
  | { type: 'ADD_CARD'; id: CardId }
  | { type: 'REMOVE_CARD'; id: CardId }
  | { type: 'ADD_CURSED'; id: CursedItemId }
  | { type: 'REMOVE_CURSED'; id: CursedItemId }
  | { type: 'SET_BONUS'; id: CardId }
  | { type: 'SKIP_BONUS' }
  | { type: 'SET_JOKER'; joker: JokerId; choice: CardChoice }
  | { type: 'CLEAR_JOKER'; joker: JokerId }
  | { type: 'SET_BOOK'; choice: BookChoice }
  | { type: 'CLEAR_BOOK' }
  | { type: 'SET_ISLAND'; choice: CardChoice | null }
  | { type: 'SET_ANGEL'; choice: CardChoice | null }
  | { type: 'SET_PLAYER_COUNT'; count: number }
  | { type: 'SET_DISCARD'; family: Family; count: number }
  | { type: 'SET_LICORNE'; value: boolean };

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const MAX_DISCARD = 12;

export const EMPTY_SESSION: ScoringSession = {
  mode: null,
  game: null,
  hand: [],
  cursedItems: [],
  bonusCard: null,
  bonusSkipped: false,
  jokerChoices: {},
  bookChoice: null,
  islandChoice: null,
  angelChoice: null,
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
  const jokerChoices: ScoringSession['jokerChoices'] = {};
  for (const joker of jokersInHand(withBonus)) {
    const choice = session.jokerChoices[joker];
    if (choice === 'NONE' || (choice && jokerTargets(withBonus, joker).some((card) => card.id === choice)))
      jokerChoices[joker] = choice;
  }
  const withJokers = { ...withBonus, jokerChoices };
  const bookChoice = hasBook(withJokers) && isValidBook(withJokers, session.bookChoice) ? session.bookChoice : null;
  const withBook = { ...withJokers, bookChoice };
  const islandChoice = isValidTarget(islandTargets(withBook), session.islandChoice) ? session.islandChoice : null;
  const angelChoice = isValidTarget(angelTargets(withBook), session.angelChoice) ? session.angelChoice : null;
  if (session.game) playerCount = session.game.playerCount;
  else if (!needsPlayerCount(withBonus)) playerCount = null;
  const families = neededDiscardFamilies(withBonus);
  const kept: DiscardCounts = {};
  for (const family of families) if (discardCounts[family] !== undefined) kept[family] = discardCounts[family];
  if (needsLicorne(withBonus) && discardCounts.licorne !== undefined) kept.licorne = discardCounts.licorne;
  return {
    ...session,
    bonusCard,
    bonusSkipped,
    jokerChoices,
    bookChoice,
    islandChoice,
    angelChoice,
    playerCount,
    discardCounts: kept,
  };
}

function isValidTarget(targets: { id: CardId }[], choice: CardChoice | null): boolean {
  if (targets.length === 0) return false;
  return choice === null || choice === 'NONE' || targets.some((card) => card.id === choice);
}

function isValidBook(session: ScoringSession, choice: BookChoice | null): boolean {
  if (choice === null || choice === 'NONE') return true;
  return (
    bookTargets(session).some((card) => card.id === choice.target) &&
    bookFamilies(session, choice.target).includes(choice.family)
  );
}

function startSession(mode: Mode, game: GameContext | null): ScoringSession {
  return { ...EMPTY_SESSION, mode, game, playerCount: game?.playerCount ?? null };
}

export function sessionDiscard(session: ScoringSession): DiscardCounts {
  return { ...session.game?.discard, ...session.discardCounts };
}

export function sessionReducer(session: ScoringSession, action: SessionAction): ScoringSession {
  switch (action.type) {
    case 'START':
      return startSession(action.mode, action.game ?? null);
    case 'NEW_HAND':
      return session.mode ? startSession(session.mode, session.game) : session;
    case 'ADD_CARD':
      if (
        !session.mode ||
        session.hand.includes(action.id) ||
        session.game?.unavailableCards.includes(action.id) ||
        session.hand.length >= HAND_SIZE[session.mode]
      )
        return session;
      return prune({ ...session, hand: [...session.hand, action.id] });
    case 'REMOVE_CARD':
      return prune({ ...session, hand: session.hand.filter((id) => id !== action.id) });
    case 'ADD_CURSED':
      if (
        !session.mode ||
        !hasCursedItems(session.mode) ||
        session.cursedItems.includes(action.id) ||
        session.game?.unavailableCursed.includes(action.id)
      )
        return session;
      return prune({ ...session, cursedItems: [...session.cursedItems, action.id] });
    case 'REMOVE_CURSED':
      return prune({ ...session, cursedItems: session.cursedItems.filter((id) => id !== action.id) });
    case 'SET_BONUS':
      if (!bonusPool(session).some((card) => card.id === action.id)) return session;
      return prune({ ...session, bonusCard: action.id, bonusSkipped: false });
    case 'SKIP_BONUS':
      return prune({ ...session, bonusCard: null, bonusSkipped: true });
    case 'SET_JOKER':
      if (action.choice !== 'NONE' && !jokerTargets(session, action.joker).some((card) => card.id === action.choice))
        return session;
      return prune({ ...session, jokerChoices: { ...session.jokerChoices, [action.joker]: action.choice } });
    case 'CLEAR_JOKER': {
      const { [action.joker]: _cleared, ...rest } = session.jokerChoices;
      return prune({ ...session, jokerChoices: rest });
    }
    case 'SET_BOOK':
      if (!hasBook(session) || !isValidBook(session, action.choice)) return session;
      return prune({ ...session, bookChoice: action.choice });
    case 'CLEAR_BOOK':
      return prune({ ...session, bookChoice: null });
    case 'SET_ISLAND':
      if (!isValidTarget(islandTargets(session), action.choice)) return session;
      return { ...session, islandChoice: action.choice };
    case 'SET_ANGEL':
      if (!isValidTarget(angelTargets(session), action.choice)) return session;
      return { ...session, angelChoice: action.choice };
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
  const card = (choice: CardChoice | null | undefined) => (choice && choice !== 'NONE' ? choice : null);
  return scoreHand(
    hand,
    {
      mode: session.mode,
      playerCount: session.playerCount,
      discard: sessionDiscard(session),
      cursedItems: session.cursedItems,
    },
    {
      doppelganger: card(session.jokerChoices.FR53),
      mirage: card(session.jokerChoices.FR52),
      shapeshifter: card(session.jokerChoices.FR51),
      book: session.bookChoice === 'NONE' ? null : session.bookChoice,
      island: card(session.islandChoice),
      angel: card(session.angelChoice),
    },
  );
}
