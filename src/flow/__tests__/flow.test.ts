import type { CardId, Mode } from '@/data/cards';
import type { CursedItemId } from '@/data/cursedItems';
import { EMPTY_SESSION, scoreSession, sessionReducer, type ScoringSession, type SessionAction } from '@/flow/session';
import {
  bonusPool,
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
    const session = run(start('BASE'), ...add('FR01'), start('EXTENSION'));
    expect(session).toEqual({ ...EMPTY_SESSION, mode: 'EXTENSION' });
  });

  test('cards are kept in entry order, without duplicates, up to the hand size', () => {
    const session = run(start('BASE'), ...add(...PLAIN_BASE, 'FR01', 'FR11'));
    expect(session.hand).toEqual(PLAIN_BASE);
    expect(missingCards(session)).toBe(0);
    expect(canContinue(session, 'HAND')).toBe(true);
  });

  test('an incomplete hand cannot continue and reports missing cards', () => {
    const session = run(start('EXTENSION'), ...add('FR01', 'FR02'));
    expect(missingCards(session)).toBe(6);
    expect(canContinue(session, 'HAND')).toBe(false);
  });

  test('NEW_HAND keeps the mode only', () => {
    const session = run(start('EXTENSION'), ...add('FR01'), ...curse('CH25'), { type: 'NEW_HAND' });
    expect(session).toEqual({ ...EMPTY_SESSION, mode: 'EXTENSION' });
  });
});

describe('conditional steps', () => {
  test('Jeu de base without bonus source: hand then result', () => {
    const session = run(start('BASE'), ...add(...PLAIN_BASE));
    expect(shownSteps(session)).toEqual(['MODE', 'HAND', 'RESULT']);
    expect(nextStep(session, 'HAND')).toBe('RESULT');
  });

  test('Extension always shows cursed items', () => {
    const session = run(start('EXTENSION'), ...add(...PLAIN_EXT));
    expect(shownSteps(session)).toEqual(['MODE', 'HAND', 'CURSED', 'RESULT']);
  });

  test('Nécromancien adds the bonus step in both modes', () => {
    expect(shownSteps(run(start('BASE'), ...add('FR28')))).toContain('BONUS');
    expect(shownSteps(run(start('EXTENSION'), ...add('FR28')))).toContain('BONUS');
  });

  test('Leprechaun, Génie and Portail are bonus sources only in Extension', () => {
    expect(shownSteps(run(start('EXTENSION'), ...add('CH09')))).toContain('BONUS');
    expect(shownSteps(run(start('EXTENSION'), ...add('CH06')))).toContain('BONUS');
    expect(shownSteps(run(start('EXTENSION'), ...curse('CH46')))).toContain('BONUS');
  });

  test('Génie or Longue-vue require the player count', () => {
    const genie = run(start('EXTENSION'), ...add('CH06'));
    expect(needsPlayerCount(genie)).toBe(true);
    expect(canContinue(genie, 'CONTEXT')).toBe(false);
    expect(canContinue(sessionReducer(genie, { type: 'SET_PLAYER_COUNT', count: 3 }), 'CONTEXT')).toBe(true);
    expect(needsPlayerCount(run(start('EXTENSION'), ...curse('CH24')))).toBe(true);
    expect(shownSteps(run(start('EXTENSION'), ...curse('CH24')))).toContain('CONTEXT');
  });

  test('player count is limited to 2..6', () => {
    const genie = run(start('EXTENSION'), ...add('CH06'));
    expect(sessionReducer(genie, { type: 'SET_PLAYER_COUNT', count: 7 }).playerCount).toBeNull();
    expect(sessionReducer(genie, { type: 'SET_PLAYER_COUNT', count: 1 }).playerCount).toBeNull();
  });

  test('undead cards ask the union of their discard families', () => {
    const session = run(start('EXTENSION'), ...add('CH13', 'CH15'));
    expect(neededDiscardFamilies(session)).toEqual(['ARMEE', 'SORCIER', 'ARME', 'ARTEFACT', 'EXTERIEUR']);
    expect(needsLicorne(session)).toBe(false);
    expect(needsLicorne(run(start('EXTENSION'), ...add('CH11')))).toBe(true);
    expect(canContinue(session, 'CONTEXT')).toBe(true);
  });

  test('Liche alone needs no discard', () => {
    expect(shownSteps(run(start('EXTENSION'), ...add('CH14')))).not.toContain('CONTEXT');
  });

  test('back goes to the previous shown step', () => {
    const session = run(start('EXTENSION'), ...add('FR28'));
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
    expect(bonusPool(run(start('EXTENSION'), ...add('FR28'))).map((c) => c.id)).toContain('CH12');
  });

  test('several sources: any card of the mode', () => {
    const pool = bonusPool(run(start('EXTENSION'), ...add('FR28', 'CH09'))).map((c) => c.id);
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
      start('EXTENSION'),
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
      start('EXTENSION'),
      ...add('CH06'),
      { type: 'SET_PLAYER_COUNT', count: 4 },
      { type: 'REMOVE_CARD', id: 'CH06' },
    );
    expect(session.playerCount).toBeNull();
  });

  test('a Génie taken as bonus card keeps the player count', () => {
    const session = run(
      start('EXTENSION'),
      ...add('CH09'),
      { type: 'SET_BONUS', id: 'CH06' },
      { type: 'SET_PLAYER_COUNT', count: 4 },
    );
    expect(needsPlayerCount(session)).toBe(true);
    expect(session.playerCount).toBe(4);
  });

  test('discard counts keep only the families still needed', () => {
    const session = run(
      start('EXTENSION'),
      ...add('CH11', 'CH15'),
      { type: 'SET_DISCARD', family: 'TERRAIN', count: 3 },
      { type: 'SET_DISCARD', family: 'ARME', count: 2 },
      { type: 'SET_LICORNE', value: true },
      { type: 'REMOVE_CARD', id: 'CH11' },
    );
    expect(session.discardCounts).toEqual({ ARME: 2 });
  });

  test('discard counts are clamped to 0..12', () => {
    const session = run(start('EXTENSION'), ...add('CH15'), { type: 'SET_DISCARD', family: 'ARME', count: 20 });
    expect(session.discardCounts.ARME).toBe(12);
  });
});

describe('scoring a session', () => {
  test('includes the bonus card, context and cursed items', () => {
    const session = run(
      start('EXTENSION'),
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
