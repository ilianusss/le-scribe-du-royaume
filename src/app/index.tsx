import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { ArchWindow, WINDOW_HEIGHT, WINDOW_WIDTH } from '@/ui/ArchWindow';
import { copy } from '@/ui/copy';
import { Screen } from '@/ui/Screen';
import { useSession } from '@/ui/SessionProvider';
import { colors, gutter, maxWidth, spacing, type } from '@/ui/theme';

function Fleuron() {
  return (
    <View aria-hidden>
      <Svg width={72} height={16} viewBox="0 0 72 16">
        <Path d="M2 8 H26 M46 8 H70" stroke={colors.lumiere} strokeOpacity={0.6} strokeWidth={1} />
        <Path d="M36 1 C40 5 40 11 36 15 C32 11 32 5 36 1 Z" fill="none" stroke={colors.lumiere} strokeWidth={1.25} />
        <Circle cx={29} cy={8} r={1.6} fill={colors.lumiere} />
        <Circle cx={43} cy={8} r={1.6} fill={colors.lumiere} />
      </Svg>
    </View>
  );
}

export default function Accueil() {
  const { dispatch } = useSession();
  const { width } = useWindowDimensions();
  const stacked = width < 360;
  const windowWidth = stacked ? WINDOW_WIDTH : Math.min(WINDOW_WIDTH, (Math.min(width, maxWidth) - gutter * 2 - spacing.l) / 2);
  const windowHeight = windowWidth * (WINDOW_HEIGHT / WINDOW_WIDTH);

  const window = (label: string, sub: string, onPress: () => void, mark?: string) => (
    <ArchWindow
      label={label}
      sub={sub}
      width={windowWidth}
      height={windowHeight}
      onPress={onPress}
      mark={mark && <Text style={styles.mark}>{mark}</Text>}
    />
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">
            {copy.appTitle}
          </Text>
          <Fleuron />
          <Text style={styles.subtitle}>{copy.homeSubtitle}</Text>
        </View>
        <View style={[styles.windows, stacked && styles.windowsStacked]}>
          {window(copy.homeBase, copy.homeBaseSub, () => {
            dispatch({ type: 'START', mode: 'BASE' });
            router.push('/setup');
          })}
          {window(copy.homeExt, copy.homeExtSub, () => router.push('/modules'), '☠')}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.xxxl, paddingVertical: spacing.xl },
  heading: { alignItems: 'center', gap: spacing.s },
  title: { ...type.title, color: colors.velin, textAlign: 'center' },
  subtitle: { ...type.body, color: colors.velinDoux, textAlign: 'center' },
  windows: { flexDirection: 'row', gap: spacing.l, justifyContent: 'center' },
  windowsStacked: { flexDirection: 'column', alignItems: 'center' },
  mark: { fontSize: 40, color: colors.velin },
});
