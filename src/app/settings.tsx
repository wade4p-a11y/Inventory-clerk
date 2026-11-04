import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StorageBar } from '../components/StorageBar';
import { getSettings, listExportedForPrune, updateItem, updateSettings } from '../db/database';
import { getStorageUsage } from '../lib/cache';
import { formatBytes } from '../lib/format';
import { deletePhotoFile } from '../lib/photos';
import { colors } from '../theme';
import { CACHE_PRESETS, type AppSettings } from '../types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [usage, setUsage] = useState({ usedBytes: 0, limitBytes: 0 });
  const [customGb, setCustomGb] = useState('');

  async function refresh() {
    const [s, u] = await Promise.all([getSettings(), getStorageUsage()]);
    setSettings(s);
    setUsage(u);
    setCustomGb((s.cacheLimitBytes / (1024 * 1024 * 1024)).toFixed(2));
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function setLimit(bytes: number) {
    const next = await updateSettings({ cacheLimitBytes: bytes });
    setSettings(next);
    setUsage(await getStorageUsage());
  }

  async function saveRetention(days: number) {
    if (!settings) return;
    const next = await updateSettings({ retentionDaysAfterExport: days });
    setSettings(next);
  }

  async function saveEmail(email: string) {
    const next = await updateSettings({ defaultExportEmail: email.trim() });
    setSettings(next);
  }

  async function clearExportedPhotos() {
    const exported = await listExportedForPrune();
    for (const item of exported) {
      deletePhotoFile(item.photoPath);
      await updateItem(item.id, { photoPath: null, photoBytes: 0 });
    }
    Alert.alert('Cleared', `Removed photos from ${exported.length} exported item(s).`);
    await refresh();
  }

  if (!settings) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <StorageBar usedBytes={usage.usedBytes} limitBytes={usage.limitBytes} />

      <Text style={styles.heading}>Cache limit</Text>
      <View style={styles.presets}>
        {CACHE_PRESETS.map((preset) => (
          <Pressable
            key={preset.label}
            style={[
              styles.preset,
              settings.cacheLimitBytes === preset.bytes && styles.presetOn,
            ]}
            onPress={() => setLimit(preset.bytes)}
          >
            <Text
              style={[
                styles.presetText,
                settings.cacheLimitBytes === preset.bytes && styles.presetTextOn,
              ]}
            >
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Custom (GB)</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={customGb}
          onChangeText={setCustomGb}
        />
        <Pressable
          style={styles.smallBtn}
          onPress={() => {
            const gb = Number(customGb);
            if (!Number.isFinite(gb) || gb <= 0) {
              Alert.alert('Invalid', 'Enter a positive number of gigabytes.');
              return;
            }
            void setLimit(Math.round(gb * 1024 * 1024 * 1024));
          }}
        >
          <Text style={styles.smallBtnText}>Apply</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>Current limit: {formatBytes(settings.cacheLimitBytes)}</Text>

      <Text style={styles.heading}>Retention after export</Text>
      <Text style={styles.hint}>
        When over limit, prune exported photos older than this many days first.
      </Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={String(settings.retentionDaysAfterExport)}
          onChangeText={(v) => {
            const days = Number(v);
            if (Number.isFinite(days) && days >= 0) {
              setSettings({ ...settings, retentionDaysAfterExport: days });
            }
          }}
          onEndEditing={() => saveRetention(settings.retentionDaysAfterExport)}
        />
        <Text style={styles.suffix}>days</Text>
      </View>

      <Text style={styles.heading}>Default export email</Text>
      <Text style={styles.hint}>
        Prefills To: in the mail composer. Use a personal address or an optional corporate
        email-to-Drive intake address if IT provides one.
      </Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={settings.defaultExportEmail}
        onChangeText={(defaultExportEmail) => setSettings({ ...settings, defaultExportEmail })}
        onEndEditing={() => saveEmail(settings.defaultExportEmail)}
        placeholder="you@company.com"
        placeholderTextColor={colors.muted}
      />

      <Pressable style={styles.dangerBtn} onPress={clearExportedPhotos}>
        <Text style={styles.dangerBtnText}>Clear exported photos now</Text>
      </Pressable>

      <Text style={styles.heading}>Phase 2+ (not built)</Text>
      <Text style={styles.hint}>Label-maker export, OCR, landmark matching, multi-photo.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
  heading: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    color: colors.brand,
  },
  label: { fontWeight: '700', color: colors.ink },
  hint: { color: colors.muted, lineHeight: 18 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  presetOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  presetText: { fontWeight: '700', color: colors.ink },
  presetTextOn: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  smallBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  smallBtnText: { color: '#fff', fontWeight: '700' },
  suffix: { color: colors.muted, fontWeight: '600' },
  dangerBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dangerBtnText: { color: colors.danger, fontWeight: '700' },
});
