import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Field } from '../../components/Field';
import { StatusChip } from '../../components/StatusChip';
import { deleteItem, getItem, listLocations, updateItem } from '../../db/database';
import { deletePhotoFile } from '../../lib/photos';
import { colors } from '../../theme';
import type { InventoryItem, LocationRecord } from '../../types';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const [next, locs] = await Promise.all([getItem(id), listLocations()]);
      setItem(next);
      setLocations(locs);
    })();
  }, [id]);

  async function save(patch: Partial<InventoryItem>, goBack = false) {
    if (!item) return;
    const next = await updateItem(item.id, patch);
    if (next) setItem(next);
    if (goBack) router.back();
  }

  async function markPending() {
    if (!item) return;
    await save({ status: 'pending' }, true);
  }

  async function remove() {
    if (!item) return;
    Alert.alert('Delete item?', 'This removes the local photo and record.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          deletePhotoFile(item.photoPath);
          await deleteItem(item.id);
          router.replace('/');
        },
      },
    ]);
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {item.photoPath ? <Image source={{ uri: item.photoPath }} style={styles.photo} /> : null}
      <View style={styles.statusRow}>
        <StatusChip status={item.status} />
        {item.lastExportError ? <Text style={styles.error}>{item.lastExportError}</Text> : null}
      </View>

      <Field label="Name" value={item.name} onChangeText={(name) => setItem({ ...item, name })} />
      <Field
        label="Location"
        value={item.locationText}
        onChangeText={(locationText) => setItem({ ...item, locationText })}
        placeholder="Store / shelf / plant area"
      />
      {locations.length > 0 ? (
        <View style={styles.locChips}>
          {locations.map((loc) => (
            <Pressable
              key={loc.id}
              style={[styles.locChip, item.locationId === loc.id && styles.locChipOn]}
              onPress={() =>
                setItem({
                  ...item,
                  locationId: loc.id,
                  locationText: loc.name,
                })
              }
            >
              <Text style={[styles.locChipText, item.locationId === loc.id && styles.locChipTextOn]}>
                {loc.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Field
        label="Supplier / brand"
        value={item.supplierBrand}
        onChangeText={(supplierBrand) => setItem({ ...item, supplierBrand })}
      />
      <Field
        label="Part number"
        value={item.partNumber}
        onChangeText={(partNumber) => setItem({ ...item, partNumber })}
      />
      <Pressable
        style={styles.scanBtn}
        onPress={async () => {
          if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) {
              Alert.alert('Camera needed', 'Allow camera to scan barcodes.');
              return;
            }
          }
          setScanOpen(true);
        }}
      >
        <Text style={styles.scanBtnText}>Scan barcode / QR into part number</Text>
      </Pressable>
      <Field
        label="Asset allocation"
        value={item.assetAllocation}
        onChangeText={(assetAllocation) => setItem({ ...item, assetAllocation })}
      />
      <Field
        label="Description"
        value={item.description}
        onChangeText={(description) => setItem({ ...item, description })}
        multiline
      />

      <Pressable
        style={styles.primaryBtn}
        onPress={() =>
          save({
            name: item.name,
            locationText: item.locationText,
            locationId: item.locationId,
            supplierBrand: item.supplierBrand,
            partNumber: item.partNumber,
            assetAllocation: item.assetAllocation,
            description: item.description,
            status: item.status === 'exported' ? item.status : 'draft',
          })
        }
      >
        <Text style={styles.primaryBtnText}>Save draft</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={markPending}>
        <Text style={styles.secondaryBtnText}>Mark pending for email export</Text>
      </Pressable>
      <Pressable style={styles.dangerBtn} onPress={remove}>
        <Text style={styles.dangerBtnText}>Delete item</Text>
      </Pressable>

      <Modal visible={scanOpen} animationType="slide">
        <View style={styles.scanModal}>
          <CameraView
            style={styles.scanCamera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={({ data }) => {
              setScanOpen(false);
              setItem({ ...item, partNumber: data });
            }}
          />
          <Pressable style={styles.primaryBtn} onPress={() => setScanOpen(false)}>
            <Text style={styles.primaryBtnText}>Cancel scan</Text>
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
  photo: { width: '100%', height: 220, borderRadius: 12, backgroundColor: colors.bgDeep },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { color: colors.danger, flex: 1, fontSize: 12 },
  locChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locChip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  locChipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  locChipText: { color: colors.ink, fontWeight: '600', fontSize: 13 },
  locChipTextOn: { color: '#fff' },
  scanBtn: {
    borderWidth: 1,
    borderColor: colors.pending,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  scanBtnText: { color: colors.pending, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.brand, fontWeight: '700', fontSize: 16 },
  dangerBtn: { alignItems: 'center', paddingVertical: 10 },
  dangerBtnText: { color: colors.danger, fontWeight: '700' },
  scanModal: { flex: 1, backgroundColor: '#000', padding: 16, gap: 12 },
  scanCamera: { flex: 1, borderRadius: 12, overflow: 'hidden' },
});
