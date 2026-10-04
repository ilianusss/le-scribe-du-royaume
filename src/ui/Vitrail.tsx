import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CardId, Family } from '@/data/cards';

import { Pane, PANE_RATIO, type PaneState } from './Pane';
import { colors, type } from './theme';

const LEAD = 3;
const MAX_PANE = 56;

export interface VitrailSlot {
  cardId?: CardId;
  copyOf?: CardId;
  asFamily?: Family;
  state?: PaneState;
  dashedColor?: string;
}

interface Props {
  slots: VitrailSlot[];
  revealStep?: number;
  settled?: boolean;
  glowColor?: string;
  emptyHint?: string;
  onPanePress?: (index: number) => void;
}

export function Vitrail({ slots, revealStep = 90, settled, glowColor, emptyHint, onPanePress }: Props) {
  const [width, setWidth] = useState(0);
  const paneWidth = Math.min(MAX_PANE, (width - LEAD * (slots.length - 1)) / slots.length);
  const showHint = emptyHint && slots.every((slot) => !slot.cardId);

  return (
    <View
      style={[styles.row, { minHeight: paneWidth > 0 ? paneWidth * PANE_RATIO : MAX_PANE * PANE_RATIO }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {paneWidth > 0 &&
        slots.map((slot, index) => (
          <Pane
            key={index}
            width={paneWidth}
            cardId={slot.cardId}
            copyOf={slot.copyOf}
            asFamily={slot.asFamily}
            state={slot.state}
            dashedColor={slot.dashedColor}
            revealDelay={index * revealStep}
            settled={settled}
            glowColor={glowColor}
            onPress={onPanePress ? () => onPanePress(index) : undefined}
          />
        ))}
      {showHint && paneWidth > 0 && (
        <Text style={[styles.hint, { left: paneWidth + LEAD * 3, top: paneWidth * PANE_RATIO * 0.55 }]}>{emptyHint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: LEAD, justifyContent: 'center' },
  hint: { ...type.small, color: colors.velinDoux, position: 'absolute', opacity: 0.8 },
});
