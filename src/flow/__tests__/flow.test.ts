import type { CardId, Mode } from '@/data/cards';
import type { CursedItemId } from '@/data/cursedItems';
import { EMPTY_SESSION, scoreSession, sessionReducer, type ScoringSession, type SessionAction } from '@/flow/session';
import {
  angelTargets,
  bonusPool,
  islandTargets,
  bookFamilies,
  bookTargets,
  jokerTargets,
  canContinue,
  missingCards,
  neededDiscardFamilies,
  needsLicorne,
  needsPlayerCount,
  nextStep,
  previousStep,
  shownSteps,
} from '@/flow/steps';

function run(...actions: SessionAction[]): ScoringSession {
  return actions.reduce(sessionReducer, EMPTY_SESSION);
}

const start = (mode: Mode) => ({ type: 'START', mode }) as const;
const add = (...ids: CardId[]) => ids.map((id) => ({ type: 'ADD_CARD', id }) as const);
const curse = (...ids: CursedItemId[]) => ids.map((id) => ({ type: 'ADD_CURSED', id }) as const);

const PLAIN_BASE: CardId[] = ['FR01', 'FR02', 'FR04', 'FR05', 'FR06', 'FR07', 'FR10'];
const PLAIN_EXT: CardId[] = [...PLAIN_BASE, 'FR11'];

describe('hand entry', () => {
  test('START resets the session with the chosen mode', () => {
    const session = run(start('BASE'), ...add('FR01'), start('FULL'));
    expect(session).toEqual({ ...EMPTY_SESSION, mode: 'FULL' });
  });

  test('cards are kept in entry order, without duplicates, up to the hand size', () => {
    const session = run(start('BASE'), ...add(...PLAIN_BASE, 'FR01', 'FR11'));
    expect(session.hand).toEqual(PLAIN_BASE);
    expect(missingCards(session)).toBe(0);
    expect(canContinue(session, 'HAND')).toBe(true);
  });

  test('an incomplete hand cannot continue and reports missing cards', () => {
    const session = run(start('FULL'), ...add('FR01', 'FR02'));
    expect(missingCards(session)).toBe(6);
    expect(canContinue(session, 'HAND')).toBe(false);
  });

  test('NEW_HAND keeps the mode only', () => {
    const session = run(start('FULL'), ...add('FR01'), ...curse('CH25'), { type: 'NEW_HAND' });
    expect(session).toEqual({ ...EMPTY_SESSION, mode: 'FULL' });
  });
});

