import { ItemAttachment } from '../types';

const DB_NAME = 'QingdaoPlannerAttachmentsDB';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

interface DBRecord {
  id: string; // attachment id
  itemId: string; // schedule item id
  name: string;
  dataUrl: string;
  size: number;
  type: string;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('itemId', 'itemId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an attachment to IndexedDB
 */
export async function saveAttachmentToDB(itemId: string, attachment: ItemAttachment): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: DBRecord = {
        id: attachment.id,
        itemId,
        name: attachment.name,
        dataUrl: attachment.dataUrl,
        size: attachment.size || 0,
        type: attachment.type || 'image/jpeg',
        createdAt: attachment.createdAt,
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save to IndexedDB, fallback to in-memory/localStorage', err);
  }
}

/**
 * Get all attachments for a specific schedule item
 */
export async function getAttachmentsForItemFromDB(itemId: string): Promise<ItemAttachment[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('itemId');
      const req = index.getAll(itemId);

      req.onsuccess = () => {
        const records: DBRecord[] = req.result || [];
        const attachments: ItemAttachment[] = records.map((r) => ({
          id: r.id,
          name: r.name,
          dataUrl: r.dataUrl,
          size: r.size,
          type: r.type,
          createdAt: r.createdAt,
        }));
        resolve(attachments);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to read from IndexedDB', err);
    return [];
  }
}

/**
 * Get all attachments in the entire DB (for offline vouchers vault)
 */
export async function getAllAttachmentsFromDB(): Promise<{ itemId: string; attachment: ItemAttachment }[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records: DBRecord[] = req.result || [];
        resolve(
          records.map((r) => ({
            itemId: r.itemId,
            attachment: {
              id: r.id,
              name: r.name,
              dataUrl: r.dataUrl,
              size: r.size,
              type: r.type,
              createdAt: r.createdAt,
            },
          }))
        );
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to read all from IndexedDB', err);
    return [];
  }
}

/**
 * Delete an attachment by ID
 */
export async function deleteAttachmentFromDB(attachmentId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(attachmentId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete from IndexedDB', err);
  }
}

/**
 * Compress an uploaded image file into a high-quality base64 DataURL
 * Keeps QR codes, barcodes, and text sharp while lowering storage footprint.
 */
export function compressImageFile(
  file: File | Blob,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to web-standard JPEG DataURL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
