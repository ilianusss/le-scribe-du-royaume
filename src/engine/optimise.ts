import { CARDS_BY_ID, cardPool, modeFamilies, type CardId, type Family, type Mode } from '@/data/cards';

import { BLANKS, SELF_MASK } from './cardLogic';
import { jokerFamilies, scoreHand } from './score';
import type { Choices, JokerCopy, ScoreContext, ScoreResult } from './types';

const NAME_REFERENCES: Partial<Record<CardId, CardId[]>> = {
  FR01: ['FR13', 'FR16'],
  FR02: ['FR24', 'FR39'],
  FR04: ['FR22'],
  FR08: ['FR01', 'FR19'],
  FR11: ['FR19'],
  FR14: ['FR11', 'FR12', 'FR08'],
  FR16: ['FR01', 'FR08', 'FR09', 'FR36', 'FR39'],
  FR17: ['FR49', 'FR03', 'CH16'],
  FR19: ['FR11'],
  FR31: ['FR32'],
  FR32: ['FR31'],
  FR36: ['FR33', 'FR35', 'FR32', 'FR30'],
  FR40: ['FR07'],
  FR43: ['FR46'],
  FR44: ['FR22', 'FR34', 'FR27'],
  FR46: ['FR43'],
  CH01: ['FR28', 'FR29', 'CH10'],
  CH05: ['FR28', 'CH10'],
  CH14: ['FR28'],
};

const FAMILY_REFERENCES: Partial<Record<CardId, Family[]>> = {
  FR01: ['VAGUE'],
  FR02: ['CLIMAT'],
  FR03: ['SORCIER'],
  FR04: ['CREATURE'],
  FR05: ['TERRAIN'],
  CH05: ['SEIGNEUR', 'CREATURE', 'MORT_VIVANT'],
  FR06: ['ARME', 'VAGUE', 'FLAMME', 'TERRAIN', 'CLIMAT', 'BATIMENT'],
  FR07: ['ARMEE', 'FLAMME'],
  FR08: ['ARMEE', 'TERRAIN', 'FLAMME', 'BATIMENT'],
  FR09: ['VAGUE', 'FLAMME'],
  FR10: ['VAGUE'],
  FR11: ['VAGUE', 'FLAMME'],
  FR12: ['VAGUE', 'ARMEE', 'SEIGNEUR', 'CREATURE', 'FLAMME'],
  FR13: ['FLAMME'],
  FR15: ['CLIMAT'],
  FR16: ['FLAMME', 'SORCIER', 'CLIMAT', 'ARME', 'ARTEFACT'],
  FR17: ['SORCIER'],
  FR18: ['ARME', 'ARTEFACT'],
  FR20: ['FLAMME'],
  FR21: ['SEIGNEUR'],
  FR22: ['CLIMAT'],
  FR23: ['TERRAIN'],
  FR24: ['ARMEE'],
  FR25: ['TERRAIN', 'BATIMENT', 'ARMEE'],
  FR27: ['CREATURE'],
  FR28: ['MORT_VIVANT'],
  FR29: ['SEIGNEUR', 'SORCIER'],
  FR30: ['TERRAIN', 'CLIMAT', 'VAGUE', 'FLAMME'],
  FR31: ['ARMEE'],
  FR32: ['ARMEE'],
  FR33: ['ARMEE', 'SORCIER', 'SEIGNEUR'],
  FR34: ['ARMEE'],
  FR35: ['ARMEE', 'SEIGNEUR'],
  FR37: ['ARMEE', 'SEIGNEUR', 'CREATURE'],
  FR38: ['SEIGNEUR', 'SORCIER'],
  FR39: ['SORCIER'],
  FR41: ['VAGUE', 'ARMEE'],
  FR42: ['SORCIER'],
  FR43: ['SEIGNEUR'],
  FR45: ['ARMEE', 'CLIMAT'],
  FR46: ['SEIGNEUR'],
  FR55: ['VAGUE'],
  CH16: ['SORCIER', 'MORT_VIVANT'],
  CH01: ['MORT_VIVANT', 'CREATURE', 'ARTEFACT'],
  CH02: ['SEIGNEUR', 'ARMEE', 'TERRAIN', 'BATIMENT'],
  CH03: ['MORT_VIVANT', 'SEIGNEUR'],
  CH04: ['SEIGNEUR', 'SORCIER', 'EXTERIEUR', 'MORT_VIVANT'],
  CH10: ['EXTERIEUR'],
  CH14: ['MORT_VIVANT'],
};

