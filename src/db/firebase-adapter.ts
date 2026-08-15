import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, getDoc, getDocFromServer, deleteDoc, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebaseClient';
import fs from 'fs';
import path from 'path';
import firebaseAppletConfig from '../../firebase-applet-config.json';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  };
  console.warn('⚠️ Firestore Warning/Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Read config with bundle import and runtime filesystem fallback
let firebaseConfig: any = firebaseAppletConfig || {};
if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const configRaw = fs.readFileSync(configPath, 'utf-8');
      firebaseConfig = JSON.parse(configRaw);
    }
  } catch (err) {
    console.warn("⚠️ Firebase configuration file not found or unreadable.");
    firebaseConfig = {};
  }
}

const hasConfig = Boolean(firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey);

export const app = hasConfig 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const db = hasConfig && app
  ? (firebaseConfig.firestoreDatabaseId ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : getFirestore(app))
  : null;

export const storage = hasConfig && app
  ? (firebaseConfig.storageBucket
      ? getStorage(app, firebaseConfig.storageBucket.startsWith("gs://") ? firebaseConfig.storageBucket : `gs://${firebaseConfig.storageBucket}`)
      : getStorage(app))
  : null;

export function sanitizeFirestoreData(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (typeof data !== "object") return data;
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) {
    return data.filter(item => item !== undefined).map(item => sanitizeFirestoreData(item));
  }
  const cleaned: any = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val !== undefined && typeof val !== "function" && typeof val !== "symbol") {
      cleaned[key] = sanitizeFirestoreData(val);
    }
  }
  return cleaned;
}

export async function testConnection(): Promise<boolean> {
  if (!db) {
    console.warn("⚠️ Firestore is not configured or initialized. Skipping connection test.");
    return false;
  }
  try {
    console.log("🔍 Checking Firebase connectivity for Project:", firebaseConfig.projectId, "Database:", firebaseConfig.firestoreDatabaseId || "(default)");
    await getDoc(doc(db, 'system', 'connection_test')).catch(() => null);
    console.log("🔥 [SUCCESS] Firebase Database Activated & Connected!");
    return true;
  } catch (error: any) {
    console.warn("⚠️ [WARNING] Firebase connection test check:", error?.message || error);
    return false;
  }
}

export async function getUserFromFirestore(identifier: string): Promise<any | null> {
  if (!db || !identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const raw = identifier.trim();
  try {
    // 1. Direct doc lookup by username/id in users collection
    const userDoc = await getDoc(doc(db, 'users', clean));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    if (raw !== clean) {
      const rawUserDoc = await getDoc(doc(db, 'users', raw));
      if (rawUserDoc.exists()) {
        return rawUserDoc.data();
      }
    }
    
    // 2. Query users collection by email, username, or studentId
    const usersCol = collection(db, 'users');
    const [byEmail, byUser, byStudentId] = await Promise.all([
      getDocs(query(usersCol, where('email', '==', clean))).catch(() => null),
      getDocs(query(usersCol, where('username', '==', clean))).catch(() => null),
      getDocs(query(usersCol, where('studentId', '==', raw))).catch(() => null)
    ]);

    if (byEmail && !byEmail.empty) return byEmail.docs[0].data();
    if (byUser && !byUser.empty) return byUser.docs[0].data();
    if (byStudentId && !byStudentId.empty) return byStudentId.docs[0].data();

    // 3. Fallback: Query activeStudents collection in Firestore (by id, email, nik)
    const activeCol = collection(db, 'activeStudents');
    const [actDoc, actByEmail, actById, actByNik] = await Promise.all([
      getDoc(doc(db, 'activeStudents', raw)).catch(() => null),
      getDocs(query(activeCol, where('email', '==', clean))).catch(() => null),
      getDocs(query(activeCol, where('id', '==', raw))).catch(() => null),
      getDocs(query(activeCol, where('nik', '==', raw))).catch(() => null)
    ]);

    let matchedActive: any = null;
    if (actDoc && actDoc.exists()) matchedActive = actDoc.data();
    else if (actByEmail && !actByEmail.empty) matchedActive = actByEmail.docs[0].data();
    else if (actById && !actById.empty) matchedActive = actById.docs[0].data();
    else if (actByNik && !actByNik.empty) matchedActive = actByNik.docs[0].data();

    if (matchedActive) {
      const s = matchedActive;
      const isAlumni = s.status === "Lulus" || s.status === "Di Jepang" || s.kategoriPendaftaran === "Alumni";
      return {
        username: s.email ? s.email.trim().toLowerCase() : (s.id || raw),
        name: s.name,
        email: s.email || `${s.id || 'siswa'}@lpksci.com`,
        role: isAlumni ? "Alumni" : "Siswa",
        status: "Active",
        studentId: s.id,
        assignedClass: s.class || "",
        password: s.password || "123456",
        profilePicture: s.profilePicture || "",
      };
    }

    // 4. Fallback: Query registeredStudents collection in Firestore (by id, email, nik)
    const regCol = collection(db, 'registeredStudents');
    const [rDoc, regByEmail, regById, regByNik] = await Promise.all([
      getDoc(doc(db, 'registeredStudents', raw)).catch(() => null),
      getDocs(query(regCol, where('email', '==', clean))).catch(() => null),
      getDocs(query(regCol, where('id', '==', raw))).catch(() => null),
      getDocs(query(regCol, where('nik', '==', raw))).catch(() => null)
    ]);

    let matchedReg: any = null;
    if (rDoc && rDoc.exists()) matchedReg = rDoc.data();
    else if (regByEmail && !regByEmail.empty) matchedReg = regByEmail.docs[0].data();
    else if (regById && !regById.empty) matchedReg = regById.docs[0].data();
    else if (regByNik && !regByNik.empty) matchedReg = regByNik.docs[0].data();

    if (matchedReg) {
      const r = matchedReg;
      return {
        username: r.email ? r.email.trim().toLowerCase() : (r.id || raw),
        name: r.name,
        email: r.email || `${r.id || 'reg'}@lpksci.com`,
        role: "Siswa",
        status: "Active",
        studentId: r.id,
        password: r.password || "123456",
        profilePicture: r.docFoto || "",
      };
    }
  } catch (err: any) {
    console.warn("Direct user query fallback warning:", err?.message || err);
  }
  return null;
}

// retries=1 (a single retry) was too thin for a cold Cloud Run container: ~24
// collection/doc reads all fire in parallel the moment Firestore finishes
// connecting, and a brief hiccup there used to make a collection come back
// empty for the rest of that boot - looking exactly like "the database isn't
// there". A couple more attempts with a bit more backoff gives the connection
// room to settle without meaningfully slowing down the normal (working) path.
async function fetchSafeDoc(docPath: { coll: string; id: string }, retries = 3): Promise<any> {
  if (!db) return null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const snap = await getDoc(doc(db, docPath.coll, docPath.id));
      return snap;
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      handleFirestoreError(err, OperationType.GET, `${docPath.coll}/${docPath.id}`);
      return null;
    }
  }
  return null;
}

