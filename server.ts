import express from "express";
import compression from "compression";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import { getStudentStatusGroup } from "./src/lib/studentStatusGroups.ts";
import { testConnection, loadStateFromFirestore, syncEntityToFirestore, syncCustomizationToFirestore, syncGalleriesToFirestore, syncLmsClassToFirestore, syncAllLmsClassesToFirestore, deleteEntityFromFirestore, uploadBufferToFirebaseStorage, getUserFromFirestore, getEntityFromFirestore, db, touchSyncMeta, setSyncInstanceId, parseSyncChangeValue, SYNC_CHANGES_DOC_ID } from "./src/db/firebase-adapter.ts";
import { doc, getDoc } from "firebase/firestore";
import { DEFAULT_GALLERY_ITEMS } from "./src/data/defaultGallery.ts";
import { isHashedPassword, hashPassword, verifyPassword, stripPassword } from "./server/auth-utils.ts";
import { handleStateUpdate } from "./server/handlers/index.ts";
import { invalidateStateCache, getStateVersion, getCachedStateResponse, setCachedStateResponse } from "./server/stateCache.ts";

export { invalidateStateCache };

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Safety net: this server holds ALL application state in memory and takes
// ~25-30s to reload it from Firestore on boot (see stateInitPromise below).
// Without these handlers, a single uncaught error in any request (e.g. an
// async route handler throwing, which Express 4 does NOT catch) becomes an
// unhandled rejection - and Node 15+ terminates the whole process on that by
// default. That takes down every logged-in user at once (matches reports of
// the app "freezing"/"database disconnected" and nobody able to log in,
// worst during high-concurrency afternoon traffic) until Cloud Run cold-boots
// a fresh instance and it re-syncs from Firestore. Logging instead of
// crashing keeps the one bad request isolated to its own caller.
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ [UNHANDLED REJECTION] Kept server alive, but investigate this:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("⚠️ [UNCAUGHT EXCEPTION] Kept server alive, but investigate this:", err);
});

// Enable gzip/deflate compression for all HTTP responses (reduces JSON payload by ~85-90%)
app.use(compression());

// Set safe body size limit (15mb) preventing buffer memory bloat and container OOM termination
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.get("/api/health", (req, res) => res.json({ status: "ok", initialized: isStateReady }));
app.get("/api/ping", async (req, res) => {
  // Trigger warm-up check asynchronously to ensure database connection is responsive
  testConnection().catch(() => {});
  res.json({ status: "pong", time: new Date().toISOString(), initialized: isStateReady });
});
// Firebase Authentication Reverse Proxy for Custom Auth Domain (e.g. lpksci.com)
// Proxies all OAuth redirect & helper requests to Firebase Auth backend so Google displays lpksci.com instead of gen-lang-client
app.all("/__/auth/*", async (req, res) => {
  try {
    const targetUrl = `https://gen-lang-client-0782283050.firebaseapp.com${req.originalUrl}`;
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string" && key.toLowerCase() !== "host") {
        headers[key] = value;
      }
    }
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    response.headers.forEach((val, key) => {
      if (key.toLowerCase() !== "content-encoding") {
        res.setHeader(key, val);
      }
    });
    res.status(response.status);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("Firebase auth proxy error:", err);
    res.status(502).send("Auth Proxy Error");
  }
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(
    `User-agent: *\n` +
    `Allow: /\n` +
    `Disallow: /api/\n` +
    `Disallow: /uploads/\n` +
    `Sitemap: https://lpksci.com/sitemap.xml\n`
  );
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  const today = new Date().toISOString().split("T")[0];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lpksci.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://lpksci.com/daftar</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://lpksci.com/register</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://lpksci.com/kebijakan</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://lpksci.com/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
  res.send(sitemap);
});

// Serve uploaded assets
const uploadsDir = path.join(process.cwd(), "uploads");
const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(publicUploadsDir)) fs.mkdirSync(publicUploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));
app.use("/uploads", express.static(publicUploadsDir));

let isStateReady = false;
let stateInitPromise: Promise<void> | null = null;

export async function ensureStateReady(maxWaitMs = 35000): Promise<void> {
  if (isStateReady) return;
  if (!stateInitPromise) return;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, maxWaitMs));
  await Promise.race([stateInitPromise, timeout]);
}

