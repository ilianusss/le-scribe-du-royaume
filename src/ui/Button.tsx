import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, type View } from 'react-native';

import { colors, fonts, radius, spacing } from './theme';
import type { PressState } from './pressable';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  accessibilityLabel?: string;
}

export const Button = forwardRef<View, Props>(function Button(
  { label, onPress, variant = 'primary', accessibilityLabel },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed, focused }: PressState) => [
        styles.base,
        styles[variant],
        pressed && (variant === 'primary' ? styles.primaryPressed : styles.pressed),
        focused && styles.focused,
      ]}
    >
      {({ focused, hovered }: PressState) => (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.primaryLabel,
            variant === 'text' && (focused || hovered) && styles.underline,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.l },
  primary: { backgroundColor: colors.lumiere, minHeight: 56 },
  secondary: { borderWidth: 1.5, borderColor: colors.plombClair },
  text: {},
  primaryPressed: { opacity: 0.85 },
  pressed: { backgroundColor: colors.plomb },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.velin },
  primaryLabel: { color: colors.encre },
  underline: { textDecorationLine: 'underline' },
});
