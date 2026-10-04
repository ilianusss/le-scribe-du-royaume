import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { currentPlayer, playerName } from '@/flow/game';

import { copy } from './copy';
import { colors, minTap, spacing, type } from './theme';
import type { PressState } from './pressable';
import { useSession } from './SessionProvider';

interface Props {
  title: string;
  onBack: () => void;
  counter?: string;
  eyebrow?: string | null;
}

export function Header({ title, onBack, counter, eyebrow }: Props) {
  const { game } = useSession();
  const player = game ? currentPlayer(game) : 0;
  const auto = game && player <= game.playerCount ? copy.gamePlayerOf(player, game.playerCount, playerName(game, player)) : null;
  const above = eyebrow === undefined ? auto : eyebrow;
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={copy.back}
        hitSlop={8}
        style={({ pressed, focused }: PressState) => [styles.back, pressed && styles.pressed, focused && styles.focused]}
      >
        <ArrowLeft color={colors.velin} size={24} strokeWidth={1.75} />
      </Pressable>
      <View style={styles.titles}>
        {above && <Text style={styles.eyebrow}>{above}</Text>}
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text style={styles.counter}>{counter ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s, paddingVertical: spacing.s },
  back: { width: minTap, height: minTap, alignItems: 'center', justifyContent: 'center', borderRadius: minTap / 2 },
  pressed: { backgroundColor: colors.plomb },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
  titles: { flex: 1 },
  eyebrow: { ...type.small, color: colors.lumiere },
  title: { ...type.h1, color: colors.velin },
  counter: { ...type.number, color: colors.velinDoux, minWidth: minTap, textAlign: 'right' },
});
