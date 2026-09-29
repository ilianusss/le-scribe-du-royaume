import { CARDS_BY_ID, FAMILY_NAMES, type Card, type CardId } from '@/data/cards';
import type { CursedItem } from '@/data/cursedItems';

import { number, signed } from './copy';
import type { PaneFamily } from './theme';

export const cardFamily = (card: Card): PaneFamily => card.families[0];
export const cardFamilyLabel = (card: Card): string => card.families.map((family) => FAMILY_NAMES[family]).join(' · ');
export const cardValue = (card: Card): string => number(card.strength);

export const cursedFamily = (): PaneFamily => 'OBJET_MAUDIT';
export const cursedFamilyLabel = (): string => 'Objet maudit';
export const cursedValueLabel = (item: CursedItem): string => signed(item.value);

export const cardName = (id: CardId): string => CARDS_BY_ID[id].name;
