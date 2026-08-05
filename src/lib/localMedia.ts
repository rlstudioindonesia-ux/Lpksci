
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'LpkChatMedia';
const STORE_NAME = 'media';
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveMediaLocally(url: string, blob: Blob, fileName: string) {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, { blob, fileName, savedAt: Date.now() }, url);
    console.log(`Saved ${fileName} locally`);
  } catch (error) {
    console.error('Failed to save media locally:', error);
  }
}

export async function getLocalMedia(url: string): Promise<{ blob: Blob, fileName: string } | null> {
  try {
    const db = await getDB();
    const data = await db.get(STORE_NAME, url);
    return data || null;
  } catch (error) {
    console.error('Failed to get local media:', error);
    return null;
  }
}

export async function downloadAndSaveMedia(url: string, fileName: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    await saveMediaLocally(url, blob, fileName);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Download failed:', error);
    return null;
  }
}