describe('conditional steps', () => {
  test('Jeu de base without bonus source: hand then result', () => {
    const session = run(start('BASE'), ...add(...PLAIN_BASE));
    expect(shownSteps(session)).toEqual(['MODE', 'HAND', 'RESULT']);
    expect(nextStep(session, 'HAND')).toBe('RESULT');
  });

  test('Extension always shows cursed items', () => {
    const session = run(start('FULL'), ...add(...PLAIN_EXT));
    expect(shownSteps(session)).toEqual(['MODE', 'HAND', 'CURSED', 'RESULT']);
  });

  test('Nécromancien adds the bonus step in both modes', () => {
    expect(shownSteps(run(start('BASE'), ...add('FR28')))).toContain('BONUS');
    expect(shownSteps(run(start('FULL'), ...add('FR28')))).toContain('BONUS');
  });

  test('Leprechaun, Génie and Portail are bonus sources only in Extension', () => {
    expect(shownSteps(run(start('FULL'), ...add('CH09')))).toContain('BONUS');
    expect(shownSteps(run(start('FULL'), ...add('CH06')))).toContain('BONUS');
    expect(shownSteps(run(start('FULL'), ...curse('CH46')))).toContain('BONUS');
  });

  test('Génie or Longue-vue require the player count', () => {
    const genie = run(start('FULL'), ...add('CH06'));
    expect(needsPlayerCount(genie)).toBe(true);
    expect(canContinue(genie, 'CONTEXT')).toBe(false);
    expect(canContinue(sessionReducer(genie, { type: 'SET_PLAYER_COUNT', count: 3 }), 'CONTEXT')).toBe(true);
    expect(needsPlayerCount(run(start('FULL'), ...curse('CH24')))).toBe(true);
    expect(shownSteps(run(start('FULL'), ...curse('CH24')))).toContain('CONTEXT');
  });

  test('player count is limited to 2..6', () => {
    const genie = run(start('FULL'), ...add('CH06'));
    expect(sessionReducer(genie, { type: 'SET_PLAYER_COUNT', count: 7 }).playerCount).toBeNull();
    expect(sessionReducer(genie, { type: 'SET_PLAYER_COUNT', count: 1 }).playerCount).toBeNull();
  });

  test('undead cards ask the union of their discard families', () => {
    const session = run(start('FULL'), ...add('CH13', 'CH15'));
    expect(neededDiscardFamilies(session)).toEqual(['ARMEE', 'SORCIER', 'ARME', 'ARTEFACT', 'EXTERIEUR']);
    expect(needsLicorne(session)).toBe(false);
    expect(needsLicorne(run(start('FULL'), ...add('CH11')))).toBe(true);
    expect(canContinue(session, 'CONTEXT')).toBe(true);
  });

  test('Liche alone needs no discard', () => {
    expect(shownSteps(run(start('FULL'), ...add('CH14')))).not.toContain('CONTEXT');
  });

  test('back goes to the previous shown step', () => {
    const session = run(start('FULL'), ...add('FR28'));
    expect(previousStep(session, 'BONUS')).toBe('CURSED');
    expect(previousStep(session, 'RESULT')).toBe('BONUS');
    expect(previousStep(session, 'HAND')).toBe('MODE');
  });
});

describe('bonus card', () => {
  test('Nécromancien alone: only its families, cards in hand excluded', () => {
    const session = run(start('BASE'), ...add('FR28', 'FR21'));
    const pool = bonusPool(session).map((card) => card.id);
    expect(pool).toContain('FR22');
    expect(pool).toContain('FR31');
    expect(pool).not.toContain('FR21');
    expect(pool).not.toContain('FR01');
  });

  test('Nécromancien in Extension can also take a Mort-vivant', () => {
    expect(bonusPool(run(start('FULL'), ...add('FR28'))).map((c) => c.id)).toContain('CH12');
  });

  test('several sources: any card of the mode', () => {
    const pool = bonusPool(run(start('FULL'), ...add('FR28', 'CH09'))).map((c) => c.id);
    expect(pool).toContain('FR01');
    expect(pool).not.toContain('FR03');
  });

  test('only one bonus card, and it must be eligible', () => {
    let session = run(start('BASE'), ...add('FR28'));
    session = sessionReducer(session, { type: 'SET_BONUS', id: 'FR01' });
    expect(session.bonusCard).toBeNull();
    session = sessionReducer(session, { type: 'SET_BONUS', id: 'FR31' });
    session = sessionReducer(session, { type: 'SET_BONUS', id: 'FR32' });
    expect(session.bonusCard).toBe('FR32');
    expect(canContinue(session, 'BONUS')).toBe(true);
  });

  test('skipping is an explicit answer', () => {
    const session = run(start('BASE'), ...add('FR28'));
    expect(canContinue(session, 'BONUS')).toBe(false);
    expect(canContinue(sessionReducer(session, { type: 'SKIP_BONUS' }), 'BONUS')).toBe(true);
  });
});

