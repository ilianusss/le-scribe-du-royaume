import type { CardId, Family } from '@/data/cards';

import type { Rulings } from './rulings';
import type { DiscardCounts } from './types';

export interface WorkingCard {
  id: CardId;
  nameId: CardId | null;
  families: Family[];
  strength: number;
  malusId: CardId | null;
  masked: boolean;
  selfMasked: boolean;
  maskedBy: CardId[];
  penaltyCleared: boolean;
  clearedBy: CardId[];
  armyWordCleared: boolean;
  familyChangedBy: CardId | null;
}

export interface HandState {
  all: WorkingCard[];
  active: WorkingCard[];
  ext: boolean;
  playerCount: number;
  discard: DiscardCounts;
  rulings: Rulings;
}

type ScoreFn = (self: WorkingCard, hand: HandState) => number;
type BlankFn = (blanker: WorkingCard, target: WorkingCard, hand: HandState) => boolean;
type SelfMaskFn = (self: WorkingCard, hand: HandState) => boolean;

const is = (card: WorkingCard, family: Family) => card.families.includes(family);

export function count(hand: HandState, family: Family): number {
  return hand.active.filter((card) => is(card, family)).length;
}

function countOther(hand: HandState, family: Family, self: WorkingCard): number {
  return hand.active.filter((card) => card !== self && is(card, family)).length;
}

function has(hand: HandState, family: Family): boolean {
  return hand.active.some((card) => is(card, family));
}

function hasName(hand: HandState, ...ids: CardId[]): boolean {
  return hand.active.some((card) => card.nameId !== null && ids.includes(card.nameId));
}

function countName(hand: HandState, id: CardId): number {
  return hand.active.filter((card) => card.nameId === id).length;
}

function disc(hand: HandState, family: Family): number {
  return hand.discard[family] ?? 0;
}

function firstThenEach(n: number): number {
  return n >= 1 ? 10 + 5 * (n - 1) : 0;
}

function collectorBonus(hand: HandState): number {
  const namesByFamily = new Map<Family, Set<string>>();
  for (const card of hand.active) {
    for (const family of card.families) {
      const names = namesByFamily.get(family) ?? new Set<string>();
      names.add(card.nameId ?? `generic:${card.id}`);
      namesByFamily.set(family, names);
    }
  }
  let bonus = 0;
  for (const names of namesByFamily.values()) {
    if (names.size === 3) bonus += 10;
    else if (names.size === 4) bonus += 40;
    else if (names.size >= 5) bonus += 100;
  }
  return bonus;
}

const RUN_BONUS = [0, 0, 0, 10, 30, 60, 100, 150];

function gemBonus(hand: HandState): number {
  const strengths = hand.active.map((card) => card.strength);
  let bonus = 0;
  for (;;) {
    const values = [...new Set(strengths)].sort((a, b) => a - b);
    let best: number[] = [];
    let run: number[] = [];
    for (const value of values) {
      run = run.length > 0 && value === run[run.length - 1] + 1 ? [...run, value] : [value];
      if (run.length > best.length) best = run;
    }
    if (best.length < 3) return bonus;
    bonus += RUN_BONUS[Math.min(best.length, 7)];
    for (const value of best) strengths.splice(strengths.indexOf(value), 1);
  }
}

function worldTreeBonus(hand: HandState): number {
  const seen = new Set<Family>();
  for (const card of hand.active) {
    for (const family of card.families) {
      if (seen.has(family)) return 0;
      seen.add(family);
    }
  }
  return hand.ext ? hand.rulings.worldTreeBonus.extension : hand.rulings.worldTreeBonus.base;
}

function jesterBonus(hand: HandState): number {
  const isOdd = (card: WorkingCard) => Math.abs(card.strength) % 2 === 1;
  if (hand.all.every((card) => !card.masked && isOdd(card))) return 50;
  return 3 * (hand.active.filter(isOdd).length - 1);
}

const FOUNTAIN_FAMILIES: Family[] = ['ARME', 'VAGUE', 'FLAMME', 'TERRAIN', 'CLIMAT'];

function fountainBonus(hand: HandState): number {
  const families = hand.ext ? [...FOUNTAIN_FAMILIES, 'BATIMENT' as const] : FOUNTAIN_FAMILIES;
  const strengths = hand.active
    .filter((card) => card.families.some((family) => families.includes(family)))
    .map((card) => card.strength);
  return Math.max(0, ...strengths);
}

function sumStrength(hand: HandState, family: Family): number {
  return hand.active.filter((card) => is(card, family)).reduce((sum, card) => sum + card.strength, 0);
}

