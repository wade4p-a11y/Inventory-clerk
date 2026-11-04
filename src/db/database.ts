import * as SQLite from 'expo-sqlite';
import { DEFAULT_SETTINGS, type AppSettings, type InventoryItem, type ItemStatus, type LocationRecord } from '../types';
import { newId } from '../lib/ids';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('inventory-clerk.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          cacheLimitBytes INTEGER NOT NULL,
          retentionDaysAfterExport INTEGER NOT NULL,
          defaultExportEmail TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS locations (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          gpsLat REAL,
          gpsLng REAL,
          gpsRadiusM REAL,
          landmarkPhotoPath TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS inventory_items (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL DEFAULT '',
          locationText TEXT NOT NULL DEFAULT '',
          locationId TEXT,
          supplierBrand TEXT NOT NULL DEFAULT '',
          partNumber TEXT NOT NULL DEFAULT '',
          assetAllocation TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          photoPath TEXT,
          photoBytes INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'draft',
          exportAttempts INTEGER NOT NULL DEFAULT 0,
          lastExportError TEXT,
          exportedAt TEXT,
          gpsLat REAL,
          gpsLng REAL,
          gpsAccuracyM REAL,
          capturedAt TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      const settingsRow = await db.getFirstAsync<{ id: number }>('SELECT id FROM settings WHERE id = 1');
      if (!settingsRow) {
        await db.runAsync(
          `INSERT INTO settings (id, cacheLimitBytes, retentionDaysAfterExport, defaultExportEmail) VALUES (1, ?, ?, ?)`,
          DEFAULT_SETTINGS.cacheLimitBytes,
          DEFAULT_SETTINGS.retentionDaysAfterExport,
          DEFAULT_SETTINGS.defaultExportEmail,
        );
      }
      return db;
    })();
  }
  return dbPromise;
}

function mapItem(row: InventoryItem): InventoryItem {
  return row;
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  const row = await db.getFirstAsync<AppSettings>(
    'SELECT cacheLimitBytes, retentionDaysAfterExport, defaultExportEmail FROM settings WHERE id = 1',
  );
  return row ?? DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  const db = await getDb();
  await db.runAsync(
    `UPDATE settings SET cacheLimitBytes = ?, retentionDaysAfterExport = ?, defaultExportEmail = ? WHERE id = 1`,
    next.cacheLimitBytes,
    next.retentionDaysAfterExport,
    next.defaultExportEmail,
  );
  return next;
}

export async function listItems(filter: 'all' | ItemStatus | 'not_exported' = 'all'): Promise<InventoryItem[]> {
  const db = await getDb();
  if (filter === 'all') {
    return db.getAllAsync<InventoryItem>('SELECT * FROM inventory_items ORDER BY capturedAt DESC');
  }
  if (filter === 'not_exported') {
    return db.getAllAsync<InventoryItem>(
      `SELECT * FROM inventory_items WHERE status IN ('draft','pending','exporting','failed') ORDER BY capturedAt DESC`,
    );
  }
  return db.getAllAsync<InventoryItem>(
    'SELECT * FROM inventory_items WHERE status = ? ORDER BY capturedAt DESC',
    filter,
  );
}

export async function getItem(id: string): Promise<InventoryItem | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<InventoryItem>('SELECT * FROM inventory_items WHERE id = ?', id);
  return row ? mapItem(row) : null;
}

