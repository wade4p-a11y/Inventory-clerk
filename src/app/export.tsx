import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusChip } from '../components/StatusChip';
import { listItems } from '../db/database';
import { exportItemsByEmail } from '../lib/emailExport';
import { colors } from '../theme';
import type { InventoryItem } from '../types';

export default function ExportScreen() {
  const [pending, setPending] = useState<InventoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const items = await listItems('pending');
    const failed = await listItems('failed');
    setPending([...items, ...failed]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function runExport() {
    if (pending.length === 0) {
      Alert.alert('Nothing pending', 'Mark items as pending from the edit screen first.');
      return;
    }
    setBusy(true);
    try {
      const result = await exportItemsByEmail(pending);
      setLastMessage(result.message);
      Alert.alert(result.ok ? 'Export ready' : 'Export not completed', result.message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.blurb}>
        Builds an Excel (.xlsx) workbook and opens your mail app so you can send it (and photos) into
        corporate Google Drive workflows. No Drive API login in the app.
      </Text>
      {lastMessage ? <Text style={styles.message}>{lastMessage}</Text> : null}
      <Pressable style={[styles.btn, busy && styles.btnDisabled]} onPress={runExport} disabled={busy}>
        <Text style={styles.btnText}>
          {busy ? 'Preparing…' : `Email export (${pending.length})`}
        </Text>
      </Pressable>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No pending or failed items.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name || 'Untitled item'}</Text>
              <Text style={styles.meta}>{item.locationText || 'No location'}</Text>
            </View>
            <StatusChip status={item.status} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: colors.bg },
  blurb: { color: colors.muted, lineHeight: 20 },
  message: { color: colors.brand, fontWeight: '600' },
  btn: {
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  list: { gap: 8, paddingBottom: 40 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  title: { fontWeight: '700', color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
});
