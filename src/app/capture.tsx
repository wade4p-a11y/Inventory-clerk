import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { createItemFromPhoto, listLocations } from '../db/database';
import { ensureBudgetForCapture } from '../lib/cache';
import { readGpsFix, suggestLocationFromGps } from '../lib/gps';
import { newId } from '../lib/ids';
import { savePhotoFromUri } from '../lib/photos';
import { colors } from '../theme';

export default function CaptureScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  async function persistCapture(uri: string) {
    setBusy(true);
    try {
      const budget = await ensureBudgetForCapture(2 * 1024 * 1024);
      if (!budget.ok) {
        Alert.alert(
          'Storage limit',
          'Photo cache is full. Clear exported photos or raise the limit in Settings.',
        );
        return;
      }

      const id = newId();
      const saved = await savePhotoFromUri(id, uri);
      const [fix, locations] = await Promise.all([readGpsFix(), listLocations()]);
      const suggested = fix ? suggestLocationFromGps(fix, locations) : null;

      const item = await createItemFromPhoto({
        id,
        photoPath: saved.path,
        photoBytes: saved.bytes,
        gpsLat: fix?.lat ?? null,
        gpsLng: fix?.lng ?? null,
        gpsAccuracyM: fix?.accuracyM ?? null,
        locationText: suggested?.name ?? '',
        locationId: suggested?.id ?? null,
      });

      router.replace(`/edit/${item.id}`);
    } catch (e) {
      Alert.alert('Capture failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function takePhoto() {
    if (!cameraRef.current || busy) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
    if (photo?.uri) await persistCapture(photo.uri);
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await persistCapture(result.assets[0].uri);
    }
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera access is needed to photograph stock.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant camera permission</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={pickFromLibrary}>
          <Text style={styles.linkText}>Or choose an existing photo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.controls}>
        <Pressable style={[styles.btn, busy && styles.btnDisabled]} onPress={takePhoto} disabled={busy}>
          <Text style={styles.btnText}>{busy ? 'Saving…' : 'Take photo'}</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={pickFromLibrary} disabled={busy}>
          <Text style={styles.linkText}>Choose from gallery</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  controls: {
    padding: 16,
    gap: 10,
    backgroundColor: colors.brand,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: colors.bg,
  },
  message: { textAlign: 'center', color: colors.ink, fontSize: 16 },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#fff', fontWeight: '600' },
});
