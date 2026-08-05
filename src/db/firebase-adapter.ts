import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, getDocFromServer, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebaseClient';
import fs from 'fs';
import path from 'path';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

declare var require: any;

// Read config with compile-time bundling and runtime fallback
let firebaseConfig: any;
try {
  // esbuild will resolve and bundle this JSON at compile-time
  firebaseConfig = require('../../firebase-applet-config.json');
} catch (e) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    firebaseConfig = JSON.parse(configRaw);
  } catch (err) {
    console.warn("⚠️ Firebase configuration file not found or unreadable.");
    firebaseConfig = {};
  }
}

const hasConfig = firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey;

export const app = hasConfig 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const db = hasConfig && app
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : null;

export const storage = hasConfig && app
  ? getStorage(app)
  : null;

function sanitizeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item));
  }
  if (typeof data === "object") {
    const proto = Object.getPrototypeOf(data);
    if (proto === null || proto === Object.prototype) {
      const cleaned: any = {};
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (val !== undefined) {
          cleaned[key] = sanitizeFirestoreData(val);
        }
      }
      return cleaned;
    }
  }
  return data;
}

export async function testConnection() {
  if (!db) {
    console.warn("⚠️ Firestore is not configured or initialized. Skipping connection test.");
    return;
  }
  try {
    console.log("🔍 Checking Firebase connectivity for Project:", firebaseConfig.projectId);
    await getDocFromServer(doc(db, 'test', 'connection')).catch(e => {
      handleFirestoreError(e, OperationType.GET, 'test/connection');
    });
    console.log("🔥 [SUCCESS] Firebase Database Activated & Connected!");
  } catch (error: any) {
    console.error("❌ [FAILURE] Firebase connection test failed.");
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("DEBUG: Client appears to be offline. Verify your network or Firebase rules.");
    }
    console.error("ERROR DETAILS:", error);
  }
}

