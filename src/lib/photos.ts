import { Directory, File, Paths } from 'expo-file-system';

function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export function photoFileForItem(itemId: string): File {
  return new File(photosDir(), `${itemId}.jpg`);
}

export async function savePhotoFromUri(itemId: string, sourceUri: string): Promise<{ path: string; bytes: number }> {
  const dest = photoFileForItem(itemId);
  const source = new File(sourceUri);
  if (dest.exists) {
    dest.delete();
  }
  await source.copy(dest);
  return { path: dest.uri, bytes: dest.size || 0 };
}

export function deletePhotoFile(path: string | null | undefined): void {
  if (!path) return;
  try {
    const file = new File(path);
    if (file.exists) file.delete();
  } catch {
    // ignore missing files
  }
}

export function exportDir(): Directory {
  const dir = new Directory(Paths.cache, 'exports');
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}
