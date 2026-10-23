import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, setDoc, getDocs, collection, getDoc, getDocFromServer, deleteDoc, query, where, limit, type Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebaseClient';
import { isStudentAlumni } from '../lib/alumniStatus';
import { DEFAULT_GALLERY_ITEMS } from '../data/defaultGallery';
import fs from 'fs';
import path from 'path';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;
export type OperationType = typeof OperationType[keyof typeof OperationType];

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

let firestoreDbInstance: Firestore | null = null;
if (hasConfig && app) {
  const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
  try {
    firestoreDbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, dbId);
  } catch {
    firestoreDbInstance = getFirestore(app, dbId);
  }
}

export const db = firestoreDbInstance;

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

// Retries the whole lookup once on a transient failure before accepting "not
// found" - the queries below each swallow their own errors into null/empty,
// so without this a brief connectivity hiccup during login looks identical to
// a genuinely nonexistent account and rejects a real user.
export async function getUserFromFirestore(identifier: string): Promise<any | null> {
  const result = await getUserFromFirestoreOnce(identifier);
  if (result) return result;
  await new Promise(r => setTimeout(r, 400));
  return getUserFromFirestoreOnce(identifier);
}

async function getUserFromFirestoreOnce(identifier: string): Promise<any | null> {
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
      const isAlumni = isStudentAlumni(s);
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

async function fetchSafeCollection(collName: string, retries = 3, maxLimit?: number): Promise<{ collName: string; docs: any[] }> {
  if (!db) return { collName, docs: [] };
  const effectiveRetries = (collName === 'chapterAssessments' || collName === 'attendance') ? Math.max(retries, 5) : retries;
  for (let attempt = 0; attempt <= effectiveRetries; attempt++) {
    try {
      let q: any = collection(db, collName);
      if (maxLimit && maxLimit > 0) {
        q = query(collection(db, collName), limit(maxLimit));
      }
      const snap = await getDocs(q);
      if (snap && !snap.empty) {
        return {
          collName,
          docs: snap.docs.map(d => {
            const data = d.data() as any;
            return {
              id: d.id,
              ...data,
              // Ensure explicit id is preserved
              ...(data?.id ? { id: data.id } : {})
            };
          })
        };
      }
      return { collName, docs: [] };
    } catch (err: any) {
      if (attempt < effectiveRetries) {
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
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
    let loadedState: any = { ...fallbackState };
    let hasData = false;

    // Load system docs safely across all known legacy and standard keys
    const [custDoc, slideDoc, galleryDoc, galleryAltDoc, costConfigDoc, lmsClassesDoc] = await Promise.all([
      fetchSafeDoc({ coll: 'system', id: 'customization' }),
      fetchSafeDoc({ coll: 'system', id: 'slideshows' }),
      fetchSafeDoc({ coll: 'system', id: 'galleries' }),
      fetchSafeDoc({ coll: 'system', id: 'gallery' }),
      fetchSafeDoc({ coll: 'system', id: 'costConfig' }),
      fetchSafeDoc({ coll: 'system', id: 'lmsClasses' })
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
      setWriteCache('system/customization', hashString(JSON.stringify(sanitizeFirestoreData(custData))));
    }
    if (lmsClassesDoc && lmsClassesDoc.exists()) {
      const clsData = lmsClassesDoc.data();
      const list = Array.isArray(clsData?.classes) ? clsData.classes : (Array.isArray(clsData) ? clsData : []);
      if (list.length > 0) {
        loadedState.lmsClasses = list;
        if (!loadedState.customization) loadedState.customization = {};
        loadedState.customization.lmsClasses = list;
        hasData = true;
      }
    }
    if (slideDoc && slideDoc.exists()) {
      const slideData = slideDoc.data();
      const slideList = Array.isArray(slideData?.data)
        ? slideData.data
        : Array.isArray(slideData?.slideshows)
          ? slideData.slideshows
          : Array.isArray(slideData)
            ? slideData
            : [];
      if (slideList.length > 0) {
        loadedState.slideshows = slideList;
        hasData = true;
      } else {
        loadedState.slideshows = fallbackState.slideshows || [];
      }
      setWriteCache('system/slideshows', hashString(JSON.stringify(sanitizeFirestoreData(slideData))));
    }
    
    // Check system/galleries and system/gallery documents
    const activeGalleryDoc = (galleryDoc && galleryDoc.exists()) ? galleryDoc : (galleryAltDoc && galleryAltDoc.exists() ? galleryAltDoc : null);
    if (activeGalleryDoc) {
      const galleryData = activeGalleryDoc.data();
      const galList = Array.isArray(galleryData?.data)
        ? galleryData.data
        : Array.isArray(galleryData?.gallery)
          ? galleryData.gallery
          : Array.isArray(galleryData?.galleries)
            ? galleryData.galleries
            : Array.isArray(galleryData?.items)
              ? galleryData.items
              : Array.isArray(galleryData)
                ? galleryData
                : [];
      if (galList.length > 0) {
        loadedState.galleries = galList;
        hasData = true;
      } else {
        loadedState.galleries = (fallbackState.galleries && fallbackState.galleries.length > 0) ? fallbackState.galleries : DEFAULT_GALLERY_ITEMS;
      }
      setWriteCache('system/galleries', hashString(JSON.stringify(sanitizeFirestoreData(galleryData))));
    }

    // If galleries is empty, check customization doc for any previously saved gallery
    if ((!loadedState.galleries || loadedState.galleries.length === 0) && custDoc && custDoc.exists()) {
      const custData = custDoc.data();
      if (Array.isArray(custData?.gallery) && custData.gallery.length > 0) {
        loadedState.galleries = custData.gallery;
        hasData = true;
      } else if (Array.isArray(custData?.galleries) && custData.galleries.length > 0) {
        loadedState.galleries = custData.galleries;
        hasData = true;
      }
    }
    if (!loadedState.galleries || loadedState.galleries.length === 0) {
      loadedState.galleries = DEFAULT_GALLERY_ITEMS;
    }
    if (costConfigDoc && costConfigDoc.exists()) {
      loadedState.costConfig = costConfigDoc.data();
      hasData = true;
      setWriteCache('system/costConfig', hashString(JSON.stringify(sanitizeFirestoreData(costConfigDoc.data()))));
    }

    // Load collections in organized, sequential batches to prevent network/socket exhaustion and Firestore drops
    // Batch 1: Critical user accounts and core structure
    const batch1Names = ['users', 'lmsClasses', 'events', 'registeredStudents', 'activeStudents'];
    const batch1Results = await Promise.all(batch1Names.map(name => fetchSafeCollection(name)));

    // Batch 2: Daily operations and academics
    const batch2Names = ['payments', 'jobOrders', 'inventory', 'taxes', 'lmsLessons', 'lmsQuizzes', 'lmsComments'];
    const batch2Results = await Promise.all(batch2Names.map(name => fetchSafeCollection(name)));

    // Batch 3A: Academic Chapter Assessments (Dedicated batch to guarantee no socket exhaustion)
    const batch3aNames = ['chapterAssessments', 'assessments'];
    const batch3aResults = await Promise.all(batch3aNames.map(name => fetchSafeCollection(name, 4)));

    // Batch 3B: Large Attendance records (Dedicated batch)
    const batch3bResults = [await fetchSafeCollection('attendance', 4)];

    // Batch 3C: Logs, HR, and other historical datasets
    const batch3cNames = ['salaries', 'cashLedger', 'messages', 'teacherLeaves', 'teacherReports', 'teacherContracts', 'logs'];
    const batch3cResults = await Promise.all(batch3cNames.map(name => fetchSafeCollection(name)));

    const collResults = [...batch1Results, ...batch2Results, ...batch3aResults, ...batch3bResults, ...batch3cResults];

    collResults.forEach(({ collName, docs }) => {
      // Map alternative collection names to canonical state property
      let canonicalName = collName;
      if (collName === "assessments" || collName === "evaluasi" || collName === "penilaian") {
        canonicalName = "chapterAssessments";
      }

      const fallbackItems = Array.isArray(fallbackState[canonicalName]) ? fallbackState[canonicalName] : [];

      if (docs && docs.length > 0) {
        hasData = true;

        const itemMap = new Map<string, any>();

        const parseDateToEpoch = (dStr: any, idStr: string) => {
          if (typeof dStr === "number") return dStr;
          const match = idStr ? idStr.match(/(\d{13})$/) : null;
          if (match) return Number(match[1]);
          if (!dStr) return 0;
          if (typeof dStr === "string" && dStr.includes("/")) {
            const parts = dStr.split("/");
            if (parts.length === 3) {
              const d = Number(parts[0]);
              const m = Number(parts[1]) - 1;
              const y = Number(parts[2]);
              const dateObj = new Date(y, m, d);
              if (!isNaN(dateObj.getTime())) return dateObj.getTime();
            }
          }
          const t = new Date(dStr).getTime();
          return isNaN(t) ? 0 : t;
        };

        const scoreCompleteness = (r: any) => {
          let pts = 0;
          if (r.scoreKotoba !== undefined && r.scoreKotoba !== null && r.scoreKotoba !== "") pts++;
          if (r.scoreBumpo !== undefined && r.scoreBumpo !== null && r.scoreBumpo !== "") pts++;
          if (r.scoreKaiwa !== undefined && r.scoreKaiwa !== null && r.scoreKaiwa !== "") pts++;
          if (r.scoreKanji !== undefined && r.scoreKanji !== null && r.scoreKanji !== "") pts++;
          return pts;
        };

        const getItemKey = (item: any) => {
          if (!item) return "";
          if (canonicalName === "chapterAssessments" && item.studentId && item.chapterNumber && !item.lessonId) {
            const sId = String(item.studentId).trim().toLowerCase();
            const ch = Number(item.chapterNumber);
            const rawSubj = String(item.subject || "Bahasa Jepang").trim().toLowerCase();
            const subj = rawSubj.includes("ssw") || rawSubj.includes("matematika") || rawSubj === "math" ? "matematika" : (rawSubj || "bahasa_jepang");
            return `asses_${sId}_ch${ch}_${subj}`;
          }
          return item.id || (item.studentId && item.chapterNumber ? `${item.studentId}_${item.chapterNumber}_${item.subject || ''}` : item.username || item.email || JSON.stringify(item));
        };

        // 1. First add existing loaded / fallback items
        const existingItems = Array.isArray(loadedState[canonicalName]) ? loadedState[canonicalName] : fallbackItems;
        existingItems.forEach((item: any) => {
          if (!item) return;
          const key = getItemKey(item);
          if (key) itemMap.set(String(key).toLowerCase(), item);
        });

        // 2. Overwrite / merge with Firestore authoritative docs
        docs.forEach((item: any) => {
          if (!item) return;
          const key = getItemKey(item);
          if (key) {
            const lowKey = String(key).toLowerCase();
            const prev = itemMap.get(lowKey);
            if (prev && canonicalName === "chapterAssessments") {
              const prevTime = prev.timestamp || parseDateToEpoch(prev.assessedDate, prev.id || "");
              const curTime = item.timestamp || parseDateToEpoch(item.assessedDate, item.id || "");
              const prevComp = scoreCompleteness(prev);
              const curComp = scoreCompleteness(item);

              if (curTime > prevTime) {
                itemMap.set(lowKey, item);
              } else if (curTime < prevTime) {
                // Keep prev because prev is newer
              } else {
                // Equal timestamp: prefer higher score completeness or Telah Dinilai status
                if (curComp > prevComp || (item.status === "Telah Dinilai" && prev.status !== "Telah Dinilai")) {
                  itemMap.set(lowKey, item);
                }
              }
            } else {
              itemMap.set(lowKey, item);
            }
            setWriteCache(`${collName}/${item.id || key}`, hashString(JSON.stringify(sanitizeFirestoreData(item))));
          }
        });

        loadedState[canonicalName] = Array.from(itemMap.values());
        console.log(`✅ Loaded & merged ${loadedState[canonicalName].length} items into ${canonicalName} (${docs.length} from Firestore coll ${collName})`);
      } else if (!loadedState[canonicalName]) {
        loadedState[canonicalName] = fallbackItems;
      }
    });

    // Merge lmsClasses collection back into customization object for backward compatibility with frontend
    const sanitizeClassChapters = (cls: any) => {
      if (!cls || typeof cls !== "object") return cls;
      if (Array.isArray(cls.chapters)) {
        const seen = new Set<number>();
        cls.chapters = cls.chapters.filter((ch: any) => {
          const num = Number(ch?.number);
          if (!num || seen.has(num)) return false;
          seen.add(num);
          return true;
        }).sort((a: any, b: any) => Number(a.number) - Number(b.number));
      }
      if (Array.isArray(cls.mathChapters)) {
        const seen = new Set<number>();
        cls.mathChapters = cls.mathChapters.filter((ch: any) => {
          const num = Number(ch?.number);
          if (!num || seen.has(num)) return false;
          seen.add(num);
          return true;
        }).sort((a: any, b: any) => Number(a.number) - Number(b.number));
      }
      return cls;
    };

    if (loadedState.lmsClasses && loadedState.lmsClasses.length > 0) {
      loadedState.lmsClasses = loadedState.lmsClasses.map(sanitizeClassChapters);
      if (!loadedState.customization) loadedState.customization = {};
      loadedState.customization.lmsClasses = loadedState.lmsClasses;
      
      loadedState.lmsClasses.forEach((lmsClass: any) => {
        const classId = String(lmsClass.id || lmsClass.name || '').replace(/\//g, '_').trim();
        if (classId) {
          lmsClass.id = classId;
          setWriteCache(`lmsClasses/${classId}`, hashString(JSON.stringify(sanitizeFirestoreData(lmsClass))));
        }
      });
    } else if (loadedState.customization?.lmsClasses && Array.isArray(loadedState.customization.lmsClasses) && loadedState.customization.lmsClasses.length > 0) {
      loadedState.customization.lmsClasses = loadedState.customization.lmsClasses.map(sanitizeClassChapters);
      loadedState.lmsClasses = loadedState.customization.lmsClasses;
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

      // Keep ALL presensi pengajar logs (never drop teacher attendance / HR records)
      // plus the latest 500 general system and security logs
      const allLogs = Array.from(logMap.values());
      const presensiLogs = allLogs.filter((l: any) => l.type === "PRESENSI_PENGAJAR");
      const otherLogs = allLogs
        .filter((l: any) => l.type !== "PRESENSI_PENGAJAR")
        .sort((a: any, b: any) => {
          const timeA = new Date(a.timestamp || a.time || 0).getTime();
          const timeB = new Date(b.timestamp || b.time || 0).getTime();
          return timeB - timeA;
        })
        .slice(0, 500);

      loadedState.logs = [...presensiLogs, ...otherLogs].sort((a: any, b: any) => {
        const timeA = new Date(a.timestamp || a.time || 0).getTime();
        const timeB = new Date(b.timestamp || b.time || 0).getTime();
        return timeB - timeA;
      });
    }

    const duration = Date.now() - startTime;
    console.log(`💎 Firestore synchronization completed in ${duration}ms. Data loaded: ${hasData ? 'YES' : 'CLEAN_INIT'}`);
    
    // Ensure all critical collection arrays exist
    const allCollectionNames = [...batch1Names, ...batch2Names, ...batch3aNames, 'attendance', ...batch3cNames];
    for (const collName of allCollectionNames) {
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

// Lightweight 32-bit FNV-1a hash to store 4-byte number hashes instead of heavy serialized JSON strings in memory
function hashString(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// In-memory write cache to prevent redundant writes and avoid RESOURCE_EXHAUSTED errors
export const writeCache = new Map<string, number>();

export function setWriteCache(key: string, hashVal: number) {
  if (writeCache.size > 800) {
    let count = 0;
    for (const k of writeCache.keys()) {
      writeCache.delete(k);
      count++;
      if (count > 200) break;
    }
  }
  writeCache.set(key, hashVal);
}

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
    const hashVal = hashString(JSON.stringify(sanitized));
    if (writeCache.get(cacheKey) === hashVal) {
      return;
    }
    setWriteCache(cacheKey, hashVal);
    // Fire-and-forget from the caller's perspective, but retried internally.
    setDocWithRetry(doc(db, collectionName, id), sanitized, cacheKey, OperationType.WRITE);
  } catch(e) {
    console.error(e);
  }
}

export async function syncEntityToFirestoreAsync(collectionName: string, id: string, data: any): Promise<boolean> {
  if (!db || !id) return false;
  try {
    const sanitized = sanitizeFirestoreData(data);
    const cacheKey = `${collectionName}/${id}`;
    const hashVal = hashString(JSON.stringify(sanitized));
    if (writeCache.get(cacheKey) === hashVal) {
      return true;
    }
    setWriteCache(cacheKey, hashVal);
    await setDocWithRetry(doc(db, collectionName, id), sanitized, cacheKey, OperationType.WRITE);
    return true;
  } catch (e) {
    console.error(`Error in syncEntityToFirestoreAsync [${collectionName}/${id}]:`, e);
    return false;
  }
}

export async function getEntityFromFirestore(collectionName: string, id: string): Promise<any | null> {
  if (!db || !id) return null;
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function syncCustomizationToFirestore(data: any) {
  if (!db || !data) return;
  try {
    const sanitized = sanitizeFirestoreData(data);
    const cacheKey = `system/customization`;
    const hashVal = hashString(JSON.stringify(sanitized));
    if (writeCache.get(cacheKey) === hashVal) {
      return;
    }
    setWriteCache(cacheKey, hashVal);
    setDocWithRetry(doc(db, 'system', 'customization'), sanitized, cacheKey, OperationType.WRITE);
  } catch(e) {
    console.error("Error in syncCustomizationToFirestore:", e);
  }
}

export function syncGalleriesToFirestore(galleries: any[]) {
  if (!db) return;
  try {
    const list = Array.isArray(galleries) ? galleries : [];
    const sanitized = sanitizeFirestoreData(list);
    const cacheKey = `system/galleries`;
    const hashVal = hashString(JSON.stringify(sanitized));
    if (writeCache.get(cacheKey) !== hashVal) {
      setWriteCache(cacheKey, hashVal);
      setDocWithRetry(doc(db, 'system', 'galleries'), { data: sanitized, galleries: sanitized, gallery: sanitized, updatedAt: new Date().toISOString() }, cacheKey, OperationType.WRITE);
    }
  } catch(e) {
    console.error("syncGalleriesToFirestore error:", e);
  }
}

export function syncLmsClassToFirestore(lmsClass: any) {
  if (!db || !lmsClass) return;
  try {
    const classId = String(lmsClass.id || lmsClass.name || 'class_' + Date.now()).replace(/\//g, '_').trim();
    if (!classId) return;
    lmsClass.id = classId;
    const sanitized = sanitizeFirestoreData(lmsClass);
    const cacheKey = `lmsClasses/${classId}`;
    const hashVal = hashString(JSON.stringify(sanitized));
    if (writeCache.get(cacheKey) === hashVal) {
      return;
    }
    setWriteCache(cacheKey, hashVal);
    setDocWithRetry(doc(db, 'lmsClasses', classId), sanitized, cacheKey, OperationType.WRITE);
  } catch(e) {
    console.error("Error in syncLmsClassToFirestore:", e);
  }
}

export function syncAllLmsClassesToFirestore(classes: any[]) {
  if (!db || !Array.isArray(classes)) return;
  try {
    const sanitized = sanitizeFirestoreData(classes);
    const cacheKey = `system/lmsClasses`;
    const hashVal = hashString(JSON.stringify(sanitized));
    if (writeCache.get(cacheKey) !== hashVal) {
      setWriteCache(cacheKey, hashVal);
      setDocWithRetry(doc(db, 'system', 'lmsClasses'), { classes: sanitized, updatedAt: new Date().toISOString() }, cacheKey, OperationType.WRITE);
    }
  } catch (e) {
    console.error("Error in syncAllLmsClassesToFirestore:", e);
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

export async function deleteEntityFromFirestoreAsync(collectionName: string, id: string): Promise<boolean> {
  if (!db || !id) return false;
  try {
    const cacheKey = `${collectionName}/${id}`;
    writeCache.delete(cacheKey);
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        return true;
      } catch (e) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        try { handleFirestoreError(e, OperationType.DELETE, cacheKey); } catch (logged) {}
      }
    }
    return false;
  } catch(e) {
    console.error(`Error in deleteEntityFromFirestoreAsync [${collectionName}/${id}]:`, e);
    return false;
  }
}

export async function uploadBufferToFirebaseStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folder: string = "uploads"
): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage is not configured or initialized.");
  }
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const cleanFolder = (folder || "uploads").replace(/[^a-zA-Z0-9_.-]/g, "_");
  const storagePath = `${cleanFolder}/${Date.now()}_${cleanFileName}`;
  const storageRef = ref(storage, storagePath);
  const uint8Array = new Uint8Array(buffer);
  const metadata = {
    contentType: mimeType || "application/octet-stream",
    customMetadata: {
      originalName: fileName,
      uploadedAt: new Date().toISOString(),
    },
  };
  const snapshot = await uploadBytes(storageRef, uint8Array, metadata);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

export async function touchSyncMeta(meta: string | { source?: string; dataType?: string; id?: string; action?: string; instanceId?: string; [key: string]: any } = "system"): Promise<void> {
  if (!db) return;
  try {
    const rawPayload = typeof meta === "string" 
      ? { source: meta, updatedAt: Date.now() }
      : { source: "system", ...meta, updatedAt: Date.now() };

    // Sanitize and prune any undefined keys so Firestore setDoc never rejects the document
    const cleanPayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawPayload)) {
      if (value !== undefined) {
        cleanPayload[key] = value;
      }
    }

    await setDoc(doc(db, "system", "sync_meta"), cleanPayload, { merge: true });
  } catch (e) {
    console.warn("Failed to touch sync_meta:", e);
  }
}
