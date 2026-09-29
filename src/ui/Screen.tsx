import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors, gutter, maxWidth } from './theme';

function Backdrop() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="lattice" width={46} height={62} patternUnits="userSpaceOnUse">
          <Path
            d="M23 0 L46 29 L23 62 L0 33 Z M0 33 L-23 62 M46 29 L69 0"
            fill="none"
            stroke={colors.velin}
            strokeWidth={1}
            strokeOpacity={0.045}
          />
        </Pattern>
        <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={colors.lumiere} stopOpacity={0.06} />
          <Stop offset="1" stopColor={colors.lumiere} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#lattice)" />
      <Ellipse cx="50%" cy="18%" rx="60%" ry="22%" fill="url(#glow)" />
    </Svg>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <Backdrop />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.column}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.nuit },
  flex: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth, alignSelf: 'center', paddingHorizontal: gutter },
});