describe('editing the hand invalidates answers that no longer apply', () => {
  test('removing the Nécromancien clears the bonus card', () => {
    const session = run(start('BASE'), ...add('FR28'), { type: 'SET_BONUS', id: 'FR31' }, { type: 'REMOVE_CARD', id: 'FR28' });
    expect(session.bonusCard).toBeNull();
    expect(session.bonusSkipped).toBe(false);
  });

  test('removing the Leprechaun clears a bonus card the Nécromancien could not take', () => {
    const session = run(
      start('FULL'),
      ...add('FR28', 'CH09'),
      { type: 'SET_BONUS', id: 'FR01' },
      { type: 'REMOVE_CARD', id: 'CH09' },
    );
    expect(session.bonusCard).toBeNull();
  });

  test('adding the bonus card to the hand clears it as bonus', () => {
    const session = run(start('BASE'), ...add('FR28'), { type: 'SET_BONUS', id: 'FR31' }, ...add('FR31'));
    expect(session.bonusCard).toBeNull();
  });

  test('removing the Génie clears the player count', () => {
    const session = run(
      start('FULL'),
      ...add('CH06'),
      { type: 'SET_PLAYER_COUNT', count: 4 },
      { type: 'REMOVE_CARD', id: 'CH06' },
    );
    expect(session.playerCount).toBeNull();
  });

  test('a Génie taken as bonus card keeps the player count', () => {
    const session = run(
      start('FULL'),
      ...add('CH09'),
      { type: 'SET_BONUS', id: 'CH06' },
      { type: 'SET_PLAYER_COUNT', count: 4 },
    );
    expect(needsPlayerCount(session)).toBe(true);
    expect(session.playerCount).toBe(4);
  });

  test('discard counts keep only the families still needed', () => {
    const session = run(
      start('FULL'),
      ...add('CH11', 'CH15'),
      { type: 'SET_DISCARD', family: 'TERRAIN', count: 3 },
      { type: 'SET_DISCARD', family: 'ARME', count: 2 },
      { type: 'SET_LICORNE', value: true },
      { type: 'REMOVE_CARD', id: 'CH11' },
    );
    expect(session.discardCounts).toEqual({ ARME: 2 });
  });

  test('discard counts are clamped to 0..12', () => {
    const session = run(start('FULL'), ...add('CH15'), { type: 'SET_DISCARD', family: 'ARME', count: 20 });
    expect(session.discardCounts.ARME).toBe(12);
  });
});

describe('scoring a session', () => {
  test('includes the bonus card, context and cursed items', () => {
    const session = run(
      start('FULL'),
      ...add('FR31', 'FR32', 'FR21'),
      ...curse('CH39', 'CH24', 'CH25'),
      { type: 'SET_PLAYER_COUNT', count: 2 },
    );
    expect(scoreSession(session)?.total).toBe(64);
  });

  test('a Nécromancien bonus card is scored with the hand', () => {
    const session = run(start('BASE'), ...add('FR28', 'FR42'), { type: 'SET_BONUS', id: 'FR31' });
    expect(scoreSession(session)?.cards.map((c) => c.id)).toEqual(['FR28', 'FR42', 'FR31']);
  });
});

