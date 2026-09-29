import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { copy } from './copy';
import { colors, gutter, radius, spacing, type } from './theme';

interface Props {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ visible, message, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityRole="alert">
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button label={copy.no} variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.action}>
              <Button label={copy.yes} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 20, 0.7)',
    justifyContent: 'center',
    padding: gutter,
  },
  dialog: {
    backgroundColor: colors.plomb,
    borderRadius: radius,
    padding: spacing.xl,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  message: { ...type.h1, fontSize: 22, lineHeight: 28, color: colors.velin, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.m },
  action: { flex: 1 },
});
