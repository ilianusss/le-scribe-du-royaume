import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { hasCursedItems } from '@/data/cards';
import { CURSED_ITEMS, CURSED_ITEMS_BY_ID } from '@/data/cursedItems';
import { cursedValue } from '@/engine/score';
import { nextStep } from '@/flow/steps';
import { Button } from '@/ui/Button';
import { cursedFamily, cursedFamilyLabel, cursedValueLabel } from '@/ui/cardDisplay';
import { CardSearch } from '@/ui/CardSearch';
import { copy, number, signed } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { ScrollArea } from '@/ui/ScrollArea';
import { goBack, goNext, useSession } from '@/ui/SessionProvider';
import { SuggestionRow } from '@/ui/SuggestionRow';
import { colors, radius, spacing, type } from '@/ui/theme';

export default function Cursed() {
  const { session, dispatch } = useSession();
  if (!session.mode || !hasCursedItems(session.mode)) return <Redirect href="/" />;

  const context = { mode: session.mode, cursedItems: session.cursedItems, playerCount: session.playerCount };
  const values = session.cursedItems.map((id) => cursedValue(id, context));
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const label = nextStep(session, 'CURSED') === 'RESULT' ? copy.ctaScore : copy.ctaContinue;

  return (
    <Screen>
      <Header title={copy.cursedTitle} onBack={() => goBack(session, 'CURSED')} />
      <ScrollArea style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.help}>{copy.cursedHelp}</Text>
        <CardSearch
          items={CURSED_ITEMS}
          exclude={[...session.cursedItems, ...(session.game?.unavailableCursed ?? [])]}
          onSelect={(item) => dispatch({ type: 'ADD_CURSED', id: item.id })}
          placeholder={copy.cursedPlaceholder}
          noMatch={copy.cursedNoMatch}
          familyOf={cursedFamily}
          familyLabelOf={cursedFamilyLabel}
          valueOf={cursedValueLabel}
          whenEmpty={
            values.length > 0 && (
              <>
                <View style={styles.list}>
                  {values.map(({ id, value }) => {
                    const item = CURSED_ITEMS_BY_ID[id];
                    return (
                      <SuggestionRow
                        key={id}
                        name={item.name}
                        family={cursedFamily()}
                        familyLabel={cursedFamilyLabel()}
                        value={signed(value)}
                        onRemove={() => dispatch({ type: 'REMOVE_CURSED', id })}
                        removeLabel={copy.handRemove(item.name)}
                      />
                    );
                  })}
                </View>
                <Text style={styles.total}>{copy.cursedTotal(number(total))}</Text>
              </>
            )
          }
        />
      </ScrollArea>
      <View style={styles.footer}>
        {session.cursedItems.length === 0 ? (
          <Button label={copy.cursedNone} variant="secondary" onPress={() => goNext(session, 'CURSED')} />
        ) : (
          <Button label={label} onPress={() => goNext(session, 'CURSED')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: spacing.l, gap: spacing.m },
  help: { ...type.body, color: colors.velinDoux },
  list: { backgroundColor: colors.plomb, borderRadius: radius, overflow: 'hidden' },
  total: { ...type.number, color: colors.velin, textAlign: 'right', paddingHorizontal: spacing.m },
  footer: { paddingVertical: spacing.l },
});