describe('jokers', () => {
  test('the jokers step is shown when the final hand has a joker, bonus card included', () => {
    expect(shownSteps(run(start('BASE'), ...add('FR52')))).toContain('JOKERS');
    const withBonus = run(start('FULL'), ...add('CH09'), { type: 'SET_BONUS', id: 'FR53' });
    expect(shownSteps(withBonus)).toEqual(['MODE', 'HAND', 'CURSED', 'BONUS', 'JOKERS', 'RESULT']);
    expect(shownSteps(run(start('BASE'), ...add(...PLAIN_BASE)))).not.toContain('JOKERS');
  });

  test('every joker needs an answer, « Ne copie rien » included', () => {
    let session = run(start('BASE'), ...add('FR52', 'FR53', 'FR01'));
    expect(canContinue(session, 'JOKERS')).toBe(false);
    session = sessionReducer(session, { type: 'SET_JOKER', joker: 'FR52', choice: 'FR11' });
    session = sessionReducer(session, { type: 'SET_JOKER', joker: 'FR53', choice: 'NONE' });
    expect(canContinue(session, 'JOKERS')).toBe(true);
    session = sessionReducer(session, { type: 'CLEAR_JOKER', joker: 'FR53' });
    expect(canContinue(session, 'JOKERS')).toBe(false);
  });

  test('only cards of the eligible families, in the mode pool', () => {
    const mirage = jokerTargets(run(start('BASE'), ...add('FR52')), 'FR52').map((c) => c.id);
    expect(mirage).toContain('FR11');
    expect(mirage).toContain('FR03');
    expect(mirage).not.toContain('FR31');
    expect(mirage).not.toContain('CH16');
    const shapeshifter = jokerTargets(run(start('FULL'), ...add('FR51')), 'FR51').map((c) => c.id);
    expect(shapeshifter).toContain('CH11');
    expect(shapeshifter).toContain('FR55');
    expect(shapeshifter).not.toContain('FR11');
    const session = run(start('BASE'), ...add('FR52'));
    expect(sessionReducer(session, { type: 'SET_JOKER', joker: 'FR52', choice: 'FR31' }).jokerChoices).toEqual({});
  });

  test('the Doppelgänger copies another card of the final hand', () => {
    const session = run(start('BASE'), ...add('FR53', 'FR37', 'FR28'), { type: 'SET_BONUS', id: 'FR31' });
    expect(jokerTargets(session, 'FR53').map((c) => c.id)).toEqual(['FR37', 'FR28', 'FR31']);
  });

  test('removing a joker or its copied card clears the answer', () => {
    let session = run(start('BASE'), ...add('FR53', 'FR37', 'FR52'));
    session = sessionReducer(session, { type: 'SET_JOKER', joker: 'FR53', choice: 'FR37' });
    session = sessionReducer(session, { type: 'SET_JOKER', joker: 'FR52', choice: 'NONE' });
    session = sessionReducer(session, { type: 'REMOVE_CARD', id: 'FR37' });
    expect(session.jokerChoices).toEqual({ FR52: 'NONE' });
    session = sessionReducer(session, { type: 'REMOVE_CARD', id: 'FR52' });
    expect(session.jokerChoices).toEqual({});
  });

  test('the chosen copies are scored', () => {
    const session = run(
      start('BASE'),
      ...add('FR01', 'FR08', 'FR13', 'FR14', 'FR15', 'FR16', 'FR52'),
      { type: 'SET_JOKER', joker: 'FR52', choice: 'FR11' },
    );
    expect(scoreSession(session)?.total).toBe(260);
  });
});

