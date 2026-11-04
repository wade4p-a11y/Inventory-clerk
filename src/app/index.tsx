import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusChip } from '../components/StatusChip';
import { StorageBar } from '../components/StorageBar';
import { listItems } from '../db/database';
import { getStorageUsage } from '../lib/cache';
import { colors } from '../theme';
import type { InventoryItem, ItemStatus } from '../types';

type Filter = 'all' | 'not_exported' | ItemStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'not_exported', label: 'Not exported' },
  { key: 'pending', label: 'Pending' },
  { key: 'exported', label: 'Exported' },
  { key: 'failed', label: 'Failed' },
];

export default function QueueScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [usage, setUsage] = useState({ usedBytes: 0, limitBytes: 2 * 1024 * 1024 * 1024 });

  const refresh = useCallback(async () => {
    const [nextItems, nextUsage] = await Promise.all([listItems(filter), getStorageUsage()]);
    setItems(nextItems);
    setUsage(nextUsage);
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Lake Cowal</Text>
        <Text style={styles.subtitle}>Photograph stock · tag · email Excel to Drive workflows</Text>
        <StorageBar usedBytes={usage.usedBytes} limitBytes={usage.limitBytes} />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/capture')}>
          <Text style={styles.primaryBtnText}>Capture item</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => router.push('/export')}>
          <Text style={styles.secondaryBtnText}>Export pending</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterChipOn]}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextOn]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No items yet. Capture stock to start the audit.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/edit/${item.id}`)}>
            {item.photoPath ? (
              <Image source={{ uri: item.photoPath }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]} />
            )}
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{item.name || 'Untitled item'}</Text>
              <Text style={styles.rowMeta}>{item.locationText || 'No location'} · {item.partNumber || 'No part #'}</Text>
              <StatusChip status={item.status} />
            </View>
          </Pressable>
        )}
      />

      <View style={styles.footer}>
        <Link href="/locations" style={styles.link}>
          Locations
        </Link>
        <Link href="/settings" style={styles.link}>
          Settings
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: colors.bgDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.brand,
    letterSpacing: 0.2,
  },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.brand, fontWeight: '700', fontSize: 16 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterChipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  filterTextOn: { color: '#fff' },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    marginBottom: 10,
  },
  thumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.bgDeep },
  thumbEmpty: { borderWidth: 1, borderColor: colors.line },
  rowBody: { flex: 1, gap: 4, justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.muted },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
  },
  link: { color: colors.brand, fontWeight: '700', fontSize: 15 },
});
