import type { CardId, Family, Mode } from '@/data/cards';
import type { CursedItemId } from '@/data/cursedItems';

import type { Rulings } from './rulings';

export type DiscardCounts = Partial<Record<Family, number>> & { licorne?: boolean };

export interface ScoreContext {
  mode: Mode;
  playerCount?: number | null;
  discard?: DiscardCounts;
  cursedItems?: readonly CursedItemId[];
  rulings?: Rulings;
}

export type JokerCopy = { cardId: CardId } | { family: Family };

export interface Choices {
  doppelganger?: CardId | null;
  mirage?: JokerCopy | null;
  shapeshifter?: JokerCopy | null;
  book?: { target: CardId; family: Family } | null;
  island?: CardId | null;
  angel?: CardId | null;
}

export type ChosenOption =
  | { kind: 'copy'; cardId: CardId }
  | { kind: 'copyFamily'; family: Family }
  | { kind: 'book'; target: CardId; family: Family }
  | { kind: 'island'; target: CardId }
  | { kind: 'angel'; target: CardId };

export interface CardTrace {
  id: CardId;
  families: Family[];
  base: number;
  bonus: number;
  malus: number;
  total: number;
  masked: boolean;
  maskedBy: CardId[];
  selfMasked: boolean;
  penaltyCleared: boolean;
  clearedBy: CardId[];
  familyChangedBy: CardId | null;
  chosen: ChosenOption | null;
}

export interface CursedTrace {
  id: CursedItemId;
  value: number;
}

export interface ScoreResult {
  total: number;
  cards: CardTrace[];
  cursed: CursedTrace[];
  cursedTotal: number;
  tieBreak: number;
  choices: Choices;
}
