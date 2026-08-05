import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { testConnection, loadStateFromFirestore, syncEntityToFirestore, syncCustomizationToFirestore, syncLmsClassToFirestore, deleteEntityFromFirestore, uploadBufferToFirebaseStorage } from "./src/db/firebase-adapter.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

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
      latitude: -7.79558,
      longitude: 110.36949,
      radius: 200,
      enforce: true
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
    let mimeType = "application/octet-stream";
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
      console.warn("Firebase Storage upload failed on backend. Falling back to local file system:", firebaseErr.message || firebaseErr);
    }

    // Fallback: Local Server Disk Storage
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const uniqueName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    fs.writeFileSync(path.join(uploadsDir, uniqueName), buffer);
    res.json({ url: `/uploads/${uniqueName}` });
  } catch (error: any) {
    console.error("Upload API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/request-reset", async (req, res) => {
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
});

app.post("/api/reset-password", async (req, res) => {
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
    state.users[userIndex].password = newPassword;
    
    // Save state to firestore if needed
    try {
      syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
    } catch(e) {}
    
    // Invalidate token
    state.passwordResets.splice(resetIndex, 1);
    return res.json({ success: true });
  }
  
  return res.status(404).json({ error: "User tidak ditemukan." });
});

app.get("/api/state", (req, res) => {
  res.json(state);
});

// Student sign up from the landing page with integrated Midtrans Sandbox Payment

