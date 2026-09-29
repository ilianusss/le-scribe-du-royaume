import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { Mode } from '@/data/cards';
import { copy } from '@/ui/copy';
import { Screen } from '@/ui/Screen';
import { useSession } from '@/ui/SessionProvider';
import { colors, fonts, spacing, type } from '@/ui/theme';
import type { PressState } from '@/ui/pressable';

export default function Accueil() {
  const { dispatch } = useSession();
  const { width } = useWindowDimensions();
  const stacked = width < 360;

  const choose = (mode: Mode) => {
    dispatch({ type: 'START', mode });
    router.push('/hand');
  };

  const window = (mode: Mode, label: string, sub: string, mark?: string) => (
    <Pressable
      onPress={() => choose(mode)}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${sub}`}
      style={({ pressed, focused }: PressState) => [
        styles.window,
        stacked && styles.windowStacked,
        pressed && styles.pressed,
        focused && styles.focused,
      ]}
    >
      <View style={styles.glass}>{mark && <Text style={styles.mark}>{mark}</Text>}</View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </Pressable>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">
            {copy.appTitle}
          </Text>
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
    flex: 1,
    maxWidth: 180,
    minHeight: 240,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 2,
    borderColor: colors.plombClair,
    backgroundColor: colors.plomb,
    alignItems: 'center',
    padding: spacing.l,
    paddingTop: spacing.xxl,
    gap: spacing.s,
  },
  windowStacked: { flex: 0, width: 200 },
  pressed: { borderColor: colors.lumiere },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
  glass: { flex: 1, minHeight: 80, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  mark: { fontSize: 40, color: colors.velin },
  label: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.velin, textAlign: 'center' },
  sub: { ...type.small, color: colors.velinDoux, textAlign: 'center' },
});
