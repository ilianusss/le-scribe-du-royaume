import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CARDS_BY_ID } from '@/data/cards';
import type { CardChoice } from '@/flow/session';
import { canContinue, finalHand, jokersInHand, jokerTargets, nextStep, type JokerId } from '@/flow/steps';
import { Button } from '@/ui/Button';
import { cardFamily, cardFamilyLabel, cardValue } from '@/ui/cardDisplay';
import { CardSearch } from '@/ui/CardSearch';
import { copy } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { goBack, goNext, useSession } from '@/ui/SessionProvider';
import { SuggestionRow } from '@/ui/SuggestionRow';
import { colors, fonts, radius, spacing } from '@/ui/theme';
import { Vitrail } from '@/ui/Vitrail';

export default function Jokers() {
  const { session, dispatch } = useSession();
  if (!session.mode) return <Redirect href="/" />;

  const jokers = jokersInHand(session);
  const firstOpen = jokers.find((joker) => session.jokerChoices[joker] === undefined);
  const copied = (joker: JokerId) => {
    const choice = session.jokerChoices[joker];
    return choice && choice !== 'NONE' ? choice : undefined;
  };
  const choose = (joker: JokerId, choice: CardChoice) => dispatch({ type: 'SET_JOKER', joker, choice });
  const label = nextStep(session, 'JOKERS') === 'RESULT' ? copy.ctaScore : copy.ctaContinue;

  const answer = (joker: JokerId, choice: CardChoice) => {
    const card = choice === 'NONE' ? CARDS_BY_ID[joker] : CARDS_BY_ID[choice];
    return (
      <>
        <View style={styles.list}>
          <SuggestionRow
            name={choice === 'NONE' ? copy.jokersNone : card.name}
            family={cardFamily(card)}
            familyLabel={cardFamilyLabel(card)}
            value={cardValue(card)}
            selected
          />
        </View>
        <Button label={copy.bonusChange} variant="text" onPress={() => dispatch({ type: 'CLEAR_JOKER', joker })} />
      </>
    );
  };

  const question = (joker: JokerId) => {
    const targets = jokerTargets(session, joker);
    return (
      <>
        {joker === 'FR53' ? (
          <View style={styles.list}>
            {targets.map((card) => (
              <SuggestionRow
                key={card.id}
                name={card.name}
                family={cardFamily(card)}
                familyLabel={cardFamilyLabel(card)}
                value={cardValue(card)}
                onPress={() => choose(joker, card.id)}
              />
            ))}
          </View>
        ) : (
          <CardSearch
            items={targets}
            exclude={[]}
            onSelect={(card) => choose(joker, card.id)}
            placeholder={copy.handPlaceholder}
            noMatch={copy.handNoMatch}
            familyOf={cardFamily}
            familyLabelOf={cardFamilyLabel}
            valueOf={cardValue}
            autoFocus={joker === firstOpen}
          />
        )}
        <Button label={copy.jokersNone} variant="secondary" onPress={() => choose(joker, 'NONE')} />
      </>
    );
  };

  return (
    <Screen>
      <Header title={copy.jokersTitle} onBack={() => goBack(session, 'JOKERS')} />
      <Vitrail slots={finalHand(session).map((cardId) => ({ cardId, copyOf: copied(cardId as JokerId) }))} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {jokers.map((joker) => {
          const choice = session.jokerChoices[joker];
          return (
            <View key={joker} style={styles.block}>
              <Text style={styles.heading}>{copy.jokersCopies(CARDS_BY_ID[joker].nameWithArticle)}</Text>
              {choice === undefined ? question(joker) : answer(joker, choice)}
            </View>
          );
        })}
      </ScrollView>
      {canContinue(session, 'JOKERS') && (
        <View style={styles.footer}>
          <Button label={label} onPress={() => goNext(session, 'JOKERS')} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.xxl },
  block: { gap: spacing.m },
  heading: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.velin },
  list: { backgroundColor: colors.plomb, borderRadius: radius, overflow: 'hidden' },
  footer: { paddingVertical: spacing.l },
});
