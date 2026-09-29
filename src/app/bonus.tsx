import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CARDS_BY_ID } from '@/data/cards';
import { bonusPool, bonusSources, nextStep } from '@/flow/steps';
import { Button } from '@/ui/Button';
import { cardFamily, cardFamilyLabel, cardValue } from '@/ui/cardDisplay';
import { CardSearch } from '@/ui/CardSearch';
import { copy, SOURCE_WITH_ARTICLE } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { goBack, goNext, useSession } from '@/ui/SessionProvider';
import { SuggestionRow } from '@/ui/SuggestionRow';
import { colors, radius, spacing, type } from '@/ui/theme';
import { Vitrail } from '@/ui/Vitrail';

const SOURCE_NAMES = { FR28: 'Nécromancien', CH09: 'Leprechaun', CH06: 'Génie', CH46: 'Portail' } as const;

export default function Bonus() {
  const { session, dispatch } = useSession();
  if (!session.mode) return <Redirect href="/" />;

  const sources = bonusSources(session);
  const subtitle =
    sources.length > 1
      ? copy.bonusSeveral(sources.map((source) => SOURCE_NAMES[source]).join(', '))
      : sources[0] === 'FR28'
        ? copy.bonusNecro
        : copy.bonusDraw(SOURCE_WITH_ARTICLE[sources[0]]);
  const bonus = session.bonusCard ? CARDS_BY_ID[session.bonusCard] : null;
  const label = nextStep(session, 'BONUS') === 'RESULT' ? copy.ctaScore : copy.ctaContinue;

  return (
    <Screen>
      <Header title={copy.bonusTitle} onBack={() => goBack(session, 'BONUS')} />
      <Vitrail
        slots={[
          ...session.hand.map((cardId) => ({ cardId })),
          { cardId: session.bonusCard ?? undefined, dashedColor: colors.lumiere },
        ]}
      />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>{subtitle}</Text>
        {bonus ? (
          <>
            <View style={styles.list}>
              <SuggestionRow
                name={bonus.name}
                family={cardFamily(bonus)}
                familyLabel={cardFamilyLabel(bonus)}
                value={cardValue(bonus)}
                selected
              />
            </View>
            <Button label={copy.bonusChange} variant="text" onPress={() => dispatch({ type: 'SKIP_BONUS' })} />
          </>
        ) : (
          <CardSearch
            items={bonusPool(session)}
            exclude={session.hand}
            onSelect={(card) => dispatch({ type: 'SET_BONUS', id: card.id })}
            placeholder={copy.handPlaceholder}
            noMatch={copy.handNoMatch}
            familyOf={cardFamily}
            familyLabelOf={cardFamilyLabel}
            valueOf={cardValue}
          />
        )}
      </ScrollView>
      <View style={styles.footer}>
        {bonus ? (
          <Button label={label} onPress={() => goNext(session, 'BONUS')} />
        ) : (
          <Button
            label={copy.bonusSkip}
            variant="secondary"
            onPress={() => {
              dispatch({ type: 'SKIP_BONUS' });
              goNext(session, 'BONUS');
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.m },
  subtitle: { ...type.body, color: colors.velin },
  list: { backgroundColor: colors.plomb, borderRadius: radius, overflow: 'hidden' },
  footer: { paddingVertical: spacing.l },
});
