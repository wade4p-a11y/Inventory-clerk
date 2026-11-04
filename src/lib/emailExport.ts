import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { getSettings, updateItem } from '../db/database';
import type { InventoryItem } from '../types';
import { buildInventoryWorkbook } from './exportExcel';
import { pruneExportedIfNeeded } from './cache';

export type ExportResult = {
  ok: boolean;
  mode: 'mail' | 'share' | 'none';
  message: string;
  exportedIds: string[];
};

const MAX_PHOTO_ATTACHMENTS = 8;

export async function exportItemsByEmail(items: InventoryItem[]): Promise<ExportResult> {
  if (items.length === 0) {
    return { ok: false, mode: 'none', message: 'No items to export.', exportedIds: [] };
  }

  for (const item of items) {
    await updateItem(item.id, { status: 'exporting' });
  }

  try {
    const { uri: xlsxUri, filename } = await buildInventoryWorkbook(items);
    const settings = await getSettings();
    const photoUris = items
      .map((i) => i.photoPath)
      .filter((p): p is string => !!p)
      .slice(0, MAX_PHOTO_ATTACHMENTS);

    const attachments = [xlsxUri, ...photoUris];
    const subject = `Lake Cowal inventory export (${items.length} item${items.length === 1 ? '' : 's'})`;
    const body = [
      'Inventory Clerk export for Lake Cowal.',
      '',
      `Workbook: ${filename}`,
      `Items: ${items.length}`,
      photoUris.length < items.filter((i) => i.photoPath).length
        ? `Note: only the first ${MAX_PHOTO_ATTACHMENTS} photos were attached; remaining photos stay on the phone.`
        : 'Photos attached where available.',
      '',
      'Optional: if your site uses email-to-Drive, send this to that address so files land in the shared folder.',
    ].join('\n');

    const mailAvailable = await MailComposer.isAvailableAsync();
    if (mailAvailable) {
      const result = await MailComposer.composeAsync({
        recipients: settings.defaultExportEmail ? [settings.defaultExportEmail] : undefined,
        subject,
        body,
        attachments,
      });

      if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
        for (const item of items) {
          await updateItem(item.id, {
            status: 'pending',
            lastExportError: 'Email cancelled',
          });
        }
        return { ok: false, mode: 'mail', message: 'Email cancelled — items remain pending.', exportedIds: [] };
      }
    } else {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error('Neither email nor share sheet is available on this device.');
      }
      // Share sheet typically handles one file; share the workbook first.
      await Sharing.shareAsync(xlsxUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: subject,
        UTI: 'com.microsoft.excel.xlsx',
      });
    }

    const exportedAt = new Date().toISOString();
    const exportedIds: string[] = [];
    for (const item of items) {
      await updateItem(item.id, {
        status: 'exported',
        exportedAt,
        lastExportError: null,
        exportAttempts: item.exportAttempts + 1,
      });
      exportedIds.push(item.id);
    }
    await pruneExportedIfNeeded();

    return {
      ok: true,
      mode: mailAvailable ? 'mail' : 'share',
      message: mailAvailable
        ? 'Mail composer opened. Items marked exported (confirm send in your mail app).'
        : 'Share sheet opened for the Excel file. Items marked exported.',
      exportedIds,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    for (const item of items) {
      await updateItem(item.id, {
        status: 'failed',
        lastExportError: message,
        exportAttempts: item.exportAttempts + 1,
      });
    }
    return { ok: false, mode: 'none', message, exportedIds: [] };
  }
}
