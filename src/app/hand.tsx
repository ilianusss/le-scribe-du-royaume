import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CARDS_BY_ID, cardPool } from '@/data/cards';
import { handSize, isHandComplete, missingCards, nextStep } from '@/flow/steps';
import { Button } from '@/ui/Button';
import { cardFamily, cardFamilyLabel, cardValue } from '@/ui/cardDisplay';
import { CardSearch } from '@/ui/CardSearch';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { copy } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { goNext, useSession } from '@/ui/SessionProvider';
import { SuggestionRow } from '@/ui/SuggestionRow';
import { colors, radius, spacing, type } from '@/ui/theme';

export default function Hand() {
  const { session, dispatch } = useSession();
  const [confirming, setConfirming] = useState(false);
  const primary = useRef<View>(null);
  const complete = isHandComplete(session);

  useEffect(() => {
    if (complete) primary.current?.focus?.();
  }, [complete]);

  if (!session.mode) return <Redirect href="/" />;

  const mode = session.mode;
  const size = handSize(session);
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const back = () => (session.hand.length > 0 ? setConfirming(true) : leave());

  const chosen = session.hand.length > 0 && (
    <View style={styles.list}>
      {session.hand.map((id) => {
        const card = CARDS_BY_ID[id];
        return (
          <SuggestionRow
            key={id}
            name={card.name}
            family={cardFamily(card)}
            familyLabel={cardFamilyLabel(card)}
            value={cardValue(card)}
            onRemove={() => dispatch({ type: 'REMOVE_CARD', id })}
            removeLabel={copy.handRemove(card.name)}
          />
        );
      })}
    </View>
  );

  return (
    <Screen>
      <Header title={copy.handTitle} onBack={back} counter={`${session.hand.length} / ${size}`} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {complete ? (
          chosen
        ) : (
          <CardSearch
            items={cardPool(mode)}
            exclude={session.hand}
            onSelect={(card) => dispatch({ type: 'ADD_CARD', id: card.id })}
            placeholder={copy.handPlaceholder}
            noMatch={copy.handNoMatch}
            familyOf={cardFamily}
            familyLabelOf={cardFamilyLabel}
            valueOf={cardValue}
            whenEmpty={
              <>
                {chosen}
                {session.hand.length > 0 && <Text style={styles.help}>{copy.handMissing(missingCards(session))}</Text>}
              </>
            }
          />
        )}
      </ScrollView>
      {complete && (
        <View style={styles.footer}>
          <Button
            ref={primary}
            label={nextStep(session, 'HAND') === 'RESULT' ? copy.ctaScore : copy.ctaContinue}
            onPress={() => goNext(session, 'HAND')}
          />
        </View>
      )}
      <ConfirmDialog
        visible={confirming}
        message={copy.handAbandon}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          leave();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.m },
  list: { backgroundColor: colors.plomb, borderRadius: radius, overflow: 'hidden' },
  help: { ...type.small, color: colors.velinDoux, paddingHorizontal: spacing.xs },
  footer: { paddingVertical: spacing.l },
});