app.post("/api/register", (req, res) => {
  const { 
    name, email, password, phone, birthDate, education, program, japaneseLevel, paymentAmount, paymentMethod, proofOfPayment,
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

  const newReg = {
    id: `REG-${Date.now().toString().slice(-6)}`,
    name,
    email,
    password: password || "123456",
    phone,
    birthDate: birthDate || "2003-01-01",
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
        password: password || "123456",
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

  res.json({ success: true, registered: newReg, payment: newPay });
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
    if (dataType === "lmsLessons") {
      if (action === "add") {
        const newLesson = {
          id: payload.id || `L-${payload.subject === "Bahasa Jepang" ? "JP" : payload.subject === "Matematika" ? "MT" : "ME"}-${Date.now().toString().slice(-4)}`,
          subject: payload.subject,
          chapterNumber: Number(payload.chapterNumber || 1),
          title: payload.title,
          japaneseTitle: payload.japaneseTitle || "",
          difficulty: payload.difficulty || "Umum",
          contentType: payload.contentType || "text_only",
          uploadMethod: payload.uploadMethod || "url",
          content: payload.content || "",
          videoUrl: payload.videoUrl || "",
          slidesUrl: payload.slidesUrl || "",
          bookUrl: payload.bookUrl || "",
          quizUrl: payload.quizUrl || "",
          soalUrl: payload.soalUrl || "",
          quizQuestions: payload.quizQuestions || [],
          quizStartTime: payload.quizStartTime || "",
          quizEndTime: payload.quizEndTime || "",
          audioData: payload.audioData || "",
          isLocked: !!payload.isLocked,
          targetClass: payload.targetClass || ""
        };
        state.lmsLessons.push(newLesson);
        return res.json({ success: true, item: newLesson });
      }

      if (action === "edit" || action === "update") {
        const index = state.lmsLessons.findIndex(l => l.id === payload.id);
        if (index !== -1) {
          const oldStartTime = state.lmsLessons[index].quizStartTime || "";
          const oldEndTime = state.lmsLessons[index].quizEndTime || "";
          const newStartTime = payload.quizStartTime !== undefined ? payload.quizStartTime : oldStartTime;
          const newEndTime = payload.quizEndTime !== undefined ? payload.quizEndTime : oldEndTime;

          if (oldStartTime !== newStartTime || oldEndTime !== newEndTime) {
            // Times changed! Clear existing assessments for this lesson so they can redo
            if (state.chapterAssessments) {
              const toDelete = state.chapterAssessments.filter(c => c.lessonId === payload.id);
              for (const rec of toDelete) {
                deleteEntityFromFirestore("chapterAssessments", rec.id);
              }
              state.chapterAssessments = state.chapterAssessments.filter(c => c.lessonId !== payload.id);
            }
          }

          state.lmsLessons[index] = {
            ...state.lmsLessons[index],
            ...payload,
            chapterNumber: payload.chapterNumber !== undefined ? Number(payload.chapterNumber) : state.lmsLessons[index].chapterNumber
          };
          return res.json({ success: true, item: state.lmsLessons[index] });
        }
        return res.status(404).json({ error: "Lesson not found" });
      }

      if (action === "delete") {
        const { id } = payload;
        state.lmsLessons = state.lmsLessons.filter(l => l.id !== id);
        if (id) deleteEntityFromFirestore("lmsLessons", id);
        return res.json({ success: true, id });
      }
    }

    if (dataType === "lmsComments") {
      if (action === "add") {
        const newComment = {
          id: payload.id || `C-${Date.now().toString()}-${Math.floor(1000 + Math.random() * 9000)}`,
          lessonId: payload.lessonId,
          userId: payload.userId,
          userName: payload.userName,
          userRole: payload.userRole,
          userAvatar: payload.userAvatar || "",
          content: payload.content,
          createdAt: payload.createdAt || new Date().toISOString(),
          parentId: payload.parentId || null
        };
        if (!state.lmsComments) {
          state.lmsComments = [];
        }
        state.lmsComments.push(newComment);
        return res.json({ success: true, item: newComment });
      }

      if (action === "edit" || action === "update") {
        const index = state.lmsComments.findIndex(c => c.id === payload.id);
        if (index !== -1) {
          state.lmsComments[index] = {
            ...state.lmsComments[index],
            ...payload
          };
          return res.json({ success: true, item: state.lmsComments[index] });
        }
        return res.status(404).json({ error: "Comment not found" });
      }

      if (action === "delete") {
        const { id } = payload;
        state.lmsComments = state.lmsComments.filter(c => c.id !== id);
        if (id) deleteEntityFromFirestore("lmsComments", id);
        return res.json({ success: true, id });
      }
    }

    if (dataType === "lmsQuizzes") {
      if (action === "add") {
        const newQuiz = {
          id: payload.id || `Q-${payload.subject === "Bahasa Jepang" ? "JP" : payload.subject === "SSW" ? "SW" : "ME"}-${Date.now().toString().slice(-4)}`,
          subject: payload.subject,
          chapterNumber: Number(payload.chapterNumber || 1),
          targetClass: payload.targetClass || "Semua",
          deadline: payload.deadline || "",
          durationMinutes: payload.durationMinutes !== undefined && payload.durationMinutes !== "" ? Number(payload.durationMinutes) : undefined,
          questionType: payload.questionType || "pilihan_ganda",
          question: payload.question,
          options: payload.options || [],
          correctAnswerIndex: payload.correctAnswerIndex || 0,
          imageUrl: payload.imageUrl || "",
          videoUrl: payload.videoUrl || "",
          audioUrl: payload.audioUrl || ""
        };
        state.lmsQuizzes.push(newQuiz);
        return res.json({ success: true, item: newQuiz });
      }

      if (action === "edit" || action === "update") {
        const index = state.lmsQuizzes.findIndex(q => q.id === payload.id);
        if (index !== -1) {
          state.lmsQuizzes[index] = {
            ...state.lmsQuizzes[index],
            ...payload
          };
          return res.json({ success: true, item: state.lmsQuizzes[index] });
        }
        return res.status(404).json({ error: "Quiz not found" });
      }

      if (action === "delete") {
        const { id } = payload;
        state.lmsQuizzes = state.lmsQuizzes.filter(q => q.id !== id);
        if (id) deleteEntityFromFirestore("lmsQuizzes", id);
        return res.json({ success: true, id });
      }
    }

    if (dataType === "attendance" && action === "add") {
      const newAtt = {
        id: `ATT-${Date.now().toString().slice(-4)}`,
        studentId: payload.studentId,
        studentName: payload.studentName,
        date: payload.date || new Date().toISOString().split("T")[0],
        status: payload.status,
        subject: payload.subject,
        notes: payload.notes || ""
      };
      state.attendance.unshift(newAtt);
      
      // Update student's attendanceScore dynamically
      if (payload.studentId) {
        const student = state.activeStudents.find(s => s.id === payload.studentId);
        if (student) {
          const stRecords = state.attendance.filter(a => a.studentId === payload.studentId);
          const presentCount = stRecords.filter(a => a.status === "Hadir").length;
          const totalRecords = stRecords.length;
          student.attendanceScore = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
          
          // Also sync to firestore if using firebase
          if (typeof syncEntityToFirestore !== "undefined") {
            syncEntityToFirestore("activeStudents", student.id, student);
          }
        }
      }
      return res.json({ success: true, item: newAtt });
    }

    if (dataType === "salaries" && action === "add") {
      if (!state.salaries) state.salaries = [];
      const newSalary = {
        id: `SAL-${Date.now().toString().slice(-4)}`,
        staffName: payload.staffName,
        role: payload.role || "Staff",
        amount: Number(payload.amount),
        monthString: payload.monthString || "Bulan Ini",
        paymentDate: payload.paymentDate || new Date().toISOString().split("T")[0],
        status: payload.status || "Lunas",
        notes: payload.notes || ""
      };
      state.salaries.unshift(newSalary);
      syncEntityToFirestore("salaries", newSalary.id, newSalary);
      return res.json({ success: true, item: newSalary });
    }

    if (dataType === "salaries" && action === "status") {
      if (!state.salaries) state.salaries = [];
      const salId = payload.id;
      const index = state.salaries.findIndex((s: any) => s.id === salId);
      if (index !== -1) {
        state.salaries[index].status = payload.status;
        syncEntityToFirestore("salaries", salId, state.salaries[index]);
        return res.json({ success: true, updated: state.salaries[index] });
      }
    }

    if (dataType === "salaries" && action === "delete") {
      if (!state.salaries) state.salaries = [];
      const { id } = payload;
      state.salaries = state.salaries.filter((s: any) => s.id !== id);
      if (id) deleteEntityFromFirestore("salaries", id);
      return res.json({ success: true, id });
    }

    if (dataType === "cashLedger" && action === "add") {
      if (!state.cashLedger) state.cashLedger = [];
      const newLedger = {
        id: `CAS-${Date.now().toString().slice(-4)}`,
        code: payload.code || "",
        date: payload.date || new Date().toISOString().split("T")[0],
        description: payload.description || "",
        inAmount: Number(payload.inAmount) || 0,
        outAmount: Number(payload.outAmount) || 0
      };
      state.cashLedger.push(newLedger);
      syncEntityToFirestore("cashLedger", newLedger.id, newLedger);
      return res.json({ success: true, item: newLedger });
    }

    if (dataType === "cashLedger" && action === "edit") {
      const { id, code, date, description, inAmount, outAmount } = payload;
      const idx = state.cashLedger.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        state.cashLedger[idx] = {
          ...state.cashLedger[idx],
          code, date, description,
          inAmount: Number(inAmount) || 0,
          outAmount: Number(outAmount) || 0
        };
        syncEntityToFirestore("cashLedger", id, state.cashLedger[idx]);
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "Not found" });
    }

    if (dataType === "cashLedger" && action === "delete") {
      const { id } = payload;
      state.cashLedger = state.cashLedger.filter((c: any) => c.id !== id);
      if (id) deleteEntityFromFirestore("cashLedger", id);
      return res.json({ success: true, id });
    }

    if (dataType === "registeredStudents" && action === "approve") {
      const studentId = payload.id;
      const index = state.registeredStudents.findIndex(s => s.id === studentId);
      if (index !== -1) {
        const match = state.registeredStudents[index];
        match.status = "Disetujui";

        // Force zero billing for alumni
        if (match.statusPendaftaran === "Alumni") {
          match.paymentAmount = 0;
          match.paymentStatus = "Lunas";
        }
        
        // Also automatically recruit them to the activeStudent pool for learning!
        let assignedStudentId = "SIS-001";
        const existingActive = state.activeStudents.find(s => s.name === match.name);
        if (existingActive) {
          assignedStudentId = existingActive.id;
          existingActive.docAkta = match.docAkta || existingActive.docAkta;
          existingActive.docFoto = match.docFoto || existingActive.docFoto;
          existingActive.profilePicture = match.docFoto ? (match.docFoto.includes('|') ? match.docFoto.split('|')[1] : match.docFoto) : existingActive.profilePicture;
          existingActive.docIjazahSD = match.docIjazahSD || existingActive.docIjazahSD;
          existingActive.docIjazahSMP = match.docIjazahSMP || existingActive.docIjazahSMP;
          existingActive.docIjazahSMA = match.docIjazahSMA || existingActive.docIjazahSMA;
          existingActive.docKK = match.docKK || existingActive.docKK;
          existingActive.docKTP = match.docKTP || existingActive.docKTP;
          existingActive.docTranskip = match.docTranskip || existingActive.docTranskip;
          existingActive.docPraMCU = match.docPraMCU || existingActive.docPraMCU;
          existingActive.docVaksin = match.docVaksin || existingActive.docVaksin;
          existingActive.docCV1 = match.docCV1 || existingActive.docCV1;
          existingActive.docCV2 = match.docCV2 || existingActive.docCV2;
          existingActive.docCV3 = match.docCV3 || existingActive.docCV3;
          existingActive.docCV4 = match.docCV4 || existingActive.docCV4;
          existingActive.docCV5 = match.docCV5 || existingActive.docCV5;
          existingActive.docMoU = match.docMoU || existingActive.docMoU;
          existingActive.docKontrak = match.docKontrak || existingActive.docKontrak;
        } else {
          let idNum = state.activeStudents.length + 1;
          let newId = `SIS-${idNum.toString().padStart(3, "0")}`;
          while (state.activeStudents.some(s => s.id === newId)) {
            idNum++;
            newId = `SIS-${idNum.toString().padStart(3, "0")}`;
          }
          assignedStudentId = newId;
          state.activeStudents.push({
            id: assignedStudentId,
            name: match.name,
            batch: "Angkatan 12",
            class: payload.class || "",
            status: "Belajar",
            kategoriPendaftaran: match.statusPendaftaran || "Siswa Baru",
            referrer: match.referrer || "",
            profilePicture: match.docFoto ? (match.docFoto.includes('|') ? match.docFoto.split('|')[1] : match.docFoto) : "",
            graduationYear: match.graduationYear || "",
            docAkta: match.docAkta || "",
            docFoto: match.docFoto || "",
            docIjazahSD: match.docIjazahSD || "",
            docIjazahSMP: match.docIjazahSMP || "",
            docIjazahSMA: match.docIjazahSMA || "",
            docKK: match.docKK || "",
            docKTP: match.docKTP || "",
            docTranskip: match.docTranskip || "",
            docPraMCU: match.docPraMCU || "",
            docVaksin: match.docVaksin || "",
            docCV1: match.docCV1 || "",
            docCV2: match.docCV2 || "",
            docCV3: match.docCV3 || "",
            docCV4: match.docCV4 || "",
            docCV5: match.docCV5 || "",
            docMoU: match.docMoU || "",
            docKontrak: match.docKontrak || ""
          });
        }

        // Auto-provision or update a system user account
        const protectedRoles = ["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"];
        const existingUser = state.users.find(u => u.username === match.email || u.email === match.email);
        if (existingUser) {
          if (!protectedRoles.includes(existingUser.role)) {
            existingUser.assignedClass = payload.class || "";
            existingUser.studentId = assignedStudentId;
            existingUser.profilePicture = match.docFoto ? (match.docFoto.includes('|') ? match.docFoto.split('|')[1] : match.docFoto) : (existingUser.profilePicture || "");
            if (match.statusPendaftaran === "Alumni") existingUser.role = "Alumni";
            syncEntityToFirestore("users", existingUser.username, existingUser);
          }
        } else {
          const newUserObj = {
            username: match.email,
            name: match.name,
            email: match.email,
            password: match.password || "123456",
            role: (match.statusPendaftaran === "Alumni" ? "Alumni" : "Siswa") as "Siswa" | "Alumni",
            status: "Active" as const,
            studentId: assignedStudentId,
            assignedClass: payload.class || "",
            profilePicture: match.docFoto ? (match.docFoto.includes('|') ? match.docFoto.split('|')[1] : match.docFoto) : ""
          };
          state.users.push(newUserObj);
          syncEntityToFirestore("users", newUserObj.username, newUserObj);
        }

        // REMOVE from registeredStudents to avoid double data (siswa baru becomes empty for this student)
        const approvedStudent = state.registeredStudents[index];
        state.registeredStudents.splice(index, 1);
        
        return res.json({ success: true, updated: approvedStudent });
      }
    }

    if (dataType === "registeredStudents" && action === "reject") {
      const studentId = payload.id;
      const index = state.registeredStudents.findIndex(s => s.id === studentId);
      if (index !== -1) {
        state.registeredStudents[index].status = "Ditolak";
        return res.json({ success: true, updated: state.registeredStudents[index] });
      }
    }

    if (dataType === "registeredStudents" && action === "delete") {
      const { id } = payload;
      const registeredToDelete = state.registeredStudents.find((s: any) => s.id === id);
      state.registeredStudents = state.registeredStudents.filter((s: any) => s.id !== id);
      if (id) {
        deleteEntityFromFirestore("registeredStudents", id);
      }
      if (registeredToDelete && registeredToDelete.id && registeredToDelete.id !== id) {
        deleteEntityFromFirestore("registeredStudents", registeredToDelete.id);
      }
      
      if (registeredToDelete) {
        // Cascade delete from activeStudents
        const actStudent = state.activeStudents.find(
          (s: any) => s.id === id || (s.name && registeredToDelete.name && s.name.trim().toLowerCase() === registeredToDelete.name.trim().toLowerCase())
        );
        if (actStudent) {
          state.activeStudents = state.activeStudents.filter((s: any) => s.id !== actStudent.id);
          deleteEntityFromFirestore("activeStudents", actStudent.id);
        }

        // Cascade delete from users
        const userAccount = state.users.find(
          (u: any) => (u.studentId && u.studentId === id) || 
                      (u.email && registeredToDelete.email && u.email.trim().toLowerCase() === registeredToDelete.email.trim().toLowerCase()) ||
                      (u.name && registeredToDelete.name && u.name.trim().toLowerCase() === registeredToDelete.name.trim().toLowerCase())
        );
        if (userAccount) {
          state.users = state.users.filter((u: any) => u.username !== userAccount.username);
          deleteEntityFromFirestore("users", userAccount.username);
        }
      }
      
      return res.json({ success: true, id });
    }

    if (dataType === "registeredStudents" && action === "update") {
      const { id } = payload;
      const index = state.registeredStudents.findIndex(s => s.id === id);
      if (index !== -1) {
        const oldDocFoto = state.registeredStudents[index].docFoto;
        state.registeredStudents[index] = {
          ...state.registeredStudents[index],
          ...payload
        };
        const student = state.registeredStudents[index];

        // Force zero billing for alumni
        if (student.statusPendaftaran === "Alumni") {
          student.paymentAmount = 0;
          student.paymentStatus = "Lunas";
        }

        // Sync to activeStudents and users if docFoto was updated or added!
        if (student.docFoto && student.docFoto !== oldDocFoto) {
          const actIndex = state.activeStudents.findIndex(s => s.id === id || s.name.trim().toLowerCase() === student.name.trim().toLowerCase());
          if (actIndex !== -1) {
            state.activeStudents[actIndex].profilePicture = student.docFoto.includes('|') ? student.docFoto.split('|')[1] : student.docFoto;
            syncEntityToFirestore("activeStudents", state.activeStudents[actIndex].id, state.activeStudents[actIndex]);
          }
          const userIndex = state.users.findIndex(u => 
            !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && (
              (u.studentId === id) || 
              (student.email && u.email && u.email.trim().toLowerCase() === student.email.trim().toLowerCase()) ||
              (student.email && u.username && u.username.trim().toLowerCase() === student.email.trim().toLowerCase()) ||
              (!student.email && u.name && student.name && u.name.trim().toLowerCase() === student.name.trim().toLowerCase())
            )
          );
          if (userIndex !== -1) {
            state.users[userIndex].profilePicture = student.docFoto.includes('|') ? student.docFoto.split('|')[1] : student.docFoto;
            syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
          }
        }
        
        // If marked as Lunas from admin panel, sync to payments and cash ledger
        if (payload.paymentStatus === "Lunas") {
          const student = state.registeredStudents[index];
          const pIndex = state.payments.findIndex(p => p.studentName === student.name && p.category.includes("Pendaftaran"));
          
          if (pIndex !== -1) {
             state.payments[pIndex].status = "Lunas";
             const payment = state.payments[pIndex];
             
             if (!state.cashLedger) state.cashLedger = [];
             const exists = state.cashLedger.some(c => c.code === payment.id);
             if (!exists) {
               const newLedger = {
                 id: `CAS-${Date.now().toString().slice(-4)}`,
                 code: payment.id,
                 date: new Date().toISOString().split("T")[0],
                 description: `Pembayaran Pendaftaran - ${payment.studentName}`,
                 inAmount: Number(payment.amount) || Number(student.paymentAmount) || 500000,
                 outAmount: 0
               };
               state.cashLedger.push(newLedger);
               syncEntityToFirestore('cashLedger', newLedger.id, newLedger);
             }
             syncEntityToFirestore('payments', payment.id, payment);
          }
        }
        
        syncEntityToFirestore('registeredStudents', state.registeredStudents[index].id, state.registeredStudents[index]);
        return res.json({ success: true, updated: state.registeredStudents[index] });
      }
      return res.status(404).json({ error: "Registered student not found to update." });
    }

    if (dataType === "payments" && action === "add") {
      const payId = payload.id || `PAY-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`;
      const newPay = {
        id: payId,
        studentName: payload.studentName || "",
        category: payload.category || "",
        amount: payload.amount !== undefined ? Number(payload.amount) : 0,
        date: payload.date || new Date().toISOString().split("T")[0],
        status: payload.status || "Belum Bayar",
        ...payload
      };
      const existingIdx = state.payments.findIndex(p => p.id === payId);
      if (existingIdx !== -1) {
        state.payments[existingIdx] = { ...state.payments[existingIdx], ...newPay };
      } else {
        state.payments.unshift(newPay);
      }
      return res.json({ success: true, item: newPay });
    }

    if (dataType === "payments" && action === "status") {
      const payId = payload.id;
      const index = state.payments.findIndex(p => p.id === payId);
      if (index !== -1) {
        state.payments[index].status = payload.status;
        
        // Synchronize corresponding manual payment state inside registeredStudents if name matches
        const pName = state.payments[index].studentName;
        const regMatch = state.registeredStudents.find(
          (s) => (s.name || "").trim().toLowerCase() === (pName || "").trim().toLowerCase()
        );
        if (regMatch) {
          regMatch.paymentStatus = payload.status;
        }
        
        // Auto-record to cash ledger if marked as Lunas
        if (payload.status === "Lunas") {
           if (!state.cashLedger) state.cashLedger = [];
           const payment = state.payments[index];
           
           // Avoid duplicating if already exists in cash ledger
           const exists = state.cashLedger.some(c => c.code === payment.id);
           if (!exists) {
             const newLedger = {
               id: `CAS-${Date.now().toString().slice(-4)}`,
               code: payment.id,
               date: new Date().toISOString().split("T")[0],
               description: `Pembayaran ${payment.category} - ${payment.studentName}`,
               inAmount: Number(payment.amount) || 0,
               outAmount: 0
             };
             state.cashLedger.push(newLedger);
             syncEntityToFirestore('cashLedger', newLedger.id, newLedger);
           }
        }
        
        return res.json({ success: true, item: state.payments[index] });
      }
    }

    if (dataType === "payments" && action === "update_payment") {
      const { id, studentName, category, amount, paymentMethod, senderBank, senderAccountName, proofOfPayment, status, isSigned, signatureDate } = payload;
      let index = state.payments.findIndex(p => p.id === id);
      if (index === -1) {
        const newPay = {
          id: id || `PAY-${Date.now().toString().slice(-4)}`,
          studentName: studentName || "Siswa LPK",
          category: category || "Pelatihan & Asrama",
          amount: amount ? Number(amount) : 5000000,
          date: new Date().toISOString().split("T")[0],
          status: "Belum Bayar" as any
        };
        state.payments.unshift(newPay);
        index = 0;
      }

      if (index !== -1) {
        if (paymentMethod !== undefined) state.payments[index].paymentMethod = paymentMethod;
        if (senderBank !== undefined) state.payments[index].senderBank = senderBank;
        if (senderAccountName !== undefined) state.payments[index].senderAccountName = senderAccountName;
        if (proofOfPayment !== undefined) state.payments[index].proofOfPayment = proofOfPayment;
        if (status !== undefined) state.payments[index].status = status;
        if (isSigned !== undefined) state.payments[index].isSigned = isSigned;
        if (signatureDate !== undefined) state.payments[index].signatureDate = signatureDate;
        return res.json({ success: true, item: state.payments[index] });
      }
    }

    if (dataType === "payments" && action === "sign_payment") {
      const { id, isSigned, signatureDate } = payload;
      const index = state.payments.findIndex(p => p.id === id);
      if (index !== -1) {
        state.payments[index].isSigned = isSigned;
        state.payments[index].signatureDate = signatureDate;
        return res.json({ success: true, item: state.payments[index] });
      }
    }

    if (dataType === "inventory" && action === "add") {
      const newItem = {
        id: `INV-${Date.now().toString().slice(-4)}`,
        itemName: payload.itemName,
        code: payload.code || `INV-${payload.itemName.slice(0,3).toUpperCase()}-${Math.floor(Math.random()*90)+10}`,
        amount: Number(payload.amount),
        condition: payload.condition || "Baik",
        location: payload.location || "Kantor"
      };
      state.inventory.unshift(newItem);
      return res.json({ success: true, item: newItem });
    }

    if (dataType === "inventory" && action === "delete") {
      const { id } = payload;
      state.inventory = state.inventory.filter(i => i.id !== id);
      if (id) deleteEntityFromFirestore("inventory", id);
      return res.json({ success: true, id });
    }

    if (dataType === "inventory" && action === "edit") {
      const idx = state.inventory.findIndex(i => i.id === payload.id);
      if (idx !== -1) {
        state.inventory[idx] = {
          ...state.inventory[idx],
          itemName: payload.itemName || state.inventory[idx].itemName,
          amount: Number(payload.amount) || state.inventory[idx].amount,
          condition: payload.condition || state.inventory[idx].condition,
          location: payload.location || state.inventory[idx].location,
        };
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "Item not found" });
    }

    if (dataType === "taxes" && action === "report") {
      const taxId = payload.id;
      const monthString = payload.monthString;
      let index = state.taxes.findIndex((t: any) => t.id === taxId || (monthString && t.monthString === monthString));
      if (index !== -1) {
        state.taxes[index].status = "Final/Dilaporkan";
        if (payload.sptFile !== undefined) state.taxes[index].sptFile = payload.sptFile;
        if (payload.financialReportFile !== undefined) state.taxes[index].financialReportFile = payload.financialReportFile;
        if (payload.notes !== undefined) state.taxes[index].notes = payload.notes;
        return res.json({ success: true, item: state.taxes[index] });
      } else {
        const newTax = {
          id: taxId || `TAX-${Date.now()}`,
          monthString: monthString || "Umum",
          totalRevenue: Number(payload.totalRevenue) || 0,
          totalExpenses: Number(payload.totalExpenses) || 0,
          taxRate: 0.11,
          taxAmount: Math.round(Number(payload.totalRevenue || 0) * 0.11),
          status: "Final/Dilaporkan" as const,
          sptFile: payload.sptFile || "",
          financialReportFile: payload.financialReportFile || "",
          notes: payload.notes || ""
        };
        state.taxes.push(newTax);
        return res.json({ success: true, item: newTax });
      }
    }

    if (dataType === "taxes" && action === "add") {
      const newTax = {
        id: payload.id || `TAX-${Date.now()}`,
        monthString: payload.monthString,
        totalRevenue: Number(payload.totalRevenue),
        totalExpenses: Number(payload.totalExpenses),
        taxRate: Number(payload.taxRate) || 0.11,
        taxAmount: Math.round(Number(payload.totalRevenue) * (Number(payload.taxRate) || 0.11)),
        status: payload.status || "Draft",
        sptFile: payload.sptFile || "",
        financialReportFile: payload.financialReportFile || "",
        notes: payload.notes || ""
      };
      state.taxes.push(newTax);
      return res.json({ success: true, item: newTax });
    }

    if (dataType === "taxes" && action === "edit") {
      const index = state.taxes.findIndex((t: any) => t.id === payload.id);
      if (index !== -1) {
        state.taxes[index] = {
          ...state.taxes[index],
          ...payload,
          totalRevenue: payload.totalRevenue !== undefined ? Number(payload.totalRevenue) : state.taxes[index].totalRevenue,
          totalExpenses: payload.totalExpenses !== undefined ? Number(payload.totalExpenses) : state.taxes[index].totalExpenses,
          taxRate: payload.taxRate !== undefined ? Number(payload.taxRate) : state.taxes[index].taxRate,
          taxAmount: Math.round(
            (payload.totalRevenue !== undefined ? Number(payload.totalRevenue) : state.taxes[index].totalRevenue) *
            (payload.taxRate !== undefined ? Number(payload.taxRate) : state.taxes[index].taxRate)
          )
        };
        return res.json({ success: true, item: state.taxes[index] });
      }
      return res.status(404).json({ error: "Tax record not found" });
    }

    if (dataType === "taxes" && action === "delete") {
      const { id } = payload;
      state.taxes = state.taxes.filter((t: any) => t.id !== id);
      if (id) deleteEntityFromFirestore("taxes", id);
      return res.json({ success: true, id });
    }

    
    if (dataType === "costConfig" && action === "update") {
      state.costConfig = {
        ...(state.costConfig || {}),
        ...payload
      };
      return res.json({ success: true, costConfig: state.costConfig });
    }
    
    if (dataType === "payments" && action === "delete") {
      const { id, studentName, category } = payload;
      if (id) {
        state.payments = state.payments.filter(p => p.id !== id);
        deleteEntityFromFirestore("payments", id);
      }
      if (studentName && category) {
        const matching = state.payments.filter(p => 
          (p.studentName || "").trim().toLowerCase() === (studentName || "").trim().toLowerCase() &&
          (p.category || "").trim().toLowerCase() === (category || "").trim().toLowerCase()
        );
        for (const m of matching) {
          deleteEntityFromFirestore("payments", m.id);
        }
        state.payments = state.payments.filter(p => !matching.some(m => m.id === p.id));
      }
      return res.json({ success: true, id });
    }

    if (dataType === "payments" && (action === "edit" || action === "update")) {
      const { id, studentName, amount, date, category, status } = payload;
      const targetId = id || payload.id;
      let idx = state.payments.findIndex(p => p.id === targetId);
      if (idx === -1 && studentName && category) {
        idx = state.payments.findIndex(p => 
          (p.studentName || "").trim().toLowerCase() === (studentName || "").trim().toLowerCase() &&
          (p.category || "").trim().toLowerCase() === (category || "").trim().toLowerCase()
        );
      }

      if (idx !== -1) {
        state.payments[idx] = {
          ...state.payments[idx],
          ...payload,
          amount: amount !== undefined ? Number(amount) : state.payments[idx].amount,
          date: date || state.payments[idx].date,
          category: category || state.payments[idx].category,
          status: status || state.payments[idx].status,
        };
        
        if (state.payments[idx].status === "Lunas") {
           if (!state.cashLedger) state.cashLedger = [];
           const payment = state.payments[idx];
           const exists = state.cashLedger.some(c => c.code === payment.id);
           if (!exists) {
             const newLedger = {
               id: `CAS-${Date.now().toString().slice(-4)}`,
               code: payment.id,
               date: new Date().toISOString().split("T")[0],
               description: `Pembayaran ${payment.category} - ${payment.studentName}`,
               inAmount: Number(payment.amount) || 0,
               outAmount: 0
             };
             state.cashLedger.push(newLedger);
             syncEntityToFirestore('cashLedger', newLedger.id, newLedger);
           }
        }
        
        return res.json({ success: true, updated: state.payments[idx], item: state.payments[idx] });
      } else {
        const newPay = {
          id: targetId || `PAY-MAN-${Date.now().toString().slice(-4)}`,
          studentName: studentName || "Siswa LPK",
          category: category || "Pembayaran Pendidikan",
          amount: amount !== undefined ? Number(amount) : 500000,
          date: date || new Date().toISOString().split("T")[0],
          status: status || "Belum Bayar",
          paymentMethod: "Manual",
          ...payload
        };
        state.payments.unshift(newPay);

        if (newPay.status === "Lunas") {
           if (!state.cashLedger) state.cashLedger = [];
           const exists = state.cashLedger.some(c => c.code === newPay.id);
           if (!exists) {
             const newLedger = {
               id: `CAS-${Date.now().toString().slice(-4)}`,
               code: newPay.id,
               date: new Date().toISOString().split("T")[0],
               description: `Pembayaran ${newPay.category} - ${newPay.studentName}`,
               inAmount: Number(newPay.amount) || 0,
               outAmount: 0
             };
             state.cashLedger.push(newLedger);
             syncEntityToFirestore('cashLedger', newLedger.id, newLedger);
           }
        }

        return res.json({ success: true, updated: newPay, item: newPay });
      }
    }

    if (dataType === "customization" && action === "update") {
      // Check if lmsClasses is being updated to log
      if (payload.lmsClasses && state.customization.lmsClasses) {
        const oldLen = state.customization.lmsClasses.length;
        const newLen = payload.lmsClasses.length;
        if (oldLen !== newLen) {
           if (!state.logs) state.logs = [];
           const actionDesc = newLen > oldLen ? "Menambahkan Kelas Baru" : "Menghapus Kelas";
           state.logs.unshift({
              id: `LOG-${Date.now()}`,
              user: req.body.actingUserName ? `[${req.body.userRole || 'Admin'}] ${req.body.actingUserName}` : "Admin/VVIP",
              action: actionDesc,
              target: "Sistem Kelas",
              time: new Date().toISOString(),
              type: "system",
              details: `Total kelas berubah dari ${oldLen} menjadi ${newLen}`
           });
           if (state.logs.length > 200) state.logs.pop();
           syncEntityToFirestore("logs", "audit_trail", { entries: state.logs });
        }
      }

      const { lmsClasses, deletedLmsClassId, renamedClass, ...payloadWithoutClasses } = payload;
      state.customization = {
        ...state.customization,
        ...payloadWithoutClasses
      };
      if (lmsClasses) {
         state.customization.lmsClasses = lmsClasses;
         state.lmsClasses = lmsClasses;
         lmsClasses.forEach(syncLmsClassToFirestore);
      }
      if (deletedLmsClassId) {
         state.lmsClasses = (state.lmsClasses || []).filter((c: any) => c.id !== deletedLmsClassId && (c.name || '').toLowerCase() !== deletedLmsClassId.toLowerCase());
         state.customization.lmsClasses = (state.customization.lmsClasses || []).filter((c: any) => c.id !== deletedLmsClassId && (c.name || '').toLowerCase() !== deletedLmsClassId.toLowerCase());
         deleteEntityFromFirestore("lmsClasses", deletedLmsClassId);
      }

      if (renamedClass && renamedClass.oldName && renamedClass.newName) {
        const { oldName, newName } = renamedClass;
        if (state.activeStudents) {
          state.activeStudents.forEach(s => {
            if (s.class === oldName) {
              s.class = newName;
              syncEntityToFirestore("activeStudents", s.id, s);
            }
          });
        }
        if (state.users) {
          state.users.forEach(u => {
            if (u.assignedClass === oldName) {
              u.assignedClass = newName;
              syncEntityToFirestore("users", u.username, u);
            }
          });
        }
        if (state.registeredStudents) {
          state.registeredStudents.forEach(r => {
            if (r.class === oldName) {
              r.class = newName;
              syncEntityToFirestore("registeredStudents", r.id, r);
            }
          });
        }
        if (state.events) {
          state.events.forEach(e => {
            if (e.targetClass === oldName) {
              e.targetClass = newName;
              syncEntityToFirestore("events", e.id, e);
            }
          });
        }
        if (state.lmsLessons) {
          state.lmsLessons.forEach(l => {
            if (l.targetClass === oldName) {
              l.targetClass = newName;
              syncEntityToFirestore("lmsLessons", l.id, l);
            }
          });
        }
        if (state.lmsQuizzes) {
          state.lmsQuizzes.forEach(q => {
            if (q.targetClass === oldName) {
              q.targetClass = newName;
              syncEntityToFirestore("lmsQuizzes", q.id, q);
            }
          });
        }
      }
      syncCustomizationToFirestore(state.customization);
      return res.json({ success: true, customization: state.customization });
    }

    if (dataType === "chapterAssessments") {
      if (action === "update" || action === "UPDATE") {
        if (!state.chapterAssessments) {
          state.chapterAssessments = [];
        }
        const { studentId, studentName, chapterNumber, title, status, score, scoreKotoba, scoreBumpo, scoreKaiwa, scoreKanji, grade, notes, assessedBy, subject, isUnlocked } = payload;
        
        let index = state.chapterAssessments.findIndex(
          c => {
            if (payload.lessonId && c.lessonId === payload.lessonId) {
              return c.studentId === studentId;
            }
            return c.studentId === studentId && 
                   c.chapterNumber === Number(chapterNumber) && 
                   (c.subject || "Bahasa Jepang") === (subject || "Bahasa Jepang");
          }
        );

        const existingRecord = index !== -1 ? state.chapterAssessments[index] : null;

        const record = {
          id: existingRecord ? existingRecord.id : `CH-ASS-${Date.now().toString().slice(-4)}-${Math.floor(Math.random()*900)+100}`,
          studentId,
          studentName,
          chapterNumber: Number(chapterNumber),
          title,
          status,
          score: score !== undefined && score !== null && score !== "" ? Number(score) : undefined,
          scoreKotoba: scoreKotoba !== undefined && scoreKotoba !== null && scoreKotoba !== "" ? Number(scoreKotoba) : undefined,
          scoreBumpo: scoreBumpo !== undefined && scoreBumpo !== null && scoreBumpo !== "" ? Number(scoreBumpo) : undefined,
          scoreKaiwa: scoreKaiwa !== undefined && scoreKaiwa !== null && scoreKaiwa !== "" ? Number(scoreKaiwa) : undefined,
          scoreKanji: scoreKanji !== undefined && scoreKanji !== null && scoreKanji !== "" ? Number(scoreKanji) : undefined,
          grade: grade || undefined,
          notes: notes || "",
          assessedBy: assessedBy || "Sensei Utama",
          assessedDate: new Date().toISOString().split("T")[0],
          subject: subject || "Bahasa Jepang",
          isUnlocked: isUnlocked !== undefined ? !!isUnlocked : (existingRecord ? !!existingRecord.isUnlocked : Number(chapterNumber) === 1),
          lessonId: payload.lessonId || (existingRecord ? existingRecord.lessonId : undefined),
          submissionUrl: payload.submissionUrl || (existingRecord ? existingRecord.submissionUrl : undefined),
          submissionDate: payload.submissionDate || (existingRecord ? existingRecord.submissionDate : undefined)
        };

        if (index !== -1) {
          state.chapterAssessments[index] = record;
        } else {
          state.chapterAssessments.push(record);
        }

        return res.json({ success: true, item: record });
      }

      if (action === "delete") {
        if (state.chapterAssessments) {
          state.chapterAssessments = state.chapterAssessments.filter(c => c.id !== payload.id);
          deleteEntityFromFirestore("chapterAssessments", payload.id);
        }
        return res.json({ success: true });
      }
    }

    if (dataType === "jobOrders") {
      if (!state.jobOrders) {
        state.jobOrders = [];
      }

      if (action === "add") {
        const { 
          jobType, partnerName, noReg, occupation, location, salary, overtime, allowance, contractDuration,
          tbRequirement, bbRequirement, interviewExecution, interviewDate, scheduleRegistration, scheduleDocumentSelection, scheduleAnnouncement, scheduleMcu,
          gender, ageRequirement, recruitCount, jobDescription,
          minJapaneseScore, minAttendanceScore, minFiveSScore, minMathScore, minEthicsScore
        } = payload;
        
        const newJob = {
          id: `JOB-${(state.jobOrders.length + 1).toString().padStart(3, "0")}`,
          noReg: noReg || `REG-JOB-${Date.now().toString().slice(-4)}`,
          jobType: jobType || "Tokutei ginou",
          partnerName,
          occupation,
          location,
          salary,
          overtime,
          allowance,
          contractDuration,
          tbRequirement,
          bbRequirement,
          interviewExecution,
          interviewDate,
          scheduleRegistration,
          scheduleDocumentSelection,
          scheduleAnnouncement,
          scheduleMcu,
          gender: gender || "LAKI-LAKI / PEREMPUAN",
          ageRequirement: ageRequirement || "Usia 18 – 30 tahun",
          recruitCount: recruitCount || "6 siswa",
          jobDescription: jobDescription || "",
          minJapaneseScore: minJapaneseScore || "BAB 15",
          minAttendanceScore: minAttendanceScore || "80",
          minFiveSScore: minFiveSScore || "80",
          minMathScore: minMathScore || "90",
          minEthicsScore: minEthicsScore || "80",
          status: "Aktif" as const,
          recommendations: [],
          interestedStudents: [],
          approvedApplicants: [],
          applicantDocuments: {}
        };
        state.jobOrders.unshift(newJob);

        // Auto broadcast notification as a CalendarEvent to students and other roles
        if (!state.events) {
          state.events = [];
        }
        const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const jobEvent = {
          id: `EV-JOB-${Date.now().toString().slice(-4)}`,
          title: `Lowongan Kerja Baru: ${occupation} di ${location}`,
          date: todayStr,
          desc: `Telah dibuka lowongan baru oleh ${partnerName} untuk posisi ${occupation}. Gaji Pokok: ${salary}, Kontrak: ${contractDuration}. Silakan cek tab Karir / Lowongan Kerja di LMS Anda untuk mendaftar seleksi ini! 🚀`,
          targets: ["Siswa", "Pengajar", "Admin", "VVIP"]
        };
        state.events.push(jobEvent);
        try {
          syncEntityToFirestore("events", jobEvent.id, jobEvent);
        } catch (e) {
          console.error("Failed to sync auto-broadcasted job event to Firestore:", e);
        }

        syncEntityToFirestore("jobOrders", newJob.id, newJob);
        return res.json({ success: true, item: newJob });
      }

      if (action === "recommend") {
        const { jobOrderId, studentId } = payload;
        const jobIndex = state.jobOrders.findIndex(j => j.id === jobOrderId);
        if (jobIndex !== -1) {
          if (!state.jobOrders[jobIndex].recommendations) {
            state.jobOrders[jobIndex].recommendations = [];
          }
          if (!state.jobOrders[jobIndex].recommendations.includes(studentId)) {
            state.jobOrders[jobIndex].recommendations.push(studentId);
            
            // Auto broadcast notification to the student
            const job = state.jobOrders[jobIndex];
            if (!state.events) {
              state.events = [];
            }
            const todayStr = new Date().toISOString().split("T")[0];
            const recEvent = {
              id: `EV-REC-${Date.now().toString().slice(-5)}`,
              title: `Rekomendasi Job Order: ${job.occupation}`,
              date: todayStr,
              desc: `Anda direkomendasikan untuk posisi ${job.occupation} di ${job.partnerName}. Segera cek tab Karir / Lowongan Kerja.`,
              targets: ["Siswa", studentId]
            };
            state.events.push(recEvent);
            try {
              syncEntityToFirestore("events", recEvent.id, recEvent);
            } catch (e) {
              console.error("Failed to sync auto-broadcasted rec event to Firestore:", e);
            }
          }
          syncEntityToFirestore("jobOrders", state.jobOrders[jobIndex].id, state.jobOrders[jobIndex]);
          return res.json({ success: true, item: state.jobOrders[jobIndex] });
        }
        return res.status(404).json({ error: "Job order not found" });
      }

      if (action === "remove_recommendation") {
        const { jobOrderId, studentId } = payload;
        const jobIndex = state.jobOrders.findIndex(j => j.id === jobOrderId);
        if (jobIndex !== -1) {
          if (state.jobOrders[jobIndex].recommendations) {
            state.jobOrders[jobIndex].recommendations = state.jobOrders[jobIndex].recommendations.filter((id: string) => id !== studentId);
          }
          syncEntityToFirestore("jobOrders", state.jobOrders[jobIndex].id, state.jobOrders[jobIndex]);
          return res.json({ success: true, item: state.jobOrders[jobIndex] });
        }
        return res.status(404).json({ error: "Job order not found" });
      }

      if (action === "toggle_status") {
        const { id } = payload;
        const jobIndex = state.jobOrders.findIndex(j => j.id === id);
        if (jobIndex !== -1) {
          state.jobOrders[jobIndex].status = state.jobOrders[jobIndex].status === "Aktif" ? "Tutup" : "Aktif";
          syncEntityToFirestore("jobOrders", state.jobOrders[jobIndex].id, state.jobOrders[jobIndex]);
          return res.json({ success: true, item: state.jobOrders[jobIndex] });
        }
        return res.status(404).json({ error: "Job order not found" });
      }

      if (action === "delete") {
        const { id } = payload;
        state.jobOrders = state.jobOrders.filter(j => j.id !== id);
        if (id) deleteEntityFromFirestore("jobOrders", id);
        return res.json({ success: true, id });
      }

      if (action === "edit") {
        const { id, updates } = payload;
        const jobIndex = state.jobOrders.findIndex(j => j.id === id);
        if (jobIndex !== -1) {
          state.jobOrders[jobIndex] = { ...state.jobOrders[jobIndex], ...updates };
          syncEntityToFirestore("jobOrders", state.jobOrders[jobIndex].id, state.jobOrders[jobIndex]);
          return res.json({ success: true, item: state.jobOrders[jobIndex] });
        }
        return res.status(404).json({ error: "Job order not found" });
      }

      if (action === "express_interest") {
        const { jobOrderId, studentId } = payload;
        const jobIndex = state.jobOrders.findIndex(j => j.id === jobOrderId);
        if (jobIndex !== -1) {
          if (!state.jobOrders[jobIndex].interestedStudents) {
            state.jobOrders[jobIndex].interestedStudents = [];
          }
          if (!state.jobOrders[jobIndex].interestedStudents.includes(studentId)) {
            state.jobOrders[jobIndex].interestedStudents.push(studentId);
          }
          syncEntityToFirestore("jobOrders", state.jobOrders[jobIndex].id, state.jobOrders[jobIndex]);
          return res.json({ success: true, item: state.jobOrders[jobIndex] });
        }
        return res.status(404).json({ error: "Job order not found" });
      }

      if (action === "cancel_interest") {
        const { jobOrderId, studentId } = payload;
        const jobIndex = state.jobOrders.findIndex(j => j.id === jobOrderId);
        if (jobIndex !== -1) {
          if (state.jobOrders[jobIndex].interestedStudents) {
            state.jobOrders[jobIndex].interestedStudents = state.jobOrders[jobIndex].interestedStudents.filter((id: string) => id !== studentId);
          }
          // Also clear approved status if they cancel interest
          if (state.jobOrders[jobIndex].approvedApplicants) {
            state.jobOrders[jobIndex].approvedApplicants = state.jobOrders[jobIndex].approvedApplicants.filter((id: string) => id !== studentId);
          }
          syncEntityToFirestore("jobOrders", state.jobOrders[jobIndex].id, state.jobOrders[jobIndex]);
          return res.json({ success: true, item: state.jobOrders[jobIndex] });
        }
        return res.status(404).json({ error: "Job order not found" });
      }

      if (action === "approve_interest") {
        const { jobOrderId, studentId } = payload;
        const jobIndex = state.jobOrders.findIndex(j => j.id === jobOrderId);
        if (jobIndex !== -1) {
          if (!state.jobOrders[jobIndex].approvedApplicants) {
            state.jobOrders[jobIndex].approvedApplicants = [];
          }
          if (!state.jobOrders[jobIndex].approvedApplicants.includes(studentId)) {
            state.jobOrders[jobIndex].approvedApplicants.push(studentId);
          }
          syncEntityToFirestore("jobOrders", state.jobOrders[jobIndex].id, state.jobOrders[jobIndex]);
          return res.json({ success: true, item: state.jobOrders[jobIndex] });
        }
        return res.status(404).json({ error: "Job order not found" });
      }

      if (action === "reject_interest") {
        const { jobOrderId, studentId } = payload;
        const jobIndex = state.jobOrders.findIndex(j => j.id === jobOrderId);
        if (jobIndex !== -1) {
          if (state.jobOrders[jobIndex].approvedApplicants) {
            state.jobOrders[jobIndex].approvedApplicants = state.jobOrders[jobIndex].approvedApplicants.filter((id: string) => id !== studentId);
          }
          syncEntityToFirestore("jobOrders", state.jobOrders[jobIndex].id, state.jobOrders[jobIndex]);
          return res.json({ success: true, item: state.jobOrders[jobIndex] });
        }
        return res.status(404).json({ error: "Job order not found" });
      }

      if (action === "submit_applicant_documents") {
        const { jobOrderId, studentId, documents } = payload;
        const jobIndex = state.jobOrders.findIndex(j => j.id === jobOrderId);
        if (jobIndex !== -1) {
          if (!state.jobOrders[jobIndex].applicantDocuments) {
            state.jobOrders[jobIndex].applicantDocuments = {};
          }
          state.jobOrders[jobIndex].applicantDocuments[studentId] = {
            ...state.jobOrders[jobIndex].applicantDocuments[studentId],
            ...documents
          };
          syncEntityToFirestore("jobOrders", state.jobOrders[jobIndex].id, state.jobOrders[jobIndex]);
          return res.json({ success: true, item: state.jobOrders[jobIndex] });
        }
        return res.status(404).json({ error: "Job order not found" });
      }
    }

    if (dataType === "activeStudents") {
      if (!state.activeStudents) {
        state.activeStudents = [];
      }

      // Helper to synchronize activeStudent with user account when they are Alumni
      const syncActiveStudentToAlumniUser = (studentId: string, studentName: string, status: string, profilePicture?: string) => {
        const studentObj = state.activeStudents.find((s: any) => s.id === studentId);
        const isAlumni = ["Lulus", "Di Jepang"].includes(status) && studentObj?.statusPendaftaran === "Alumni";
        
        if (isAlumni) {
          const protectedRoles = ["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"];
          const userIndex = state.users.findIndex(u => !protectedRoles.includes(u.role) && ((u.studentId && u.studentId === studentId) || u.name === studentName));
          if (userIndex !== -1) {
            const currentRole = state.users[userIndex].role;
            const protectedRoles = ["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"];
            if (currentRole !== "Alumni" && !protectedRoles.includes(currentRole)) {
              state.users[userIndex].role = "Alumni";
              state.users[userIndex].assignedClass = "";
            }
            if (profilePicture) {
              state.users[userIndex].profilePicture = profilePicture;
            }
            syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
          } else {
            let baseUsername = studentName.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (!baseUsername) baseUsername = "alumni";
            let usernameVal = baseUsername;
            let uNum = 1;
            while (state.users.some(u => u.username === usernameVal)) {
              usernameVal = `${baseUsername}${uNum}`;
              uNum++;
            }
            const newUser = {
              username: usernameVal,
              name: studentName,
              email: "",
              password: "",
              role: "Alumni" as const,
              status: "Active" as const,
              studentId: studentId,
              assignedClass: "",
              profilePicture: profilePicture || ""
            };
            state.users.push(newUser);
            syncEntityToFirestore("users", newUser.username, newUser);
          }
        }
      };

      if (action === "delete") {
        const { id } = payload;
        const studentToDelete = state.activeStudents.find((s: any) => s.id === id);
        state.activeStudents = state.activeStudents.filter((s: any) => s.id !== id);
        if (id) {
          deleteEntityFromFirestore("activeStudents", id);
        }

        if (studentToDelete) {
          if (studentToDelete.id && studentToDelete.id !== id) {
            deleteEntityFromFirestore("activeStudents", studentToDelete.id);
          }
          // Cascade delete from users
          const userAccount = state.users.find(
            (u: any) => (u.studentId && u.studentId === id) || 
                        (u.name && studentToDelete.name && u.name.trim().toLowerCase() === studentToDelete.name.trim().toLowerCase())
          );
          if (userAccount) {
            state.users = state.users.filter((u: any) => u.username !== userAccount.username);
            deleteEntityFromFirestore("users", userAccount.username);
          }

          // Cascade delete from registeredStudents
          const regStudent = state.registeredStudents.find(
            (s: any) => s.id === id || 
                        (s.name && studentToDelete.name && s.name.trim().toLowerCase() === studentToDelete.name.trim().toLowerCase())
          );
          if (regStudent) {
            state.registeredStudents = state.registeredStudents.filter((s: any) => s.id !== regStudent.id);
            deleteEntityFromFirestore("registeredStudents", regStudent.id);
          }
        }
        return res.json({ success: true, id });
      }
      if (action === "add") {
        const { name, batch, class: className, status, prefecture, city, company, latitude, longitude, sensei, graduationYear } = payload;
        let idNum = state.activeStudents.length + 1;
        let newId = `SIS-${idNum.toString().padStart(3, "0")}`;
        while (state.activeStudents.some(s => s.id === newId)) {
          idNum++;
          newId = `SIS-${idNum.toString().padStart(3, "0")}`;
        }

        const isAlumni = ["Lulus", "Di Jepang"].includes(status || "Di Jepang");
        const finalClass = isAlumni ? "" : (className || "");
        const finalSensei = isAlumni ? "" : (sensei || "Sensei Utama");

        const newStudent = {
          id: newId,
          name,
          batch: batch || "Angkatan 11",
          class: finalClass,
          status: status || "Di Jepang",
          statusPendaftaran: isAlumni ? "Alumni" : "Siswa Baru",
          kategoriPendaftaran: isAlumni ? "Alumni" : "Siswa Baru",
          prefecture,
          city,
          company,
          graduationYear,
          latitude: latitude !== undefined && latitude !== null ? Number(latitude) : undefined,
          longitude: longitude !== undefined && longitude !== null ? Number(longitude) : undefined,
          sensei: finalSensei
        };
        state.activeStudents.push(newStudent);

        // Sync with users account (creating if they don't exist yet)
        syncActiveStudentToAlumniUser(newId, name, newStudent.status, payload.profilePicture);

        return res.json({ success: true, item: newStudent });
      }

      if (action === "update") {
         const { id } = payload;
         const index = state.activeStudents.findIndex(s => s.id === id);
         if (index !== -1) {
            const oldStudent = state.activeStudents[index];
            state.activeStudents[index] = { ...state.activeStudents[index], ...payload };
            if (payload.docFoto && payload.docFoto !== oldStudent.docFoto) {
              state.activeStudents[index].profilePicture = payload.docFoto.includes('|') ? payload.docFoto.split('|')[1] : payload.docFoto;
              payload.profilePicture = state.activeStudents[index].profilePicture; // to trigger user sync below
            }

            const isAlumni = ["Lulus", "Di Jepang"].includes(state.activeStudents[index].status);
            if (isAlumni) {
              state.activeStudents[index].class = "";
              state.activeStudents[index].sensei = "";
              state.activeStudents[index].statusPendaftaran = "Alumni";
              state.activeStudents[index].kategoriPendaftaran = "Alumni";
              syncActiveStudentToAlumniUser(id, state.activeStudents[index].name, state.activeStudents[index].status, state.activeStudents[index].profilePicture);
            } else {
              // Sync up to UserAccount if they are regular
              const userIndex = state.users.findIndex(u => 
                !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && (
                  (u.studentId === id) || 
                  (u.name === oldStudent.name)
                )
              );
              if (userIndex !== -1) {
                let updatedUser = false;
                if (payload.profilePicture !== undefined && state.users[userIndex].profilePicture !== payload.profilePicture) {
                  state.users[userIndex].profilePicture = payload.profilePicture;
                  updatedUser = true;
                }
                if (payload.name !== undefined && state.users[userIndex].name !== payload.name) {
                  state.users[userIndex].name = payload.name;
                  updatedUser = true;
                }
                if (payload.class !== undefined && state.users[userIndex].assignedClass !== payload.class) {
                  state.users[userIndex].assignedClass = payload.class;
                  updatedUser = true;
                }
                if (updatedUser) {
                  syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
                }
              }
            }

            return res.json({ success: true, item: state.activeStudents[index] });
         } else {
            return res.status(404).json({ error: "Student not found to update." });
         }
      }

      if (action === "update_status") {
        const { id, status, class: className, prefecture, city, company, latitude, longitude, profilePicture, sensei, statusPendaftaran, graduationYear, phone, name, currentChapter } = payload;
        const index = state.activeStudents.findIndex(s => s.id === id);
        if (index !== -1) {
          if (status) {
            state.activeStudents[index].status = status;
          }
          if (name) {
            state.activeStudents[index].name = name;
          }
          if (phone) {
            state.activeStudents[index].phone = phone;
          }
          if (graduationYear !== undefined) {
            state.activeStudents[index].graduationYear = graduationYear;
          }
          if (statusPendaftaran) {
            state.activeStudents[index].statusPendaftaran = statusPendaftaran;
            state.activeStudents[index].kategoriPendaftaran = statusPendaftaran === "Alumni" ? "Alumni" : "Siswa";
          }

          // If status is an alumni status (Lulus, Di Jepang), default to Alumni IF NOT ALREADY SET TO SISWA
          const isAlumniStatus = ["Lulus", "Di Jepang"].includes(state.activeStudents[index].status);
          if (isAlumniStatus) {
            // Only force Alumni if it's not explicitly set to a student status or if it was previously empty/siswa and we are transitioning to Japan
            if (!statusPendaftaran && state.activeStudents[index].statusPendaftaran !== "Siswa Baru" && state.activeStudents[index].statusPendaftaran !== "Siswa") {
              state.activeStudents[index].statusPendaftaran = "Alumni";
              state.activeStudents[index].kategoriPendaftaran = "Alumni";
            }
            
            state.activeStudents[index].class = "";
            state.activeStudents[index].sensei = "";

            // Sync status to registeredStudents if exists
            const regIndex = state.registeredStudents.findIndex(rs => rs.id === id || rs.name.trim().toLowerCase() === state.activeStudents[index].name.trim().toLowerCase());
            if (regIndex !== -1) {
              // Only update if not explicitly kept as Siswa
              if (state.activeStudents[index].statusPendaftaran === "Alumni") {
                state.registeredStudents[regIndex].statusPendaftaran = "Alumni";
              }
              state.registeredStudents[regIndex].status = "Disetujui";
              syncEntityToFirestore("registeredStudents", state.registeredStudents[regIndex].id, state.registeredStudents[regIndex]);
            }

            syncActiveStudentToAlumniUser(id, state.activeStudents[index].name, state.activeStudents[index].status, state.activeStudents[index].profilePicture);
          } else {
            // Only reset to Siswa Baru if not already an Alumni (don't downgrade alumni back to student unless status changed back to Belajar etc)
            if (!statusPendaftaran && (status === "Belajar" || status === "On Proges Job" || status === "On Progres JFT/JLPT/SSW" || status === "Diklat SO")) {
               state.activeStudents[index].statusPendaftaran = "Siswa Baru";
               state.activeStudents[index].kategoriPendaftaran = "Siswa";
            }

            // Sync back user role to Siswa if it is currently Alumni and status is back to Belajar
            const userIndex = state.users.findIndex(u => !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && ((u.studentId && u.studentId === id) || u.name === state.activeStudents[index].name));
            if (userIndex !== -1) {
              if (state.users[userIndex].role === "Alumni" && (status === "Belajar" || status === "On Proges Job")) {
                state.users[userIndex].role = "Siswa";
              }
              syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
            }
          }

          if (className !== undefined) {
            state.activeStudents[index].class = className;
            // Automatically find and assign the sensei for this class!
            if (className) {
              const classSensei = state.users.find(u => u.role === "Pengajar" && u.assignedClass && u.assignedClass.toLowerCase() === className.toLowerCase());
              if (classSensei) {
                state.activeStudents[index].sensei = classSensei.name;
              } else {
                state.activeStudents[index].sensei = "";
              }
            } else {
              state.activeStudents[index].sensei = "";
            }
          }
          if (sensei !== undefined) {
            state.activeStudents[index].sensei = sensei;
          }
          if (prefecture !== undefined) {
            state.activeStudents[index].prefecture = prefecture;
          }
          if (city !== undefined) {
            state.activeStudents[index].city = city;
          }
          if (company !== undefined) {
            state.activeStudents[index].company = company;
          }
          if (latitude !== undefined) {
            state.activeStudents[index].latitude = latitude !== null ? Number(latitude) : undefined;
          }
          if (longitude !== undefined) {
            state.activeStudents[index].longitude = longitude !== null ? Number(longitude) : undefined;
          }
          if (profilePicture !== undefined) {
            state.activeStudents[index].profilePicture = profilePicture;
            
            // Also sync back to registeredStudents docFoto!
            const actStudent = state.activeStudents[index];
            const regIndex = state.registeredStudents.findIndex(rs => rs.id === id || rs.name.trim().toLowerCase() === actStudent.name.trim().toLowerCase());
            if (regIndex !== -1) {
              state.registeredStudents[regIndex].docFoto = profilePicture;
              syncEntityToFirestore("registeredStudents", state.registeredStudents[regIndex].id, state.registeredStudents[regIndex]);
            }
          }
          if (currentChapter !== undefined) {
            state.activeStudents[index].currentChapter = currentChapter;
          }
          
          const actStudent = state.activeStudents[index];
          const regIndex = state.registeredStudents.findIndex(rs => rs.id === id || rs.name.trim().toLowerCase() === actStudent.name.trim().toLowerCase());

          // Sync up to UserAccount!
          const userIndex = state.users.findIndex(u => 
             !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && (
               (u.studentId && u.studentId === id) || 
               (u.name && u.name.trim().toLowerCase() === actStudent.name.trim().toLowerCase()) ||
               (regIndex !== -1 && u.email && u.email.trim().toLowerCase() === state.registeredStudents[regIndex].email.trim().toLowerCase()) ||
               (regIndex !== -1 && u.username && u.username.trim().toLowerCase() === state.registeredStudents[regIndex].email.trim().toLowerCase())
             )
          );
          if (userIndex !== -1) {
            let userUpdated = false;
            if (profilePicture !== undefined && state.users[userIndex].profilePicture !== profilePicture) {
              state.users[userIndex].profilePicture = profilePicture;
              userUpdated = true;
            }
            if (className !== undefined && state.users[userIndex].assignedClass !== className) {
              state.users[userIndex].assignedClass = className;
              userUpdated = true;
            }
            if (userUpdated) {
              syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
            }
          }

          syncEntityToFirestore("activeStudents", state.activeStudents[index].id, state.activeStudents[index]);
          return res.json({ success: true, item: state.activeStudents[index] });
        }
        return res.status(404).json({ error: "Student not found" });
      }
    }

    if (dataType === "events") {
      if (!state.events) {
        state.events = [];
      }
      if (action === "add") {
        const { title, date, desc, targets, type, studyTime, reminderTime, targetClass, time, url, location } = payload;
        const newEvent = {
          id: `EV-${Date.now().toString().slice(-4)}`,
          title,
          date,
          desc,
          targets: targets || ["Siswa", "Pengajar", "Admin", "VVIP"],
          type: type || "Kegiatan",
          studyTime: studyTime || "",
          reminderTime: reminderTime || "",
          targetClass: targetClass || "",
          time: time || "",
          url: url || "",
          location: location || ""
        };
        state.events.push(newEvent);
        try {
          syncEntityToFirestore("events", newEvent.id, newEvent);
        } catch (e) {
          console.error("Failed to sync newly added event to Firestore:", e);
        }
        return res.json({ success: true, item: newEvent });
      }
      if (action === "update") {
        const { id, title, date, desc, targets, type, studyTime, reminderTime, targetClass, time, url, location } = payload;
        const index = state.events.findIndex(e => e.id === id);
        if (index !== -1) {
          state.events[index] = {
            ...state.events[index],
            title: title !== undefined ? title : state.events[index].title,
            date: date !== undefined ? date : state.events[index].date,
            desc: desc !== undefined ? desc : state.events[index].desc,
            targets: targets !== undefined ? targets : state.events[index].targets,
            type: type !== undefined ? type : state.events[index].type,
            studyTime: studyTime !== undefined ? studyTime : state.events[index].studyTime,
            reminderTime: reminderTime !== undefined ? reminderTime : state.events[index].reminderTime,
            targetClass: targetClass !== undefined ? targetClass : state.events[index].targetClass,
            time: time !== undefined ? time : state.events[index].time,
            url: url !== undefined ? url : state.events[index].url,
            location: location !== undefined ? location : state.events[index].location,
          };
          try {
            syncEntityToFirestore("events", id, state.events[index]);
          } catch (e) {
            console.error("Failed to sync updated event to Firestore:", e);
          }
          return res.json({ success: true, item: state.events[index] });
        }
        return res.status(404).json({ error: "Event not found" });
      }
      if (action === "delete") {
        const { id } = payload;
        state.events = state.events.filter(e => e.id !== id);
        try {
          deleteEntityFromFirestore("events", id);
        } catch (e) {
          console.error("Failed to delete event from Firestore:", e);
        }
        return res.json({ success: true, id });
      }
    }

    if (dataType === "users") {
      if (!state.users) {
        state.users = [];
      }
      if (action === "add") {
        const { username, name, email, role, studentId, assignedClass, password, japaneseLevel, kecakapanSensei } = payload;
        const exists = state.users.some(u => u.username === username);
        if (exists) {
          return res.status(400).json({ error: "Username sudah digunakan!" });
        }
        const newUser = { username, name, email, role, studentId, assignedClass, password, japaneseLevel, kecakapanSensei };
        state.users.push(newUser);

        // Sync to ActiveStudents if role is Siswa
        if (role === "Siswa" && studentId && assignedClass) {
          const actIndex = state.activeStudents.findIndex(s => s.id === studentId );
          if (actIndex !== -1) {
            state.activeStudents[actIndex].class = assignedClass;
            syncEntityToFirestore("activeStudents", state.activeStudents[actIndex].id, state.activeStudents[actIndex]);
          }
        }
        return res.json({ success: true, item: newUser });
      }
      if (action === "edit") {
        const { username, name, email, role, studentId, profilePicture, assignedClass, password, status, bankAccount, faceRegistered, faceBiometricData, lastActive, japaneseLevel, kecakapanSensei, docCV, docIjazah, docSertifikat, docKTP } = payload;
        const index = state.users.findIndex(u => u.username === username);
        if (index !== -1) {
          const oldData = state.users[index];
          state.users[index] = {
            ...state.users[index],
            name: name !== undefined ? name : state.users[index].name,
            email: email !== undefined ? email : state.users[index].email,
            role: role !== undefined ? role : state.users[index].role,
            studentId: studentId !== undefined ? studentId : state.users[index].studentId,
            profilePicture: profilePicture !== undefined ? profilePicture : state.users[index].profilePicture,
            assignedClass: assignedClass !== undefined ? assignedClass : state.users[index].assignedClass,
            password: password !== undefined ? password : state.users[index].password,
            status: status !== undefined ? status : (state.users[index].status || "Active"),
            bankAccount: bankAccount !== undefined ? bankAccount : state.users[index].bankAccount,
            faceRegistered: faceRegistered !== undefined ? faceRegistered : state.users[index].faceRegistered,
            faceBiometricData: faceBiometricData !== undefined ? faceBiometricData : state.users[index].faceBiometricData,
            lastActive: lastActive !== undefined ? lastActive : state.users[index].lastActive,
            japaneseLevel: japaneseLevel !== undefined ? japaneseLevel : state.users[index].japaneseLevel,
            kecakapanSensei: kecakapanSensei !== undefined ? kecakapanSensei : state.users[index].kecakapanSensei,
            docCV: docCV !== undefined ? docCV : state.users[index].docCV,
            docIjazah: docIjazah !== undefined ? docIjazah : state.users[index].docIjazah,
            docSertifikat: docSertifikat !== undefined ? docSertifikat : state.users[index].docSertifikat,
            docKTP: docKTP !== undefined ? docKTP : state.users[index].docKTP,
          };

          // Audit Log
          let detailsMsg = "Profile updated";
          let actionMsg = `Update Akun: ${state.users[index].name}`;
          
          if (status !== undefined && status !== oldData.status) {
            detailsMsg = `Status changed to ${status}`;
          } else if (assignedClass !== undefined && assignedClass !== oldData.assignedClass) {
            detailsMsg = `Ploting kelas diubah menjadi ${assignedClass || 'Kosong'}`;
            actionMsg = `Ploting Kelas: ${state.users[index].name}`;
            
            // If this is a Pengajar, automatically sync all active students in this class to have this sensei!
            if (state.users[index].role === "Pengajar" && assignedClass) {
              state.activeStudents.forEach(s => {
                if (s.class && s.class.toLowerCase() === assignedClass.toLowerCase()) {
                  s.sensei = state.users[index].name;
                  syncEntityToFirestore("activeStudents", s.id, s);
                }
              });
            }
          }

          if (!state.logs) state.logs = [];
          state.logs.unshift({
            id: `LOG-${Date.now()}`,
            user: req.body.actingUserName ? `[${req.body.userRole || 'Admin'}] ${req.body.actingUserName}` : "Admin/VVIP",
            action: actionMsg,
            target: state.users[index].username,
            time: new Date().toISOString(),
            type: "security",
            details: detailsMsg
          });
          if (state.logs.length > 200) state.logs.pop();
          syncEntityToFirestore("logs", "audit_trail", { entries: state.logs });

          // Synchronize profile picture, name, and class down to ActiveStudents and registeredStudents if they exist
          const currentUserObj = state.users[index];
          if (["Siswa", "Alumni"].includes(currentUserObj.role)) {
            const regIndex = state.registeredStudents.findIndex(rs => 
              rs.email.trim().toLowerCase() === currentUserObj.email.trim().toLowerCase() ||
              rs.name.trim().toLowerCase() === currentUserObj.name.trim().toLowerCase()
            );
            if (regIndex !== -1 && currentUserObj.profilePicture && state.registeredStudents[regIndex].docFoto !== currentUserObj.profilePicture) {
              state.registeredStudents[regIndex].docFoto = currentUserObj.profilePicture;
              syncEntityToFirestore("registeredStudents", state.registeredStudents[regIndex].id, state.registeredStudents[regIndex]);
            }

            const actIndex = state.activeStudents.findIndex(s => 
              (currentUserObj.studentId && s.id === currentUserObj.studentId) || 
              (regIndex !== -1 && s.id === state.registeredStudents[regIndex].id)
            );
            if (actIndex !== -1) {
              let updatedAct = false;
              if (currentUserObj.profilePicture && state.activeStudents[actIndex].profilePicture !== currentUserObj.profilePicture) {
                state.activeStudents[actIndex].profilePicture = currentUserObj.profilePicture;
                updatedAct = true;
              }
              if (currentUserObj.name && state.activeStudents[actIndex].name !== currentUserObj.name) {
                state.activeStudents[actIndex].name = currentUserObj.name;
                updatedAct = true;
              }
              if (currentUserObj.assignedClass && state.activeStudents[actIndex].class !== currentUserObj.assignedClass) {
                state.activeStudents[actIndex].class = currentUserObj.assignedClass;
                updatedAct = true;
              }
              if (updatedAct) {
                syncEntityToFirestore("activeStudents", state.activeStudents[actIndex].id, state.activeStudents[actIndex]);
              }
            }
          }
          syncEntityToFirestore("users", state.users[index].username, state.users[index]);
          return res.json({ success: true, item: state.users[index] });
        }
        return res.status(404).json({ error: "User tidak ditemukan!" });
      }
      if (action === "updateBank") {
        const { username, bankAccount } = payload;
        const index = state.users.findIndex(u => u.username === username);
        if (index !== -1) {
          state.users[index].bankAccount = bankAccount;
          syncEntityToFirestore("users", state.users[index].username, state.users[index]);
          return res.json({ success: true, item: state.users[index] });
        }
        return res.status(404).json({ error: "User tidak ditemukan!" });
      }
      if (action === "registerBiometric") {
        const { username, faceBiometricData } = payload;
        const index = state.users.findIndex(u => u.username === username);
        if (index !== -1) {
          state.users[index].faceRegistered = true;
          state.users[index].faceBiometricData = faceBiometricData || "REGISTERED_OK";
          syncEntityToFirestore("users", state.users[index].username, state.users[index]);
          return res.json({ success: true, item: state.users[index] });
        }
        return res.status(404).json({ error: "User tidak ditemukan!" });
      }
      if (action === "delete") {
        const { username } = payload;
        const userToDelete = state.users.find((u: any) => u.username === username);
        
        if (userToDelete) {
          // 1. Find and delete corresponding active student
          const actIndex = state.activeStudents.findIndex(
            (s: any) => s.id === userToDelete.studentId || 
                        (s.name && userToDelete.name && s.name.trim().toLowerCase() === userToDelete.name.trim().toLowerCase())
          );
          if (actIndex !== -1) {
             const actId = state.activeStudents[actIndex].id;
             state.activeStudents.splice(actIndex, 1);
             deleteEntityFromFirestore("activeStudents", actId);
          }

          // 2. Find and delete corresponding registeredStudent
          const regIndex = state.registeredStudents.findIndex(
            (s: any) => (s.id && userToDelete.studentId && s.id === userToDelete.studentId) || 
                        (s.email && userToDelete.email && s.email.trim().toLowerCase() === userToDelete.email.trim().toLowerCase()) ||
                        (s.name && userToDelete.name && s.name.trim().toLowerCase() === userToDelete.name.trim().toLowerCase())
          );
          if (regIndex !== -1) {
            const regId = state.registeredStudents[regIndex].id;
            state.registeredStudents.splice(regIndex, 1);
            deleteEntityFromFirestore("registeredStudents", regId);
          }
        }
        
        state.users = state.users.filter((u: any) => u.username !== username);
        if (username) {
          deleteEntityFromFirestore("users", username);
        }
        return res.json({ success: true, username });
      }
    }

    if (dataType === "logs") {
      if (!state.logs) {
        state.logs = [];
      }
      if (action === "add") {
        const logId = payload.id || `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const timeStr = payload.timestamp || payload.time || new Date().toISOString();
        const newLog = {
          id: logId,
          user: payload.user || "System",
          action: payload.action || payload.type || "Presensi",
          type: payload.type || "info",
          details: payload.description || payload.details || "",
          target: payload.target || "",
          time: timeStr,
          timestamp: timeStr,
          notes: payload.notes || "",
          description: payload.description || payload.details || "",
          clockType: payload.clockType || "",
          workMode: payload.workMode || "",
          latitude: payload.latitude || "",
          longitude: payload.longitude || "",
          location: payload.location || "",
          photoUrl: payload.photoUrl || ""
        };

        const existingIndex = state.logs.findIndex((l: any) => l.id === logId);
        if (existingIndex !== -1) {
          state.logs[existingIndex] = newLog;
        } else {
          state.logs.unshift(newLog);
        }
        if (state.logs.length > 500) {
          state.logs.pop();
        }
        
        syncEntityToFirestore("logs", logId, newLog);
        syncEntityToFirestore("logs", "audit_trail", { entries: state.logs });
        return res.json({ success: true, item: newLog });
      }

      if (action === "delete") {
        const { id } = payload;
        if (id) {
          state.logs = state.logs.filter((l: any) => l.id !== id);
          deleteEntityFromFirestore("logs", id);
          syncEntityToFirestore("logs", "audit_trail", { entries: state.logs });
        }
        return res.json({ success: true, id });
      }
    }

    if (dataType === "messages") {
      if (!state.messages) {
        state.messages = [];
      }
      if (action === "send") {
        const newMessage = {
          id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          senderId: payload.senderId,
          senderName: payload.senderName,
          senderRole: payload.senderRole,
          receiverId: payload.receiverId,
          text: payload.text,
          fileUrl: payload.fileUrl || "",
          fileType: payload.fileType || "",
          fileName: payload.fileName || "",
          timestamp: new Date().toISOString(),
          isRead: false
        };
        state.messages.push(newMessage);
        syncEntityToFirestore("messages", newMessage.id, newMessage);
        return res.json({ success: true, item: newMessage });
      }
      if (action === "mark_read") {
        const { id } = payload;
        const msgIndex = state.messages.findIndex(m => m.id === id);
        if (msgIndex !== -1) {
          state.messages[msgIndex].isRead = true;
          syncEntityToFirestore("messages", id, state.messages[msgIndex]);
          return res.json({ success: true, updated: state.messages[msgIndex] });
        }
      }
      if (action === "mark_read_all") {
        const { senderId, receiverId } = payload;
        let updatedCount = 0;
        state.messages.forEach((m, idx) => {
          if (m.senderId === senderId && m.receiverId === receiverId && !m.isRead) {
            state.messages[idx].isRead = true;
            syncEntityToFirestore("messages", m.id, state.messages[idx]);
            updatedCount++;
          }
        });
        return res.json({ success: true, updatedCount });
      }
      if (action === "delete") {
        const { id } = payload;
        state.messages = state.messages.filter(m => m.id !== id);
        if (id) deleteEntityFromFirestore("messages", id);
        return res.json({ success: true, id });
      }
      if (action === "clear_chat") {
        const { myChatId, otherChatId, isGroup } = payload;
        if (isGroup) {
          state.messages = state.messages.filter(m => m.receiverId !== otherChatId);
        } else {
          state.messages = state.messages.filter(m => !(
            (m.senderId === myChatId && m.receiverId === otherChatId) ||
            (m.senderId === otherChatId && m.receiverId === myChatId)
          ));
        }
        return res.json({ success: true });
      }
    }

    if (dataType === "slideshows" && action === "update") {
      state.slideshows = payload;
      syncEntityToFirestore("system", "slideshows", { data: state.slideshows });
      return res.json({ success: true, item: { id: "slideshows", data: state.slideshows } });
    }
    if (dataType === "galleries" && action === "update") {
      state.galleries = payload;
      syncEntityToFirestore("system", "galleries", { data: state.galleries });
      return res.json({ success: true, item: { id: "galleries", data: state.galleries } });
    }
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

  // Wait for Firebase before listening to avoid race conditions returning empty states on cold starts
    try {
      testConnection(); // Run in the background to avoid blocking server boot and speed up cold starts
      
      // Load state from Firestore overlaying the default memory mock state!
      console.log("Synchronizing memory state with Firebase Firestore...");
      const loadedState = await loadStateFromFirestore(state);
      if (loadedState) {
        state = loadedState;

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
                // If the user exists but their role is not "Alumni", update it!
                // CRITICAL FIX: Do NOT override roles if they are already higher level (Sensei, Admin, VVIP)
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
                  password: "",
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

      console.log("🔥 Memory state loaded successfully!");
    } catch (err) {
      console.error("Error during background Firestore sync:", err);
    }
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server fully operational on http://localhost:${PORT} under environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

startServer();
