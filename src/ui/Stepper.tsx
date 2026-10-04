import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { copy } from './copy';
import { FamilyIcon } from './FamilyIcon';
import { colors, fonts, spacing, type, type PaneFamily } from './theme';
import type { PressState } from './pressable';

interface Props {
  family: PaneFamily;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function Stepper({ family, label, value, min, max, onChange }: Props) {
  const button = (kind: 'minus' | 'plus') => {
    const disabled = kind === 'minus' ? value <= min : value >= max;
    const Icon = kind === 'minus' ? Minus : Plus;
    return (
      <Pressable
        onPress={() => onChange(kind === 'minus' ? value - 1 : value + 1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={kind === 'minus' ? copy.endStepperMinus(label) : copy.endStepperPlus(label)}
        accessibilityState={{ disabled }}
        style={({ pressed, focused }: PressState) => [
          styles.round,
          pressed && styles.pressed,
          disabled && styles.disabled,
          focused && styles.focused,
        ]}
      >
        <Icon color={colors.velin} size={20} strokeWidth={1.75} />
      </Pressable>
    );
  };
  return (
    <View style={styles.row}>
      <FamilyIcon family={family} color={colors.velinDoux} size={20} />
      <Text style={styles.label}>{label}</Text>
      {button('minus')}
      <Text style={styles.count} accessibilityLabel={copy.endStepperValue(label, value)}>
        {value}
      </Text>
      {button('plus')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.m, minHeight: 56 },
  label: { ...type.body, color: colors.velin, flex: 1 },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.plombClair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.plomb },
  disabled: { opacity: 0.35 },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
  count: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.velin,
    minWidth: 32,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
