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

export interface Choices {
  doppelganger?: CardId | null;
  mirage?: CardId | null;
  shapeshifter?: CardId | null;
  book?: { target: CardId; family: Family } | null;
  island?: CardId | null;
  angel?: CardId | null;
}

export type ChosenOption =
  | { kind: 'copy'; cardId: CardId }
  | { kind: 'book'; target: CardId; family: Family }
  | { kind: 'island'; target: CardId }
  | { kind: 'angel'; target: CardId };

export type MaskReason =
  | { kind: 'by'; cards: CardId[] }
  | { kind: 'ownMalus' }
  | { kind: 'noFlame' }
  | { kind: 'noFlood' }
  | { kind: 'noArmy' }
  | { kind: 'withWeather' }
  | { kind: 'withFlood' };

export interface CardTrace {
  id: CardId;
  families: Family[];
  base: number;
  bonus: number;
  malus: number;
  total: number;
  masked: boolean;
  maskReason: MaskReason | null;
  penaltyCleared: boolean;
  clearedBy: CardId[];
  armyWordClearedBy: CardId[];
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
