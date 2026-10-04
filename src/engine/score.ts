import {
  CARDS_BY_ID,
  hasCursedItems,
  hasExtraFamilies,
  isInPool,
  modeFamilies,
  type CardId,
  type Family,
  type Mode,
} from '@/data/cards';
import { CURSED_ITEMS_BY_ID, type CursedItemId } from '@/data/cursedItems';

import {
  ARMY_WORD_MALUS,
  BLANKS,
  BONUS,
  MALUS,
  SELF_MASK,
  SELF_MASK_ORDER,
  type HandState,
  type WorkingCard,
} from './cardLogic';
import { DEFAULT_RULINGS, type Rulings } from './rulings';
import type { CardTrace, Choices, ChosenOption, CursedTrace, ScoreContext, ScoreResult } from './types';

export const MIRAGE_FAMILIES: Family[] = ['TERRAIN', 'ARMEE', 'CLIMAT', 'VAGUE', 'FLAMME'];
export const SHAPESHIFTER_FAMILIES: Family[] = ['ARTEFACT', 'SEIGNEUR', 'SORCIER', 'ARME', 'CREATURE'];

export function jokerFamilies(jokerId: 'FR51' | 'FR52', mode: Mode): Family[] {
  if (jokerId === 'FR52') return hasExtraFamilies(mode) ? [...MIRAGE_FAMILIES, 'BATIMENT'] : MIRAGE_FAMILIES;
  return hasExtraFamilies(mode) ? [...SHAPESHIFTER_FAMILIES, 'MORT_VIVANT'] : SHAPESHIFTER_FAMILIES;
}

function workingCard(id: CardId): WorkingCard {
  const card = CARDS_BY_ID[id];
  return {
    id,
    nameId: id,
    families: [...card.families],
    strength: card.strength,
    malusId: card.hasPenalty ? id : null,
    masked: false,
    maskReason: null,
    penaltyCleared: false,
    clearedBy: [],
    armyWordCleared: false,
    armyWordClearedBy: [],
    familyChangedBy: null,
  };
}

export function canJokerCopy(jokerId: 'FR51' | 'FR52', target: CardId, mode: Mode): boolean {
  const card = CARDS_BY_ID[target];
  return !!card && isInPool(card, mode) && jokerFamilies(jokerId, mode).includes(card.families[0]);
}

export interface ClearTarget {
  id: CardId;
  families: readonly Family[];
}

export function clearsPenalty(clearerId: CardId, target: ClearTarget, rulings: Rulings): boolean {
  switch (clearerId) {
    case 'FR01':
      return target.families.includes('VAGUE');
    case 'FR02':
      return target.families.includes('CLIMAT');
    case 'FR27':
      return (
        target.families.includes('CREATURE') && (target.id !== 'FR55' || rulings.phoenixPenaltyClearedByBeastmaster)
      );
    case 'FR50':
      return true;
    default:
      return false;
  }
}

function clear(target: WorkingCard, by: CardId) {
  if (target.malusId === null || target.penaltyCleared) return;
  target.penaltyCleared = true;
  target.clearedBy.push(by);
}