export async function loadStateFromFirestore(fallbackState: any) {
  if (!db) {
    console.warn("⚠️ Firestore is not initialized. Using fallback in-memory state.");
    return fallbackState;
  }
  
  const startTime = Date.now();
  console.log("🚀 Initializing State Load from Firestore...");

  try {
    const collections = [
      'registeredStudents', 'activeStudents', 'attendance', 
      'payments', 'inventory', 'taxes', 'lmsLessons', 'lmsQuizzes',
      'chapterAssessments', 'jobOrders', 'users', 'events',
      'salaries', 'cashLedger', 'messages', 'logs', 'lmsClasses',
      'lmsComments'
    ];
    
    let loadedState: any = {};
    let hasData = false;

    // Load customization and collections concurrently
    const [custDoc, slideDoc, galleryDoc, ...snapshots] = await Promise.all([
      getDocFromServer(doc(db, 'system', 'customization')).catch((err) => {
        handleFirestoreError(err, OperationType.GET, 'system/customization');
        return null;
      }),
      getDocFromServer(doc(db, 'system', 'slideshows')).catch((err) => {
        handleFirestoreError(err, OperationType.GET, 'system/slideshows');
        return null;
      }),
      getDocFromServer(doc(db, 'system', 'galleries')).catch((err) => {
        handleFirestoreError(err, OperationType.GET, 'system/galleries');
        return null;
      }),
      ...collections.map(collName => getDocs(collection(db, collName)).catch((err) => {
        handleFirestoreError(err, OperationType.LIST, collName);
        return null;
      }))
    ]);

    if (custDoc && custDoc.exists()) {
      const custData = custDoc.data();
      loadedState.customization = custData;
      hasData = true;
      // Populate write cache for customization (without classes)
      const { lmsClasses, ...custWithoutClasses } = custData;
      writeCache.set('system/customization', JSON.stringify(sanitizeFirestoreData(custWithoutClasses)));
    }
    if (slideDoc && slideDoc.exists()) {
      loadedState.slideshows = slideDoc.data().data || [];
      hasData = true;
      writeCache.set('system/slideshows', JSON.stringify(sanitizeFirestoreData(slideDoc.data())));
    } else {
      loadedState.slideshows = [];
    }
    if (galleryDoc && galleryDoc.exists()) {
      loadedState.galleries = galleryDoc.data().data || [];
      hasData = true;
      writeCache.set('system/galleries', JSON.stringify(sanitizeFirestoreData(galleryDoc.data())));
    } else {
      loadedState.galleries = [];
    }
    if (loadedState.customization) {

      // Deep merge with fallbackState for customization to ensure new default fields are available
      if (fallbackState.customization) {
        loadedState.customization = {
          ...fallbackState.customization,
          ...loadedState.customization,
          // Ensure nested objects like landingConfig are also merged
          landingConfig: {
            ...(fallbackState.customization.landingConfig || {}),
            ...(loadedState.customization.landingConfig || {})
          }
        };
        
        // If critical arrays are empty in Firestore but present in fallback, use fallback (if it's a "lost data" scenario)
        // Slideshows and Galleries are now loaded independently from their own collections.

        // Same for landingConfig arrays
        const landingArrays = ['programs', 'perks', 'testimonials', 'opportunityImages'];
        landingArrays.forEach(key => {
          if ((!loadedState.customization.landingConfig[key] || loadedState.customization.landingConfig[key].length === 0) && 
              fallbackState.customization.landingConfig[key] && fallbackState.customization.landingConfig[key].length > 0) {
             loadedState.customization.landingConfig[key] = fallbackState.customization.landingConfig[key];
          }
        });
      }
    }

    collections.forEach((collName, i) => {
      const snap = snapshots[i];
      if (snap && !snap.empty) {
        hasData = true;
        const docsData = snap.docs.map(d => d.data());
        loadedState[collName] = docsData;
        
        // Populate write cache for loaded collection documents
        docsData.forEach((item: any) => {
          const id = item.id || item.username;
          if (id) {
            writeCache.set(`${collName}/${id}`, JSON.stringify(sanitizeFirestoreData(item)));
          }
        });
        
        console.log(`✅ Loaded ${loadedState[collName].length} items from ${collName}`);
      }
    });

    // Merge lmsClasses collection back into customization object for backward compatibility with frontend
    if (loadedState.lmsClasses && loadedState.lmsClasses.length > 0) {
      if (!loadedState.customization) loadedState.customization = {};
      loadedState.customization.lmsClasses = loadedState.lmsClasses;
      
      // Cache the loaded lmsClasses individually
      loadedState.lmsClasses.forEach((lmsClass: any) => {
        if (lmsClass && lmsClass.id) {
          writeCache.set(`lmsClasses/${lmsClass.id}`, JSON.stringify(sanitizeFirestoreData(lmsClass)));
        }
      });
    }

    if (loadedState.logs && loadedState.logs.length > 0) {
      let rawLogList: any[] = [];
      const auditTrailDoc = loadedState.logs.find((d: any) => d && d.entries && Array.isArray(d.entries));
      if (auditTrailDoc && Array.isArray(auditTrailDoc.entries)) {
        rawLogList.push(...auditTrailDoc.entries);
      }
      const individualLogs = loadedState.logs.filter((d: any) => d && !d.entries && (d.id || d.timestamp || d.time));
      rawLogList.push(...individualLogs);

      const logMap = new Map<string, any>();
      rawLogList.forEach((logItem: any) => {
        if (!logItem || typeof logItem !== "object") return;
        const ts = logItem.timestamp || logItem.time || new Date().toISOString();
        const key = logItem.id || `${logItem.user || 'User'}_${ts}_${logItem.type || 'info'}`;
        
        if (!logMap.has(key)) {
          logMap.set(key, {
            ...logItem,
            id: logItem.id || key,
            timestamp: ts,
            time: logItem.time || ts
          });
        }
      });

      loadedState.logs = Array.from(logMap.values()).sort((a: any, b: any) => {
        const timeA = new Date(a.timestamp || a.time || 0).getTime();
        const timeB = new Date(b.timestamp || b.time || 0).getTime();
        return timeB - timeA;
      });

      console.log(`📜 Consolidated ${loadedState.logs.length} total log items from audit_trail and individual documents.`);
    }

    if (!hasData) {
      console.log("⚠️ No existing data in Firestore. Returning empty initial state structure.");
      return fallbackState;
    }

    const duration = Date.now() - startTime;
    console.log(`💎 Successfully synchronized state with Firestore in ${duration}ms.`);
    
    // Fill in missing arrays
    for (const collName of collections) {
      if (!loadedState[collName]) loadedState[collName] = [];
    }
    if (!loadedState.customization) loadedState.customization = fallbackState.customization;
    
    return loadedState;
  } catch(e) {
    console.error("❌ CRITICAL: Failed to load from Firestore. Reverting to local fallback.", e);
    return fallbackState;
  }
}

