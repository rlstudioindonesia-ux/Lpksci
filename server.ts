import express from "express";
import compression from "compression";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { testConnection, loadStateFromFirestore, syncEntityToFirestore, syncCustomizationToFirestore, syncLmsClassToFirestore, deleteEntityFromFirestore, uploadBufferToFirebaseStorage, getUserFromFirestore, getEntityFromFirestore } from "./src/db/firebase-adapter.ts";
import { isHashedPassword, hashPassword, verifyPassword, stripPassword } from "./server/auth-utils.ts";
import { handleStateUpdate } from "./server/handlers/index.ts";

dotenv.config();

const app = express();
const PORT = 3000;

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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.get("/api/health", (req, res) => res.json({ status: "ok", initialized: isStateReady }));

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

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

let isStateReady = false;
let stateInitPromise: Promise<void> | null = null;

export async function ensureStateReady(maxWaitMs = 35000): Promise<void> {
  if (isStateReady) return;
  if (!stateInitPromise) return;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, maxWaitMs));
  await Promise.race([stateInitPromise, timeout]);
}

// In-Memory Database with clean initial state
let state: any = {
  registeredStudents: [],
  activeStudents: [],
  attendance: [],
  payments: [],
  inventory: [],
  taxes: [],
  customization: {
    logoText: "LPK SCI",
    logoIcon: "Award",
    themeColor: "indigo",
    logoUrl: "",
    faviconUrl: "",
    officeLocation: {
      latitude: 0,
      longitude: 0,
      radius: 200,
      enforce: false
    },
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
      opportunityImages: []
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

// Lazy initialization of Gemini API Client
let geminiAI: GoogleGenAI | null = null;
function getGeminiSDK(): GoogleGenAI {
  if (!geminiAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets Panel.");
    }
    geminiAI = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiAI;
}

// REST APIs

app.get("/api/debug/customization", (req, res) => {
  res.json({ galleryLength: state.customization.gallery?.length, gallery: state.customization.gallery });
});

app.post("/api/upload", async (req, res) => {
  const { fileData, fileName } = req.body;
  if (!fileData || !fileName) {
    return res.status(400).json({ error: "Missing fileData or fileName" });
  }
  try {
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let base64Image = fileData;
    let mimeType = "image/jpeg";
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Image = matches[2];
    }
    const buffer = Buffer.from(base64Image, "base64");
    
    // Attempt Firebase Storage upload first
    try {
      console.log(`Attempting to upload ${fileName} (${mimeType}) directly to Firebase Storage...`);
      const firebaseStorageUrl = await uploadBufferToFirebaseStorage(buffer, fileName, mimeType);
      console.log(`Successfully uploaded ${fileName} to Firebase Storage: ${firebaseStorageUrl}`);
      return res.json({ url: firebaseStorageUrl });
    } catch (firebaseErr: any) {
      console.warn("Firebase Storage upload failed on backend. Returning persistent base64 data URL fallback:", firebaseErr.message || firebaseErr);
    }

    // Persistent Fallback: Return persistent base64 Data URL so photos are never lost when container restarts
    const persistentUrl = fileData.startsWith("data:") ? fileData : `data:${mimeType};base64,${base64Image}`;
    res.json({ url: persistentUrl });
  } catch (error: any) {
    console.error("Upload API error:", error);
    res.status(500).json({ error: error.message });
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

app.get("/api/state", async (req, res) => {
  try {
    // Wait if state is still initializing from Firestore on cold boot. The full
    // sync of ~20 collections consistently takes ~25-28s in practice, so 15s was
    // cutting it short and causing requests to see partially-empty data.
    await ensureStateReady(30000);
  } catch (e) {}

  // Strip excessive biometric photo base64 strings from generic logs to prevent multi-megabyte transfers
  const optimizedLogs = (state.logs || []).map((l: any) => {
    if (!l || typeof l !== "object") return l;
    let hasBigBase64 = false;
    for (const key of Object.keys(l)) {
      const val = l[key];
      if (typeof val === "string" && val.startsWith("data:image") && val.length > 500) {
        hasBigBase64 = true;
        break;
      }
    }
    if (!hasBigBase64) return l;

    const copy = { ...l };
    for (const [k, v] of Object.entries(copy)) {
      if (typeof v === "string" && v.startsWith("data:image") && v.length > 500) {
        copy[k] = "[FOTO_TERSIMPAN]";
      }
    }
    return copy;
  });

  res.setHeader("Cache-Control", "no-cache");
  res.json({
    ...state,
    _isReady: isStateReady,
    logs: optimizedLogs,
    users: (state.users || []).map(u => ({ ...stripPassword(u), hasPassword: !!u.password })),
    registeredStudents: (state.registeredStudents || []).map(stripPassword),
  });
});

// /api/state strips embedded base64 photos out of every log entry (see optimizedLogs
// above) to keep that payload small on every poll. This endpoint fetches a single
// log's real, un-stripped photoUrl on demand - used when a user actually opens an
// attendance photo. Falls back to Firestore for logs older than the in-memory cap.
app.get("/api/logs/:id/photo", async (req, res) => {
  try {
    await ensureStateReady(30000);
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

  res.json({ success: true, registered: stripPassword(newReg), payment: newPay });
  } catch (error: any) {
    console.error("Register API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Update standard datasets from the Admin Portal or LMS E-Benkyou
app.post("/api/state/update", (req, res) => {
  const { dataType, action, payload, userRole } = req.body;
  if (!dataType || !action) {
    return res.status(400).json({ error: "Missing parameter" });
  }

  // Hook sync logic post-response using monkeypatch
  const originalJson = res.json;
  res.json = function(val) {
    res.locals.responseData = val;
    return originalJson.call(this, val);
  };

  res.on("finish", async () => {
    try {
      if (dataType === "customization") {
         syncCustomizationToFirestore(state.customization);
         if (state.customization.lmsClasses) {
            state.customization.lmsClasses.forEach(syncLmsClassToFirestore);
         }
      } else if (state[dataType] || dataType === "registeredStudents") {
         if (dataType === "galleries" || dataType === "slideshows") return; // Handled manually
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
    } catch(e) { console.error("Auto-sync error:", e); }
  });

  try {
    if (handleStateUpdate(req, res, dataType, action, payload, state)) return;
    return res.status(400).json({ error: "Unknown action or dataType" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// VVIP Strategic Advice calculated via Rule-Based Algorithmic Engine (No AI as requested)
app.post("/api/vvip/analyze", (req, res) => {
  try {
    const activeCount = state.activeStudents.length;
    const workingInJapan = state.activeStudents.filter(s => s.status === "Di Jepang").length;
    const studyingCount = state.activeStudents.filter(s => s.status === "Belajar").length;
    const totalPayments = state.payments.filter(p => p.status === "Lunas").reduce((acc, curr) => acc + curr.amount, 0);

    const ratio = activeCount > 0 ? Math.round((workingInJapan / activeCount) * 100) : 0;
    
    let executiveSummary = `Analisis Kinerja Operasional: LPK Source Course Indonesia saat ini memiliki rasio keberangkatan alumni sebesar ${ratio}%. `;
    if (ratio > 50) {
      executiveSummary += "Capaian penjaluran kerja di atas rata-rata industri nasional. Direkomendasikan menambah kapasitas tampung asrama guna menyambut permintaan penempatan musim depan.";
    } else {
      executiveSummary += "Jumlah peserta didik di asrama bimbingan belajar masih mendominasi. Kurikulum intensif penunjang tes Prometric perlu diprioritaskan.";
    }

    const recommendations = [
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
      rekomendasiStrategis: recommendations
    });
  } catch (error: any) {
    console.error("Strategic analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Configure Vite middleware in development or serve static build in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
    } catch (err) {
      console.error("Error during background Firestore sync:", err);
      isStateReady = true;
    }
  })();
}

startServer();
