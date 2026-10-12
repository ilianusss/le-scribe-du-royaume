import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CARDS_BY_ID, FAMILY_NAMES, type Card, type CardId } from '@/data/cards';
import type { CardChoice } from '@/flow/session';
import { canContinue, familiesAfterChoices, finalHand, nextStep, type JokerId, type Step } from '@/flow/steps';

import { Button } from './Button';
import { cardValue } from './cardDisplay';
import { copy } from './copy';
import { Header } from './Header';
import { Screen } from './Screen';
import { ScrollArea } from './ScrollArea';
import { goBack, goNext, useSession } from './SessionProvider';
import { SuggestionRow } from './SuggestionRow';
import { colors, fonts, radius, spacing } from './theme';
import { Vitrail } from './Vitrail';

interface Props {
  step: Step;
  title: string;
  question: string;
  noneLabel: string;
  owner: CardId;
  targets: Card[];
  choice: CardChoice | null;
  onChoose: (choice: CardChoice | null) => void;
}

export function TargetChoice({ step, title, question, noneLabel, owner, targets, choice, onChoose }: Props) {
  const { session } = useSession();
  if (!session.mode) return <Redirect href="/" />;

  const label = nextStep(session, step) === 'RESULT' ? copy.ctaScore : copy.ctaContinue;
  const book = session.bookChoice;
  const row = (card: Card, onPress?: () => void) => {
    const families = familiesAfterChoices(session, card.id);
    return (
      <SuggestionRow
        key={card.id}
        name={card.name}
        family={families[0]}
        familyLabel={families.map((family) => FAMILY_NAMES[family]).join(' · ')}
        value={cardValue(card)}
        onPress={onPress}
        selected={!onPress}
      />
    );
  };
  const ownerCard = CARDS_BY_ID[owner];

  return (
    <Screen>
      <Header title={title} onBack={() => goBack(session, step)} />
      <Vitrail
        slots={finalHand(session).map((cardId) => {
          const joker = session.jokerChoices[cardId as JokerId];
          return {
            cardId,
            copyOf: joker && joker !== 'NONE' ? joker : undefined,
            asFamily: book && book !== 'NONE' && book.target === cardId ? book.family : undefined,
          };
        })}
      />
      <ScrollArea style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{question}</Text>
        {choice === null ? (
          <>
            <View style={styles.list}>{targets.map((card) => row(card, () => onChoose(card.id)))}</View>
            <Button label={noneLabel} variant="secondary" onPress={() => onChoose('NONE')} />
          </>
        ) : (
          <>
            <View style={styles.list}>
              {choice === 'NONE' ? (
                <SuggestionRow
                  name={noneLabel}
                  family={ownerCard.families[0]}
                  familyLabel={FAMILY_NAMES[ownerCard.families[0]]}
                  value={cardValue(ownerCard)}
                  selected
                />
              ) : (
                row(CARDS_BY_ID[choice])
              )}
            </View>
            <Button label={copy.bonusChange} variant="text" onPress={() => onChoose(null)} />
          </>
        )}
      </ScrollArea>
      {canContinue(session, step) && (
        <View style={styles.footer}>
          <Button label={label} onPress={() => goNext(session, step)} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.m },
  heading: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.velin },
  list: { backgroundColor: colors.plomb, borderRadius: radius, overflow: 'hidden' },
  footer: { paddingVertical: spacing.l },
});