describe('Livre des mutations', () => {
  const BOOK_HAND: CardId[] = ['FR49', 'FR03', 'FR17', 'FR32', 'FR43', 'FR46', 'FR47'];

  test('the book step comes after the jokers and needs an answer', () => {
    let session = run(start('BASE'), ...add('FR49', 'FR52'));
    expect(shownSteps(session)).toEqual(['MODE', 'HAND', 'JOKERS', 'BOOK', 'RESULT']);
    expect(canContinue(session, 'BOOK')).toBe(false);
    session = sessionReducer(session, { type: 'SET_BOOK', choice: 'NONE' });
    expect(canContinue(session, 'BOOK')).toBe(true);
    expect(shownSteps(run(start('BASE'), ...add('FR01')))).not.toContain('BOOK');
  });

  test('targets are the other cards of the final hand, except the Phénix', () => {
    const session = run(start('BASE'), ...add('FR49', 'FR55', 'FR28', 'FR01'), { type: 'SET_BONUS', id: 'FR31' });
    expect(bookTargets(session).map((c) => c.id)).toEqual(['FR28', 'FR01', 'FR31']);
  });

  test('families exclude Joker and the current family, and follow a joker copy', () => {
    let session = run(start('BASE'), ...add('FR49', 'FR01', 'FR52'));
    expect(bookFamilies(session, 'FR01')).not.toContain('TERRAIN');
    expect(bookFamilies(session, 'FR01')).not.toContain('JOKER');
    expect(bookFamilies(session, 'FR01')).not.toContain('BATIMENT');
    expect(bookFamilies(run(start('FULL'), ...add('FR49', 'FR01')), 'FR01')).toContain('BATIMENT');
    session = sessionReducer(session, { type: 'SET_JOKER', joker: 'FR52', choice: 'FR11' });
    expect(bookFamilies(session, 'FR52')).not.toContain('CLIMAT');
    expect(sessionReducer(session, { type: 'SET_BOOK', choice: { target: 'FR01', family: 'TERRAIN' } }).bookChoice).toBeNull();
  });

  test('removing the Livre or its target, or a new copy making the family a no-op, clears the answer', () => {
    let session = run(start('BASE'), ...add('FR49', 'FR01', 'FR52'), { type: 'SET_JOKER', joker: 'FR52', choice: 'FR11' });
    session = sessionReducer(session, { type: 'SET_BOOK', choice: { target: 'FR52', family: 'TERRAIN' } });
    expect(session.bookChoice).toEqual({ target: 'FR52', family: 'TERRAIN' });
    expect(sessionReducer(session, { type: 'SET_JOKER', joker: 'FR52', choice: 'FR04' }).bookChoice).toBeNull();
    expect(sessionReducer(session, { type: 'REMOVE_CARD', id: 'FR52' }).bookChoice).toBeNull();
    expect(sessionReducer(session, { type: 'REMOVE_CARD', id: 'FR49' }).bookChoice).toBeNull();
  });

  test('the chosen change is scored (rulebook example 2)', () => {
    const session = run(start('BASE'), ...add(...BOOK_HAND), {
      type: 'SET_BOOK',
      choice: { target: 'FR47', family: 'SORCIER' },
    });
    expect(scoreSession(session)?.total).toBe(380);
    expect(scoreSession(sessionReducer(session, { type: 'SET_BOOK', choice: 'NONE' }))?.total).toBeLessThan(380);
  });
});