// In-memory write cache to prevent redundant writes and avoid RESOURCE_EXHAUSTED errors
export const writeCache = new Map<string, string>();

export function syncEntityToFirestore(collectionName: string, id: string, data: any) {
  if (!db || !id) return;
  try {
    const sanitized = sanitizeFirestoreData(data);
    const cacheKey = `${collectionName}/${id}`;
    const serialized = JSON.stringify(sanitized);
    if (writeCache.get(cacheKey) === serialized) {
      return;
    }
    writeCache.set(cacheKey, serialized);
    setDoc(doc(db, collectionName, id), sanitized).catch(e => {
      // Fire-and-forget write: log the structured error but never let it become
      // an unhandled rejection, which would crash the whole Node process.
      try { handleFirestoreError(e, OperationType.WRITE, cacheKey); } catch (logged) {}
      writeCache.delete(cacheKey);
    });
  } catch(e) {
    console.error(e);
  }
}

export function syncCustomizationToFirestore(data: any) {
  if (!db) return;
  try {
    const { lmsClasses, ...customizationWithoutClasses } = data;
    const sanitized = sanitizeFirestoreData(customizationWithoutClasses);
    const cacheKey = `system/customization`;
    const serialized = JSON.stringify(sanitized);
    if (writeCache.get(cacheKey) === serialized) {
      return;
    }
    writeCache.set(cacheKey, serialized);
    setDoc(doc(db, 'system', 'customization'), sanitized).catch(e => {
      try { handleFirestoreError(e, OperationType.WRITE, cacheKey); } catch (logged) {}
      writeCache.delete(cacheKey);
    });
  } catch(e) {
    console.error(e);
  }
}

export function syncLmsClassToFirestore(lmsClass: any) {
  if (!db || !lmsClass || !lmsClass.id) return;
  try {
    const sanitized = sanitizeFirestoreData(lmsClass);
    const cacheKey = `lmsClasses/${lmsClass.id}`;
    const serialized = JSON.stringify(sanitized);
    if (writeCache.get(cacheKey) === serialized) {
      return;
    }
    writeCache.set(cacheKey, serialized);
    setDoc(doc(db, 'lmsClasses', lmsClass.id), sanitized).catch(e => {
      try { handleFirestoreError(e, OperationType.WRITE, cacheKey); } catch (logged) {}
      writeCache.delete(cacheKey);
    });
  } catch(e) {
    console.error(e);
  }
}

export function deleteEntityFromFirestore(collectionName: string, id: string) {
  if (!db || !id) return;
  try {
    const cacheKey = `${collectionName}/${id}`;
    writeCache.delete(cacheKey);
    deleteDoc(doc(db, collectionName, id)).catch(e => {
      try { handleFirestoreError(e, OperationType.DELETE, cacheKey); } catch (logged) {}
    });
  } catch(e) {
    console.error(e);
  }
}

export async function uploadBufferToFirebaseStorage(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage is not configured or initialized.");
  }
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const storagePath = `uploads/${Date.now()}_${cleanFileName}`;
  const storageRef = ref(storage, storagePath);
  const uint8Array = new Uint8Array(buffer);
  const metadata = {
    contentType: mimeType,
  };
  const snapshot = await uploadBytes(storageRef, uint8Array, metadata);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}
