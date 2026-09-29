import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from './theme';
import type { PressState } from './pressable';

interface Props {
  label: string;
  options: number[];
  value: number | null;
  onChange: (value: number) => void;
}

export function SegmentedControl({ label, options, value, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option, index) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${option}`}
            style={({ pressed, focused }: PressState) => [
              styles.segment,
              index > 0 && styles.divider,
              selected && styles.selected,
              pressed && !selected && styles.pressed,
              focused && styles.focused,
            ]}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.plombClair,
    overflow: 'hidden',
  },
  segment: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  divider: { borderLeftWidth: 1.5, borderLeftColor: colors.plombClair },
  selected: { backgroundColor: colors.lumiere },
  pressed: { backgroundColor: colors.plomb },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: -2 },
  text: { fontFamily: fonts.heading, fontSize: 20, color: colors.velin, fontVariant: ['tabular-nums'] },
  selectedText: { color: colors.encre },
});