function relevantFamilies(hand: readonly CardId[]): Set<Family> {
  const families = new Set<Family>();
  const countsPresentFamilies = hand.includes('FR26') || hand.includes('CH10');
  for (const id of hand) {
    for (const family of FAMILY_REFERENCES[id] ?? []) families.add(family);
    if (countsPresentFamilies) for (const family of CARDS_BY_ID[id].families) families.add(family);
  }
  return families;
}

function withRepresentative(candidates: readonly Family[], relevant: Set<Family>): Family[] {
  const kept = candidates.filter((family) => relevant.has(family));
  const representative = candidates.find((family) => !relevant.has(family));
  return representative ? [...kept, representative] : kept;
}

function jokerOptions(jokerId: 'FR51' | 'FR52', hand: readonly CardId[], mode: Mode, relevant: Set<Family>) {
  const eligible = jokerFamilies(jokerId, mode);
  const referenced = new Set(hand.flatMap((id) => NAME_REFERENCES[id] ?? []));
  const named: JokerCopy[] = cardPool(mode)
    .filter((card) => referenced.has(card.id) && eligible.includes(card.families[0]))
    .map((card) => ({ cardId: card.id }));
  const generic: JokerCopy[] = withRepresentative(eligible, relevant).map((family) => ({ family }));
  return [null, ...named, ...generic];
}

function bookOptions(hand: readonly CardId[], mode: Mode, relevant: Set<Family>) {
  const families = withRepresentative(
    modeFamilies(mode).filter((family) => family !== 'JOKER'),
    relevant,
  );
  const options: Choices['book'][] = [null];
  for (const target of hand) {
    if (target === 'FR49' || target === 'FR55') continue;
    for (const family of families) {
      if (CARDS_BY_ID[target].families[0] !== family) options.push({ target, family });
    }
  }
  return options;
}

function canMask(hand: readonly CardId[]): boolean {
  return hand.some((id) => BLANKS[id] !== undefined || SELF_MASK[id] !== undefined || id === 'CH10');
}

export function choiceOptions(hand: readonly CardId[], mode: Mode) {
  const has = (id: CardId) => hand.includes(id);
  const relevant = relevantFamilies(hand);
  const others = (self: CardId) => hand.filter((id) => id !== self);
  return {
    doppelganger: has('FR53') ? [null, ...others('FR53').filter((id) => id !== 'FR51' && id !== 'FR52')] : [null],
    mirage: has('FR52') ? jokerOptions('FR52', hand, mode, relevant) : [null],
    shapeshifter: has('FR51') ? jokerOptions('FR51', hand, mode, relevant) : [null],
    book: has('FR49') ? bookOptions(hand, mode, relevant) : [null],
    island: has('FR09')
      ? [null, ...others('FR09').filter((id) => CARDS_BY_ID[id].hasPenalty || id === 'FR53')]
      : [null],
    angel: has('CH08') && canMask(hand) ? [null, ...others('CH08')] : [null],
  };
}

const EXHAUSTIVE_LIMIT = 20000;

type Options = ReturnType<typeof choiceOptions>;
type Key = keyof Options;
const KEYS: Key[] = ['doppelganger', 'mirage', 'shapeshifter', 'book', 'island', 'angel'];

function exhaustive(hand: readonly CardId[], context: ScoreContext, options: Options): ScoreResult {
  let best = scoreHand(hand, context);
  for (const doppelganger of options.doppelganger)
    for (const mirage of options.mirage)
      for (const shapeshifter of options.shapeshifter)
        for (const book of options.book)
          for (const island of options.island)
            for (const angel of options.angel) {
              const result = scoreHand(hand, context, { doppelganger, mirage, shapeshifter, book, island, angel });
              if (result.total > best.total) best = result;
            }
  return best;
}

function localSearch(hand: readonly CardId[], context: ScoreContext, options: Options): ScoreResult {
  const current: Choices = {};
  let best = scoreHand(hand, context, current);
  const keys = KEYS.filter((key) => options[key].length > 1);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        for (const first of options[keys[i]]) {
          for (const second of options[keys[j]]) {
            const candidate = { ...current, [keys[i]]: first, [keys[j]]: second };
            const result = scoreHand(hand, context, candidate);
            if (result.total > best.total) {
              best = result;
              Object.assign(current, candidate);
              improved = true;
            }
          }
        }
      }
    }
  }
  return best;
}

export function optimise(hand: readonly CardId[], context: ScoreContext): ScoreResult {
  const options = choiceOptions(hand, context.mode);
  const combinations = KEYS.reduce((product, key) => product * options[key].length, 1);
  return combinations <= EXHAUSTIVE_LIMIT
    ? exhaustive(hand, context, options)
    : localSearch(hand, context, options);
}
