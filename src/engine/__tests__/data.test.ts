import { CARDS, HAND_SIZE, cardPool, type Family } from '@/data/cards';
import { CURSED_ITEMS } from '@/data/cursedItems';

describe('card data', () => {
  test('71 hand cards and 24 cursed items', () => {
    expect(CARDS).toHaveLength(71);
    expect(CURSED_ITEMS).toHaveLength(24);
  });

  test('IDs are unique across cards and cursed items', () => {
    const ids = [...CARDS.map((c) => c.id), ...CURSED_ITEMS.map((c) => c.id)];
    expect(new Set(ids).size).toBe(95);
  });

  test('family counts match reference §2', () => {
    const counts: Partial<Record<Family, number>> = {};
    for (const card of CARDS) counts[card.families[0]] = (counts[card.families[0]] ?? 0) + 1;
    expect(counts).toEqual({
      TERRAIN: 6,
      VAGUE: 5,
      CLIMAT: 5,
      FLAMME: 5,
      ARMEE: 5,
      SORCIER: 6,
      SEIGNEUR: 5,
      CREATURE: 6,
      ARME: 5,
      ARTEFACT: 5,
      JOKER: 3,
      BATIMENT: 5,
      EXTERIEUR: 5,
      MORT_VIVANT: 5,
    });
  });

  test('Phénix counts as Créature, Flamme and Climat', () => {
    expect(CARDS.find((c) => c.id === 'FR55')?.families).toEqual(['CREATURE', 'FLAMME', 'CLIMAT']);
  });
});

describe('card pool per mode', () => {
  test('Jeu de base: 53 base cards + Bouffon + Phénix, Beffroi Terrain', () => {
    const pool = cardPool('BASE');
    expect(pool).toHaveLength(55);
    expect(pool.filter((c) => c.module === 'PROMO').map((c) => c.id).sort()).toEqual(['FR54', 'FR55']);
    expect(pool.some((c) => c.id.startsWith('CH'))).toBe(false);
    expect(pool.filter((c) => c.name === 'Beffroi').map((c) => c.id)).toEqual(['FR03']);
  });

  test('Extension: every card except the Terrain Beffroi', () => {
    const pool = cardPool('EXTENSION');
    expect(pool).toHaveLength(70);
    expect(pool.filter((c) => c.name === 'Beffroi').map((c) => c.id)).toEqual(['CH16']);
    expect(pool.some((c) => c.id === 'CH05')).toBe(true);
  });

  test('names are unique within each pool', () => {
    for (const mode of ['BASE', 'EXTENSION'] as const) {
      const names = cardPool(mode).map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  test('hand sizes', () => {
    expect(HAND_SIZE).toEqual({ BASE: 7, EXTENSION: 8 });
  });
});
