import { router, type Href } from 'expo-router';
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';

import { EMPTY_SESSION, sessionReducer, type ScoringSession, type SessionAction } from '@/flow/session';
import { nextStep, previousStep, type Step } from '@/flow/steps';

const SessionContext = createContext<{ session: ScoringSession; dispatch: Dispatch<SessionAction> } | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, EMPTY_SESSION);
  return <SessionContext.Provider value={{ session, dispatch }}>{children}</SessionContext.Provider>;
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