export function scoreHand(hand: readonly CardId[], context: ScoreContext, choices: Choices = {}): ScoreResult {
  const rulings = context.rulings ?? DEFAULT_RULINGS;
  const mode = context.mode;
  const ext = hasExtraFamilies(mode);
  const cards = hand.map(workingCard);
  const byId = new Map(cards.map((card) => [card.id, card]));
  const chosen = new Map<CardId, ChosenOption>();
  const applied: Choices = {};

  // Step 1: copies and transformations, in rulebook order.
  const doppelganger = byId.get('FR53');
  if (doppelganger && choices.doppelganger && choices.doppelganger !== 'FR53' && byId.has(choices.doppelganger)) {
    const target = CARDS_BY_ID[choices.doppelganger];
    doppelganger.nameId = target.id;
    doppelganger.families = target.id === 'FR55' ? ['CREATURE'] : [...target.families];
    doppelganger.strength = target.strength;
    doppelganger.malusId = target.hasPenalty ? target.id : null;
    chosen.set('FR53', { kind: 'copy', cardId: target.id });
    applied.doppelganger = target.id;
  }
  for (const [jokerId, copy] of [
    ['FR52', choices.mirage],
    ['FR51', choices.shapeshifter],
  ] as const) {
    const joker = byId.get(jokerId);
    if (!joker || !copy || !canJokerCopy(jokerId, copy, mode)) continue;
    joker.nameId = copy;
    joker.families = [CARDS_BY_ID[copy].families[0]];
    chosen.set(jokerId, { kind: 'copy', cardId: copy });
    if (jokerId === 'FR52') applied.mirage = copy;
    else applied.shapeshifter = copy;
  }
  const book = choices.book;
  const bookTarget = book ? byId.get(book.target) : undefined;
  if (
    byId.has('FR49') &&
    book &&
    bookTarget &&
    !['FR49', 'FR55'].includes(bookTarget.id) &&
    book.family !== 'JOKER' &&
    modeFamilies(mode).includes(book.family)
  ) {
    bookTarget.families = [book.family];
    bookTarget.familyChangedBy = 'FR49';
    chosen.set('FR49', { kind: 'book', target: bookTarget.id, family: book.family });
    applied.book = { target: bookTarget.id, family: book.family };
  }
  const islandTarget = choices.island ? byId.get(choices.island) : undefined;
  const validIsland =
    byId.has('FR09') && islandTarget && (islandTarget.families.includes('VAGUE') || islandTarget.families.includes('FLAMME'))
      ? islandTarget
      : undefined;
  if (validIsland) {
    chosen.set('FR09', { kind: 'island', target: validIsland.id });
    applied.island = validIsland.id;
  }
  const angelTarget = choices.angel && choices.angel !== 'CH08' ? byId.get(choices.angel) : undefined;
  const validAngel = byId.has('CH08') ? angelTarget : undefined;
  if (validAngel) {
    chosen.set('CH08', { kind: 'angel', target: validAngel.id });
    applied.angel = validAngel.id;
  }

  // Step 2: clearing happens before any masking.
  for (const clearer of cards) {
    for (const target of cards) {
      if (target === clearer) continue;
      if (clearsPenalty(clearer.id, target, rulings)) clear(target, clearer.id);
      switch (clearer.id) {
        case 'FR09':
          if (target === validIsland) clear(target, clearer.id);
          break;
        case 'FR25':
          target.armyWordCleared = true;
          target.armyWordClearedBy.push(clearer.id);
          break;
        case 'FR41':
          if (target.families.includes('VAGUE')) {
            target.armyWordCleared = true;
            target.armyWordClearedBy.push(clearer.id);
          }
          break;
      }
    }
  }

  // Step 3: protections.
  const alwaysProtected = new Set<WorkingCard>();
  const angel = byId.get('CH08');
  if (angel) alwaysProtected.add(angel);
  if (validAngel) alwaysProtected.add(validAngel);
  if (ext && (byId.has('CH14') || byId.has('FR28'))) {
    for (const card of cards) if (card.families.includes('MORT_VIVANT')) alwaysProtected.add(card);
  }
  const protectedFromOthers = (card: WorkingCard) => alwaysProtected.has(card) || card.id === 'FR55';

  const state: HandState = {
    all: cards,
    active: cards,
    ext,
    playerCount: context.playerCount ?? 1,
    discard: context.discard ?? {},
    rulings,
  };
  const refreshActive = () => {
    state.active = cards.filter((card) => !card.masked);
  };

  // Step 4: Démon, before any other masking.
  const familyCounts = new Map<Family, number>();
  for (const card of cards) {
    for (const family of card.families) familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
  }
  const demons = cards.filter((card) => card.malusId === 'CH10' && !card.penaltyCleared);
  for (const target of cards) {
    if (target.families.includes('EXTERIEUR') || protectedFromOthers(target)) continue;
    if (demons.length > 0 && target.families.some((family) => familyCounts.get(family) === 1)) {
      target.masked = true;
      target.maskReason = { kind: 'by', cards: demons.map((demon) => demon.id) };
    }
  }
  refreshActive();

  // Step 5: blanking (reference §4.1).
  const candidates = state.active;
  const blankers = candidates.filter(
    (card) => card.malusId !== null && BLANKS[card.malusId] !== undefined && !card.penaltyCleared,
  );
  const incoming = new Map<WorkingCard, WorkingCard[]>();
  for (const target of candidates) {
    if (protectedFromOthers(target)) continue;
    const sources = blankers.filter((blanker) => BLANKS[blanker.malusId as CardId]!(blanker, target, state));
    if (sources.length > 0) incoming.set(target, sources);
  }
  const edge = (from: WorkingCard, to: WorkingCard) => incoming.get(to)?.includes(from) ?? false;
  const isMasked = (target: WorkingCard, stack: WorkingCard[]): boolean => {
    for (const blanker of incoming.get(target) ?? []) {
      if (edge(target, blanker)) return true;
      if (stack.includes(blanker)) {
        if (rulings.blankingCycleMasksAll) return true;
        continue;
      }
      if (!isMasked(blanker, [...stack, blanker])) return true;
    }
    return false;
  };
  const blanked = candidates.filter((card) => isMasked(card, [card]));
  for (const card of blanked) card.masked = true;
  for (const card of blanked) {
    const others = (incoming.get(card) ?? []).filter((source) => source !== card);
    const activeOthers = others.filter((source) => !source.masked);
    card.maskReason =
      activeOthers.length > 0
        ? { kind: 'by', cards: activeOthers.map((source) => source.id) }
        : edge(card, card)
          ? { kind: 'ownMalus' }
          : { kind: 'by', cards: others.map((source) => source.id) };
  }
  refreshActive();

  // Step 6: self-conditional masking, repeated until stable.
  let changed = true;
  while (changed) {
    changed = false;
    for (const malusId of SELF_MASK_ORDER) {
      for (const card of state.active) {
        if (card.malusId !== malusId || card.penaltyCleared || alwaysProtected.has(card)) continue;
        const reason = SELF_MASK[malusId]!(card, state);
        if (reason) {
          card.masked = true;
          card.maskReason = reason;
          changed = true;
          refreshActive();
        }
      }
    }
  }

  // Step 7: score active cards.
  const traces: CardTrace[] = cards.map((card) => {
    const bonusFn = BONUS[card.id];
    const malusFn = card.malusId !== null && !card.penaltyCleared ? MALUS[card.malusId] : undefined;
    const bonus = !card.masked && bonusFn ? bonusFn(card, state) : 0;
    const malus = !card.masked && malusFn ? malusFn(card, state) : 0;
    return {
      id: card.id,
      families: card.families,
      base: card.strength,
      bonus,
      malus,
      total: card.masked ? 0 : card.strength + bonus + malus,
      masked: card.masked,
      maskReason: card.maskReason,
      penaltyCleared: card.penaltyCleared,
      clearedBy: card.clearedBy,
      armyWordClearedBy:
        card.malusId !== null && ARMY_WORD_MALUS.includes(card.malusId) && !card.penaltyCleared
          ? card.armyWordClearedBy
          : [],
      familyChangedBy: card.familyChangedBy,
      chosen: chosen.get(card.id) ?? null,
    };
  });

  // Step 8: face-down cursed items.
  const cursed: CursedTrace[] = hasCursedItems(mode)
    ? (context.cursedItems ?? []).map((id) => cursedValue(id, context))
    : [];
  const cursedTotal = cursed.reduce((sum, item) => sum + item.value, 0);

  const tieBreak = rulings.tieBreakUsesPrintedStrengthOfAllCards
    ? hand.reduce((sum, id) => sum + CARDS_BY_ID[id].strength, 0)
    : state.active.reduce((sum, card) => sum + card.strength, 0);

  return {
    total: traces.reduce((sum, trace) => sum + trace.total, 0) + cursedTotal,
    cards: traces,
    cursed,
    cursedTotal,
    tieBreak,
    choices: applied,
  };
}

export function cursedValue(id: CursedItemId, context: ScoreContext): CursedTrace {
  const others = (context.cursedItems ?? []).filter((other) => other !== id).length;
  switch (id) {
    case 'CH24':
      return { id, value: context.playerCount === 2 ? -10 : -1 };
    case 'CH39':
      return { id, value: -5 + (others >= 3 ? 25 : 0) };
    default:
      return { id, value: CURSED_ITEMS_BY_ID[id].value };
  }
}