async function fetchSafeCollection(collName: string, retries = 3): Promise<{ collName: string; docs: any[] }> {
  if (!db) return { collName, docs: [] };
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const snap = await getDocs(collection(db, collName));
      if (snap && !snap.empty) {
        return { collName, docs: snap.docs.map(d => d.data()) };
      }
      return { collName, docs: [] };
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      handleFirestoreError(err, OperationType.LIST, collName);
      return { collName, docs: [] };
    }
  }
  return { collName, docs: [] };
}

export async function loadStateFromFirestore(fallbackState: any) {
  if (!db) {
    console.warn("⚠️ Firestore is not initialized. Using in-memory fallback state.");
    return fallbackState;
  }
  
  const startTime = Date.now();
  console.log("🚀 Initializing State Load from Firestore database:", firebaseConfig.firestoreDatabaseId || "(default)");

  try {
    const collections = [
      'registeredStudents', 'activeStudents', 'attendance',
      'payments', 'inventory', 'taxes', 'lmsLessons', 'lmsQuizzes',
      'chapterAssessments', 'jobOrders', 'users', 'events',
      'salaries', 'cashLedger', 'messages', 'logs', 'lmsClasses',
      'lmsComments', 'teacherLeaves', 'teacherReports', 'teacherContracts'
    ];
    
    let loadedState: any = { ...fallbackState };
    let hasData = false;

    // Load system docs safely
    const [custDoc, slideDoc, galleryDoc, costConfigDoc] = await Promise.all([
      fetchSafeDoc({ coll: 'system', id: 'customization' }),
      fetchSafeDoc({ coll: 'system', id: 'slideshows' }),
      fetchSafeDoc({ coll: 'system', id: 'galleries' }),
      fetchSafeDoc({ coll: 'system', id: 'costConfig' })
    ]);

    if (custDoc && custDoc.exists()) {
      const custData = custDoc.data();
      loadedState.customization = {
        ...(fallbackState.customization || {}),
        ...custData,
        landingConfig: {
          ...(fallbackState.customization?.landingConfig || {}),
          ...(custData.landingConfig || {})
        }
      };
      hasData = true;
      const { lmsClasses, ...custWithoutClasses } = custData;
      writeCache.set('system/customization', JSON.stringify(sanitizeFirestoreData(custWithoutClasses)));
    }
    if (slideDoc && slideDoc.exists()) {
      const slideData = slideDoc.data();
      loadedState.slideshows = Array.isArray(slideData.data) ? slideData.data : (fallbackState.slideshows || []);
      hasData = true;
      writeCache.set('system/slideshows', JSON.stringify(sanitizeFirestoreData(slideData)));
    }
    if (galleryDoc && galleryDoc.exists()) {
      const galleryData = galleryDoc.data();
      loadedState.galleries = Array.isArray(galleryData.data) ? galleryData.data : (fallbackState.galleries || []);
      hasData = true;
      writeCache.set('system/galleries', JSON.stringify(sanitizeFirestoreData(galleryData)));
    }
    if (costConfigDoc && costConfigDoc.exists()) {
      loadedState.costConfig = costConfigDoc.data();
      hasData = true;
      writeCache.set('system/costConfig', JSON.stringify(sanitizeFirestoreData(costConfigDoc.data())));
    }

    // Load all collections safely in parallel
    const collResults = await Promise.all(
      collections.map(collName => fetchSafeCollection(collName))
    );

    collResults.forEach(({ collName, docs }) => {
      const fallbackItems = Array.isArray(fallbackState[collName]) ? fallbackState[collName] : [];

      if (docs && docs.length > 0) {
        hasData = true;

        // Non-destructive merge: Merge Firestore docs with any memory items that might not yet be in Firestore
        const itemMap = new Map<string, any>();

        // 1. First add memory fallback items
        fallbackItems.forEach((item: any) => {
          if (!item) return;
          const key = item.id || item.username || item.email;
          if (key) itemMap.set(String(key).toLowerCase(), item);
        });

        // 2. Overwrite with Firestore authoritative docs
        docs.forEach((item: any) => {
          if (!item) return;
          const key = item.id || item.username || item.email;
          if (key) {
            itemMap.set(String(key).toLowerCase(), item);
            writeCache.set(`${collName}/${key}`, JSON.stringify(sanitizeFirestoreData(item)));
          }
        });

        loadedState[collName] = Array.from(itemMap.values());
        console.log(`✅ Loaded & merged ${loadedState[collName].length} items from ${collName} (${docs.length} from Firestore)`);
      } else {
        // Firestore returned 0 items (or had a connection issue) -> KEEP memory fallback data!
        loadedState[collName] = fallbackItems;
        if (fallbackItems.length > 0) {
          console.log(`ℹ️ Firestore ${collName} empty/unreachable. Retained ${fallbackItems.length} in-memory items.`);
        }
      }
    });

    // Merge lmsClasses collection back into customization object for backward compatibility with frontend
    if (loadedState.lmsClasses && loadedState.lmsClasses.length > 0) {
      if (!loadedState.customization) loadedState.customization = {};
      loadedState.customization.lmsClasses = loadedState.lmsClasses;
      
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
    }

    const duration = Date.now() - startTime;
    console.log(`💎 Firestore synchronization completed in ${duration}ms. Data loaded: ${hasData ? 'YES' : 'CLEAN_INIT'}`);
    
    // Ensure all critical collection arrays exist
    for (const collName of collections) {
      if (!Array.isArray(loadedState[collName])) {
        loadedState[collName] = fallbackState[collName] || [];
      }
    }
    if (!loadedState.customization) {
      loadedState.customization = fallbackState.customization;
    }
    
    return loadedState;
  } catch(e) {
    console.error("❌ CRITICAL: Failed to load from Firestore. Reverting to safe in-memory fallback.", e);
    return fallbackState;
  }
}

