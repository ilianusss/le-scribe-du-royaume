import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CARDS_BY_ID, FAMILY_NAMES, type CardId } from '@/data/cards';
import { CURSED_ITEMS_BY_ID } from '@/data/cursedItems';
import type { ChosenOption } from '@/engine/types';
import type { ScoringSession } from '@/flow/session';
import { JOKERS, familiesAfterChoices, finalHand, type JokerId } from '@/flow/steps';
import { Button } from '@/ui/Button';
import { cardNameWithChoice, cardValue, cursedFamily, cursedFamilyLabel } from '@/ui/cardDisplay';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { copy } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { ScrollArea } from '@/ui/ScrollArea';
import { goBack, useSession } from '@/ui/SessionProvider';
import { SuggestionRow } from '@/ui/SuggestionRow';
import { colors, fonts, radius, spacing } from '@/ui/theme';
import { Vitrail } from '@/ui/Vitrail';

const NONE_LABELS: Partial<Record<CardId, string>> = {
  FR53: copy.jokersNone,
  FR52: copy.jokersNone,
  FR51: copy.jokersNone,
  FR49: copy.bookNone,
  FR09: copy.islandNone,
  CH08: copy.angelNone,
};

function chosenOf(session: ScoringSession, id: CardId): ChosenOption | null {
  if (JOKERS.includes(id as JokerId)) {
    const choice = session.jokerChoices[id as JokerId];
    return choice && choice !== 'NONE' ? { kind: 'copy', cardId: choice } : null;
  }
  if (id === 'FR49') {
    const choice = session.bookChoice;
    return choice && choice !== 'NONE' ? { kind: 'book', target: choice.target, family: choice.family } : null;
  }
  if (id === 'FR09') {
    const choice = session.islandChoice;
    return choice && choice !== 'NONE' ? { kind: 'island', target: choice } : null;
  }
  if (id === 'CH08') {
    const choice = session.angelChoice;
    return choice && choice !== 'NONE' ? { kind: 'angel', target: choice } : null;
  }
  return null;
}

function choseNothing(session: ScoringSession, id: CardId): boolean {
  if (JOKERS.includes(id as JokerId)) return session.jokerChoices[id as JokerId] === 'NONE';
  if (id === 'FR49') return session.bookChoice === 'NONE';
  if (id === 'FR09') return session.islandChoice === 'NONE';
  if (id === 'CH08') return session.angelChoice === 'NONE';
  return false;
}

export default function Recap() {
  const { session, game, dispatch } = useSession();
  const [abandoning, setAbandoning] = useState(false);
  if (!session.mode || !game) return <Redirect href="/" />;

  const book = session.bookChoice;
  const last = game.finished.length + 1 === game.playerCount;

  return (
    <Screen>
      <Header title={copy.recapTitle} onBack={() => goBack(session, 'RECAP')} />
      <Vitrail
        slots={finalHand(session).map((cardId) => {
          const joker = session.jokerChoices[cardId as JokerId];
          return {
            cardId,
            copyOf: joker && joker !== 'NONE' ? joker : undefined,
            asFamily: book && book !== 'NONE' && book.target === cardId ? book.family : undefined,
          };
        })}
        settled
      />
      <ScrollArea style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{copy.recapQuestion}</Text>
        <View style={styles.list}>
          {finalHand(session).map((id) => {
            const families = familiesAfterChoices(session, id);
            const nothing = choseNothing(session, id) ? NONE_LABELS[id] : undefined;
            return (
              <SuggestionRow
                key={id}
                name={cardNameWithChoice(id, chosenOf(session, id))}
                family={families[0]}
                familyLabel={families
                  .map((family) => FAMILY_NAMES[family])
                  .concat(nothing ?? [])
                  .join(' · ')}
                value={cardValue(CARDS_BY_ID[id])}
              />
            );
          })}
        </View>
        {session.cursedItems.length > 0 && (
          <>
            <Text style={styles.heading}>{copy.cursedTitle}</Text>
            <View style={styles.list}>
              {session.cursedItems.map((id) => (
                <SuggestionRow
                  key={id}
                  name={CURSED_ITEMS_BY_ID[id].name}
                  family={cursedFamily()}
                  familyLabel={cursedFamilyLabel()}
                  value=""
                />
              ))}
            </View>
          </>
        )}
        <View style={styles.actions}>
          <Button
            label={last ? copy.gameRanking : copy.gameNext}
            onPress={() => {
              dispatch({ type: 'NEXT_PLAYER' });
              if (last) router.push('/ranking');
              else router.dismissTo('/hand');
            }}
          />
          <Button label={copy.resultEdit} variant="secondary" onPress={() => router.dismissTo('/hand')} />
          <Button label={copy.gameAbandon} variant="text" onPress={() => setAbandoning(true)} />
        </View>
      </ScrollArea>
      <ConfirmDialog
        visible={abandoning}
        message={copy.gameAbandonConfirm}
        onCancel={() => setAbandoning(false)}
        onConfirm={() => {
          setAbandoning(false);
          dispatch({ type: 'END_GAME' });
          router.dismissTo('/');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.m },
  heading: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.velin },
  list: { backgroundColor: colors.plomb, borderRadius: radius, overflow: 'hidden' },
  actions: { gap: spacing.m, paddingTop: spacing.m },
});