export async function createItemFromPhoto(input: {
  id?: string;
  photoPath: string;
  photoBytes: number;
  gpsLat?: number | null;
  gpsLng?: number | null;
  gpsAccuracyM?: number | null;
  locationText?: string;
  locationId?: string | null;
}): Promise<InventoryItem> {
  const db = await getDb();
  const now = new Date().toISOString();
  const item: InventoryItem = {
    id: input.id ?? newId(),
    name: '',
    locationText: input.locationText ?? '',
    locationId: input.locationId ?? null,
    supplierBrand: '',
    partNumber: '',
    assetAllocation: '',
    description: '',
    photoPath: input.photoPath,
    photoBytes: input.photoBytes,
    status: 'draft',
    exportAttempts: 0,
    lastExportError: null,
    exportedAt: null,
    gpsLat: input.gpsLat ?? null,
    gpsLng: input.gpsLng ?? null,
    gpsAccuracyM: input.gpsAccuracyM ?? null,
    capturedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await db.runAsync(
    `INSERT INTO inventory_items (
      id, name, locationText, locationId, supplierBrand, partNumber, assetAllocation, description,
      photoPath, photoBytes, status, exportAttempts, lastExportError, exportedAt,
      gpsLat, gpsLng, gpsAccuracyM, capturedAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id,
    item.name,
    item.locationText,
    item.locationId,
    item.supplierBrand,
    item.partNumber,
    item.assetAllocation,
    item.description,
    item.photoPath,
    item.photoBytes,
    item.status,
    item.exportAttempts,
    item.lastExportError,
    item.exportedAt,
    item.gpsLat,
    item.gpsLng,
    item.gpsAccuracyM,
    item.capturedAt,
    item.createdAt,
    item.updatedAt,
  );
  return item;
}

export async function updateItem(
  id: string,
  patch: Partial<
    Pick<
      InventoryItem,
      | 'name'
      | 'locationText'
      | 'locationId'
      | 'supplierBrand'
      | 'partNumber'
      | 'assetAllocation'
      | 'description'
      | 'status'
      | 'exportAttempts'
      | 'lastExportError'
      | 'exportedAt'
      | 'photoPath'
      | 'photoBytes'
    >
  >,
): Promise<InventoryItem | null> {
  const current = await getItem(id);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  const db = await getDb();
  await db.runAsync(
    `UPDATE inventory_items SET
      name = ?, locationText = ?, locationId = ?, supplierBrand = ?, partNumber = ?,
      assetAllocation = ?, description = ?, status = ?, exportAttempts = ?, lastExportError = ?,
      exportedAt = ?, photoPath = ?, photoBytes = ?, updatedAt = ?
     WHERE id = ?`,
    next.name,
    next.locationText,
    next.locationId,
    next.supplierBrand,
    next.partNumber,
    next.assetAllocation,
    next.description,
    next.status,
    next.exportAttempts,
    next.lastExportError,
    next.exportedAt,
    next.photoPath,
    next.photoBytes,
    next.updatedAt,
    id,
  );
  return next;
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM inventory_items WHERE id = ?', id);
}

export async function listLocations(): Promise<LocationRecord[]> {
  const db = await getDb();
  return db.getAllAsync<LocationRecord>('SELECT * FROM locations ORDER BY name COLLATE NOCASE ASC');
}

export async function upsertLocation(
  input: Omit<LocationRecord, 'createdAt' | 'updatedAt'> & { createdAt?: string },
): Promise<LocationRecord> {
  const db = await getDb();
  const now = new Date().toISOString();
  const existing = await db.getFirstAsync<LocationRecord>('SELECT * FROM locations WHERE id = ?', input.id);
  const record: LocationRecord = {
    id: input.id,
    name: input.name,
    notes: input.notes ?? '',
    gpsLat: input.gpsLat ?? null,
    gpsLng: input.gpsLng ?? null,
    gpsRadiusM: input.gpsRadiusM ?? null,
    landmarkPhotoPath: input.landmarkPhotoPath ?? null,
    createdAt: existing?.createdAt ?? input.createdAt ?? now,
    updatedAt: now,
  };
  await db.runAsync(
    `INSERT INTO locations (id, name, notes, gpsLat, gpsLng, gpsRadiusM, landmarkPhotoPath, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       notes = excluded.notes,
       gpsLat = excluded.gpsLat,
       gpsLng = excluded.gpsLng,
       gpsRadiusM = excluded.gpsRadiusM,
       landmarkPhotoPath = excluded.landmarkPhotoPath,
       updatedAt = excluded.updatedAt`,
    record.id,
    record.name,
    record.notes,
    record.gpsLat,
    record.gpsLng,
    record.gpsRadiusM,
    record.landmarkPhotoPath,
    record.createdAt,
    record.updatedAt,
  );
  return record;
}

export async function deleteLocation(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM locations WHERE id = ?', id);
}

export async function sumPhotoBytes(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(photoBytes) as total FROM inventory_items WHERE photoPath IS NOT NULL',
  );
  return row?.total ?? 0;
}

export async function listExportedForPrune(): Promise<InventoryItem[]> {
  const db = await getDb();
  return db.getAllAsync<InventoryItem>(
    `SELECT * FROM inventory_items
     WHERE status = 'exported' AND photoPath IS NOT NULL
     ORDER BY exportedAt ASC, capturedAt ASC`,
  );
}