// In-memory write cache to prevent redundant writes and avoid RESOURCE_EXHAUSTED errors
export const writeCache = new Map<string, string>();

// Transient network hiccups (common right after a cold start, or brief Firestore
// throttling) used to cause a write to be dropped after a single failed attempt -
// the in-memory state still looked correct, but the change silently never reached
// Firestore, so it would vanish again on the next server restart. Retrying a few
// times with backoff before giving up makes writes survive those brief blips.
async function setDocWithRetry(docRef: any, sanitized: any, cacheKey: string, opType: OperationType, retries = 3): Promise<void> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await setDoc(docRef, sanitized);
      return;
    } catch (e) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      try { handleFirestoreError(e, opType, cacheKey); } catch (logged) {}
      writeCache.delete(cacheKey);
    }
  }
}

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
    // Fire-and-forget from the caller's perspective, but retried internally.
    setDocWithRetry(doc(db, collectionName, id), sanitized, cacheKey, OperationType.WRITE);
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
    setDocWithRetry(doc(db, 'system', 'customization'), sanitized, cacheKey, OperationType.WRITE);
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
    setDocWithRetry(doc(db, 'lmsClasses', lmsClass.id), sanitized, cacheKey, OperationType.WRITE);
  } catch(e) {
    console.error(e);
  }
}

export function deleteEntityFromFirestore(collectionName: string, id: string) {
  if (!db || !id) return;
  try {
    const cacheKey = `${collectionName}/${id}`;
    writeCache.delete(cacheKey);
    (async () => {
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          await deleteDoc(doc(db, collectionName, id));
          return;
        } catch (e) {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            continue;
          }
          try { handleFirestoreError(e, OperationType.DELETE, cacheKey); } catch (logged) {}
        }
      }
    })();
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
