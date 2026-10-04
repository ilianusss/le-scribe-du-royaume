import type { CardId } from '@/data/cards';
import { appReducer, currentPlayer, INITIAL_STATE, playerName, standings, type AppAction, type AppState } from '@/flow/game';
import { scoreSession } from '@/flow/session';
import { bonusPool, shownSteps } from '@/flow/steps';

function run(...actions: AppAction[]): AppState {
  return actions.reduce(appReducer, INITIAL_STATE);
}

const add = (...ids: CardId[]) => ids.map((id) => ({ type: 'ADD_CARD', id }) as const);
const next = { type: 'NEXT_PLAYER' } as const;

const P1: CardId[] = ['FR31', 'FR32', 'FR21', 'FR22', 'FR23', 'FR24', 'FR25'];
const P2: CardId[] = ['FR01', 'FR02', 'FR04', 'FR05', 'FR06', 'FR07', 'FR10'];

describe('game', () => {
  test('a single hand has no game', () => {
    const state = run({ type: 'START_GAME', mode: 'BASE', playerCount: 3 }, { type: 'START', mode: 'BASE' });
    expect(state.game).toBeNull();
    expect(state.session.game).toBeNull();
  });

  test('players follow each other and the player count is known', () => {
    let state = run({ type: 'START_GAME', mode: 'FULL', playerCount: 3 });
    expect(currentPlayer(state.game!)).toBe(1);
    expect(state.session.playerCount).toBe(3);
    state = run({ type: 'START_GAME', mode: 'FULL', playerCount: 3 }, ...add('CH06'));
    expect(shownSteps(state.session)).not.toContain('CONTEXT');
    expect(scoreSession(state.session)?.cards[0].bonus).toBe(20);
    state = appReducer(state, next);
    expect(currentPlayer(state.game!)).toBe(2);
    expect(state.session.hand).toEqual([]);
  });

  test('cards and cursed items of previous players are unavailable', () => {
    const start = { type: 'START_GAME', mode: 'FULL', playerCount: 2 } as const;
    let state = run(start, ...add('FR28', 'FR01'), { type: 'SET_BONUS', id: 'FR31' }, { type: 'ADD_CURSED', id: 'CH25' }, next);
    expect(state.session.game?.unavailableCards).toEqual(['FR28', 'FR01', 'FR31']);
    expect(state.session.game?.unavailableCursed).toEqual(['CH25']);
    state = [...add('FR01', 'FR28', 'FR02'), { type: 'ADD_CURSED', id: 'CH25' } as const].reduce(appReducer, state);
    expect(state.session.hand).toEqual(['FR02']);
    expect(state.session.cursedItems).toEqual([]);
    expect(bonusPool({ ...state.session, hand: ['FR28'] }).map((c) => c.id)).not.toContain('FR31');
  });

  test('the discard entered by a previous player is reused', () => {
    const state = run(
      { type: 'START_GAME', mode: 'FULL', playerCount: 2 },
      ...add('CH15'),
      { type: 'SET_DISCARD', family: 'ARMEE', count: 2 },
      next,
      ...add('CH12'),
    );
    expect(state.session.game?.discard).toEqual({ ARMEE: 2 });
    expect(scoreSession(state.session)?.cards[0].bonus).toBe(8);
  });

  test('going back restores the previous player', () => {
    let state = run({ type: 'START_GAME', mode: 'BASE', playerCount: 2 }, ...add('FR01'), next, ...add('FR02'));
    state = appReducer(state, { type: 'PREVIOUS_PLAYER' });
    expect(currentPlayer(state.game!)).toBe(1);
    expect(state.session.hand).toEqual(['FR01']);
  });

  test('after the last player the game is complete and can restart', () => {
    let state = run({ type: 'START_GAME', mode: 'BASE', playerCount: 2 }, ...add(...P1), next, ...add(...P2), next);
    expect(state.game?.finished).toHaveLength(2);
    expect(appReducer(state, next)).toBe(state);
    state = appReducer(state, { type: 'NEW_GAME' });
    expect(state.game).toEqual({ mode: 'BASE', playerCount: 2, names: ['', ''], finished: [] });
    expect(appReducer(state, { type: 'END_GAME' })).toEqual(INITIAL_STATE);
  });
});

describe('player names', () => {
  test('names are optional, trimmed, and fall back to none', () => {
    const game = run({ type: 'START_GAME', mode: 'BASE', playerCount: 3, names: [' Alice ', '', 'Bob'] }).game!;
    expect(game.names).toEqual(['Alice', '', 'Bob']);
    expect([1, 2, 3].map((n) => playerName(game, n))).toEqual(['Alice', null, 'Bob']);
    expect(run({ type: 'START_GAME', mode: 'BASE', playerCount: 2 }).game!.names).toEqual(['', '']);
  });

  test('a new game keeps only the mode, the player count and the names', () => {
    const state = run(
      { type: 'START_GAME', mode: 'FULL', playerCount: 2, names: ['Alice', 'Bob'] },
      ...add('FR01'),
      { type: 'ADD_CURSED', id: 'CH25' },
      next,
      ...add('FR02'),
      next,
      { type: 'NEW_GAME' },
    );
    expect(state.game).toEqual({ mode: 'FULL', playerCount: 2, names: ['Alice', 'Bob'], finished: [] });
    expect(state.session.hand).toEqual([]);
    expect(state.session.cursedItems).toEqual([]);
    expect(state.session.game).toEqual({ playerCount: 2, unavailableCards: [], unavailableCursed: [], discard: {} });
  });
});

describe('standings', () => {
  test('ranked by total', () => {
    const state = run({ type: 'START_GAME', mode: 'BASE', playerCount: 2 }, ...add(...P2), next, ...add(...P1), next);
    const ranking = standings(state.game!);
    expect(ranking.map((s) => [s.player, s.rank])).toEqual([
      [2, 1],
      [1, 2],
    ]);
    expect(ranking[0].total).toBeGreaterThan(ranking[1].total);
    expect(ranking.every((s) => !s.tieBreakUsed)).toBe(true);
  });

  test('equal totals: the lowest total base strength wins, equal again is a shared rank', () => {
    const start = { type: 'START_GAME', mode: 'BASE', playerCount: 3 } as const;
    const session = (id: CardId) => run(start, ...add(id)).session;
    const game = { mode: 'BASE' as const, playerCount: 3, names: ['', '', ''], finished: [session('FR24'), session('FR22'), session('FR22')] };
    expect(standings(game)).toEqual([
      { player: 2, total: 15, tieBreak: 10, rank: 1, tieBreakUsed: true },
      { player: 3, total: 15, tieBreak: 10, rank: 1, tieBreakUsed: true },
      { player: 1, total: 15, tieBreak: 15, rank: 3, tieBreakUsed: true },
    ]);
  });
});
