import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { archPath } from './Pane';
import type { PressState } from './pressable';
import { colors, fonts, spacing, type } from './theme';

export const WINDOW_WIDTH = 160;
export const WINDOW_HEIGHT = 240;

interface Props {
  label: string;
  sub: string;
  width: number;
  height: number;
  onPress: () => void;
  mark?: ReactNode;
  selected?: boolean;
}

export function ArchWindow({ label, sub, width, height, onPress, mark, selected }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${sub}`}
      accessibilityState={{ selected }}
      style={({ focused }: PressState) => [styles.window, { width, height }, focused && !selected && styles.focused]}
    >
      {({ pressed }) => (
        <>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Path
              d={archPath(width, height, 1)}
              fill={colors.plomb}
              stroke={pressed || selected ? colors.lumiere : colors.plombClair}
              strokeWidth={2}
            />
          </Svg>
          <View style={styles.glass}>{mark}</View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  window: { alignItems: 'center', padding: spacing.l, paddingTop: spacing.xxxl, gap: spacing.s },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
  glass: { flex: 1, minHeight: 80, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.velin, textAlign: 'center' },
  sub: { ...type.small, color: colors.velinDoux, textAlign: 'center' },
});
