import { Redirect, router } from 'expo-router';
import { ChevronRight, Crown } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { playerName, standings, type Game } from '@/flow/game';
import { scoreSession } from '@/flow/session';
import { Button } from '@/ui/Button';
import { copy, number } from '@/ui/copy';
import { Header } from '@/ui/Header';
import type { PressState } from '@/ui/pressable';
import { Screen } from '@/ui/Screen';
import { useSession } from '@/ui/SessionProvider';
import { colors, fonts, minTap, radius, spacing, type } from '@/ui/theme';
import { Vitrail } from '@/ui/Vitrail';

function label(game: Game, player: number): string {
  return playerName(game, player) ?? copy.gamePlayer(player);
}

function joinPlayers(game: Game, players: number[]): string {
  const names = players.map((player) => label(game, player));
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}` : names[0];
}

export default function Ranking() {
  const { game, dispatch } = useSession();
  const ranking = useMemo(() => (game ? standings(game) : []), [game]);
  const winners = ranking.filter((standing) => standing.rank === 1);
  const winnerResult = useMemo(
    () => (game && winners.length > 0 ? scoreSession(game.finished[winners[0].player - 1]) : null),
    [game, winners],
  );
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
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
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
          <Crown color={colors.lumiere} size={28} strokeWidth={1.5} />
          <Text style={styles.winnerName}>
            {winners.length > 1 ? copy.rankingTie(joinPlayers(game, winners.map((w) => w.player))) : label(game, winners[0].player)}
          </Text>
          <Text style={styles.total}>{number(winners[0].total)}</Text>
          <Text style={styles.sub}>
            {copy.resultPoints}
            {winners.length === 1 ? ` · ${copy.rankingWins}` : ''}
          </Text>
        </View>
        <View style={styles.list}>
          {ranking.map((standing) => (
            <Pressable
              key={standing.player}
              onPress={() => router.push({ pathname: '/result', params: { player: String(standing.player) } })}
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
          ))}
        </View>
        <View style={styles.actions}>
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
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.xl },
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
