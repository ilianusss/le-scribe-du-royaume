import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CARDS_BY_ID, cardPool, type CardId } from '@/data/cards';
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
import { Vitrail } from '@/ui/Vitrail';

export default function Hand() {
  const { session, game, dispatch } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [selected, setSelected] = useState<CardId | null>(null);
  const primary = useRef<View>(null);
  const scroll = useRef<ScrollView>(null);
  const content = useRef<View>(null);
  const rows = useRef(new Map<CardId, View>());
  const complete = isHandComplete(session);

  useEffect(() => {
    if (complete) primary.current?.focus?.();
  }, [complete]);

  if (!session.mode) return <Redirect href="/" />;

  const mode = session.mode;
  const size = handSize(session);
  const leave = () => {
    if (game && game.finished.length > 0) {
      dispatch({ type: 'PREVIOUS_PLAYER' });
      router.push('/recap');
    } else if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const back = () => (session.hand.length > 0 ? setConfirming(true) : leave());
  const add = (id: CardId) => {
    dispatch({ type: 'ADD_CARD', id });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  const focusRow = (index: number) => {
    const id = session.hand[index];
    const row = rows.current.get(id);
    setSelected(id);
    if (row && content.current) {
      row.measureLayout(content.current, (_x, y) => scroll.current?.scrollTo({ y: Math.max(0, y - spacing.s) }));
    }
  };

  const chosen = session.hand.length > 0 && (
    <View style={styles.list}>
      {session.hand.map((id) => {
        const card = CARDS_BY_ID[id];
        return (
          <View
            key={id}
            ref={(view) => {
              if (view) rows.current.set(id, view);
              else rows.current.delete(id);
            }}
          >
            <SuggestionRow
              name={card.name}
              family={cardFamily(card)}
              familyLabel={cardFamilyLabel(card)}
              value={cardValue(card)}
              onRemove={() => dispatch({ type: 'REMOVE_CARD', id })}
              removeLabel={copy.handRemove(card.name)}
              selected={selected === id}
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <Screen>
      <Header title={copy.handTitle} onBack={back} counter={`${session.hand.length} / ${size}`} />
      <Vitrail
        slots={Array.from({ length: size }, (_, index) => ({ cardId: session.hand[index] }))}
        //emptyHint={copy.handFirstCard}
        onPanePress={focusRow}
      />
      <ScrollView ref={scroll} style={styles.flex} keyboardShouldPersistTaps="handled">
        <View ref={content} style={styles.content}>
          {complete ? (
            chosen
          ) : (
            <CardSearch
              items={cardPool(mode)}
              exclude={[...session.hand, ...(session.game?.unavailableCards ?? [])]}
              onSelect={(card) => add(card.id)}
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
        </View>
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
