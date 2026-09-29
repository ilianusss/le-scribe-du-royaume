import { BASE_FAMILIES, EXTENSION_FAMILIES, HAND_SIZE, cardPool, type Card, type CardId, type Family } from '@/data/cards';

import type { ScoringSession } from './session';

export type Step = 'MODE' | 'HAND' | 'CURSED' | 'BONUS' | 'CONTEXT' | 'RESULT';

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

function finalHand(session: ScoringSession): CardId[] {
  return session.bonusCard ? [...session.hand, session.bonusCard] : session.hand;
}

export function bonusSources(session: ScoringSession): BonusSource[] {
  const sources: BonusSource[] = [];
  if (session.hand.includes('FR28')) sources.push('FR28');
  if (session.mode === 'EXTENSION') {
    if (session.hand.includes('CH09')) sources.push('CH09');
    if (session.hand.includes('CH06')) sources.push('CH06');
    if (session.cursedItems.includes('CH46')) sources.push('CH46');
  }
  return sources;
}

export function bonusPool(session: ScoringSession): Card[] {
  if (!session.mode) return [];
  const sources = bonusSources(session);
  const families =
    session.mode === 'EXTENSION' ? [...NECROMANCER_FAMILIES, 'MORT_VIVANT' as const] : NECROMANCER_FAMILIES;
  const onlyNecromancer = sources.length === 1 && sources[0] === 'FR28';
  return cardPool(session.mode).filter(
    (card) => !session.hand.includes(card.id) && (!onlyNecromancer || families.includes(card.families[0])),
  );
}

export function needsPlayerCount(session: ScoringSession): boolean {
  return session.mode === 'EXTENSION' && (finalHand(session).includes('CH06') || session.cursedItems.includes('CH24'));
}

export function neededDiscardFamilies(session: ScoringSession): Family[] {
  if (session.mode !== 'EXTENSION') return [];
  const needed = new Set(finalHand(session).flatMap((id) => DISCARD_FAMILIES[id] ?? []));
  return [...BASE_FAMILIES, ...EXTENSION_FAMILIES].filter((family) => needed.has(family));
}

export function needsLicorne(session: ScoringSession): boolean {
  return session.mode === 'EXTENSION' && finalHand(session).includes('CH11');
}

const GUARDS: Record<Step, (session: ScoringSession) => boolean> = {
  MODE: () => true,
  HAND: (session) => session.mode !== null,
  CURSED: (session) => session.mode === 'EXTENSION',
  BONUS: (session) => bonusSources(session).length > 0,
  CONTEXT: (session) => needsPlayerCount(session) || neededDiscardFamilies(session).length > 0,
  RESULT: (session) => session.mode !== null,
};

const ORDER: Step[] = ['MODE', 'HAND', 'CURSED', 'BONUS', 'CONTEXT', 'RESULT'];

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
    case 'CONTEXT':
      return !needsPlayerCount(session) || session.playerCount !== null;
    default:
      return true;
  }
}
