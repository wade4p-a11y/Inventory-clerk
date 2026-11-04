import { EncodingType, File } from 'expo-file-system';
import * as XLSX from 'xlsx';
import type { InventoryItem } from '../types';
import { stampForFilename } from './format';
import { exportDir } from './photos';

function photoFilename(item: InventoryItem): string {
  if (!item.photoPath) return '';
  const parts = item.photoPath.split('/');
  return parts[parts.length - 1] || '';
}

export async function buildInventoryWorkbook(items: InventoryItem[]): Promise<{ uri: string; filename: string }> {
  const rows = items.map((item) => ({
    itemId: item.id,
    capturedAt: item.capturedAt,
    exportedAt: item.exportedAt ?? new Date().toISOString(),
    name: item.name,
    location: item.locationText,
    supplierBrand: item.supplierBrand,
    partNumber: item.partNumber,
    assetAllocation: item.assetAllocation,
    description: item.description,
    photoFilename: photoFilename(item),
    gpsLat: item.gpsLat ?? '',
    gpsLng: item.gpsLng ?? '',
    gpsAccuracyM: item.gpsAccuracyM ?? '',
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Inventory');
  const base64 = XLSX.write(book, { type: 'base64', bookType: 'xlsx' }) as string;

  const filename = `inventory-${stampForFilename()}.xlsx`;
  const file = new File(exportDir(), filename);
  if (file.exists) file.delete();
  file.create();
  await file.write(base64, { encoding: EncodingType.Base64 });

  return { uri: file.uri, filename };
}
