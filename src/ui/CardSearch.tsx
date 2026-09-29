import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type NativeSyntheticEvent, type TextInputKeyPressEventData } from 'react-native';

import { suggest } from '@/search/suggest';

import { SuggestionRow } from './SuggestionRow';
import { colors, radius, spacing, type, type PaneFamily } from './theme';

export interface SearchItem {
  id: string;
  name: string;
}

interface Props<T extends SearchItem> {
  items: readonly T[];
  exclude: readonly string[];
  onSelect: (item: T) => void;
  placeholder: string;
  noMatch: (query: string) => string;
  familyOf: (item: T) => PaneFamily;
  familyLabelOf: (item: T) => string;
  valueOf: (item: T) => string;
  whenEmpty?: ReactNode;
  autoFocus?: boolean;
}

export function CardSearch<T extends SearchItem>({
  items,
  exclude,
  onSelect,
  placeholder,
  noMatch,
  familyOf,
  familyLabelOf,
  valueOf,
  whenEmpty,
  autoFocus = true,
}: Props<T>) {
  const input = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [focused, setFocused] = useState(false);
  const suggestions = suggest(items, query, exclude);
  const active = Math.min(highlight, Math.max(0, suggestions.length - 1));

  const change = (text: string) => {
    setQuery(text);
    setHighlight(0);
  };

  const select = (item: T) => {
    onSelect(item);
    change('');
    input.current?.focus();
  };

  const onKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const { key } = event.nativeEvent;
    if (suggestions.length === 0) return;
    if (key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((active + 1) % suggestions.length);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((active - 1 + suggestions.length) % suggestions.length);
    } else if (key === 'Escape') {
      change('');
    }
  };

  const listId = 'card-search-list';
  const hasQuery = query.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        ref={input}
        value={query}
        onChangeText={change}
        onKeyPress={onKeyPress}
        onSubmitEditing={() => suggestions[active] && select(suggestions[active].item)}
        placeholder={placeholder}
        placeholderTextColor={colors.velinDoux}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        autoComplete="off"
        inputMode="search"
        enterKeyHint="done"
        returnKeyType="done"
        submitBehavior="submit"
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        accessibilityState={{ expanded: suggestions.length > 0 }}
        aria-controls={listId}
        aria-activedescendant={suggestions[active] ? `${listId}-${suggestions[active].item.id}` : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
      {hasQuery ? (
        suggestions.length > 0 ? (
          <View style={styles.list} nativeID={listId} role="list">
            {suggestions.map(({ item, match }, index) => (
              <SuggestionRow
                key={item.id}
                nativeID={`${listId}-${item.id}`}
                name={item.name}
                match={match}
                family={familyOf(item)}
                familyLabel={familyLabelOf(item)}
                value={valueOf(item)}
                highlighted={index === active}
                onPress={() => select(item)}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.noMatch}>{noMatch(query.trim())}</Text>
        )
      ) : (
        whenEmpty
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.s },
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
  list: { backgroundColor: colors.plomb, borderRadius: radius, overflow: 'hidden' },
  noMatch: { ...type.body, color: colors.velinDoux, paddingHorizontal: spacing.xs, paddingVertical: spacing.m },
});
