import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { copy } from './copy';
import { colors, minTap, spacing, type } from './theme';
import type { PressState } from './pressable';

interface Props {
  title: string;
  onBack: () => void;
  counter?: string;
}

export function Header({ title, onBack, counter }: Props) {
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
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.counter}>{counter ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s, paddingVertical: spacing.s },
  back: { width: minTap, height: minTap, alignItems: 'center', justifyContent: 'center', borderRadius: minTap / 2 },
  pressed: { backgroundColor: colors.plomb },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
  title: { ...type.h1, color: colors.velin, flex: 1 },
  counter: { ...type.number, color: colors.velinDoux, minWidth: minTap, textAlign: 'right' },
});
