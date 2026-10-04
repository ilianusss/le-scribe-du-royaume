import { Redirect, router } from 'expo-router';
import { Hand, Users } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { MAX_PLAYERS, MIN_PLAYERS } from '@/flow/session';
import { ArchWindow, WINDOW_HEIGHT, WINDOW_WIDTH } from '@/ui/ArchWindow';
import { Button } from '@/ui/Button';
import { copy } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { useSession } from '@/ui/SessionProvider';
import { colors, fonts, gutter, maxWidth, radius, spacing, type } from '@/ui/theme';

const PLAYER_OPTIONS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);

export default function Setup() {
  const { session, dispatch } = useSession();
  const { width } = useWindowDimensions();
  const [game, setGame] = useState(false);
  const [players, setPlayers] = useState<number | null>(null);
  const [withNames, setWithNames] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<number | null>(null);
  const fields = useRef<(TextInput | null)[]>([]);
  if (!session.mode) return <Redirect href="/" />;

  const mode = session.mode;
  const stacked = width < 360;
  const windowWidth = stacked ? WINDOW_WIDTH : Math.min(WINDOW_WIDTH, (Math.min(width, maxWidth) - gutter * 2 - spacing.l) / 2);
  const windowHeight = windowWidth * (WINDOW_HEIGHT / WINDOW_WIDTH);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen>
      <Header title={copy.setupTitle} onBack={back} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.windows, stacked && styles.windowsStacked]}>
          <ArchWindow
            label={copy.setupSingle}
            sub={copy.setupSingleSub}
            width={windowWidth}
            height={windowHeight}
            mark={<Hand color={colors.velin} size={40} strokeWidth={1.5} />}
            onPress={() => {
              dispatch({ type: 'START', mode });
              router.push('/hand');
            }}
          />
          <ArchWindow
            label={copy.setupGame}
            sub={copy.setupGameSub}
            width={windowWidth}
            height={windowHeight}
            mark={<Users color={colors.velin} size={40} strokeWidth={1.5} />}
            selected={game}
            onPress={() => setGame(true)}
          />
        </View>
        {game && (
          <View style={styles.players}>
            <Text style={styles.heading}>{copy.setupPlayers}</Text>
            <SegmentedControl label={copy.setupPlayers} options={PLAYER_OPTIONS} value={players} onChange={setPlayers} />
            {players !== null && (
              <View style={styles.toggle}>
                <Text style={styles.toggleLabel}>{copy.setupNames}</Text>
                <Switch
                  value={withNames}
                  onValueChange={setWithNames}
                  accessibilityLabel={copy.setupNames}
                  trackColor={{ true: colors.lumiere, false: colors.plombClair }}
                  thumbColor={colors.velin}
                />
              </View>
            )}
            {players !== null &&
              withNames &&
              Array.from({ length: players }, (_, index) => (
                <TextInput
                  key={index}
                  ref={(field) => {
                    fields.current[index] = field;
                  }}
                  value={names[index] ?? ''}
                  onChangeText={(text) => setNames((current) => Object.assign([...current], { [index]: text }))}
                  onFocus={() => setFocusedField(index)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={copy.gamePlayer(index + 1)}
                  placeholderTextColor={colors.velinDoux}
                  accessibilityLabel={copy.gamePlayer(index + 1)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="off"
                  maxLength={20}
                  returnKeyType={index + 1 < players ? 'next' : 'done'}
                  submitBehavior={index + 1 < players ? 'submit' : 'blurAndSubmit'}
                  onSubmitEditing={() => fields.current[index + 1]?.focus()}
                  style={[styles.input, focusedField === index && styles.inputFocused]}
                />
              ))}
          </View>
        )}
      </ScrollView>
      {game && players !== null && (
        <View style={styles.footer}>
          <Button
            label={copy.setupStart}
            onPress={() => {
              dispatch({ type: 'START_GAME', mode, playerCount: players, names: withNames ? names : [] });
              router.push('/hand');
            }}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.xxl, paddingVertical: spacing.xl },
  windows: { flexDirection: 'row', gap: spacing.l, justifyContent: 'center' },
  windowsStacked: { flexDirection: 'column', alignItems: 'center' },
  players: { gap: spacing.m },
  heading: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.velin },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.m, minHeight: 56 },
  toggleLabel: { ...type.body, color: colors.velin, flex: 1 },
  input: {
    ...type.input,
    color: colors.velin,
    backgroundColor: colors.plomb,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.plombClair,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    minHeight: 52,
    outlineWidth: 0,
  },
  inputFocused: { borderColor: colors.lumiere, borderWidth: 2 },
  footer: { paddingVertical: spacing.l },
});
