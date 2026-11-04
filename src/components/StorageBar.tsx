import { StyleSheet, Text, View } from 'react-native';
import { formatBytes } from '../lib/format';
import { colors } from '../theme';

export function StorageBar({ usedBytes, limitBytes }: { usedBytes: number; limitBytes: number }) {
  const ratio = limitBytes > 0 ? Math.min(1, usedBytes / limitBytes) : 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>Photo storage</Text>
        <Text style={styles.value}>
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  value: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  track: {
    height: 8,
    backgroundColor: colors.bgDeep,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.brandSoft,
  },
});
