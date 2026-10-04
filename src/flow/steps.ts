import {
  BASE_FAMILIES,
  CARDS_BY_ID,
  EXTENSION_FAMILIES,
  HAND_SIZE,
  cardPool,
  hasCursedItems,
  hasExtraFamilies,
  modeFamilies,
  type Card,
  type CardId,
  type Family,
} from '@/data/cards';
import { DEFAULT_RULINGS } from '@/engine/rulings';
import { canJokerCopy, clearsPenalty } from '@/engine/score';

import type { ScoringSession } from './session';

export type Step =
  | 'MODE'
  | 'HAND'
  | 'CURSED'
  | 'BONUS'
  | 'JOKERS'
  | 'BOOK'
  | 'ISLAND'
  | 'ANGEL'
  | 'CONTEXT'
  | 'RECAP'
  | 'RESULT';

export type JokerId = 'FR53' | 'FR52' | 'FR51';

export const JOKERS: JokerId[] = ['FR53', 'FR52', 'FR51'];

export type BonusSource = 'FR28' | 'CH09' | 'CH06' | 'CH46';

const DISCARD_FAMILIES: Partial<Record<CardId, Family[]>> = {
  CH11: ['TERRAIN', 'VAGUE', 'FLAMME', 'CLIMAT'],
  CH12: ['SORCIER', 'SEIGNEUR', 'ARMEE', 'CREATURE', 'MORT_VIVANT'],
  CH13: ['SORCIER', 'ARTEFACT', 'EXTERIEUR'],
  CH15: ['ARME', 'ARMEE'],
};

const NECROMANCER_FAMILIES: Family[] = ['ARMEE', 'SEIGNEUR', 'SORCIER', 'CREATURE'];

export function handSize(session: ScoringSession): number {
  return session.mode ? HAND_SIZE[session.mode] : 0;
}

export function isHandComplete(session: ScoringSession): boolean {
  return session.mode !== null && session.hand.length === handSize(session);
}

export function missingCards(session: ScoringSession): number {
  return Math.max(0, handSize(session) - session.hand.length);
}

export function finalHand(session: ScoringSession): CardId[] {
  return session.bonusCard ? [...session.hand, session.bonusCard] : session.hand;
}

export function bonusSources(session: ScoringSession): BonusSource[] {
  const sources: BonusSource[] = [];
  if (session.hand.includes('FR28')) sources.push('FR28');
  if (session.hand.includes('CH09')) sources.push('CH09');
  if (session.hand.includes('CH06')) sources.push('CH06');
  if (session.cursedItems.includes('CH46')) sources.push('CH46');
  return sources;
}

export function bonusPool(session: ScoringSession): Card[] {
  if (!session.mode) return [];
  const sources = bonusSources(session);
  const families =
    hasExtraFamilies(session.mode) ? [...NECROMANCER_FAMILIES, 'MORT_VIVANT' as const] : NECROMANCER_FAMILIES;
  const onlyNecromancer = sources.length === 1 && sources[0] === 'FR28';
  return cardPool(session.mode).filter(
    (card) =>
      !session.hand.includes(card.id) &&
      !session.game?.unavailableCards.includes(card.id) &&
      (!onlyNecromancer || families.includes(card.families[0])),
  );
}

export function jokersInHand(session: ScoringSession): JokerId[] {
  const hand = finalHand(session);
  return JOKERS.filter((joker) => hand.includes(joker));
}

export function jokerTargets(session: ScoringSession, joker: JokerId): Card[] {
  if (!session.mode) return [];
  const mode = session.mode;
  if (joker === 'FR53') return finalHand(session).filter((id) => id !== 'FR53').map((id) => CARDS_BY_ID[id]);
  return cardPool(mode).filter((card) => canJokerCopy(joker, card.id, mode));
}

export function currentFamily(session: ScoringSession, id: CardId): Family {
  const choice = JOKERS.includes(id as JokerId) ? session.jokerChoices[id as JokerId] : undefined;
  return CARDS_BY_ID[choice && choice !== 'NONE' ? choice : id].families[0];
}

export function hasBook(session: ScoringSession): boolean {
  return finalHand(session).includes('FR49');
}

export function bookTargets(session: ScoringSession): Card[] {
  return finalHand(session)
    .filter((id) => id !== 'FR49' && id !== 'FR55')
    .map((id) => CARDS_BY_ID[id]);
}

export function bookFamilies(session: ScoringSession, target: CardId): Family[] {
  if (!session.mode) return [];
  const current = currentFamily(session, target);
  return modeFamilies(session.mode).filter((family) => family !== 'JOKER' && family !== current);
}