describe('Île and Ange', () => {
  test('steps come after the Livre, in order, and need an answer', () => {
    let session = run(start('FULL'), ...add('FR49', 'FR09', 'CH08', 'FR08'));
    expect(shownSteps(session)).toEqual(['MODE', 'HAND', 'CURSED', 'BOOK', 'ISLAND', 'ANGEL', 'RESULT']);
    expect(canContinue(session, 'ISLAND')).toBe(false);
    session = sessionReducer(session, { type: 'SET_ISLAND', choice: 'NONE' });
    session = sessionReducer(session, { type: 'SET_ANGEL', choice: 'FR08' });
    expect(canContinue(session, 'ISLAND')).toBe(true);
    expect(canContinue(session, 'ANGEL')).toBe(true);
    expect(sessionReducer(session, { type: 'SET_ANGEL', choice: null }).angelChoice).toBeNull();
  });

  test('the Île step is skipped without another Vague or Flamme', () => {
    expect(shownSteps(run(start('BASE'), ...add('FR09', 'FR01')))).not.toContain('ISLAND');
  });

  test('Île targets follow the jokers and the Livre, Phénix included', () => {
    let session = run(start('BASE'), ...add('FR09', 'FR55', 'FR53', 'FR49', 'FR08', 'FR37', 'FR05'));
    expect(islandTargets(session).map((c) => c.id)).toEqual(['FR55', 'FR08']);
    session = sessionReducer(session, { type: 'SET_JOKER', joker: 'FR53', choice: 'FR08' });
    expect(islandTargets(session).map((c) => c.id)).toEqual(['FR55', 'FR53', 'FR08']);
    session = sessionReducer(session, { type: 'SET_BOOK', choice: { target: 'FR37', family: 'FLAMME' } });
    expect(islandTargets(session).map((c) => c.id)).toEqual(['FR55', 'FR53', 'FR08', 'FR37']);
    session = sessionReducer(session, { type: 'SET_ISLAND', choice: 'FR37' });
    expect(session.islandChoice).toBe('FR37');
    session = sessionReducer(session, { type: 'CLEAR_BOOK' });
    expect(session.islandChoice).toBeNull();
    expect(sessionReducer(session, { type: 'SET_ISLAND', choice: 'FR37' }).islandChoice).toBeNull();
  });

  test('the Île only offers cards whose malus it can still erase', () => {
    const targets = (...ids: CardId[]) => islandTargets(run(start('BASE'), ...add(...ids))).map((c) => c.id);
    expect(targets('FR09', 'FR06')).toEqual([]);
    expect(shownSteps(run(start('BASE'), ...add('FR09', 'FR06')))).not.toContain('ISLAND');
    expect(targets('FR09', 'FR08')).toEqual(['FR08']);
    expect(targets('FR09', 'FR08', 'FR01')).toEqual([]);
    expect(targets('FR09', 'FR08', 'FR50')).toEqual([]);
    expect(targets('FR09', 'FR55', 'FR02')).toEqual([]);
  });

  test('a Mirage keeps its own malus, a Doppelgänger takes the one it copies', () => {
    let session = run(start('BASE'), ...add('FR09', 'FR52', 'FR53', 'FR08'));
    session = sessionReducer(session, { type: 'SET_JOKER', joker: 'FR52', choice: 'FR08' });
    expect(islandTargets(session).map((c) => c.id)).toEqual(['FR08']);
    session = sessionReducer(session, { type: 'SET_JOKER', joker: 'FR53', choice: 'FR08' });
    expect(islandTargets(session).map((c) => c.id)).toEqual(['FR53', 'FR08']);
  });

  test('Ange targets are the other cards; removing the target clears the answer', () => {
    let session = run(start('FULL'), ...add('CH08', 'FR32', 'FR37'));
    expect(angelTargets(session).map((c) => c.id)).toEqual(['FR32', 'FR37']);
    session = sessionReducer(session, { type: 'SET_ANGEL', choice: 'FR32' });
    expect(sessionReducer(session, { type: 'REMOVE_CARD', id: 'FR32' }).angelChoice).toBeNull();
  });

  test('the player choices are scored as given, even when not the best', () => {
    let session = run(start('FULL'), ...add('CH08', 'FR32', 'FR37'), { type: 'SET_ANGEL', choice: 'FR32' });
    expect(scoreSession(session)?.total).toBe(57);
    session = sessionReducer(session, { type: 'SET_ANGEL', choice: 'NONE' });
    expect(scoreSession(session)?.total).toBe(51);
    const island = run(start('BASE'), ...add('FR09', 'FR12', 'FR16', 'FR37'), { type: 'SET_ISLAND', choice: 'FR16' });
    expect(scoreSession(island)?.total).toBe(95);
  });
});

describe('extension modules', () => {
  test('Objets maudits only: 7 cards, cursed step, no extra families', () => {
    const session = run(start('CURSED'), ...add('FR01'), ...curse('CH46', 'CH24'));
    expect(missingCards(session)).toBe(6);
    expect(shownSteps(session)).toEqual(['MODE', 'HAND', 'CURSED', 'BONUS', 'CONTEXT', 'RESULT']);
    expect(bonusPool(session).some((card) => card.id.startsWith('CH'))).toBe(false);
    expect(needsPlayerCount(session)).toBe(true);
  });

  test('Familles supplémentaires only: 8 cards, no cursed step, cursed items refused', () => {
    const session = run(start('FAMILIES'), ...add('CH09'), ...curse('CH25'));
    expect(missingCards(session)).toBe(7);
    expect(session.cursedItems).toEqual([]);
    expect(shownSteps(session)).toEqual(['MODE', 'HAND', 'BONUS', 'RESULT']);
  });
});
