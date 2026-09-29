import { cardPool, type CardId, type Family, type Mode } from '@/data/cards';
import { CURSED_ITEMS, type CursedItemId } from '@/data/cursedItems';
import { optimise } from '@/engine/optimise';
import { DEFAULT_RULINGS } from '@/engine/rulings';
import { scoreHand } from '@/engine/score';
import type { Choices, DiscardCounts } from '@/engine/types';

const B: Mode = 'BASE';
const X: Mode = 'EXTENSION';

function card(name: string, mode: Mode): CardId {
  const found = cardPool(mode).find((c) => c.name === name);
  if (!found) throw new Error(`Unknown card "${name}" in mode ${mode}`);
  return found.id;
}

function item(name: string): CursedItemId {
  const found = CURSED_ITEMS.find((c) => c.name === name);
  if (!found) throw new Error(`Unknown cursed item "${name}"`);
  return found.id;
}

type NamedChoices = {
  doppelganger?: string;
  mirage?: string;
  shapeshifter?: string;
  book?: [string, Family];
  island?: string;
  angel?: string;
};

interface Case {
  n: number;
  mode: Mode;
  hand: string[];
  choices?: NamedChoices;
  expected: number;
  players?: number;
  discard?: DiscardCounts;
  cursed?: string[];
}

const EMPTY_DISCARD: DiscardCounts = {};

