import { StyleSheet, Text, View } from 'react-native';
import type { ItemStatus } from '../types';
import { colors } from '../theme';

const LABELS: Record<ItemStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  exporting: 'Exporting',
  exported: 'Exported',
  failed: 'Failed',
};

const TINT: Record<ItemStatus, string> = {
  draft: colors.muted,
  pending: colors.pending,
  exporting: colors.warn,
  exported: colors.ok,
  failed: colors.danger,
};

export function StatusChip({ status }: { status: ItemStatus }) {
  return (
    <View style={[styles.chip, { borderColor: TINT[status] }]}>
      <Text style={[styles.text, { color: TINT[status] }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
