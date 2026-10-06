import { router } from 'expo-router';
import { ChevronRight, Skull } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Mode } from '@/data/cards';
import { copy } from '@/ui/copy';
import { FamilyIcon } from '@/ui/FamilyIcon';
import { Header } from '@/ui/Header';
import type { PressState } from '@/ui/pressable';
import { Screen } from '@/ui/Screen';
import { ScrollArea } from '@/ui/ScrollArea';
import { useSession } from '@/ui/SessionProvider';
import { colors, familyColors, fonts, radius, spacing, type } from '@/ui/theme';

export default function Modules() {
  const { dispatch } = useSession();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const option = (mode: Mode, label: string, sub: string, bar: string, icon: ReactNode) => (
    <Pressable
      onPress={() => {
        dispatch({ type: 'START', mode });
        router.push('/setup');
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${sub}`}
      style={({ pressed, focused }: PressState) => [styles.row, pressed && styles.pressed, focused && styles.focused]}
    >
      <View style={[styles.bar, { backgroundColor: bar }]} />
      <View style={styles.icon}>{icon}</View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <ChevronRight color={colors.velinDoux} size={20} strokeWidth={1.75} />
    </Pressable>
  );

  return (
    <Screen>
      <Header title={copy.modulesTitle} onBack={back} />
      <ScrollArea contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{copy.modulesQuestion}</Text>
        <View style={styles.list}>
          {option(
            'FAMILIES',
            copy.modulesFamilies,
            copy.modulesFamiliesSub,
            familyColors.BATIMENT.pane,
            <FamilyIcon family="BATIMENT" color={colors.velin} size={24} />,
          )}
          {option(
            'CURSED',
            copy.modulesCursed,
            copy.modulesCursedSub,
            colors.poison,
            <FamilyIcon family="OBJET_MAUDIT" color={colors.velin} size={24} />,
          )}
          {option(
            'FULL',
            copy.modulesFull,
            copy.modulesFullSub,
            colors.lumiere,
            <Skull color={colors.velin} size={24} strokeWidth={1.75} />,
          )}
        </View>
      </ScrollArea>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.l, paddingVertical: spacing.xl },
  heading: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.velin },
  list: { backgroundColor: colors.plomb, borderRadius: radius, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.m, minHeight: 76, paddingRight: spacing.m },
  pressed: { backgroundColor: colors.plombClair },
  focused: { outlineColor: colors.lumiere, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: -2 },
  bar: { width: 4, alignSelf: 'stretch' },
  icon: { width: 32, alignItems: 'center' },
  text: { flex: 1, paddingVertical: spacing.m, gap: 2 },
  label: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 24, color: colors.velin },
  sub: { ...type.small, color: colors.velinDoux },
});