const CASES: Case[] = [
  { n: 1, mode: B, hand: ['Blizzard', 'Inondation', 'Archers Elfes'], expected: 35 },
  { n: 2, mode: B, hand: ['Fumée', 'Infanterie naine', 'Dirigeable'], expected: 50 },
  { n: 3, mode: B, hand: ['Chandelle', 'Fumée', 'Infanterie naine', 'Dirigeable'], expected: 44 },
  { n: 4, mode: B, hand: ['Chevaliers', 'Infanterie naine', 'Éclaireurs', 'Roi', 'Reine', 'Épée de Keth', 'Bouclier de Keth'], expected: 265 },
  { n: 5, mode: B, hand: ['Source de vie', 'Marécage', 'Inondation', 'Île', "Élémental d'Eau", 'Orage', 'Collectionneur'], expected: 326 },
  { n: 6, mode: B, hand: ['Forge', 'Archers Elfes', 'Roi', 'Reine', 'Épée de Keth', 'Bouclier de Keth', 'Gemme de Loi'], expected: 351 },
  { n: 7, mode: B, hand: ['Montagne', 'Inondation', 'Fumée', 'Tornade', "Élémental d'Air", 'Feu de forêt', 'Mirage'], choices: { mirage: 'Orage' }, expected: 260 },
  { n: 8, mode: B, hand: ['Beffroi', 'Chandelle', 'Reine', 'Épée de Keth', 'Bouclier de Keth', 'Gemme de Loi', 'Livre des mutations'], choices: { book: ['Gemme de Loi', 'SORCIER'] }, expected: 380 },
  { n: 9, mode: B, hand: ['Beffroi', 'Chandelle', 'Nécromancien', 'Destrier', 'Épée de Keth', 'Bouclier de Keth', 'Gemme de Loi', 'Livre des mutations'], choices: { book: ['Beffroi', 'SEIGNEUR'] }, expected: 397 },
  { n: 10, mode: B, hand: ['Caverne', 'Beffroi', 'Élémental de Terre', 'Chandelle', 'Collectionneur', 'Nécromancien', 'Gemme de Loi', 'Livre des mutations'], choices: { book: ['Chandelle', 'TERRAIN'] }, expected: 388 },
  { n: 11, mode: B, hand: ['Beffroi', 'Chandelle', 'Nécromancien', 'Reine', 'Épée de Keth', 'Bouclier de Keth', 'Gemme de Loi', 'Livre des mutations'], choices: { book: ['Beffroi', 'ARMEE'] }, expected: 388 },
  { n: 12, mode: B, hand: ['Nécromancien', 'Démoniste', 'Roi', 'Reine', 'Chef de guerre', 'Impératrice', 'Métamorphe', 'Doppelgänger'], choices: { shapeshifter: 'Roi', doppelganger: 'Démoniste' }, expected: -74 },
  { n: 13, mode: B, hand: ['Basilic', 'Doppelgänger'], choices: { doppelganger: 'Basilic' }, expected: 0 },
  { n: 14, mode: B, hand: ['Infanterie naine', 'Doppelgänger'], choices: { doppelganger: 'Infanterie naine' }, expected: 26 },
  { n: 15, mode: B, hand: ['Île', 'Blizzard', 'Feu de forêt', 'Basilic'], choices: { island: 'Feu de forêt' }, expected: 95 },
  { n: 16, mode: B, hand: ["Élémental d'Eau", 'Doppelgänger'], choices: { doppelganger: "Élémental d'Eau" }, expected: 23 },
  { n: 17, mode: B, hand: ['Collectionneur', 'Dresseur', 'Enchanteresse', 'Licorne', 'Destrier', 'Dragon', 'Hydre'], expected: 193 },
  { n: 18, mode: B, hand: ['Collectionneur', 'Bouclier de Keth', 'Gemme de Loi', 'Métamorphe', 'Doppelgänger'], choices: { shapeshifter: 'Bouclier de Keth', doppelganger: 'Bouclier de Keth' }, expected: 20 },
  { n: 19, mode: B, hand: ['Archers Elfes', 'Roi', 'Licorne', 'Épée de Keth', 'Arc elfique', 'Bouclier de Keth', 'Gemme de Loi'], expected: 206 },
  { n: 20, mode: B, hand: ['Bouclier de Keth', 'Gemme de Loi', 'Caverne', 'Élémental de Terre', 'Éclaireurs', 'Reine'], expected: 105 },
  { n: 21, mode: B, hand: ['Feu de forêt', 'Livre des mutations', 'Orage', 'Blizzard'], choices: { book: ['Blizzard', 'VAGUE'] }, expected: 11 },
  { n: 22, mode: B, hand: ['Blizzard', 'Inondation', 'Feu de forêt', 'Livre des mutations'], choices: { book: ['Blizzard', 'CREATURE'] }, expected: 3 },
  { n: 23, mode: B, hand: ['Livre des mutations', 'Navire de guerre', 'Basilic', 'Chevaliers'], choices: { book: ['Basilic', 'VAGUE'] }, expected: 73 },
  { n: 24, mode: B, hand: ['Livre des mutations', 'Navire de guerre', 'Infanterie naine', 'Archers Elfes'], choices: { book: ['Infanterie naine', 'VAGUE'] }, expected: 56 },
  { n: 25, mode: B, hand: ['Livre des mutations', 'Navire de guerre', 'Source de vie', 'Inondation', 'Archers Elfes'], choices: { book: ['Inondation', 'SORCIER'] }, expected: 82 },
  { n: 26, mode: B, hand: ['Inondation', 'Blizzard', 'Feu de forêt'], expected: 65 },
  { n: 27, mode: B, hand: ['Caverne', 'Inondation', 'Blizzard', 'Feu de forêt'], expected: 62 },
  { n: 28, mode: B, hand: ['Caverne', 'Inondation', 'Blizzard', 'Feu de forêt', 'Livre des mutations'], choices: { book: ['Blizzard', 'CREATURE'] }, expected: 9 },
  { n: 29, mode: B, hand: ['Livre des mutations', 'Navire de guerre', 'Dirigeable', 'Cavalerie légère', "Élémental d'Air"], choices: { book: ['Dirigeable', 'VAGUE'] }, expected: 24 },
  { n: 30, mode: B, hand: ['Livre des mutations', 'Navire de guerre', 'Dirigeable'], choices: { book: ['Dirigeable', 'VAGUE'] }, expected: 61 },
  { n: 31, mode: B, hand: ['Livre des mutations', 'Dirigeable', 'Éclaireurs'], choices: { book: ['Éclaireurs', 'TERRAIN'] }, expected: 53 },
  { n: 32, mode: B, hand: ['Chevaliers', 'Dirigeable', 'Fumée'], expected: 47 },
  { n: 33, mode: B, hand: ['Doppelgänger', 'Impératrice', 'Roi'], choices: { doppelganger: 'Impératrice' }, expected: 18 },
  { n: 34, mode: B, hand: ['Bouffon', 'Éclair', 'Épée de Keth', 'Forge', 'Gemme de Loi'], expected: 103 },
  { n: 35, mode: B, hand: ['Bouffon', 'Éclair', 'Épée de Keth', 'Caverne'], expected: 33 },

  { n: 36, mode: X, hand: ['Phénix', 'Basilic', 'Feu de forêt', 'Orage', 'Ange', 'Livre des mutations'], choices: { angel: 'Feu de forêt', book: ['Basilic', 'SORCIER'] }, expected: 116 },
  { n: 37, mode: X, hand: ['Phénix', 'Démon'], expected: 59 },
  { n: 38, mode: X, hand: ['Phénix', 'Démon', 'Forge', "Élémental d'Air"], expected: 87 },
  { n: 39, mode: B, hand: ['Phénix', 'Dirigeable', 'Archers Elfes'], expected: 59 },
  { n: 40, mode: B, hand: ['Phénix', 'Caverne', 'Source de vie', "Élémental d'Air", 'Archers Elfes', 'Collectionneur', 'Orage'], expected: 114 },
  { n: 41, mode: B, hand: ['Phénix', 'Fumée', 'Élémental de Feu', 'Chandelle', 'Collectionneur'], expected: 94 },
  { n: 42, mode: B, hand: ['Phénix', 'Élémental de Feu', 'Chandelle', 'Collectionneur', 'Éclair', "Élémental d'Air", 'Tornade', 'Fumée'], expected: 252 },
  { n: 43, mode: B, hand: ['Phénix', 'Enchanteresse'], expected: 29 },
  { n: 44, mode: B, hand: ['Phénix', 'Blizzard'], expected: 34 },
  { n: 45, mode: B, hand: ['Phénix', 'Arbre-Monde', "Élémental d'Air"], expected: 35 },
  { n: 46, mode: B, hand: ['Phénix', 'Élémental de Feu', "Élémental d'Air", 'Métamorphe', 'Doppelgänger', 'Collectionneur', 'Dresseur'], choices: { shapeshifter: 'Phénix', doppelganger: 'Phénix' }, expected: 109 },

  { n: 47, mode: X, hand: ['Démon', 'Navire de guerre', "Élémental d'Eau", 'Marécage', 'Archers Elfes', 'Cavalerie légère'], expected: 114 },
  { n: 48, mode: X, hand: ['Ange', 'Reine', 'Basilic'], choices: { angel: 'Reine' }, expected: 57 },
  { n: 49, mode: X, hand: ['Donjon', 'Liche', 'Chevalier de la Mort', 'Basilic', 'Bouclier de Keth', 'Gemme de Loi', 'Démoniste'], discard: EMPTY_DISCARD, expected: 158 },
  { n: 50, mode: X, hand: ['Château', 'Chapelle', 'Beffroi', 'Roi', 'Chevaliers', 'Montagne'], expected: 107 },
  { n: 51, mode: X, hand: ['Crypte', 'Liche', 'Goule', 'Roi', 'Impératrice'], discard: EMPTY_DISCARD, expected: 73 },
  { n: 52, mode: X, hand: ['Jardin', 'Roi', 'Licorne', 'Destrier', 'Goule'], discard: EMPTY_DISCARD, expected: 45 },
  { n: 53, mode: X, hand: ['Jardin', 'Roi', 'Licorne', 'Destrier'], expected: 81 },
  { n: 54, mode: X, hand: ['Juge des âmes', 'Chevaliers', 'Dragon', 'Marécage', 'Cavalerie légère'], expected: 82 },
  { n: 55, mode: X, hand: ['Juge des âmes', 'Chevaliers', 'Éclaireurs', 'Infanterie naine', 'Marécage'], expected: 91 },
  { n: 56, mode: X, hand: ['Génie', 'Montagne', 'Caverne'], players: 6, expected: 15 },
  { n: 57, mode: X, hand: ['Génie', 'Montagne', 'Caverne'], players: 2, expected: -25 },
  {
    n: 58,
    mode: X,
    hand: ['Reine des Ténèbres', 'Goule', 'Spectre', 'Chevalier de la Mort', 'Nécromancien'],
    discard: { TERRAIN: 1, VAGUE: 1, CREATURE: 1, SEIGNEUR: 1, ARME: 1, ARMEE: 1, EXTERIEUR: 1, SORCIER: 1, licorne: true },
    expected: 104,
  },
  { n: 59, mode: X, hand: ['Démon', 'Leprechaun', 'Roi', 'Reine', 'Chevaliers', 'Archers Elfes', 'Feu de forêt'], expected: 194 },
  { n: 60, mode: X, hand: ['Feu de forêt', 'Nécromancien', 'Liche', 'Spectre'], discard: EMPTY_DISCARD, expected: 88 },
  { n: 61, mode: X, hand: ['Démon', 'Ange', 'Roi', 'Chevaliers', 'Archers Elfes'], choices: { angel: 'Roi' }, expected: 114 },
  { n: 62, mode: X, hand: ['Arbre-Monde', 'Montagne', 'Éclair', 'Chevaliers', 'Collectionneur'], expected: 111 },
  { n: 63, mode: X, hand: ['Roi', 'Reine', 'Chevaliers'], cursed: ['Coffre au trésor', 'Longue-vue', 'Sarcophage', 'Portail'], players: 4, expected: 78 },
  { n: 64, mode: X, hand: ['Roi', 'Reine', 'Chevaliers'], cursed: ['Coffre au trésor', 'Longue-vue', 'Sarcophage'], players: 2, expected: 64 },
];