export const BONUS: Partial<Record<CardId, ScoreFn>> = {
  FR01: (_, h) => (hasName(h, 'FR13') && hasName(h, 'FR16') ? 50 : 0),
  FR02: (_, h) => (hasName(h, 'FR24', 'FR39') ? 25 : 0),
  FR03: (_, h) => (has(h, 'SORCIER') ? 15 : 0),
  FR04: (_, h) => 12 * count(h, 'CREATURE') + (hasName(h, 'FR22') ? 12 : 0),
  FR05: (s, h) => 15 * countOther(h, 'TERRAIN', s),
  CH05: (_, h) => 11 * (count(h, 'SEIGNEUR') + count(h, 'CREATURE')),
  FR06: (_, h) => fountainBonus(h),
  FR10: (s, h) => 15 * countOther(h, 'VAGUE', s),
  FR11: (_, h) => 10 * count(h, 'VAGUE'),
  FR14: (_, h) => (hasName(h, 'FR11') && hasName(h, 'FR12', 'FR08') ? 40 : 0),
  FR15: (s, h) => 15 * countOther(h, 'CLIMAT', s),
  FR17: (_, h) => (hasName(h, 'FR49') && hasName(h, 'FR03', 'CH16') && has(h, 'SORCIER') ? 100 : 0),
  FR18: (_, h) => 9 * (count(h, 'ARME') + count(h, 'ARTEFACT')),
  FR19: (_, h) => (hasName(h, 'FR11') ? 30 : 0),
  FR20: (s, h) => 15 * countOther(h, 'FLAMME', s),
  FR22: (_, h) => (has(h, 'CLIMAT') ? 0 : 5),
  FR25: (_, h) => 10 * (count(h, 'TERRAIN') + (h.ext ? count(h, 'BATIMENT') : 0)),
  FR26: (_, h) => collectorBonus(h),
  FR27: (_, h) => 9 * count(h, 'CREATURE'),
  FR30: (_, h) => 5 * (count(h, 'TERRAIN') + count(h, 'CLIMAT') + count(h, 'VAGUE') + count(h, 'FLAMME')),
  FR54: (_, h) => jesterBonus(h),
  FR31: (_, h) => (hasName(h, 'FR32') ? 20 : 5) * count(h, 'ARMEE'),
  FR32: (_, h) => (hasName(h, 'FR31') ? 20 : 5) * count(h, 'ARMEE'),
  FR33: (s, h) => 8 * (count(h, 'ARMEE') + count(h, 'SORCIER') + countOther(h, 'SEIGNEUR', s)),
  FR34: (_, h) => sumStrength(h, 'ARMEE'),
  FR35: (_, h) => 10 * count(h, 'ARMEE'),
  FR36: (_, h) => (hasName(h, 'FR33') ? 30 : hasName(h, 'FR35', 'FR32', 'FR30') ? 15 : 0),
  FR38: (_, h) => (has(h, 'SEIGNEUR') || has(h, 'SORCIER') ? 14 : 0),
  FR40: (_, h) => (hasName(h, 'FR07') ? 28 : 0),
  FR42: (_, h) => (has(h, 'SORCIER') ? 25 : 0),
  FR43: (_, h) => (has(h, 'SEIGNEUR') ? (hasName(h, 'FR46') ? 40 : 10) : 0),
  FR44: (_, h) => (hasName(h, 'FR22', 'FR34', 'FR27') ? 30 : 0),
  FR46: (_, h) => (has(h, 'SEIGNEUR') ? (hasName(h, 'FR43') ? 40 : 15) : 0),
  FR47: (_, h) => gemBonus(h),
  FR48: (_, h) => worldTreeBonus(h),
  CH16: (_, h) => (has(h, 'SORCIER') || has(h, 'MORT_VIVANT') ? 15 : 0),
  CH01: (_, h) =>
    firstThenEach(count(h, 'MORT_VIVANT')) +
    firstThenEach(count(h, 'CREATURE')) +
    firstThenEach(count(h, 'ARTEFACT')) +
    5 * (countName(h, 'FR28') + countName(h, 'FR29') + countName(h, 'CH10')),
  CH02: (s, h) =>
    (has(h, 'SEIGNEUR') ? 10 : 0) +
    (has(h, 'ARMEE') ? 10 : 0) +
    (has(h, 'TERRAIN') ? 10 : 0) +
    firstThenEach(countOther(h, 'BATIMENT', s)),
  CH03: (_, h) => sumStrength(h, 'MORT_VIVANT'),
  CH04: (_, h) =>
    count(h, 'SEIGNEUR') + count(h, 'SORCIER') + count(h, 'EXTERIEUR') + count(h, 'MORT_VIVANT') === 2 ? 40 : 0,
  CH06: (_, h) => 10 * (h.playerCount - 1),
  CH07: (_, h) => 10 * h.active.filter((card) => card.malusId !== null && !card.penaltyCleared).length,
  CH11: (_, h) =>
    5 * (disc(h, 'TERRAIN') + disc(h, 'VAGUE') + disc(h, 'FLAMME') + disc(h, 'CLIMAT') + (h.discard.licorne ? 1 : 0)),
  CH12: (_, h) =>
    4 * (disc(h, 'SORCIER') + disc(h, 'SEIGNEUR') + disc(h, 'ARMEE') + disc(h, 'CREATURE') + disc(h, 'MORT_VIVANT')),
  CH13: (_, h) => 6 * (disc(h, 'SORCIER') + disc(h, 'ARTEFACT') + disc(h, 'EXTERIEUR')),
  CH14: (s, h) => (hasName(h, 'FR28') ? 10 : 0) + 10 * countOther(h, 'MORT_VIVANT', s),
  CH15: (_, h) => 7 * (disc(h, 'ARME') + disc(h, 'ARMEE')),
};

