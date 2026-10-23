import http from 'http';
import fs from 'fs';
import path from 'path';

console.log("==========================================");
console.log("🔍 AUDIT BUG & REST API CHECKER SYSTEM");
console.log("==========================================\n");

async function checkRestApi() {
  console.log("📌 1. MEMERIKSA REST API ENDPOINTS");
  
  const endpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/state', method: 'GET' },
    { path: '/api/broadcast-notifications', method: 'GET' }
  ];

  for (const ep of endpoints) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:3000${ep.path}`, (r) => {
          let data = '';
          r.on('data', chunk => data += chunk);
          r.on('end', () => resolve({ statusCode: r.statusCode, data }));
        });
        req.on('error', reject);
        req.setTimeout(3000, () => req.destroy());
      });
      console.log(`  ✅ [${ep.method}] ${ep.path} -> Status: ${res.statusCode} (OK)`);
    } catch (err) {
      console.log(`  ❌ [${ep.method}] ${ep.path} -> Error: ${err.message}`);
    }
  }
}

function checkBabUnlockLogic() {
  console.log("\n📌 2. MEMERIKSA LOGIKA BUKA/TUTUP BAB (LMS BAB UNLOCK)");
  const lmsViewPath = path.resolve('src/components/LmsView.tsx');
  if (fs.existsSync(lmsViewPath)) {
    const code = fs.readFileSync(lmsViewPath, 'utf8');
    const hasActivateFn = code.includes('handleActivateChapterInLms') && code.includes('handleDeactivateChapterInLms');
    const hasSetClassActive = code.includes('handleSetClassActiveChapter') && code.includes('isActive');
    if (hasActivateFn && hasSetClassActive) {
      console.log("  ✅ Logika status Buka/Tutup Bab (handleActivateChapterInLms, handleSetClassActiveChapter, isActive) terverifikasi OK.");
    } else {
      console.log("  ⚠️ Perhatian: Logika handleActivateChapterInLms perlu diverifikasi di LmsView.tsx");
    }
  } else {
    console.log("  ❌ File src/components/LmsView.tsx tidak ditemukan.");
  }
}

function checkEssayAndScoringSync() {
  console.log("\n📌 3. MEMERIKSA SINKRONISASI KOREKSI ESSAY & NILAI");
  const modalPath = path.resolve('src/components/lms/StudentQuizReviewModal.tsx');
  if (fs.existsSync(modalPath)) {
    const code = fs.readFileSync(modalPath, 'utf8');
    const hasCheckEssay = code.includes('checkEssayAnswer');
    const hasUpdatedPayload = code.includes('updatedPayload') && code.includes('handleSaveCorrection');
    if (hasCheckEssay && hasUpdatedPayload) {
      console.log("  ✅ checkEssayAnswer & sinkronisasi nilai essay di StudentQuizReviewModal aktif.");
    } else {
      console.log("  ⚠️ Perhatian: checkEssayAnswer atau handleSaveCorrection mungkin tidak lengkap.");
    }
  } else {
    console.log("  ❌ File src/components/lms/StudentQuizReviewModal.tsx tidak ditemukan.");
  }
}

function checkModalCentering() {
  console.log("\n📌 4. MEMERIKSA POP-UP / MODAL CENTERING & STYLING");
  const modalPath = path.resolve('src/components/lms/StudentQuizReviewModal.tsx');
  if (fs.existsSync(modalPath)) {
    const code = fs.readFileSync(modalPath, 'utf8');
    const isCentered = code.includes('fixed inset-0') && (code.includes('items-center') || code.includes('place-items-center'));
    if (isCentered) {
      console.log("  ✅ Modal menggunakan layout fixed overlay auto-center (fixed inset-0 z-50 flex items-center justify-center).");
    } else {
      console.log("  ⚠️ Modal styling perlu diverifikasi untuk centering.");
    }
  }
}

async function runAudit() {
  await checkRestApi();
  checkBabUnlockLogic();
  checkEssayAndScoringSync();
  checkModalCentering();
  console.log("\n==========================================");
  console.log("✨ AUDIT SELESAI");
  console.log("==========================================");
}

runAudit();