function toChoices(named: NamedChoices | undefined, mode: Mode): Choices {
  if (!named) return {};
  return {
    doppelganger: named.doppelganger ? card(named.doppelganger, mode) : null,
    mirage: named.mirage ? { cardId: card(named.mirage, mode) } : null,
    shapeshifter: named.shapeshifter ? { cardId: card(named.shapeshifter, mode) } : null,
    book: named.book ? { target: card(named.book[0], mode), family: named.book[1] } : null,
    island: named.island ? card(named.island, mode) : null,
    angel: named.angel ? card(named.angel, mode) : null,
  };
}

function setup(c: Case) {
  const hand = c.hand.map((name) => card(name, c.mode));
  const context = {
    mode: c.mode,
    playerCount: c.players ?? 4,
    discard: c.discard,
    cursedItems: c.cursed?.map(item),
  };
  return { hand, context };
}

describe('reference §10 acceptance tests (forced choices)', () => {
  test.each(CASES.map((c) => [c.n, c] as const))('#%i', (_, c) => {
    const { hand, context } = setup(c);
    expect(scoreHand(hand, context, toChoices(c.choices, c.mode)).total).toBe(c.expected);
  });
});

describe('automatic choices score at least the forced choices', () => {
  test.each(CASES.filter((c) => c.n !== 12).map((c) => [c.n, c] as const))('#%i', (_, c) => {
    const { hand, context } = setup(c);
    const best = optimise(hand, context);
    expect(best.total).toBeGreaterThanOrEqual(c.expected);
    expect(scoreHand(hand, context, best.choices).total).toBe(best.total);
  });
});

test('§10 #62 with Arbre-Monde at +50', () => {
  const hand = ['Arbre-Monde', 'Montagne', 'Éclair', 'Chevaliers', 'Collectionneur'].map((name) => card(name, X));
  const rulings = { ...DEFAULT_RULINGS, worldTreeBonus: { base: 50, extension: 50 } };
  expect(scoreHand(hand, { mode: X, playerCount: 4, rulings }).total).toBe(91);
});

test('the optimiser stays fast on a hand with every choice card', () => {
  const hand: CardId[] = ['FR52', 'FR51', 'FR53', 'FR49', 'FR09', 'CH08', 'FR16', 'FR08', 'FR26'];
  const start = Date.now();
  const best = optimise(hand, { mode: X, playerCount: 4 });
  expect(Date.now() - start).toBeLessThan(1000);
  expect(best.total).toBeGreaterThanOrEqual(scoreHand(hand, { mode: X, playerCount: 4 }).total);
});
