import { router, type Href } from 'expo-router';
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';

import { appReducer, INITIAL_STATE, type AppAction, type Game } from '@/flow/game';
import type { ScoringSession } from '@/flow/session';
import { nextStep, previousStep, type Step } from '@/flow/steps';

const SessionContext = createContext<{
  session: ScoringSession;
  game: Game | null;
  dispatch: Dispatch<AppAction>;
} | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  return (
    <SessionContext.Provider value={{ session: state.session, game: state.game, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

export const STEP_ROUTES: Record<Step, Href> = {
  MODE: '/',
  HAND: '/hand',
  CURSED: '/cursed',
  BONUS: '/bonus',
  JOKERS: '/jokers',
  BOOK: '/book',
  ISLAND: '/island',
  ANGEL: '/angel',
  CONTEXT: '/end',
  RESULT: '/result',
};

export function goNext(session: ScoringSession, current: Step) {
  router.push(STEP_ROUTES[nextStep(session, current)]);
}

export function goBack(session: ScoringSession, current: Step) {
  if (router.canGoBack()) router.back();
  else router.replace(STEP_ROUTES[previousStep(session, current)]);
}
