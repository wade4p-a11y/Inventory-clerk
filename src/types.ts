export type ItemStatus = 'draft' | 'pending' | 'exporting' | 'exported' | 'failed';

export type InventoryItem = {
  id: string;
  name: string;
  locationText: string;
  locationId: string | null;
  supplierBrand: string;
  partNumber: string;
  assetAllocation: string;
  description: string;
  photoPath: string | null;
  photoBytes: number;
  status: ItemStatus;
  exportAttempts: number;
  lastExportError: string | null;
  exportedAt: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsAccuracyM: number | null;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LocationRecord = {
  id: string;
  name: string;
  notes: string;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsRadiusM: number | null;
  landmarkPhotoPath: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  cacheLimitBytes: number;
  retentionDaysAfterExport: number;
  defaultExportEmail: string;
};

export const CACHE_PRESETS = [
  { label: '500 MB', bytes: 500 * 1024 * 1024 },
  { label: '1 GB', bytes: 1024 * 1024 * 1024 },
  { label: '2 GB', bytes: 2 * 1024 * 1024 * 1024 },
  { label: '5 GB', bytes: 5 * 1024 * 1024 * 1024 },
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  cacheLimitBytes: 2 * 1024 * 1024 * 1024,
  retentionDaysAfterExport: 14,
  defaultExportEmail: '',
};
