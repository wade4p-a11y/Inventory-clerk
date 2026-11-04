import {
  getSettings,
  listExportedForPrune,
  sumPhotoBytes,
  updateItem,
} from '../db/database';
import { deletePhotoFile } from './photos';

export async function getStorageUsage(): Promise<{ usedBytes: number; limitBytes: number }> {
  const [usedBytes, settings] = await Promise.all([sumPhotoBytes(), getSettings()]);
  return { usedBytes, limitBytes: settings.cacheLimitBytes };
}

/** Prune exported photos oldest-first until under limit (or retention age first). */
export async function pruneExportedIfNeeded(extraBytesNeeded = 0): Promise<number> {
  const settings = await getSettings();
  let used = await sumPhotoBytes();
  const limit = settings.cacheLimitBytes;
  if (used + extraBytesNeeded <= limit) return 0;

  const exported = await listExportedForPrune();
  const now = Date.now();
  const retentionMs = settings.retentionDaysAfterExport * 24 * 60 * 60 * 1000;
  let freed = 0;

  const aged = exported.filter((item) => {
    const t = item.exportedAt ? Date.parse(item.exportedAt) : 0;
    return t > 0 && now - t >= retentionMs;
  });
  const rest = exported.filter((item) => !aged.includes(item));
  const order = [...aged, ...rest];

  for (const item of order) {
    if (used + extraBytesNeeded - freed <= limit) break;
    if (!item.photoPath) continue;
    deletePhotoFile(item.photoPath);
    freed += item.photoBytes;
    await updateItem(item.id, { photoPath: null, photoBytes: 0 });
  }

  return freed;
}

export async function ensureBudgetForCapture(estimatedBytes: number): Promise<{ ok: boolean; usedBytes: number; limitBytes: number }> {
  await pruneExportedIfNeeded(estimatedBytes);
  const usage = await getStorageUsage();
  return {
    ok: usage.usedBytes + estimatedBytes <= usage.limitBytes,
    ...usage,
  };
}
