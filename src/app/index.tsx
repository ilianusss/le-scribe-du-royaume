import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import Svg, { Circle, Path } from 'react-native-svg';

import type { Mode } from '@/data/cards';
import { copy } from '@/ui/copy';
import { archPath } from '@/ui/Pane';
import { Screen } from '@/ui/Screen';
import { useSession } from '@/ui/SessionProvider';
import { colors, fonts, gutter, maxWidth, spacing, type } from '@/ui/theme';
import type { PressState } from '@/ui/pressable';

const WINDOW_WIDTH = 160;
const WINDOW_HEIGHT = 240;

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

  const choose = (mode: Mode) => {
    dispatch({ type: 'START', mode });
    router.push('/hand');
  };

  const window = (mode: Mode, label: string, sub: string, mark?: string) => (
    <Pressable
      onPress={() => choose(mode)}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${sub}`}
      style={({ focused }: PressState) => [
        styles.window,
        { width: windowWidth, height: windowHeight },
        focused && styles.focused,
      ]}
    >
      {({ pressed }) => (
        <>
          <Svg width={windowWidth} height={windowHeight} style={StyleSheet.absoluteFill}>
            <Path
              d={archPath(windowWidth, windowHeight, 1)}
              fill={colors.plomb}
              stroke={pressed ? colors.lumiere : colors.plombClair}
              strokeWidth={2}
            />
          </Svg>
          <View style={styles.glass}>{mark && <Text style={styles.mark}>{mark}</Text>}</View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </>
      )}
    </Pressable>
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
          {window('BASE', copy.homeBase, copy.homeBaseSub)}
          {window('EXTENSION', copy.homeExt, copy.homeExtSub, '☠')}
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
  window: {
    alignItems: 'center',
    padding: spacing.l,
    paddingTop: spacing.xxxl,
    gap: spacing.s,
  },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
  glass: { flex: 1, minHeight: 80, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  mark: { fontSize: 40, color: colors.velin },
  label: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.velin, textAlign: 'center' },
  sub: { ...type.small, color: colors.velinDoux, textAlign: 'center' },
});
