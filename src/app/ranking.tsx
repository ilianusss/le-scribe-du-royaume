import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { ChevronRight, Crown } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { G, Line } from 'react-native-svg';

import { playerName, standings, type Game } from '@/flow/game';
import { scoreSession } from '@/flow/session';
import { Button } from '@/ui/Button';
import { copy, number } from '@/ui/copy';
import { Header } from '@/ui/Header';
import type { PressState } from '@/ui/pressable';
import { Screen } from '@/ui/Screen';
import { ScrollArea } from '@/ui/ScrollArea';
import { useSession } from '@/ui/SessionProvider';
import { colors, fonts, minTap, radius, spacing, type } from '@/ui/theme';
import { Vitrail } from '@/ui/Vitrail';

const ROW_STEP = 450;
const ROW_DURATION = 320;
const WINNER_PAUSE = 260;
const BURST_DURATION = 900;
const CROWN_SIZE = 28;
const BURST_SIZE = 120;
const RAYS = 8;

function label(game: Game, player: number): string {
  return playerName(game, player) ?? copy.gamePlayer(player);
}

function joinPlayers(game: Game, players: number[]): string {
  const names = players.map((player) => label(game, player));
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}` : names[0];
}

function Reveal({
  animate,
  delay,
  style,
  pointerEvents,
  children,
}: {
  animate: boolean;
  delay: number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'none' | 'auto';
  children: ReactNode;
}) {
  const progress = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    progress.set(
      animate ? withDelay(delay, withTiming(1, { duration: ROW_DURATION, easing: Easing.out(Easing.quad) })) : 1,
    );
  }, [animate, delay, progress]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * 14 }],
  }));
  return (
    <Animated.View style={[style, revealStyle]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
}

function Celebration({ animate, delay }: { animate: boolean; delay: number }) {
  const burst = useSharedValue(0);
  useEffect(() => {
    burst.set(animate ? withDelay(delay, withTiming(1, { duration: BURST_DURATION, easing: Easing.out(Easing.quad) })) : 0);
  }, [animate, delay, burst]);
  const burstStyle = useAnimatedStyle(() => ({
    opacity: Math.sin(Math.PI * burst.get()) * 0.9,
    transform: [{ scale: 0.45 + burst.get() }],
  }));
  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.sin(Math.PI * burst.get()) * 0.3 }],
  }));

  return (
    <View style={styles.crown}>
      <Animated.View style={[styles.burst, burstStyle]} pointerEvents="none" aria-hidden>
        <Svg width={BURST_SIZE} height={BURST_SIZE} viewBox={`0 0 ${BURST_SIZE} ${BURST_SIZE}`}>
          <G stroke={colors.lumiere} strokeWidth={2.5} strokeLinecap="round">
            {Array.from({ length: RAYS }, (_, index) => {
              const angle = ((Math.PI * 2) / RAYS) * index;
              const half = BURST_SIZE / 2;
              return (
                <Line
                  key={index}
                  x1={half + Math.cos(angle) * 24}
                  y1={half + Math.sin(angle) * 24}
                  x2={half + Math.cos(angle) * 44}
                  y2={half + Math.sin(angle) * 44}
                />
              );
            })}
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={crownStyle}>
        <Crown color={colors.lumiere} size={CROWN_SIZE} strokeWidth={1.5} />
      </Animated.View>
    </View>
  );
}

export default function Ranking() {
  const { game, dispatch } = useSession();
  const ranking = useMemo(() => (game ? standings(game) : []), [game]);
  const winners = ranking.filter((standing) => standing.rank === 1);
  const winnerResult = useMemo(
    () => (game && winners.length > 0 ? scoreSession(game.finished[winners[0].player - 1]) : null),
    [game, winners],
  );
  const reduced = useReducedMotion();
  const [settled, setSettled] = useState(false);
  const skipping = useRef(false);
  const announced = useRef(false);
  const animate = !reduced && !settled;
  const winnerDelay = Math.max(0, ranking.length - 1) * ROW_STEP + ROW_DURATION + WINNER_PAUSE;
  const crowning = game && winners.length > 0 ? joinPlayers(game, winners.map((winner) => winner.player)) : null;

  useEffect(() => {
    if (!crowning || announced.current) return;
    const announce = () => {
      announced.current = true;
      AccessibilityInfo.announceForAccessibility(`${crowning} · ${copy.rankingWins}`);
    };
    if (!animate) {
      announce();
      return;
    }
    const crown = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      announce();
    }, winnerDelay);
    const done = setTimeout(() => setSettled(true), winnerDelay + BURST_DURATION);
    return () => {
      clearTimeout(crown);
      clearTimeout(done);
    };
  }, [animate, crowning, winnerDelay]);

  if (!game || game.finished.length < game.playerCount || !winnerResult) return <Redirect href="/" />;

  return (
    <Screen>
      <Header
        title={copy.rankingTitle}
        eyebrow={null}
        onBack={() => {
          dispatch({ type: 'PREVIOUS_PLAYER' });
          router.back();
        }}
      />
      <ScrollArea style={styles.flex}>
        <View
          style={styles.content}
          onStartShouldSetResponderCapture={() => {
            skipping.current = animate;
            setSettled(true);
            return false;
          }}
        >
          <Reveal animate={animate} delay={winnerDelay} style={styles.header}>
            <Vitrail
              slots={winnerResult.cards.map((trace) => ({
                cardId: trace.id,
                copyOf: trace.chosen?.kind === 'copy' ? trace.chosen.cardId : undefined,
                asFamily: trace.familyChangedBy ? trace.families[0] : undefined,
                state: trace.masked ? 'masked' : 'active',
              }))}
              settled
              glowColor={winnerResult.total < 0 ? colors.ember : undefined}
            />
            <View style={styles.winner} accessible accessibilityRole="header">
              <Celebration animate={animate} delay={winnerDelay} />
              <Text style={styles.winnerName}>
                {winners.length > 1 ? copy.rankingTie(joinPlayers(game, winners.map((w) => w.player))) : label(game, winners[0].player)}
              </Text>
              <Text style={styles.total}>{number(winners[0].total)}</Text>
              <Text style={styles.sub}>
                {copy.resultPoints}
                {winners.length === 1 ? ` · ${copy.rankingWins}` : ''}
              </Text>
            </View>
          </Reveal>
          <View style={styles.list}>
            {ranking.map((standing, index) => (
              <Reveal key={standing.player} animate={animate} delay={(ranking.length - 1 - index) * ROW_STEP}>
                <Pressable
                  onPress={() => {
                    if (skipping.current) return;
                    router.push({ pathname: '/result', params: { player: String(standing.player) } });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${standing.rank}, ${label(game, standing.player)}, ${number(standing.total)} ${copy.resultPoints}`}
                  style={({ pressed, focused }: PressState) => [styles.row, pressed && styles.pressed, focused && styles.focused]}
                >
                  <View style={[styles.bar, standing.rank === 1 && styles.winnerBar]} />
                  <Text style={[styles.rank, standing.rank === 1 && styles.winnerText]}>{standing.rank}</Text>
                  <View style={styles.nameCell}>
                    <Text style={styles.name} numberOfLines={1}>
                      {label(game, standing.player)}
                    </Text>
                    {standing.tieBreakUsed && <Text style={styles.tag}>{copy.resultTiebreak(standing.tieBreak)}</Text>}
                  </View>
                  <Text style={[styles.score, standing.total < 0 && styles.malus]}>{number(standing.total)}</Text>
                  <ChevronRight color={colors.velinDoux} size={18} strokeWidth={1.75} />
                </Pressable>
              </Reveal>
            ))}
          </View>
          <Reveal animate={animate} delay={winnerDelay} style={styles.actions} pointerEvents={animate ? 'none' : 'auto'}>
            <Button
              label={copy.rankingNew}
              onPress={() => {
                dispatch({ type: 'NEW_GAME' });
                router.dismissTo('/hand');
              }}
            />
            <Button
              label={copy.resultMode}
              variant="text"
              onPress={() => {
                dispatch({ type: 'END_GAME' });
                router.dismissTo('/');
              }}
            />
          </Reveal>
        </View>
      </ScrollArea>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.xl },
  header: { gap: spacing.xl },
  crown: { width: CROWN_SIZE, height: CROWN_SIZE, alignItems: 'center', justifyContent: 'center' },
  burst: {
    position: 'absolute',
    width: BURST_SIZE,
    height: BURST_SIZE,
    left: (CROWN_SIZE - BURST_SIZE) / 2,
    top: (CROWN_SIZE - BURST_SIZE) / 2,
  },
  winner: { alignItems: 'center', gap: spacing.xs },
  winnerName: { ...type.h1, color: colors.velin, textAlign: 'center' },
  total: { ...type.score, color: colors.lumiere },
  sub: { ...type.body, color: colors.velinDoux },
  list: { backgroundColor: colors.plomb, borderRadius: radius, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.m, minHeight: minTap + 8, paddingRight: spacing.m },
  pressed: { backgroundColor: colors.plombClair },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: -2 },
  bar: { width: 4, alignSelf: 'stretch', backgroundColor: colors.plombClair },
  winnerBar: { backgroundColor: colors.lumiere },
  rank: { fontFamily: fonts.headingBold, fontSize: 24, color: colors.velinDoux, minWidth: 24, textAlign: 'center' },
  winnerText: { color: colors.lumiere },
  nameCell: { flex: 1, paddingVertical: spacing.s },
  name: { fontFamily: fonts.bodyMedium, fontSize: 17, color: colors.velin },
  tag: { ...type.small, fontSize: 13, color: colors.velinDoux },
  score: { fontFamily: fonts.headingBold, fontSize: 22, color: colors.velin, fontVariant: ['tabular-nums'] },
  malus: { color: colors.malus },
  actions: { gap: spacing.m },
});
