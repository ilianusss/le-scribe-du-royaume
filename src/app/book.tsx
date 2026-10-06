import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARDS_BY_ID, FAMILY_NAMES, type CardId } from '@/data/cards';
import { bookFamilies, bookTargets, canContinue, currentFamily, finalHand, nextStep, type JokerId } from '@/flow/steps';
import { Button } from '@/ui/Button';
import { cardFamily, cardFamilyLabel, cardValue } from '@/ui/cardDisplay';
import { copy } from '@/ui/copy';
import { FamilyIcon } from '@/ui/FamilyIcon';
import { Header } from '@/ui/Header';
import type { PressState } from '@/ui/pressable';
import { Screen } from '@/ui/Screen';
import { ScrollArea } from '@/ui/ScrollArea';
import { goBack, goNext, useSession } from '@/ui/SessionProvider';
import { SuggestionRow } from '@/ui/SuggestionRow';
import { colors, familyColors, fonts, minTap, radius, spacing } from '@/ui/theme';
import { Vitrail } from '@/ui/Vitrail';

export default function Book() {
  const { session, dispatch } = useSession();
  const [picked, setPicked] = useState<CardId | null>(null);
  if (!session.mode) return <Redirect href="/" />;

  const choice = session.bookChoice;
  const label = nextStep(session, 'BOOK') === 'RESULT' ? copy.ctaScore : copy.ctaContinue;
  const copied = (id: CardId) => {
    const joker = session.jokerChoices[id as JokerId];
    return joker && joker !== 'NONE' ? joker : undefined;
  };
  const row = (id: CardId, onPress?: () => void) => {
    const card = CARDS_BY_ID[id];
    const family = currentFamily(session, id);
    return (
      <SuggestionRow
        key={id}
        name={card.name}
        family={family}
        familyLabel={FAMILY_NAMES[family]}
        value={cardValue(card)}
        onPress={onPress}
        selected={!onPress}
      />
    );
  };
  const reset = () => {
    setPicked(null);
    dispatch({ type: 'CLEAR_BOOK' });
  };

  let body;
  if (choice !== null) {
    body = (
      <>
        <View style={styles.list}>
          {choice === 'NONE' ? (
            <SuggestionRow
              name={copy.bookNone}
              family={cardFamily(CARDS_BY_ID.FR49)}
              familyLabel={cardFamilyLabel(CARDS_BY_ID.FR49)}
              value={cardValue(CARDS_BY_ID.FR49)}
              selected
            />
          ) : (
            <SuggestionRow
              name={copy.bookResult(CARDS_BY_ID[choice.target].name, FAMILY_NAMES[choice.family])}
              family={choice.family}
              familyLabel={FAMILY_NAMES[choice.family]}
              value={cardValue(CARDS_BY_ID[choice.target])}
              selected
            />
          )}
        </View>
        <Button label={copy.bonusChange} variant="text" onPress={reset} />
      </>
    );
  } else if (picked) {
    body = (
      <>
        <View style={styles.list}>{row(picked)}</View>
        <Text style={styles.heading}>{copy.bookFamily(CARDS_BY_ID[picked].name)}</Text>
        <View style={styles.grid}>
          {bookFamilies(session, picked).map((family) => (
            <Pressable
              key={family}
              onPress={() => dispatch({ type: 'SET_BOOK', choice: { target: picked, family } })}
              accessibilityRole="button"
              accessibilityLabel={FAMILY_NAMES[family]}
              style={({ pressed, focused }: PressState) => [
                styles.chip,
                pressed && styles.pressed,
                focused && styles.focused,
              ]}
            >
              <View style={[styles.bar, { backgroundColor: familyColors[family].pane }]} />
              <FamilyIcon family={family} color={colors.velin} size={18} />
              <Text style={styles.chipLabel} numberOfLines={1}>
                {FAMILY_NAMES[family]}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button label={copy.bonusChange} variant="text" onPress={() => setPicked(null)} />
      </>
    );
  } else {
    body = (
      <>
        <Text style={styles.heading}>{copy.bookTarget}</Text>
        <View style={styles.list}>{bookTargets(session).map((card) => row(card.id, () => setPicked(card.id)))}</View>
        <Button label={copy.bookNone} variant="secondary" onPress={() => dispatch({ type: 'SET_BOOK', choice: 'NONE' })} />
      </>
    );
  }

  return (
    <Screen>
      <Header title={copy.bookTitle} onBack={() => goBack(session, 'BOOK')} />
      <Vitrail
        slots={finalHand(session).map((cardId) => ({
          cardId,
          copyOf: copied(cardId),
          asFamily: choice !== null && choice !== 'NONE' && choice.target === cardId ? choice.family : undefined,
        }))}
      />
      <ScrollArea style={styles.flex} contentContainerStyle={styles.content}>
        {body}
      </ScrollArea>
      {canContinue(session, 'BOOK') && (
        <View style={styles.footer}>
          <Button label={label} onPress={() => goNext(session, 'BOOK')} />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
  chip: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: minTap,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingRight: spacing.m,
    backgroundColor: colors.plomb,
    borderRadius: radius,
    overflow: 'hidden',
  },
  bar: { width: 4, alignSelf: 'stretch' },
  chipLabel: { fontFamily: fonts.bodyMedium, fontSize: 17, color: colors.velin, flexShrink: 1 },
  pressed: { backgroundColor: colors.plombClair },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
  footer: { paddingVertical: spacing.l },
});