const armyCount = (self: WorkingCard, hand: HandState) => (self.armyWordCleared ? 0 : count(hand, 'ARMEE'));

export const MALUS: Partial<Record<CardId, ScoreFn>> = {
  FR07: (s, h) => -3 * (count(h, 'FLAMME') + armyCount(s, h)),
  FR12: (s, h) => -5 * (count(h, 'SEIGNEUR') + count(h, 'CREATURE') + count(h, 'FLAMME') + armyCount(s, h)),
  FR21: (_, h) => (has(h, 'SEIGNEUR') ? 0 : -8),
  FR23: (_, h) => -2 * count(h, 'TERRAIN'),
  FR24: (s, h) => (s.armyWordCleared ? 0 : -2 * countOther(h, 'ARMEE', s)),
  FR29: (s, h) => -10 * (count(h, 'SEIGNEUR') + countOther(h, 'SORCIER', s)),
  FR35: (s, h) => -5 * countOther(h, 'SEIGNEUR', s),
  FR39: (_, h) => (has(h, 'SORCIER') ? 0 : -40),
};

const WILDFIRE_SAFE_FAMILIES: Family[] = ['FLAMME', 'SORCIER', 'CLIMAT', 'ARME', 'ARTEFACT'];
const WILDFIRE_SAFE_NAMES: CardId[] = ['FR01', 'FR08', 'FR09', 'FR36', 'FR39'];

export const BLANKS: Partial<Record<CardId, BlankFn>> = {
  FR08: (b, t, h) =>
    (is(t, 'ARMEE') && !b.armyWordCleared) ||
    (is(t, 'TERRAIN') && t.nameId !== 'FR01') ||
    (is(t, 'FLAMME') && t.nameId !== 'FR19') ||
    (h.ext && is(t, 'BATIMENT')),
  FR11: (_, t) => is(t, 'FLAMME') && t.nameId !== 'FR19',
  FR12: (_, t) => is(t, 'VAGUE'),
  FR16: (_, t, h) =>
    !(
      t.families.some((family) => WILDFIRE_SAFE_FAMILIES.includes(family)) ||
      (t.nameId !== null && WILDFIRE_SAFE_NAMES.includes(t.nameId)) ||
      (!h.rulings.wildfireBlanksUnusedJoker && is(t, 'JOKER'))
    ),
  FR37: (b, t) => (is(t, 'ARMEE') && !b.armyWordCleared) || is(t, 'SEIGNEUR') || (is(t, 'CREATURE') && t !== b),
  CH03: (_, t) => is(t, 'SEIGNEUR'),
};

export const SELF_MASK_ORDER: CardId[] = ['FR55', 'FR13', 'FR41', 'CH05', 'FR45'];

export const SELF_MASK: Partial<Record<CardId, SelfMaskFn>> = {
  FR55: (_, h) => has(h, 'VAGUE'),
  FR13: (_, h) => !has(h, 'FLAMME'),
  FR41: (_, h) => !has(h, 'VAGUE'),
  CH05: (_, h) => has(h, 'MORT_VIVANT') || hasName(h, 'FR28', 'CH10'),
  FR45: (s, h) =>
    (!has(h, 'ARMEE') && !(h.rulings.dirigibleArmyWordClearWaivesArmyCondition && s.armyWordCleared)) ||
    h.active.some((card) => card !== s && is(card, 'CLIMAT') && card.id !== 'FR55'),
};
