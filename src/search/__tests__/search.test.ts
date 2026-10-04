import { cardPool } from '@/data/cards';
import { CURSED_ITEMS } from '@/data/cursedItems';
import { normalise } from '@/search/normalise';
import { suggest } from '@/search/suggest';

const names = (query: string, mode: 'BASE' | 'FULL' = 'BASE', exclude: string[] = []) =>
  suggest(cardPool(mode), query, exclude).map((s) => s.item.name);

describe('normalise', () => {
  test.each([
    ['ÉCLAIR', 'eclair'],
    ["Élémental d'Eau", 'elemental d eau'],
    ['Élémental d’Eau', 'elemental d eau'],
    ['Arbre-Monde', 'arbre monde'],
    ['  feu   de  FORÊT ', 'feu de foret'],
    ['Doppelgänger', 'doppelganger'],
  ])('%s → %s', (input, expected) => {
    expect(normalise(input)).toBe(expected);
  });
});

describe('suggest', () => {
  test('eclair: exact prefix first, then alphabetical', () => {
    expect(names('eclair')).toEqual(['Éclair', 'Éclaireurs']);
  });

  test('ELEMENTAL D EAU finds Élémental d’Eau', () => {
    expect(names('ELEMENTAL D EAU')).toEqual(["Élémental d'Eau"]);
  });

  test('foret: name prefix before word prefix', () => {
    expect(names('foret')).toEqual(['Forêt', 'Feu de forêt']);
  });

  test('rank beats alphabetical order', () => {
    expect(names('de')).toEqual([
      'Démoniste',
      'Destrier',
      'Bouclier de Keth',
      'Chef de guerre',
      'Élémental de Feu',
      'Élémental de Terre',
    ]);
  });

  test('contains-matches come after word prefixes', () => {
    expect(names('or')).toEqual(['Orage', 'Feu de forêt', 'Forêt', 'Forge', 'Licorne', 'Métamorphe']);
  });

  test('doppel finds Doppelgänger', () => {
    expect(names('doppel')).toEqual(['Doppelgänger']);
  });

  test('beffroi returns only the Beffroi of the mode', () => {
    expect(suggest(cardPool('BASE'), 'beffroi').map((s) => s.item.id)).toEqual(['FR03']);
    expect(suggest(cardPool('FULL'), 'beffroi').map((s) => s.item.id)).toEqual(['CH16']);
  });

  test('extension-only cards are hidden in Jeu de base', () => {
    expect(names('genie')).toEqual([]);
    expect(names('genie', 'FULL')).toEqual(['Génie']);
  });

  test('cards already in hand are excluded', () => {
    expect(names('eclair', 'BASE', ['FR19'])).toEqual(['Éclaireurs']);
  });

  test('at most 6 suggestions', () => {
    expect(names('e').length).toBe(6);
  });

  test('empty or blank query gives nothing', () => {
    expect(names('')).toEqual([]);
    expect(names('   ')).toEqual([]);
  });

  test('match range points into the original name', () => {
    const [first] = suggest(cardPool('BASE'), 'foret de');
    expect(first).toBeUndefined();
    const [fire] = suggest(cardPool('BASE'), 'de foret');
    expect(fire.item.name).toBe('Feu de forêt');
    expect(fire.item.name.slice(fire.match.start, fire.match.end)).toBe('de forêt');
    const [water] = suggest(cardPool('BASE'), 'd eau');
    expect(water.item.name.slice(water.match.start, water.match.end)).toBe("d'Eau");
  });

  test('works for cursed items', () => {
    expect(suggest(CURSED_ITEMS, 'coffre').map((s) => s.item.name)).toEqual(['Coffre au trésor']);
  });
});