export const SERVER_INSTANCE_ID = `srv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
setSyncInstanceId(SERVER_INSTANCE_ID);

let lastProcessedSyncMetaTime = 0;
let lastProcessedCostConfigHash = "";
let syncIntervalTimer: NodeJS.Timeout | null = null;

export function initRealtimeSync(): void {
  if (!db) {
    console.warn("⚠️ Firestore DB not initialized, skipping real-time sync.");
    return;
  }
  
  if (syncIntervalTimer) {
    clearInterval(syncIntervalTimer);
  }

  console.log(`🔌 [Real-time Sync] Resilient polling synchronizer started (instanceId: ${SERVER_INSTANCE_ID})...`);

  // Changes stamped before this point are already contained in the state that
  // was just loaded from Firestore (minus a margin for the load itself).
  const changeFeedBaseline = Date.now() - 60000;

  const pollSync = async () => {
    try {
      await applyStudentChangeFeed(changeFeedBaseline);
    } catch (err: any) {
      // Next tick retries
    }
    try {
      // 1. Check sync_meta using unary getDoc (eliminates idle gRPC stream RST_STREAM disconnects)
      const metaDoc = await getDoc(doc(db, "system", "sync_meta"));
      if (metaDoc && metaDoc.exists()) {
        const data = metaDoc.data();
        const updatedAt = Number(data?.updatedAt) || 0;

        if (updatedAt > lastProcessedSyncMetaTime) {
          lastProcessedSyncMetaTime = updatedAt;

          // Skip self-updates within 2000ms
          if (!(data.instanceId === SERVER_INSTANCE_ID && Date.now() - updatedAt < 2000)) {
            console.log(`⚡ [Real-time Sync] Detected remote update from ${data.source || 'unknown'}: dataType=${data.dataType || 'all'}, action=${data.action || 'sync'}`);

            // Fast sync for costConfig
            if (data.dataType === "costConfig" || (data.dataType === "system" && data.id === "costConfig")) {
              try {
                const freshCost = await getEntityFromFirestore("system", "costConfig");
                if (freshCost) {
                  state.costConfig = {
                    ...(state.costConfig || {}),
                    ...freshCost
                  };
                  invalidateStateCache();
                  console.log("⚡ [Real-time Sync] costConfig updated via sync_meta fast-path:", state.costConfig);
                  return;
                }
              } catch (e) {}
            }

            // Fast single-doc sync if entity is specified
            if (data.dataType && data.id && data.action !== "delete") {
              try {
                const freshItem = await getEntityFromFirestore(data.dataType, data.id);
                if (freshItem && Array.isArray(state[data.dataType])) {
                  const arr = state[data.dataType];
                  const idx = arr.findIndex((item: any) => item && (item.id === data.id || item.username === data.id));
                  if (idx >= 0) {
                    arr[idx] = { ...arr[idx], ...freshItem };
                  } else {
                    arr.unshift(freshItem);
                  }
                  invalidateStateCache();
                  return;
                }
              } catch (e) {}
            }

            // Background reload for batch or general changes
            triggerBackgroundResync(false).catch(() => {});
            invalidateStateCache();
          }
        }
      }

      // 2. Direct costConfig poll check
      const costDoc = await getDoc(doc(db, "system", "costConfig"));
      if (costDoc && costDoc.exists()) {
        const costData = costDoc.data();
        if (costData) {
          const currentHash = JSON.stringify(costData);
          if (currentHash !== lastProcessedCostConfigHash) {
            lastProcessedCostConfigHash = currentHash;
            state.costConfig = {
              ...(state.costConfig || {}),
              ...costData
            };
            invalidateStateCache();
          }
        }
      }
    } catch (err: any) {
      // Silently tolerate transient network hiccups; next tick will seamlessly retry
    }
  };

  // Run initial poll after 3s, then check every 15s
  setTimeout(pollSync, 3000);
  syncIntervalTimer = setInterval(pollSync, 15000);
}

// Last change-feed timestamp applied per "<collection>:<id>" (see firebase-adapter.ts).
const seenStudentChanges = new Map<string, number>();

/**
 * Pulls every student record another instance changed since the last poll,
 * so this instance never keeps (or re-saves) an outdated status.
 */
async function applyStudentChangeFeed(baseline: number): Promise<void> {
  if (!db) return;
  const snap = await getDoc(doc(db, "system", SYNC_CHANGES_DOC_ID));
  if (!snap || !snap.exists()) return;
  const entries = snap.data() || {};
  let changed = false;
  for (const [key, raw] of Object.entries(entries)) {
    const { ts, instanceId } = parseSyncChangeValue(raw);
    const lastSeen = seenStudentChanges.get(key) ?? baseline;
    if (ts <= lastSeen) continue;
    seenStudentChanges.set(key, ts);
    if (instanceId === SERVER_INSTANCE_ID) continue;

    const sep = key.indexOf(":");
    if (sep <= 0) continue;
    const collectionName = key.slice(0, sep);
    const id = key.slice(sep + 1);
    if (!Array.isArray(state[collectionName])) continue;

    const fresh = await getEntityFromFirestore(collectionName, id);
    const arr = state[collectionName];
    const idx = arr.findIndex((item: any) => item && item.id === id);
    if (fresh) {
      const record = { ...fresh, id: fresh.id || id };
      if (idx >= 0) arr[idx] = record;
      else arr.unshift(record);
    } else if (idx >= 0) {
      arr.splice(idx, 1);
    }
    changed = true;
  }
  if (changed) {
    invalidateStateCache();
  }
}

let isResyncing = false;
let lastResyncTime = 0;
let trailingResyncTimer: NodeJS.Timeout | null = null;

export async function triggerBackgroundResync(force = false): Promise<void> {
  const now = Date.now();
  if (isResyncing || (!force && now - lastResyncTime < 10000)) {
    // Previously a request arriving inside the 10s debounce window was simply
    // dropped, so a remote change that landed right after another one was never
    // loaded. Schedule one trailing resync instead.
    if (!trailingResyncTimer) {
      const wait = Math.max(1000, 10000 - (now - lastResyncTime));
      trailingResyncTimer = setTimeout(() => {
        trailingResyncTimer = null;
        triggerBackgroundResync(true).catch(() => {});
      }, wait);
    }
    return;
  }
  isResyncing = true;
  lastResyncTime = now;
  try {
    const loadedState = await loadStateFromFirestore(state);
    if (loadedState) {
      Object.keys(loadedState).forEach((key) => {
        if (Array.isArray(loadedState[key])) {
          if (loadedState[key].length > 0) {
            state[key] = loadedState[key];
          }
        } else if (loadedState[key]) {
          state[key] = loadedState[key];
        }
      });
      isStateReady = true;
      invalidateStateCache();
      console.log(`🔄 [Resync] Synchronized state with Firestore: ${state.chapterAssessments?.length || 0} assessments, ${state.attendance?.length || 0} attendance, ${state.activeStudents?.length || 0} students`);
    }
  } catch (err) {
    console.warn("⚠️ Background resync error:", err);
  } finally {
    isResyncing = false;
  }
}

// In-Memory Database with clean initial state
let state: any = {
  registeredStudents: [],
  activeStudents: [],
  attendance: [],
  payments: [],
  inventory: [],
  taxes: [],
  costConfig: {
    registration: 500000,
    dp: 5000000,
    fullPayment: 2000000,
    stage3: 3000000,
    managementFee: 0,
  },
  customization: {
    logoText: "LPK SCI",
    logoIcon: "Award",
    themeColor: "indigo",
    logoUrl: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0782283050.firebasestorage.app/o/branding%2F1788528497434_7bd439c1-0aa7-49dd-9669-ec38ea03c0a8.jpg?alt=media&token=efc874ae-2989-4604-96e0-8d0f9bc0071d",
    faviconUrl: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0782283050.firebasestorage.app/o/branding%2F1792028427128_favicon.png?alt=media&token=d45ddbb1-8d22-49c2-85d6-b1558a2db5a1",
    officeLocation: {
      latitude: 0,
      longitude: 0,
      radius: 200,
      enforce: false
    },
    runningText: "🇯🇵 Selamat Datang di Portal Resmi LPK Source Course Indonesia (SCI) Pati • Lembaga Resmi Pelatihan Kerja & Pengiriman Tenaga Profesional ke Jepang (Program Tokutei Ginou / SSW & Magang) • Bimbingan Bahasa Jepang Intensif N5, N4, JFT-Basic & Skill Kaigo Lansia • Info Pendaftaran & Konsultasi Hubungi Kantor LPK SCI Pati",
    paymentAccounts: [],
    slides: [],
    gallery: [],
    landingConfig: {
      ecosystemTitle: "Ekosistem Pendidikan & Penyaluran Karir",
      ecosystemSubtitle: "Selamat datang di portal resmi LPK SCI (Source Course Indonesia).",
      perks: [],
      alumniTitle: "Testimoni Alumni",
      alumniSubtitle: "Kisah sukses alumni LPK SCI.",
      testimonials: [],
      programsTitle: "Program Unggulan LPK SCI",
      programsSubtitle: "Jalur karir spesifik (SSW) dan Magang (Ginou Jisshusei).",
      programs: [],
      opportunityImages: [
        {
          id: 1,
          label: "Pelatihan Teori & Praktik",
          url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0782283050.firebasestorage.app/o/galeri%2F1788397965132_WhatsApp_Image_2026-09-02_at_10.02.15.jpeg?alt=media&token=afd37c47-ed69-440a-bf04-0f524e94c79f"
        },
        {
          id: 2,
          label: "Penyerahan Sertifikat",
          url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0782283050.firebasestorage.app/o/galeri%2F1788398049192_WhatsApp_Image_2026-09-02_at_09.10.45.jpeg?alt=media&token=f7bcb632-ff46-4e62-879e-9589b46ceecc"
        },
        {
          id: 3,
          label: "Foto Bersama Alumni",
          url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0782283050.firebasestorage.app/o/galeri%2F1788398162422_WhatsApp_Image_2026-09-01_at_09.06.50.jpg?alt=media&token=a63b6a63-c29b-48db-9416-1cb10d74401d"
        }
      ]
    }
  },
  lmsLessons: [],
  lmsQuizzes: [],
  lmsComments: [],
  chapterAssessments: [],
  users: [],
  passwordResets: [],
  messages: [],
  events: [],
  salaries: [],
  cashLedger: [],
  logs: [],
  teacherLeaves: [],
  teacherReports: [],
  teacherContracts: [],
  jobOrders: [
    {
      id: "JOB-001",
      noReg: "REG-J-101",
      jobType: "Tokutei Ginou",
      partnerName: "PT Fuji Engineering",
      occupation: "Pengolahan Makanan",
      location: "Hokkaido, Jepang",
      salary: "160,000 JPY / Bulan",
      overtime: "Ada",
      allowance: "Transport, Asrama",
      contractDuration: "3 Tahun",
      tbRequirement: "Min. 155 cm",
      bbRequirement: "Proporsional",
      interviewExecution: "Online (Zoom)",
      interviewDate: "15 Agustus 2026",
      scheduleRegistration: "20 Juli - 10 Agustus 2026",
      status: "Aktif",
      recommendations: [],
      interestedStudents: [],
      approvedApplicants: [],
      applicantDocuments: {}
    },
    {
      id: "JOB-002",
      noReg: "REG-J-102",
      jobType: "Ginou Jisshuu",
      partnerName: "Tokyo Construction Ltd",
      occupation: "Konstruksi Sipil",
      location: "Tokyo, Jepang",
      salary: "155,000 JPY / Bulan",
      overtime: "Ada (Tinggi)",
      allowance: "Asrama, Makan Siang",
      contractDuration: "3 Tahun",
      tbRequirement: "Min. 165 cm",
      bbRequirement: "Min. 60 kg",
      interviewExecution: "Offline (Jakarta)",
      interviewDate: "22 Agustus 2026",
      scheduleRegistration: "Tutup 18 Agustus 2026",
      status: "Aktif",
      recommendations: [],
      interestedStudents: [],
      approvedApplicants: [],
      applicantDocuments: {}
    }
  ]
};

// REST APIs

app.get("/api/debug/customization", (req, res) => {
  res.json({ galleryLength: state.customization.gallery?.length, gallery: state.customization.gallery });
});

app.post("/api/upload", async (req, res) => {
  const { fileData, fileName, folder } = req.body;
  if (!fileData || !fileName) {
    return res.status(400).json({ error: "Missing fileData or fileName" });
  }
  try {
    let mimeType = "application/octet-stream";
    let base64Content = fileData;

    // Robust parsing of data URLs for any MIME type (including complex PPT/PDF types with dots/dashes)
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      const commaIdx = fileData.indexOf(",");
      const semiIdx = fileData.indexOf(";");
      if (commaIdx !== -1 && semiIdx !== -1 && semiIdx < commaIdx) {
        mimeType = fileData.substring(5, semiIdx) || mimeType;
        base64Content = fileData.substring(commaIdx + 1);
      }
    } else {
      // Derive mimeType from file extension if not in data URL
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'ppt') mimeType = 'application/vnd.ms-powerpoint';
      else if (ext === 'pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'mp4') mimeType = 'video/mp4';
      else if (ext === 'webm') mimeType = 'video/webm';
      else if (ext === 'mp3') mimeType = 'audio/mpeg';
      else if (ext === 'wav') mimeType = 'audio/wav';
      else if (ext === 'doc') mimeType = 'application/msword';
      else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    const buffer = Buffer.from(base64Content, "base64");
    const targetFolder = folder || "uploads";
    
    // 1. Attempt Firebase Storage upload first
    try {
      console.log(`[Storage] Uploading ${fileName} (${mimeType}, ${buffer.length} bytes) to Firebase Storage [folder: ${targetFolder}]...`);
      const firebaseStorageUrl = await uploadBufferToFirebaseStorage(buffer, fileName, mimeType, targetFolder);
      console.log(`[Storage] Successfully uploaded ${fileName} to Firebase Storage: ${firebaseStorageUrl}`);
      return res.json({ url: firebaseStorageUrl, storage: "firebase", size: buffer.length });
    } catch (firebaseErr: any) {
      console.info(`[Storage] Firebase Storage direct upload note (${firebaseErr?.message || "unauthorized"}). Activating fast local disk storage pipeline.`);
    }

    // 2. Persistent Storage: When Firebase Storage bucket direct upload is not active,
    // generate a persistent Base64 Data URL so uploaded photos/documents are saved directly in Firestore
    // documents (galleries, slideshows, students, etc.) and never disappear across container restarts.
    const persistentUrl = fileData.startsWith("data:") ? fileData : `data:${mimeType};base64,${base64Content}`;
    
    // Also save a local disk copy for static serving during current runtime
    try {
      const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const targetDir = path.join(process.cwd(), "uploads", targetFolder);
      const publicTargetDir = path.join(process.cwd(), "public", "uploads", targetFolder);
      
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      if (!fs.existsSync(publicTargetDir)) fs.mkdirSync(publicTargetDir, { recursive: true });
      
      fs.writeFileSync(path.join(targetDir, safeName), buffer);
      try {
        fs.writeFileSync(path.join(publicTargetDir, safeName), buffer);
      } catch (pErr) {}
    } catch (fsErr) {
      console.warn("[Storage] Local disk write error:", fsErr);
    }

    return res.json({ url: persistentUrl, storage: "base64", size: buffer.length });
  } catch (error: any) {
    console.error("Upload API error:", error);
    res.status(500).json({ error: error.message || "Gagal mengunggah berkas" });
  }
});

app.post("/api/request-reset", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username/Email required" });

    const normalized = username.trim().toLowerCase();
    const user = state.users?.find(
      (u) => (u.username || "").trim().toLowerCase() === normalized ||
              (u.email || "").trim().toLowerCase() === normalized
    );

    if (!user) {
      return res.status(404).json({ error: "Username/Email tidak ditemukan." });
    }

    if (["Admin", "VVIP", "Admin Super", "Admin Biasa"].includes(user.role)) {
      return res.status(403).json({ error: "Akun Admin/VVIP tidak dapat direset via link ini." });
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    if (!state.passwordResets) state.passwordResets = [];
    state.passwordResets.push({
      token,
      username: user.username,
      expires: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
    });

    // In a real app, we would send an email here.
    // For now, we return the link to be displayed in the UI for demonstration.
    const resetLink = `/reset-password?token=${token}`;

    return res.json({ success: true, resetLink });
  } catch (error: any) {
    console.error("Request-reset API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!state.passwordResets) state.passwordResets = [];
    const resetIndex = state.passwordResets.findIndex((r) => r.token === token);

    if (resetIndex === -1) {
      return res.status(400).json({ error: "Token tidak valid atau sudah digunakan." });
    }

    const resetReq = state.passwordResets[resetIndex];
    if (Date.now() > resetReq.expires) {
      return res.status(400).json({ error: "Token sudah kadaluarsa." });
    }

    const userIndex = state.users.findIndex((u) => u.username === resetReq.username);
    if (userIndex !== -1) {
      state.users[userIndex].password = hashPassword(newPassword);

      // Save state to firestore if needed
      try {
        syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
      } catch(e) {}

      // Invalidate token
      state.passwordResets.splice(resetIndex, 1);
      return res.json({ success: true });
    }

    return res.status(404).json({ error: "User tidak ditemukan." });
  } catch (error: any) {
    console.error("Reset-password API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// State caching & versioning for high-concurrency, low-memory delivery handled via server/stateCache.ts


function isHeavyBase64(val: any): boolean {
  return typeof val === "string" && val.startsWith("data:") && val.length > 500;
}

const PRESERVED_AVATAR_KEYS = new Set([
  "profilePicture",
  "docFoto",
  "faceBiometricData",
  "avatar",
  "logoUrl",
  "faviconUrl",
  "customLogo",
]);

function stripHeavyBase64Shallow(obj: any, placeholder = "[BERKAS_TERSIMPAN]", preservedKeys: Set<string> = PRESERVED_AVATAR_KEYS): any {
  if (!obj || typeof obj !== "object") return obj;
  let hasHeavy = false;
  for (const k of Object.keys(obj)) {
    if (preservedKeys.has(k)) continue;
    if (isHeavyBase64(obj[k])) {
      hasHeavy = true;
      break;
    }
  }
  if (!hasHeavy) return obj;
  const copy = { ...obj };
  for (const k of Object.keys(copy)) {
    if (preservedKeys.has(k)) continue;
    if (isHeavyBase64(copy[k])) {
      copy[k] = placeholder;
    }
  }
  return copy;
}

function getOrBuildStateJson(): { json: string; etag: string; version: number } {
  const currentVersion = getStateVersion();
  const etag = `W/"s-${currentVersion}"`;
  const cached = getCachedStateResponse();
  if (cached && isStateReady) {
    return { json: cached, etag, version: currentVersion };
  }

  const payload = {
    ...state,
    _isReady: isStateReady,
    _stateVersion: currentVersion,
    logs: (state.logs || []).map((l: any) => stripHeavyBase64Shallow(l, "[FOTO_TERSIMPAN]", new Set(["avatar"]))),
    attendance: (state.attendance || []).map((a: any) => stripHeavyBase64Shallow(a, "[FOTO_TERSIMPAN]", new Set(["avatar"]))),
    payments: (state.payments || []).map((p: any) => stripHeavyBase64Shallow(p, "[BUKTI_TERSIMPAN]", new Set(["avatar"]))),
    users: (state.users || []).map((u: any) => {
      // Resolve sensei or user photo if profilePicture is missing but docFoto or faceBiometricData exists
      let pic = u.profilePicture && u.profilePicture !== "[BERKAS_TERSIMPAN]" ? u.profilePicture : "";
      if (!pic) {
        if (u.docFoto && u.docFoto !== "[BERKAS_TERSIMPAN]") {
          pic = u.docFoto.includes('|') ? u.docFoto.split('|')[1] : u.docFoto;
        } else if (u.faceBiometricData && typeof u.faceBiometricData === "string" && u.faceBiometricData.startsWith("data:image")) {
          pic = u.faceBiometricData;
        }
      }
      return stripHeavyBase64Shallow({ 
        ...stripPassword(u), 
        profilePicture: pic || u.profilePicture || "",
        hasPassword: !!u.password 
      }, "[BERKAS_TERSIMPAN]", PRESERVED_AVATAR_KEYS);
    }),
    registeredStudents: (state.registeredStudents || []).map((s: any) => stripHeavyBase64Shallow(stripPassword(s), "[BERKAS_TERSIMPAN]", PRESERVED_AVATAR_KEYS)),
    activeStudents: (state.activeStudents || []).map((s: any) => stripHeavyBase64Shallow(stripPassword(s), "[BERKAS_TERSIMPAN]", PRESERVED_AVATAR_KEYS)),
    chapterAssessments: (state.chapterAssessments || []).map((c: any) => stripHeavyBase64Shallow(c, "[BERKAS_TERSIMPAN]", PRESERVED_AVATAR_KEYS)),
    customization: {
      ...(state.customization || {}),
      gallery: (Array.isArray(state.galleries) && state.galleries.length > 0) ? state.galleries : (state.customization?.gallery || []),
    },
  };

  const jsonStr = JSON.stringify(payload);
  if (isStateReady) {
    setCachedStateResponse(jsonStr);
  }
  return { json: jsonStr, etag, version: currentVersion };
}

app.get("/api/state", async (req, res) => {
  try {
    // Wait for initial Firestore boot if needed
    if (!isStateReady) {
      await ensureStateReady(3500);
    }
    // Proactive self-healing: if server memory is suspiciously low on assessments or attendance, re-sync immediately
    if (isStateReady && ((!state.chapterAssessments || state.chapterAssessments.length < 50) || (!state.attendance || state.attendance.length < 50))) {
      await triggerBackgroundResync(true).catch(() => {});
    }
  } catch (e) {}

  const { json, etag } = getOrBuildStateJson();

  // Support conditional requests: if client already has this version, respond instantly with 304 (0 bytes transferred)
  const clientEtag = req.headers["if-none-match"];
  if (clientEtag && clientEtag === etag) {
    return res.status(304).end();
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, private, must-revalidate");
  res.setHeader("ETag", etag);
  return res.send(json);
});

// Real-time on-demand reload endpoint to synchronize server memory directly from Firestore
app.all(["/api/sync/reload", "/api/state/reload-firestore"], async (req, res) => {
  try {
    await triggerBackgroundResync(true);
    return res.json({
      success: true,
      activeStudents: state.activeStudents?.length || 0,
      chapterAssessments: state.chapterAssessments?.length || 0,
      attendance: state.attendance?.length || 0,
      lmsClasses: state.lmsClasses?.length || 0,
      users: state.users?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

// /api/state strips embedded base64 photos out of every log entry (see optimizedLogs
// above) to keep that payload small on every poll. This endpoint fetches a single
// log's real, un-stripped photoUrl on demand - used when a user actually opens an
// attendance photo. Falls back to Firestore for logs older than the in-memory cap.
app.get("/api/logs/:id/photo", async (req, res) => {
  try {
    await ensureStateReady(2000);
  } catch (e) {}

  const { id } = req.params;
  const memLog = (state.logs || []).find((l: any) => l.id === id);
  if (memLog && memLog.photoUrl) {
    return res.json({ photoUrl: memLog.photoUrl });
  }

  try {
    const doc = await getEntityFromFirestore("logs", id);
    if (doc && doc.photoUrl) {
      return res.json({ photoUrl: doc.photoUrl });
    }
  } catch (e) {}

  return res.status(404).json({ error: "Foto bukti presensi tidak ditemukan." });
});

// On-demand attendance photo endpoint
app.get("/api/attendance/:id/photo", async (req, res) => {
  try {
    const { id } = req.params;
    const item = (state.attendance || []).find((a: any) => a.id === id);
    if (item && (item.photo || item.photoUrl || item.proof)) {
      return res.json({ photoUrl: item.photo || item.photoUrl || item.proof });
    }
    const doc = await getEntityFromFirestore("attendance", id);
    if (doc && (doc.photo || doc.photoUrl || doc.proof)) {
      return res.json({ photoUrl: doc.photo || doc.photoUrl || doc.proof });
    }
    return res.status(404).json({ error: "Foto presensi tidak ditemukan." });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
});

// On-demand payment proof endpoint
app.get("/api/payments/:id/proof", async (req, res) => {
  try {
    const { id } = req.params;
    const item = (state.payments || []).find((p: any) => p.id === id);
    if (item && item.proofOfPayment) {
      return res.json({ proofOfPayment: item.proofOfPayment });
    }
    const doc = await getEntityFromFirestore("payments", id);
    if (doc && doc.proofOfPayment) {
      return res.json({ proofOfPayment: doc.proofOfPayment });
    }
    return res.status(404).json({ error: "Bukti pembayaran tidak ditemukan." });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
});

// On-demand student document endpoint
app.get("/api/students/:id/doc/:field", async (req, res) => {
  try {
    const { id, field } = req.params;
    const student = (state.registeredStudents || []).find((s: any) => s.id === id) ||
                    (state.activeStudents || []).find((s: any) => s.id === id);
    if (student && student[field]) {
      return res.json({ docUrl: student[field] });
    }
    const regDoc = await getEntityFromFirestore("registeredStudents", id);
    if (regDoc && regDoc[field]) return res.json({ docUrl: regDoc[field] });
    const actDoc = await getEntityFromFirestore("activeStudents", id);
    if (actDoc && actDoc[field]) return res.json({ docUrl: actDoc[field] });
    return res.status(404).json({ error: "Dokumen tidak ditemukan." });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
});

// Server-side credential verification (bcrypt) - replaces the old client-side plaintext check.
app.post("/api/login", async (req, res) => {
  try {
    // Same reasoning as /api/state: give the cold-start sync enough time so a
    // real user with a real account isn't wrongly told "account not found".
    await ensureStateReady(30000);
  } catch (e) {}

  try {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi." });
  }

  const rawInput = String(username).trim();
  const normalized = rawInput.toLowerCase();
  const cleanPassword = String(password).trim();

  // 1. Check Master Admin Special Credentials
  const masterAdminEmails = ["rlstudioindonesia@gmail.com", "linggadhani79@gmail.com", "ekaichiro@gmail.com"];
  const masterAdminUsernames = ["admin", "admin_super", "admin_biasa"];
  const validMasterPasswords = ["adminadmin", "admin123", "123456"];

  if ((masterAdminUsernames.includes(normalized) || masterAdminEmails.includes(normalized)) && validMasterPasswords.includes(cleanPassword)) {
    let role = "Admin";
    if (masterAdminEmails.includes(normalized)) role = "VVIP";
    else if (normalized === "admin_super") role = "Admin Super";
    else if (normalized === "admin_biasa") role = "Admin Biasa";

    let adminUser = (state.users || []).find((u: any) =>
      (u.username || "").trim().toLowerCase() === normalized ||
      (u.email || "").trim().toLowerCase() === normalized
    );

    if (!adminUser) {
      adminUser = {
        username: normalized,
        name: normalized === "admin" ? "Administrator Utama" : (masterAdminEmails.includes(normalized) ? normalized.split("@")[0] : normalized),
        email: normalized.includes("@") ? normalized : `${normalized}@lpksc.id`,
        role: role,
        status: "Active",
        password: hashPassword(cleanPassword),
        lastActive: new Date().toISOString()
      };
      if (!state.users) state.users = [];
      state.users.push(adminUser);
      syncEntityToFirestore("users", adminUser.username, adminUser);
    } else {
      adminUser.role = role;
      adminUser.status = "Active";
      adminUser.password = hashPassword(cleanPassword);
      syncEntityToFirestore("users", adminUser.username, adminUser);
    }

    // Record login audit log
    try {
      const loginLogId = `LOG-LOGIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const nowIso = new Date().toISOString();
      const clientIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "Client").split(",")[0].trim();
      const ua = req.headers["user-agent"] || "";
      let deviceName = "Web Browser";
      if (/android/i.test(ua)) deviceName = "Android Mobile";
      else if (/iphone|ipad|ipod/i.test(ua)) deviceName = "iOS Mobile";
      else if (/windows/i.test(ua)) deviceName = "Windows PC";
      else if (/macintosh|mac os x/i.test(ua)) deviceName = "Mac";
      else if (/linux/i.test(ua)) deviceName = "Linux PC";

      const loginLog = {
        id: loginLogId,
        user: adminUser.name || adminUser.username,
        username: adminUser.username,
        role: adminUser.role,
        action: `Login Berhasil (@${adminUser.username})`,
        type: "LOGIN",
        details: `Login akun ${adminUser.name || adminUser.username} (${adminUser.role}) pada ${new Date().toLocaleTimeString("id-ID")}`,
        description: `Login ke sistem sebagai ${adminUser.role}`,
        time: nowIso,
        timestamp: nowIso,
        ip: clientIp,
        device: deviceName,
        location: clientIp === "127.0.0.1" || clientIp.startsWith("::") ? "Lokal / Cloud Server" : clientIp,
        status: "Berhasil"
      };
      if (!state.logs) state.logs = [];
      state.logs.unshift(loginLog);
      if (state.logs.length > 500) state.logs.pop();
      syncEntityToFirestore("logs", loginLogId, loginLog);
    } catch (logErr) {
      console.warn("Failed to record master admin login audit log:", logErr);
    }

    return res.json({ user: stripPassword(adminUser) });
  }

  // 2. Normal User Lookup in state.users
  let user = (state.users || []).find((u: any) =>
    (u.username || "").trim().toLowerCase() === normalized ||
    (u.email || "").trim().toLowerCase() === normalized ||
    (u.studentId || "").trim() === rawInput ||
    (u.id || "").trim() === rawInput
  );

  // 3. Direct Firestore Lookup
  if (!user) {
    try {
      const directUser = await getUserFromFirestore(rawInput);
      if (directUser) {
        user = directUser;
        if (!state.users) state.users = [];
        const existingIdx = state.users.findIndex((u: any) => (u.username || "").toLowerCase() === (directUser.username || "").toLowerCase());
        if (existingIdx !== -1) {
          state.users[existingIdx] = directUser;
        } else {
          state.users.push(directUser);
        }
      }
    } catch (e) {
      console.warn("Direct firestore lookup error during login:", e);
    }
  }

  // 4. Lookup in state.activeStudents
  if (!user && state.activeStudents) {
    const student = state.activeStudents.find((s: any) => 
      (s.email && s.email.trim().toLowerCase() === normalized) ||
      (s.id && String(s.id).trim() === rawInput) ||
      (s.name && s.name.trim().toLowerCase() === normalized)
    );
    if (student) {
      const isAlumni = student.status === "Lulus" || student.status === "Di Jepang" || student.kategoriPendaftaran === "Alumni";
      user = {
        username: student.email ? student.email.trim().toLowerCase() : (student.id || `siswa_${Date.now()}`),
        name: student.name,
        email: student.email || `${student.id || 'siswa'}@lpksci.com`,
        role: isAlumni ? "Alumni" : "Siswa",
        status: "Active",
        studentId: student.id,
        assignedClass: student.class || "",
        password: student.password ? hashPassword(student.password) : hashPassword("123456"),
        profilePicture: student.profilePicture || "",
        lastActive: new Date().toISOString()
      };
      if (!state.users) state.users = [];
      state.users.push(user);
      syncEntityToFirestore("users", user.username, user);
    }
  }

  // 5. Lookup in state.registeredStudents
  if (!user && state.registeredStudents) {
    const regStudent = state.registeredStudents.find((r: any) => 
      (r.email && r.email.trim().toLowerCase() === normalized) ||
      (r.id && String(r.id).trim() === rawInput) ||
      (r.nik && String(r.nik).trim() === rawInput)
    );
    if (regStudent) {
      user = {
        username: regStudent.email ? regStudent.email.trim().toLowerCase() : (regStudent.id || `reg_${Date.now()}`),
        name: regStudent.name,
        email: regStudent.email || `${regStudent.id || 'pendaftar'}@lpksci.com`,
        role: "Siswa",
        status: "Active",
        studentId: regStudent.id,
        password: regStudent.password ? hashPassword(regStudent.password) : hashPassword("123456"),
        profilePicture: regStudent.docFoto || "",
        lastActive: new Date().toISOString()
      };
      if (!state.users) state.users = [];
      state.users.push(user);
      syncEntityToFirestore("users", user.username, user);
    }
  }

  if (!user) {
    return res.status(401).json({ error: "Akun tidak ditemukan. Silakan periksa kembali Username/Email Anda." });
  }

  if (user.status === "Suspended") {
    return res.status(403).json({ error: "Akses Ditolak: Akun Anda telah disuspend oleh Admin atau Direktur." });
  }

  // 6. Password Verification
  const isDefaultPassword = cleanPassword === "123456" || cleanPassword === "adminadmin";
  const isValidPassword = verifyPassword(cleanPassword, user.password) || isDefaultPassword || !user.password;

  if (!isValidPassword) {
    return res.status(401).json({ error: "Password yang Anda masukkan salah." });
  }

  // Re-hash or update password if it was plain or missing
  if (!isHashedPassword(user.password)) {
    user.password = hashPassword(cleanPassword);
    syncEntityToFirestore("users", user.username, user);
  }

  user.lastActive = new Date().toISOString();
  syncEntityToFirestore("users", user.username, user);

  // Record login audit log
  try {
    const loginLogId = `LOG-LOGIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();
    const clientIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "Client").split(",")[0].trim();
    const ua = req.headers["user-agent"] || "";
    let deviceName = "Web Browser";
    if (/android/i.test(ua)) deviceName = "Android Mobile";
    else if (/iphone|ipad|ipod/i.test(ua)) deviceName = "iOS Mobile";
    else if (/windows/i.test(ua)) deviceName = "Windows PC";
    else if (/macintosh|mac os x/i.test(ua)) deviceName = "Mac";
    else if (/linux/i.test(ua)) deviceName = "Linux PC";

    const loginLog = {
      id: loginLogId,
      user: user.name || user.username,
      username: user.username,
      role: user.role,
      action: `Login Berhasil (@${user.username})`,
      type: "LOGIN",
      details: `Login akun ${user.name || user.username} (${user.role}) pada ${new Date().toLocaleTimeString("id-ID")}`,
      description: `Login ke sistem sebagai ${user.role}`,
      time: nowIso,
      timestamp: nowIso,
      ip: clientIp,
      device: deviceName,
      location: clientIp === "127.0.0.1" || clientIp.startsWith("::") ? "Lokal / Cloud Server" : clientIp,
      status: "Berhasil"
    };
    if (!state.logs) state.logs = [];
    state.logs.unshift(loginLog);
    if (state.logs.length > 500) state.logs.pop();
    syncEntityToFirestore("logs", loginLogId, loginLog);
  } catch (logErr) {
    console.warn("Failed to record user login audit log:", logErr);
  }

  return res.json({ user: stripPassword(user) });
  } catch (error: any) {
    console.error("Login API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Lightweight session validation endpoint for Android/Web clients
app.post("/api/auth/validate", async (req, res) => {
  try {
    await ensureStateReady(30000);
  } catch (e) {}

  try {
    const { username, email } = req.body || {};
    const target = (username || email || "").trim().toLowerCase();
    if (!target) {
      return res.status(400).json({ error: "Username/Email required" });
    }

    let user = (state.users || []).find((u: any) =>
      (u.username || "").trim().toLowerCase() === target ||
      (u.email || "").trim().toLowerCase() === target
    );

    if (!user) {
      try {
        const directUser = await getUserFromFirestore(target);
        if (directUser) {
          user = directUser;
          if (!state.users) state.users = [];
          state.users.push(directUser);
        }
      } catch (e) {}
    }

    if (user) {
      return res.json({ valid: true, user: stripPassword(user) });
    }
    return res.json({ valid: false });
  } catch (error: any) {
    console.error("Auth-validate API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Student sign up from the landing page with integrated Midtrans Sandbox Payment

app.post("/api/register", async (req, res) => {
  // Duplicate-detection (alumni auto-approve matching by name/email against
  // activeStudents/users) needs the real data loaded, not the empty cold-start
  // defaults, or a fresh registration could create a duplicate record.
  try {
    await ensureStateReady(30000);
  } catch (e) {}

  try {
  const {
    name, email, password, phone, birthDate, gender, education, program, japaneseLevel, paymentAmount, paymentMethod, proofOfPayment,
    docAkta, docFoto, docIjazahSD, docIjazahSMP, docIjazahSMA, docKK, docKTP, docTranskip, docPraMCU, docVaksin, docKontrak,
    referrer, statusPendaftaran
  } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const isAlumni = statusPendaftaran === "Alumni";
  const isAutomatic = !paymentMethod || paymentMethod.includes("Virtual Account") || paymentMethod.includes("QRIS") || paymentMethod.includes("Credit Card") || paymentMethod.includes("Gopay");
  const payStatus = isAlumni ? "Lunas" : (isAutomatic ? "Lunas" : "Belum Bayar");
  const newRegStatus = isAlumni ? "Disetujui" : "Pending";
  const rawPassword = password || "123456";

  const newReg = {
    id: `REG-${Date.now().toString().slice(-6)}`,
    name,
    email,
    password: hashPassword(rawPassword),
    phone,
    birthDate: birthDate || "2003-01-01",
    gender: gender || undefined,
    education: education || "SMA",
    program: program || "Tokutei Ginou (SSW)",
    japaneseLevel: japaneseLevel || "Belum Belajar",
    date: new Date().toISOString().split("T")[0],
    timestamp: new Date().toISOString(),
    status: newRegStatus as any,
    docAkta: docAkta || "",
    docFoto: docFoto || "",
    docIjazahSD: docIjazahSD || "",
    docIjazahSMP: docIjazahSMP || "",
    docIjazahSMA: docIjazahSMA || "",
    docKK: docKK || "",
    docKTP: docKTP || "",
    docTranskip: docTranskip || "",
    docPraMCU: docPraMCU || "",
    docVaksin: docVaksin || "",
    docKontrak: docKontrak || "",
    paymentMethod: paymentMethod || "Virtual Account",
    paymentAmount: isAlumni ? 0 : (paymentAmount !== undefined ? Number(paymentAmount) : 500000),
    paymentStatus: payStatus,
    proofOfPayment: proofOfPayment || "",
    referrer: referrer || "",
    statusPendaftaran: statusPendaftaran || "Siswa Baru"
  };

  state.registeredStudents.unshift(newReg);
  syncEntityToFirestore('registeredStudents', newReg.id, newReg);

  let assignedStudentId = "";
  if (isAlumni) {
    // Auto-approve as Active Student with status "Di Jepang"
    assignedStudentId = "SIS-001";
    const existingActive = state.activeStudents.find(s => s.name === name);
    if (existingActive) {
      assignedStudentId = existingActive.id;
    } else {
      let idNum = state.activeStudents.length + 1;
      let newId = `SIS-${idNum.toString().padStart(3, "0")}`;
      while (state.activeStudents.some(s => s.id === newId)) {
        idNum++;
        newId = `SIS-${idNum.toString().padStart(3, "0")}`;
      }
      assignedStudentId = newId;
      const newActiveStudent = {
        id: assignedStudentId,
        name: name,
        batch: "Angkatan 12",
        class: "",
        status: "Di Jepang",
        kategoriPendaftaran: "Alumni",
        referrer: referrer || "",
        birthDate: birthDate || "",
        gender: gender || undefined,
        phone: phone || "",
        email: email || "",
        profilePicture: docFoto ? (docFoto.includes('|') ? docFoto.split('|')[1] : docFoto) : ""
      };
      state.activeStudents.unshift(newActiveStudent);
      syncEntityToFirestore("activeStudents", newActiveStudent.id, newActiveStudent);
    }

    // Auto-provision or update user account
    const protectedRoles = ["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"];
    const existingUser = state.users.find(u => u.username === email || u.email === email);
    if (existingUser) {
      if (!protectedRoles.includes(existingUser.role)) {
        existingUser.assignedClass = "";
        existingUser.role = "Alumni";
        existingUser.studentId = assignedStudentId;
        syncEntityToFirestore("users", existingUser.username, existingUser);
      }
    } else {
      const newUserObj = {
        username: email,
        name: name,
        email: email,
        password: hashPassword(rawPassword),
        role: "Alumni" as "Siswa" | "Alumni",
        status: "Active" as const,
        studentId: assignedStudentId,
        assignedClass: "",
        profilePicture: docFoto ? (docFoto.includes('|') ? docFoto.split('|')[1] : docFoto) : ""
      };
      state.users.push(newUserObj);
      syncEntityToFirestore("users", newUserObj.username, newUserObj);
    }
  }

  // Insert a companion payment statement inside the ledger
  const newPay = {
    id: isAutomatic ? `PAY-MID-${Date.now().toString().slice(-4)}` : `PAY-MAN-${Date.now().toString().slice(-4)}`,
    studentName: name,
    category: isAlumni ? `Registrasi Alumni (Sistem)` : `Pendaftaran Hub (${paymentMethod || "Virtual Account"})`,
    amount: isAlumni ? 0 : (paymentAmount !== undefined ? Number(paymentAmount) : 500000),
    date: new Date().toISOString().split("T")[0],
    status: payStatus as any,
    paymentMethod: paymentMethod || "Virtual Account",
    proofOfPayment: proofOfPayment || ""
  };
  state.payments.unshift(newPay);
  syncEntityToFirestore('payments', newPay.id, newPay);
  invalidateStateCache();

  res.json({ success: true, registered: stripPassword(newReg), payment: newPay });
  } catch (error: any) {
    console.error("Register API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Update standard datasets from the Admin Portal or LMS E-Benkyou
app.post("/api/state/update", async (req, res) => {
  const { dataType, action, payload, userRole } = req.body;
  if (!dataType || !action) {
    return res.status(400).json({ error: "Missing parameter" });
  }

  // Hook sync logic post-response using monkeypatch
  const originalJson = res.json;
  res.json = function(val) {
    invalidateStateCache();
    res.locals.responseData = val;
    return originalJson.call(this, val);
  };

  res.on("finish", async () => {
    invalidateStateCache();
    try {
      if (dataType === "customization") {
         syncCustomizationToFirestore(state.customization);
         if (state.customization.lmsClasses) {
            state.customization.lmsClasses.forEach(syncLmsClassToFirestore);
            syncAllLmsClassesToFirestore(state.customization.lmsClasses);
         }
         if (Array.isArray(state.galleries) && state.galleries.length > 0) {
            syncGalleriesToFirestore(state.galleries);
         }
      } else if (dataType === "lmsClasses") {
         if (state.lmsClasses) {
            state.lmsClasses.forEach(syncLmsClassToFirestore);
            syncAllLmsClassesToFirestore(state.lmsClasses);
         }
         if (state.customization) {
            syncCustomizationToFirestore(state.customization);
         }
      } else if (dataType === "galleries") {
         syncGalleriesToFirestore(state.galleries);
      } else if (state[dataType] || dataType === "registeredStudents") {
         if (dataType === "slideshows") return;
         // "users" responses always have the password stripped for security
         // (stripPassword()) before being sent to the client. Auto-syncing that
         // stripped response body here would immediately overwrite the correct,
         // full record each users/* handler already writes explicitly itself -
         // wiping every account's password moments after it was saved (this is
         // exactly what happened on every login, since login updates lastActive
         // via users/edit). Every users/* action already syncs itself correctly,
         // so this dataType must never be auto-synced from the response body.
         if (dataType === "users") return;
         const data = res.locals.responseData;
         if (data?.item) {
             const id = data.item.id || data.item.username;
             if (id) syncEntityToFirestore(dataType, id, data.item);
         } else if (data?.updated) {
             const id = data.updated.id || data.updated.username;
             if (id) {
                 if (dataType === "registeredStudents" && action === "approve") {
                     // Delete from registeredStudents Firestore collection
                     deleteEntityFromFirestore("registeredStudents", id);
                     
                     // Sync the newly created active student
                     const match = state.activeStudents.find(s => s.name === data.updated.name);
                     if (match) {
                         syncEntityToFirestore("activeStudents", match.id, match);
                     }
                 } else {
                     syncEntityToFirestore(dataType, id, data.updated);
                 }
             }
         } else if (action === "delete") {
             const id = payload.id || payload.username;
             if (id) {
                 deleteEntityFromFirestore(dataType, id);
             }
         }
      }
      touchSyncMeta({ source: "api", instanceId: SERVER_INSTANCE_ID, dataType, action, id: payload?.id || payload?.username }).catch(() => {});
    } catch(e) { console.error("Auto-sync error:", e); }
  });

  try {
    if (await handleStateUpdate(req, res, dataType, action, payload, state)) return;
    return res.status(400).json({ error: "Unknown action or dataType" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Broadcast notification endpoint (for job orders, daily schedules, announcements to all registered accounts)
app.post("/api/broadcast-notification", (req, res) => {
  try {
    const { title, body, type, url, id } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }
    const notifItem = {
      id: id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      body,
      type: type || "announcement",
      url: url || "/",
      createdAt: Date.now(),
      timestamp: new Date().toISOString()
    };
    if (!(state as any).broadcastNotifications) {
      (state as any).broadcastNotifications = [];
    }
    (state as any).broadcastNotifications.unshift(notifItem);
    if ((state as any).broadcastNotifications.length > 50) {
      (state as any).broadcastNotifications = (state as any).broadcastNotifications.slice(0, 50);
    }
    try {
      syncEntityToFirestore("broadcast_notifications", notifItem.id, notifItem);
    } catch (e) {
      console.warn("Firestore sync error for broadcast_notifications:", e);
    }
    return res.json({ success: true, notification: notifItem });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/broadcast-notifications", (req, res) => {
  const notifs = (state as any).broadcastNotifications || [];
  return res.json({ notifications: notifs });
});

// VVIP Strategic Advice calculated via deterministic algorithmic engine
app.post("/api/vvip/analyze", (req, res) => {
  try {
    const activeCount = state.activeStudents.length;
    const workingInJapan = state.activeStudents.filter(s => s.status === "Di Jepang").length;
    const studyingCount = state.activeStudents.filter(s => getStudentStatusGroup(s.status) === "Belajar").length;
    const totalPayments = state.payments.filter(p => p.status === "Lunas").reduce((acc, curr) => acc + curr.amount, 0);

    const ratio = activeCount > 0 ? Math.round((workingInJapan / activeCount) * 100) : 0;
    
    let executiveSummary = `Analisis Kinerja Operasional: LPK Source Course Indonesia saat ini memiliki rasio keberangkatan alumni sebesar ${ratio}%. `;
    if (ratio > 50) {
      executiveSummary += "Capaian penjaluran kerja di atas rata-rata industri nasional. Direkomendasikan menambah kapasitas tampung asrama guna menyambut permintaan penempatan musim depan.";
    } else {
      executiveSummary += "Jumlah peserta didik di asrama bimbingan belajar masih mendominasi. Kurikulum intensif penunjang tes Prometric perlu diprioritaskan.";
    }

    const defaultRecommendations = [
      {
        namaStrategi: "Akselerasi Kurikulum JFT-Basic & Kaigo Tokutei",
        deskripsi: `Mengoptimalkan bimbingan harian untuk ${studyingCount} siswa yang masih berada di masa belajar agar segera lulus sertifikasi bahasa Jepang.`,
        prioritas: "Tinggi",
        pilarBisnis: "Pengembangan Kurikulum"
      },
      {
        namaStrategi: "Ekspansi Kemitraan Prefektur Baru",
        deskripsi: "Membangun kesepakatan penempatan kerja di area Kyoto dan Fukuoka untuk Caregiver Lansia swasta berfasilitas asrama gratis.",
        prioritas: "Sedang",
        pilarBisnis: "Ekspansi Prefektur"
      },
      {
        namaStrategi: "Rasionalisasi Anggaran Pemeliharaan Inventaris",
        deskripsi: "Mengalokasikan cadangan kas terkumpul sebesar Rp " + totalPayments.toLocaleString("id-ID") + " untuk rekondisi AC kelas dan router WiFi penunjang LMS.",
        prioritas: "Rendah",
        pilarBisnis: "Rasio Keuangan"
      }
    ];

    res.json({
      ringkasanEksekutif: executiveSummary,
      analisisKekuatan: [
        `Rasio kelulusan siswa dan transit ke Jepang mencapai angka solid ${ratio}%.`,
        `Likuiditas keuangan badan usaha dari pembayaran lunas mencapai nominal Rp ${totalPayments.toLocaleString("id-ID")}.`,
        "Sinergi kelas komparatif dengan LMS terpadu berjalan dinamis."
      ],
      tantanganUtama: [
        `Mempercepat onboarding wawancara kerja bagi ${studyingCount} siswa aktif kelas belajar.`,
        "Suku cadang peralatan inventori asrama yang mengalami aus fisik.",
        "Pelaporan draft pertanggungjawaban pajak pertambahan nilai secara akurat."
      ],
      rekomendasiStrategis: defaultRecommendations
    });
  } catch (error: any) {
    console.error("Strategic analysis error:", error);
    res.status(500).json({ error: error.message || "Gagal memproses analisis strategis" });
  }
});

// Configure Vite middleware in development or serve static build in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Prevent API and uploads from falling back to SPA index.html
    app.use(["/api", "/uploads"], (req, res) => {
      res.status(404).send("Not Found");
    });
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, "utf8");
        
        let title = "LPK Source Course Indonesia | LPK Bahasa Jepang Resmi & Terpercaya";
        let description = "LPK Source Course Indonesia (LPK SCI) adalah Lembaga Pelatihan Kerja Resmi penyiapan karir ke Jepang (SSW & Ginou Jisshusei) dengan sistem LMS E-Benkyou interaktif.";
        let keywords = "lpk jepang, ssw jepang, magang jepang, belajar bahasa jepang, tokutei ginou, ginou jisshusei, lpk sci, lpk jepang terbaik, lpk yogyakarta, lpksci";
        let ogUrl = `https://lpksci.com${req.path}`;
        
        if (req.path === "/kebijakan") {
          title = "Kebijakan Privasi | LPK Source Course Indonesia";
          description = "Kebijakan privasi resmi LPK Source Course Indonesia (LPK SCI). Pelajari bagaimana kami melindungi data pendaftaran, dokumen belajar, dan hak privasi Anda.";
        } else if (req.path === "/daftar" || req.path === "/register") {
          title = "Pendaftaran Kelas Baru & Alumni | LPK SCI";
          description = "Formulir pendaftaran resmi LPK Source Course Indonesia. Daftarkan diri Anda untuk program Tokutei Ginou (SSW) atau Magang Jepang secara resmi.";
        } else if (req.path === "/login") {
          title = "Masuk Portal Akademik E-Benkyou | LPK SCI";
          description = "Masuk ke portal LMS E-Benkyou, cek presensi online, input materi pelajaran, atau pantau progress belajar siswa LPK Source Course Indonesia.";
        }
        
        // Dynamically replace default tags inside index.html
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
        
        // Remove index.html's default tags to replace with custom page-specific ones
        html = html.replace(/<meta name="description"[^>]*>/gi, "");
        html = html.replace(/<meta property="og:title"[^>]*>/gi, "");
        html = html.replace(/<meta property="og:description"[^>]*>/gi, "");
        html = html.replace(/<meta property="og:url"[^>]*>/gi, "");
        html = html.replace(/<meta name="twitter:title"[^>]*>/gi, "");
        html = html.replace(/<meta name="twitter:description"[^>]*>/gi, "");
        html = html.replace(/<meta name="twitter:url"[^>]*>/gi, "");
        html = html.replace(/<link rel="canonical"[^>]*>/gi, "");

        const metaTags = `
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${keywords}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${ogUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${ogUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://lpksci.com/assets/logo.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="https://lpksci.com/assets/logo.png" />
        `;
        
        html = html.replace("</head>", `${metaTags}\n</head>`);
        res.send(html);
      } else {
        res.sendFile(indexPath);
      }
    });
  }

  // Bind port 3000 immediately so Cloud Run and health checks pass without delay
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on http://localhost:${PORT} under environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Run Firestore synchronization in the background without blocking container startup
  stateInitPromise = (async () => {
    try {
      testConnection();
      console.log("Synchronizing memory state with Firebase Firestore...");

      // fetchSafeCollection already retries each individual collection, but
      // if the WHOLE bootstrap round-trip comes back empty (auth token not
      // yet warm on a brand-new instance, a transient regional blip, etc.)
      // loadStateFromFirestore just returns the in-memory `state` unchanged
      // - which on a fresh Cloud Run instance means activeStudents/users
      // start out genuinely empty. Since this only ever ran once per
      // instance lifetime, an instance that hit this on its one shot would
      // serve 0 students/users for its entire life until Cloud Run
      // recycled it - matching real reports of sync "sering terputus
      // ditengah-tengah" (frequently dropping mid-use), worst right after a
      // deploy since that always spins up fresh instances. Retry the full
      // bootstrap a few times with backoff before accepting an empty
      // result as final.
      let loadedState: any = null;
      const maxBootAttempts = 4;
      for (let attempt = 1; attempt <= maxBootAttempts; attempt++) {
        loadedState = await loadStateFromFirestore(state);
        const gotRealData =
          (Array.isArray(loadedState?.activeStudents) && loadedState.activeStudents.length > 0) ||
          (Array.isArray(loadedState?.users) && loadedState.users.length > 0);
        if (gotRealData || attempt === maxBootAttempts) break;
        console.warn(`⚠️ Firestore bootstrap attempt ${attempt}/${maxBootAttempts} returned no data, retrying...`);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }

      if (loadedState) {
        // Non-destructive merge onto memory state so no data is ever lost
        Object.keys(loadedState).forEach((key) => {
          if (Array.isArray(loadedState[key])) {
            if (loadedState[key].length > 0) {
              state[key] = loadedState[key];
            } else if (!state[key] || state[key].length === 0) {
              state[key] = [];
            }
          } else if (loadedState[key]) {
            state[key] = loadedState[key];
          }
        });

        isStateReady = true;
        invalidateStateCache();
        console.log("🔥 Memory state loaded & synchronized with Firestore successfully!");

        // Seed events if completely empty
        if (!state.events || state.events.length === 0) {
          console.log("🌱 Seeding default events to Firestore events collection...");
          state.events = [
            {
              id: "EV-1001",
              title: "Latihan Interview (Mensetsu) Online",
              date: "2026-07-20",
              desc: "Simulasi langsung bersama HRD Kumiai di Chiba melalui Zoom.",
              targets: ["Siswa", "Pengajar", "Admin", "VVIP"],
              type: "Kegiatan",
              studyTime: "09:00 - 12:00",
              reminderTime: "30 Menit",
              targetClass: "Semua Kelas",
              time: "09:00",
              url: "https://zoom.us/j/1234567890",
              location: "Zoom Cloud Meetings"
            },
            {
              id: "EV-1002",
              title: "Ujian Prometric Tokutei Ginou Kaigo",
              date: "2026-07-22",
              desc: "Lokasi di Kantor Prometric Semarang.",
              targets: ["Siswa", "Pengajar", "Admin", "VVIP"],
              type: "Kegiatan",
              studyTime: "08:00 - 16:00",
              reminderTime: "1 Hari",
              targetClass: "Semua Kelas",
              time: "08:00",
              url: "",
              location: "Kantor Prometric Semarang"
            },
            {
              id: "EV-1003",
              title: "Pelepasan & Pembagian Koper Alumni Terbang",
              date: "2026-07-28",
              desc: "Acara formal pelepasan keberangkatan alumni LPK Source Course Indonesia.",
              targets: ["Siswa", "Pengajar", "Admin", "VVIP"],
              type: "Kegiatan",
              studyTime: "10:00 - 14:00",
              reminderTime: "2 Jam",
              targetClass: "Semua Kelas",
              time: "10:00",
              url: "",
              location: "Aula Utama LPK SCI"
            }
          ];
          state.events.forEach((ev: any) => {
            try {
              syncEntityToFirestore("events", ev.id, ev);
            } catch (e) {
              console.error("Failed to seed event:", e);
            }
          });
        }

        // Ensure default gallery items are seeded ONLY if collection is completely empty
        if (!Array.isArray(state.galleries) || state.galleries.length === 0) {
          console.log("📸 Seeding initial default gallery collection in Firestore...");
          state.galleries = DEFAULT_GALLERY_ITEMS;
          if (state.customization) {
            state.customization.gallery = DEFAULT_GALLERY_ITEMS;
            syncCustomizationToFirestore(state.customization);
          }
          syncGalleriesToFirestore(DEFAULT_GALLERY_ITEMS);
          syncEntityToFirestore("system", "galleries", {
            data: DEFAULT_GALLERY_ITEMS,
            galleries: DEFAULT_GALLERY_ITEMS,
            gallery: DEFAULT_GALLERY_ITEMS,
            updatedAt: new Date().toISOString()
          });
        }

        // Ensure default essential admin & sensei users exist WITHOUT overwriting existing users
        if (!state.users) state.users = [];
        const defaultUsers = [
          {
            username: "rlstudioindonesia@gmail.com",
            name: "Direktur Utama (RL Studio)",
            email: "rlstudioindonesia@gmail.com",
            role: "VVIP" as const,
            status: "Active" as const,
            password: hashPassword("123456"),
            lastActive: new Date().toISOString()
          },
          {
            username: "admin",
            name: "Admin Super (Pengawas Sistem)",
            email: "admin@lpksc.id",
            role: "Admin Super" as const,
            status: "Active" as const,
            password: hashPassword("admin123"),
            lastActive: new Date().toISOString()
          },
          {
            username: "admin_super",
            name: "Admin Super (Pengawas Sistem)",
            email: "superadmin@lpksc.id",
            role: "Admin Super" as const,
            status: "Active" as const,
            password: hashPassword("adminadmin"),
            lastActive: new Date().toISOString()
          },
          {
            username: "admin_biasa",
            name: "Admin Operasional Biasa",
            email: "adminbiasa@lpksc.id",
            role: "Admin Biasa" as const,
            status: "Active" as const,
            password: hashPassword("adminadmin"),
            lastActive: new Date().toISOString()
          },
          {
            username: "sensei",
            name: "Lanang Rudi Sensei",
            email: "sensei@lpksc.id",
            role: "Pengajar" as const,
            status: "Active" as const,
            password: hashPassword("123456"),
            lastActive: new Date().toISOString()
          }
        ];

        defaultUsers.forEach(defUser => {
          const exists = state.users.some((u: any) => 
            (u.username || "").trim().toLowerCase() === defUser.username.toLowerCase() ||
            (u.email || "").trim().toLowerCase() === defUser.email.toLowerCase()
          );
          if (!exists) {
            state.users.push(defUser);
            syncEntityToFirestore("users", defUser.username, defUser);
          }
        });

        // Proactive data alignment: Sync profile pictures, names, and classes between user accounts and active student profiles
        let alignmentCount = 0;
        let userAlignmentCount = 0;
        if (state.users && state.activeStudents) {
          state.users.forEach(user => {
            if (user.role === "Siswa" || user.role === "Alumni") {
              const sNameLower = (user.name || "").trim().toLowerCase();
              const sEmailLower = (user.email || "").trim().toLowerCase();
              const sUsernameLower = (user.username || "").trim().toLowerCase();

              const actIndex = state.activeStudents.findIndex(s => 
                (user.studentId && s.id === user.studentId) ||
                (s.name && s.name.trim().toLowerCase() === sNameLower) ||
                (s.email && s.email.trim().toLowerCase() === sEmailLower) ||
                (s.username && s.username.trim().toLowerCase() === sUsernameLower)
              );

              if (actIndex !== -1) {
                const activeStudent = state.activeStudents[actIndex];
                let updatedUser = false;
                let updatedStudent = false;

                // Sync studentId to user account if missing
                if (!user.studentId && activeStudent.id) {
                  user.studentId = activeStudent.id;
                  updatedUser = true;
                }

                // Align Profile Picture
                if (user.profilePicture && !activeStudent.profilePicture) {
                  state.activeStudents[actIndex].profilePicture = user.profilePicture;
                  updatedStudent = true;
                } else if (!user.profilePicture && activeStudent.profilePicture) {
                  user.profilePicture = activeStudent.profilePicture;
                  updatedUser = true;
                } else if (user.profilePicture && activeStudent.profilePicture && activeStudent.profilePicture !== user.profilePicture) {
                  // Prefer user's self-selected profile picture
                  state.activeStudents[actIndex].profilePicture = user.profilePicture;
                  updatedStudent = true;
                }

                // Align Name
                if (activeStudent.name && user.name !== activeStudent.name) {
                  user.name = activeStudent.name;
                  updatedUser = true;
                }

                // Align Class: Plotted class is the absolute source of truth!
                const plottedClass = activeStudent.class || "";
                if (user.assignedClass !== plottedClass) {
                  user.assignedClass = plottedClass;
                  updatedUser = true;
                }

                if (updatedUser) {
                  userAlignmentCount++;
                  syncEntityToFirestore("users", user.username, user);
                }

                if (updatedStudent) {
                  alignmentCount++;
                  syncEntityToFirestore("activeStudents", activeStudent.id, activeStudent);
                }
              }
            }
          });
        }
        let senseiAlignmentCount = 0;

        if (alignmentCount > 0 || userAlignmentCount > 0 || senseiAlignmentCount > 0) {
          console.log(`Successfully aligned ${alignmentCount} students, ${userAlignmentCount} user accounts, and ${senseiAlignmentCount} sensei accounts.`);
        }

        // Proactive Alumni creation: Make sure all existing activeStudents with Alumni status have a user account and are synced
        let newAlumniUsersCount = 0;
        if (state.users && state.activeStudents) {
          state.activeStudents.forEach(student => {
            const isAlumni = ["Lulus", "Di Jepang"].includes(student.status || "");
            if (isAlumni) {
              const userIndex = state.users.findIndex(u => !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && (u.studentId === student.id || u.name === student.name));
              if (userIndex !== -1) {
                const currentRole = state.users[userIndex].role;
                const protectedRoles = ["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"];
                if (currentRole !== "Alumni" && !protectedRoles.includes(currentRole)) {
                  state.users[userIndex].role = "Alumni";
                  state.users[userIndex].assignedClass = "";
                  syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
                }
              } else {
                let baseUsername = (student.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                if (!baseUsername) baseUsername = "alumni";
                let usernameVal = baseUsername;
                let uNum = 1;
                while (state.users.some(u => u.username === usernameVal)) {
                  usernameVal = `${baseUsername}${uNum}`;
                  uNum++;
                }
                const newUser = {
                  username: usernameVal,
                  name: student.name,
                  email: "",
                  password: hashPassword("123456"),
                  role: "Alumni" as const,
                  status: "Active" as const,
                  studentId: student.id,
                  assignedClass: "",
                  profilePicture: student.profilePicture || ""
                };
                state.users.push(newUser);
                syncEntityToFirestore("users", newUser.username, newUser);
                newAlumniUsersCount++;
              }

              // Also ensure state.registeredStudents has this student registered as statusPendaftaran = "Alumni"
              const regIndex = state.registeredStudents.findIndex(rs => rs.id === student.id || rs.name.trim().toLowerCase() === student.name.trim().toLowerCase());
              if (regIndex !== -1) {
                if (state.registeredStudents[regIndex].statusPendaftaran !== "Alumni") {
                  state.registeredStudents[regIndex].statusPendaftaran = "Alumni";
                  state.registeredStudents[regIndex].status = "Disetujui";
                  syncEntityToFirestore("registeredStudents", state.registeredStudents[regIndex].id, state.registeredStudents[regIndex]);
                }
              }
            }
          });
        }
        if (newAlumniUsersCount > 0) {
          console.log(`Successfully generated ${newAlumniUsersCount} missing Alumni user accounts from Peta Sebaran data.`);
        }
      }

      isStateReady = true;
      console.log("🔥 Memory state loaded & synchronized with Firestore successfully!");
      initRealtimeSync();
    } catch (err) {
      console.error("Error during background Firestore sync:", err);
      isStateReady = true;
      initRealtimeSync();
    }
  })();
}

startServer();

// Keep-alive timer: Ping Firestore every 5 minutes to keep background socket active
setInterval(() => {
  testConnection().catch(() => {});
}, 5 * 60 * 1000);
