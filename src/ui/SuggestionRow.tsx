import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FamilyIcon } from './FamilyIcon';
import { colors, familyColors, fonts, minTap, spacing, type, type PaneFamily } from './theme';
import type { PressState } from './pressable';

interface Props {
  name: string;
  match?: { start: number; end: number };
  family: PaneFamily;
  familyLabel: string;
  value: string;
  highlighted?: boolean;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  nativeID?: string;
}

export function SuggestionRow({
  name,
  match,
  family,
  familyLabel,
  value,
  highlighted,
  selected,
  onPress,
  onRemove,
  removeLabel,
  nativeID,
}: Props) {
  const bar = highlighted ? colors.lumiere : familyColors[family].pane;
  const content = (
    <>
      <View style={[styles.bar, { backgroundColor: bar }]} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={2}>
          {match ? (
            <>
              {name.slice(0, match.start)}
              <Text style={styles.matched}>{name.slice(match.start, match.end)}</Text>
              {name.slice(match.end)}
            </>
          ) : (
            name
          )}
        </Text>
        <View style={styles.family}>
          <FamilyIcon family={family} color={colors.velinDoux} size={14} />
          <Text style={styles.familyLabel}>{familyLabel}</Text>
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
    </>
  );
  return (
    <View
      nativeID={nativeID}
      style={[styles.row, (highlighted || selected) && styles.highlighted]}
    >
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityState={{ selected: highlighted }}
          accessibilityLabel={`${name}, ${familyLabel}, ${value}`}
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.pressable}>{content}</View>
      )}
      {onRemove && (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={removeLabel}
          style={({ pressed, focused }: PressState) => [styles.remove, pressed && styles.pressed, focused && styles.focused]}
        >
          <X color={colors.velinDoux} size={20} strokeWidth={1.75} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', minHeight: minTap },
  highlighted: { backgroundColor: colors.plombClair },
  pressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingRight: spacing.m },
  pressed: { backgroundColor: colors.plombClair },
  bar: { width: 4, alignSelf: 'stretch' },
  text: { flex: 1, paddingVertical: spacing.s },
  name: { fontFamily: fonts.bodyMedium, fontSize: 17, lineHeight: 22, color: colors.velin },
  matched: { fontFamily: fonts.bodyBold },
  family: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  familyLabel: { ...type.small, color: colors.velinDoux },
  value: { ...type.number, color: colors.velin, minWidth: 36, textAlign: 'right' },
  remove: { width: minTap, height: minTap, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: -2 },
});
