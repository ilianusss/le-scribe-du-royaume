import { Redirect } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { FAMILY_NAMES } from '@/data/cards';
import { MAX_DISCARD, MAX_PLAYERS, MIN_PLAYERS, sessionDiscard } from '@/flow/session';
import { asksPlayerCount, canContinue, needsLicorne, neededDiscardFamilies } from '@/flow/steps';
import { Button } from '@/ui/Button';
import { copy } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { ScrollArea } from '@/ui/ScrollArea';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { goBack, goNext, useSession } from '@/ui/SessionProvider';
import { Stepper } from '@/ui/Stepper';
import { colors, fonts, spacing, type } from '@/ui/theme';

const PLAYER_OPTIONS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);

export default function End() {
  const { session, dispatch } = useSession();
  if (!session.mode) return <Redirect href="/" />;

  const families = neededDiscardFamilies(session);
  const discard = sessionDiscard(session);

  return (
    <Screen>
      <Header title={copy.endTitle} onBack={() => goBack(session, 'CONTEXT')} />
      <ScrollArea style={styles.flex} contentContainerStyle={styles.content}>
        {asksPlayerCount(session) && (
          <View style={styles.block}>
            <Text style={styles.heading}>{copy.endPlayers}</Text>
            <SegmentedControl
              label={copy.endPlayers}
              options={PLAYER_OPTIONS}
              value={session.playerCount}
              onChange={(count) => dispatch({ type: 'SET_PLAYER_COUNT', count })}
            />
          </View>
        )}
        {families.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.heading}>{copy.endDiscard}</Text>
            <Text style={styles.help}>{copy.endDiscardHelp}</Text>
            {families.map((family) => (
              <Stepper
                key={family}
                family={family}
                label={FAMILY_NAMES[family]}
                value={discard[family] ?? 0}
                min={0}
                max={MAX_DISCARD}
                onChange={(count) => dispatch({ type: 'SET_DISCARD', family, count })}
              />
            ))}
            {needsLicorne(session) && (
              <View style={styles.toggle}>
                <Text style={styles.toggleLabel}>{copy.endLicorne}</Text>
                <Switch
                  value={discard.licorne ?? false}
                  onValueChange={(value) => dispatch({ type: 'SET_LICORNE', value })}
                  accessibilityLabel={copy.endLicorne}
                  trackColor={{ true: colors.lumiere, false: colors.plombClair }}
                  thumbColor={colors.velin}
                />
              </View>
            )}
          </View>
        )}
      </ScrollArea>
      {canContinue(session, 'CONTEXT') && (
        <View style={styles.footer}>
          <Button label={copy.ctaScore} onPress={() => goNext(session, 'CONTEXT')} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.xxl },
  block: { gap: spacing.m },
  heading: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.velin },
  help: { ...type.small, color: colors.velinDoux },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.m, minHeight: 56 },
  toggleLabel: { ...type.body, color: colors.velin, flex: 1 },
  footer: { paddingVertical: spacing.l },
});
