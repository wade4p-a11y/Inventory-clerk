import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { deleteLocation, listLocations, upsertLocation } from '../db/database';
import { readGpsFix } from '../lib/gps';
import { newId } from '../lib/ids';
import { colors } from '../theme';
import type { LocationRecord } from '../types';

export default function LocationsScreen() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [name, setName] = useState('');
  const [radiusM, setRadiusM] = useState('40');

  const refresh = useCallback(async () => {
    setLocations(await listLocations());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function addLocation(withGps: boolean) {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter a location name (e.g. Store 3 / crusher crib).');
      return;
    }
    let gpsLat: number | null = null;
    let gpsLng: number | null = null;
    let gpsRadiusM: number | null = null;
    if (withGps) {
      const fix = await readGpsFix();
      if (!fix) {
        Alert.alert('GPS unavailable', 'Could not read a location fix. Saved name only.');
      } else {
        gpsLat = fix.lat;
        gpsLng = fix.lng;
        gpsRadiusM = Number(radiusM) || 40;
      }
    }
    await upsertLocation({
      id: newId(),
      name: trimmed,
      notes: '',
      gpsLat,
      gpsLng,
      gpsRadiusM,
      landmarkPhotoPath: null,
    });
    setName('');
    await refresh();
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.blurb}>
        Onboard named stores and plant areas. Optional GPS centre + radius powers outdoor suggestions
        at capture time.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Location name"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
      />
      <View style={styles.row}>
        <Text style={styles.label}>Geofence radius (m)</Text>
        <TextInput
          style={[styles.input, styles.radius]}
          keyboardType="number-pad"
          value={radiusM}
          onChangeText={setRadiusM}
        />
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.secondaryBtn} onPress={() => addLocation(false)}>
          <Text style={styles.secondaryBtnText}>Add name only</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={() => addLocation(true)}>
          <Text style={styles.primaryBtnText}>Add with GPS</Text>
        </Pressable>
      </View>

      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No locations yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.gpsLat != null
                  ? `GPS ${item.gpsLat.toFixed(5)}, ${item.gpsLng?.toFixed(5)} · ${item.gpsRadiusM ?? '?'} m`
                  : 'No GPS pin'}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert('Delete location?', item.name, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      await deleteLocation(item.id);
                      await refresh();
                    },
                  },
                ])
              }
            >
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 10, backgroundColor: colors.bg },
  blurb: { color: colors.muted, lineHeight: 20 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: colors.ink, fontWeight: '600', flex: 1 },
  radius: { flex: 0, width: 90, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.brand,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.brand,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.brand, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
  card: {
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
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  delete: { color: colors.danger, fontWeight: '700' },
});
