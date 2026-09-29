import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { FAMILY_NAMES } from '@/data/cards';
import type { CardTrace } from '@/engine/types';
import { scoreSession } from '@/flow/session';
import { Button } from '@/ui/Button';
import { cardName } from '@/ui/cardDisplay';
import { CLEARER_WITH_ARTICLE, copy, MASKER_WITH_ARTICLE, number, signed } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { goBack, useSession } from '@/ui/SessionProvider';
import { colors, fonts, radius, spacing, type } from '@/ui/theme';
import { Vitrail } from '@/ui/Vitrail';

const PANE_STEP = 90;
const COUNT_DURATION = 700;

function displayName(trace: CardTrace): string {
  const name = cardName(trace.id);
  const chosen = trace.chosen;
  if (!chosen) return name;
  switch (chosen.kind) {
    case 'copy':
      return `${name} → ${cardName(chosen.cardId)}`;
    case 'copyFamily':
      return `${name} → ${FAMILY_NAMES[chosen.family]}`;
    case 'book':
      return `${name} : ${cardName(chosen.target)} devient ${FAMILY_NAMES[chosen.family]}`;
    case 'island':
    case 'angel':
      return `${name} → ${cardName(chosen.target)}`;
  }
}

function reason(ids: string[], articles: Record<string, string | undefined>): string | null {
  const names = [...new Set(ids)].map((id) => articles[id] ?? cardName(id as CardTrace['id']));
  return names.length > 0 ? `par ${names.join(', ')}` : null;
}

function useCountUp(target: number, animate: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / COUNT_DURATION);
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate]);
  return animate ? value : target;
}

function Row({ trace }: { trace: CardTrace }) {
  const delta = trace.bonus + trace.malus;
  const maskedReason = trace.masked && !trace.selfMasked ? reason(trace.maskedBy, MASKER_WITH_ARTICLE) : null;
  const clearedReason = trace.penaltyCleared ? reason(trace.clearedBy, CLEARER_WITH_ARTICLE) : null;
  return (
    <View style={[styles.row, trace.masked && styles.maskedRow]}>
      <View style={styles.nameCell}>
        <Text style={[styles.name, trace.masked && styles.dim]}>{displayName(trace)}</Text>
        {trace.masked && (
          <Text style={styles.tag}>
            {copy.resultMasked}
            {maskedReason ? ` · ${maskedReason}` : ''}
          </Text>
        )}
        {!trace.masked && trace.penaltyCleared && (
          <Text style={styles.tag}>
            {copy.resultCleared}
            {clearedReason ? ` · ${clearedReason}` : ''}
          </Text>
        )}
      </View>
      <Text style={[styles.num, trace.masked && styles.dim]}>{number(trace.base)}</Text>
      <Text style={[styles.num, styles.delta, delta < 0 && styles.malus, trace.masked && styles.dim]}>
        {trace.masked ? '—' : signed(delta)}
      </Text>
      <Text style={[styles.num, styles.subtotal, trace.masked && styles.dim]}>{number(trace.total)}</Text>
    </View>
  );
}

function rankLine(total: number): string {
  if (total < 0) return copy.rankRuins;
  if (total < 100) return copy.rankFief;
  if (total < 200) return copy.rankProsperous;
  if (total < 300) return copy.rankEmpire;
  return copy.rankLegend;
}

export default function Result() {
  const { session, dispatch } = useSession();
  const result = useMemo(() => scoreSession(session), [session]);
  const reduced = useReducedMotion();
  const [settled, setSettled] = useState(false);
  const animate = !reduced && !settled;
  const shown = useCountUp(result?.total ?? 0, animate);
  const revealEnd = Math.max((result?.cards.length ?? 0) * PANE_STEP + 240, COUNT_DURATION);
  const breakdown = useSharedValue(animate ? 0 : 1);
  const breakdownStyle = useAnimatedStyle(() => ({ opacity: breakdown.get() }));

  useEffect(() => {
    breakdown.set(animate ? withDelay(revealEnd, withTiming(1, { duration: 150 })) : 1);
  }, [animate, revealEnd, breakdown]);

  useEffect(() => {
    if (result) AccessibilityInfo.announceForAccessibility(`${number(result.total)} ${copy.resultPoints}`);
  }, [result]);

  if (!result) return <Redirect href="/" />;

  return (
    <Screen>
      <Header title={copy.resultTitle} onBack={() => goBack(session, 'RESULT')} />
      <ScrollView style={styles.flex}>
        <View
          style={styles.content}
          onStartShouldSetResponderCapture={() => {
            setSettled(true);
            return false;
          }}
        >
          <Vitrail
            slots={result.cards.map((trace) => ({ cardId: trace.id, state: trace.masked ? 'masked' : 'active' }))}
            revealStep={PANE_STEP}
            settled={!animate}
            glowColor={result.total < 0 ? colors.ember : undefined}
          />
          <View style={styles.totalBlock} accessibilityLiveRegion="polite">
            <Text style={styles.total} accessibilityLabel={`${number(result.total)} ${copy.resultPoints}`}>
              {number(shown)}
            </Text>
            <Text style={styles.points}>{copy.resultPoints}</Text>
            <Text style={styles.rank}>{rankLine(result.total)}</Text>
          </View>
          <Animated.View style={[styles.section, breakdownStyle]}>
            <View style={styles.list}>
              {result.cards.map((trace) => (
                <Row key={trace.id} trace={trace} />
              ))}
              {result.cursed.length > 0 && (
                <View style={styles.row}>
                  <Text style={[styles.name, styles.nameCell]}>{copy.resultCursed}</Text>
                  <Text style={[styles.num, styles.subtotal, result.cursedTotal < 0 && styles.malus]}>
                    {number(result.cursedTotal)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.tiebreak}>{copy.resultTiebreak(result.tieBreak)}</Text>
            <View style={styles.actions}>
              <Button
                label={copy.resultNew}
                onPress={() => {
                  dispatch({ type: 'NEW_HAND' });
                  router.dismissTo('/hand');
                }}
              />
              <Button label={copy.resultEdit} variant="secondary" onPress={() => router.dismissTo('/hand')} />
              <Button label={copy.resultMode} variant="text" onPress={() => router.dismissTo('/')} />
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.xl },
  section: { gap: spacing.xl },
  totalBlock: { alignItems: 'center' },
  total: { ...type.score, color: colors.lumiere },
  points: { ...type.body, color: colors.velinDoux },
  rank: { ...type.body, color: colors.velinDoux, marginTop: spacing.xs },
  list: { backgroundColor: colors.plomb, borderRadius: radius, paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s, paddingHorizontal: spacing.m, minHeight: 48 },
  maskedRow: { opacity: 0.85 },
  nameCell: { flex: 1, paddingVertical: spacing.s },
  name: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 21, color: colors.velin },
  tag: { ...type.small, fontSize: 13, color: colors.velinDoux },
  dim: { color: colors.velinDoux },
  num: { ...type.number, color: colors.velin, width: 40, textAlign: 'right' },
  delta: { width: 48 },
  subtotal: { width: 44, fontFamily: fonts.headingBold },
  malus: { color: colors.malus },
  tiebreak: { ...type.small, color: colors.velinDoux, textAlign: 'center' },
  actions: { gap: spacing.m },
});