export function familiesAfterChoices(session: ScoringSession, id: CardId): readonly Family[] {
  const book = session.bookChoice;
  if (book && book !== 'NONE' && book.target === id) return [book.family];
  const copy = JOKERS.includes(id as JokerId) ? session.jokerChoices[id as JokerId] : undefined;
  if (!copy || copy === 'NONE') return CARDS_BY_ID[id].families;
  if (id === 'FR53' && copy !== 'FR55') return CARDS_BY_ID[copy].families;
  return [CARDS_BY_ID[copy].families[0]];
}

export function hasPenaltyAfterChoices(session: ScoringSession, id: CardId): boolean {
  const copy = session.jokerChoices.FR53;
  return CARDS_BY_ID[id === 'FR53' && copy && copy !== 'NONE' ? copy : id].hasPenalty;
}

export function islandTargets(session: ScoringSession): Card[] {
  const hand = finalHand(session);
  if (!hand.includes('FR09')) return [];
  return hand
    .filter((id) => id !== 'FR09' && hasPenaltyAfterChoices(session, id))
    .filter((id) => {
      const families = familiesAfterChoices(session, id);
      if (!families.some((family) => family === 'VAGUE' || family === 'FLAMME')) return false;
      return !hand.some((other) => other !== id && clearsPenalty(other, { id, families }, DEFAULT_RULINGS));
    })
    .map((id) => CARDS_BY_ID[id]);
}

export function angelTargets(session: ScoringSession): Card[] {
  if (!finalHand(session).includes('CH08')) return [];
  return finalHand(session)
    .filter((id) => id !== 'CH08')
    .map((id) => CARDS_BY_ID[id]);
}

export function needsPlayerCount(session: ScoringSession): boolean {
  return finalHand(session).includes('CH06') || session.cursedItems.includes('CH24');
}

export function asksPlayerCount(session: ScoringSession): boolean {
  return needsPlayerCount(session) && !session.game;
}

export function neededDiscardFamilies(session: ScoringSession): Family[] {
  if (!session.mode || !hasExtraFamilies(session.mode)) return [];
  const needed = new Set(finalHand(session).flatMap((id) => DISCARD_FAMILIES[id] ?? []));
  return [...BASE_FAMILIES, ...EXTENSION_FAMILIES].filter((family) => needed.has(family));
}

export function needsLicorne(session: ScoringSession): boolean {
  return finalHand(session).includes('CH11');
}

const GUARDS: Record<Step, (session: ScoringSession) => boolean> = {
  MODE: () => true,
  HAND: (session) => session.mode !== null,
  CURSED: (session) => session.mode !== null && hasCursedItems(session.mode),
  BONUS: (session) => bonusSources(session).length > 0,
  JOKERS: (session) => jokersInHand(session).length > 0,
  BOOK: hasBook,
  ISLAND: (session) => islandTargets(session).length > 0,
  ANGEL: (session) => angelTargets(session).length > 0,
  CONTEXT: (session) => asksPlayerCount(session) || neededDiscardFamilies(session).length > 0,
  RECAP: (session) => session.game !== null,
  RESULT: (session) => session.mode !== null && session.game === null,
};

const ORDER: Step[] = [
  'MODE',
  'HAND',
  'CURSED',
  'BONUS',
  'JOKERS',
  'BOOK',
  'ISLAND',
  'ANGEL',
  'CONTEXT',
  'RECAP',
  'RESULT',
];

export function shownSteps(session: ScoringSession): Step[] {
  return ORDER.filter((step) => GUARDS[step](session));
}

export function nextStep(session: ScoringSession, current: Step): Step {
  const steps = shownSteps(session);
  return steps[steps.indexOf(current) + 1] ?? 'RESULT';
}

export function previousStep(session: ScoringSession, current: Step): Step {
  const steps = shownSteps(session);
  return steps[steps.indexOf(current) - 1] ?? 'MODE';
}

export function canContinue(session: ScoringSession, step: Step): boolean {
  switch (step) {
    case 'HAND':
      return isHandComplete(session);
    case 'BONUS':
      return session.bonusCard !== null || session.bonusSkipped;
    case 'JOKERS':
      return jokersInHand(session).every((joker) => session.jokerChoices[joker] !== undefined);
    case 'BOOK':
      return session.bookChoice !== null;
    case 'ISLAND':
      return session.islandChoice !== null;
    case 'ANGEL':
      return session.angelChoice !== null;
    case 'CONTEXT':
      return !needsPlayerCount(session) || session.playerCount !== null;
    default:
      return true;
  }
}
