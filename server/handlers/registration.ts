import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore, uploadBufferToFirebaseStorage, touchSyncMeta, mergeEntityFieldsToFirestore } from "../../src/db/firebase-adapter.ts";
import { hashPassword, isHashedPassword } from "../auth-utils.ts";
import { invalidateStateCache } from "../stateCache.ts";
import { EXTRA_STUDENT_DOCUMENT_FIELDS } from "../../src/lib/studentDocuments.ts";
import { findRecordIndex } from "../../src/lib/recordMatching.ts";
import { findRegistrationUpdateTarget, isPhantomRegistration } from "../../src/lib/registrationUpdate.ts";
import { normalizeGender } from "../../src/lib/gender.ts";
import { todayJakartaISO } from "../../src/lib/dateUtils.ts";
import { nextSequentialId, collectUsedStudentIds } from "../../src/lib/idGenerator.ts";
import { uniqueIdSuffix } from "../../src/lib/idGenerator.ts";

async function uploadBase64IfPresent(dataStr: string | undefined, prefix: string, folder: string): Promise<string> {
  if (!dataStr || typeof dataStr !== "string" || !dataStr.startsWith("data:")) {
    return dataStr || "";
  }
  try {
    const commaIdx = dataStr.indexOf(",");
    const semiIdx = dataStr.indexOf(";");
    const mime = (semiIdx !== -1 && commaIdx !== -1) ? dataStr.substring(5, semiIdx) : "image/jpeg";
    const b64 = commaIdx !== -1 ? dataStr.substring(commaIdx + 1) : dataStr;
    const buf = Buffer.from(b64, "base64");
    const ext = mime.includes("pdf") ? "pdf" : (mime.split("/")[1] || "jpg");
    const filename = `${prefix}_${Date.now()}.${ext}`;
    return await uploadBufferToFirebaseStorage(buf, filename, mime, folder);
  } catch (err) {
    console.warn(`[Firebase Storage] Note during ${folder} upload:`, err);
    return dataStr;
  }
}

// Copies only the fields a registration update actually sent onto the matching
// active student. Copying from the whole merged registration used to overwrite
// the student's class with the registration's default program ("Tokutei
// Ginou (SSW)") and push other stale values whenever an admin merely verified
// a document.
// `allowClear` lets an empty string remove a document; only used when the
// request targets the active student directly, never for a merged registration.
function applySentFieldsToActiveStudent(act: any, sent: any, allowClear = false) {
  const before = { ...act };
  if (sent.name) act.name = sent.name;
  if (sent.phone) act.phone = sent.phone;
  if (sent.email) act.email = sent.email;
  if (sent.district) act.district = sent.district;
  if (sent.birthDate) act.birthDate = sent.birthDate;
  if (sent.gender) act.gender = normalizeGender(sent.gender) || sent.gender;
  if (sent.education) act.education = sent.education;
  if (sent.school) act.school = sent.school;
  if (sent.graduationYear) act.graduationYear = sent.graduationYear;
  if (sent.japaneseLevel) act.japaneseLevel = sent.japaneseLevel;
  if (sent.program) act.class = sent.program;
  if (sent.docFoto) {
    const pic = sent.docFoto.includes('|') ? sent.docFoto.split('|')[1] : sent.docFoto;
    act.profilePicture = pic;
    act.docFoto = sent.docFoto;
  }
  const docFields = [
    "docAkta", "docIjazahSD", "docIjazahSMP", "docIjazahSMA", "docKK", "docKTP", "docTranskip",
    "docPraMCU", "docVaksin", "docCV1", "docCV2", "docCV3", "docCV4", "docCV5", "docMoU", "docKontrak",
    ...EXTRA_STUDENT_DOCUMENT_FIELDS,
  ];
  for (const field of docFields) {
    if (sent[field]) act[field] = sent[field];
    else if (allowClear && sent[field] === "" && act[field]) act[field] = "";
  }
  if (sent.verifiedDocs) act.verifiedDocs = sent.verifiedDocs;

  const changedFields: Record<string, any> = {};
  for (const key of Object.keys(act)) {
    if (act[key] !== before[key]) changedFields[key] = act[key];
  }
  if (Object.keys(changedFields).length > 0) {
    mergeEntityFieldsToFirestore("activeStudents", act.id, changedFields);
  }
}

// Registered student approval/rejection workflow
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export async function handleRegistrationState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any): Promise<boolean> {


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
        // Email first, then a unique name: matching on name alone merged two
        // different applicants who share a name into one student record.
        const existingActiveIdx = findRecordIndex(state.activeStudents, { email: match.email, name: match.name });
        const existingActive = existingActiveIdx !== -1 ? state.activeStudents[existingActiveIdx] : undefined;
        if (existingActive) {
          assignedStudentId = existingActive.id;
          existingActive.birthDate = existingActive.birthDate || match.birthDate;
          existingActive.gender = existingActive.gender || match.gender;
          existingActive.district = existingActive.district || match.district;
          existingActive.school = existingActive.school || match.school;
          existingActive.phone = existingActive.phone || match.phone;
          existingActive.email = existingActive.email || match.email;
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
          for (const field of EXTRA_STUDENT_DOCUMENT_FIELDS) {
            if (match[field]) existingActive[field] = match[field];
          }
        } else {
          const newId = nextSequentialId("SIS", collectUsedStudentIds(state));
          assignedStudentId = newId;
          state.activeStudents.push({
            id: assignedStudentId,
            name: match.name,
            batch: "Angkatan 12",
            class: payload.class || "",
            status: "Belajar",
            kategoriPendaftaran: match.statusPendaftaran || "Siswa Baru",
            referrer: match.referrer || "",
            birthDate: match.birthDate || "",
            gender: match.gender || undefined,
            district: match.district || "",
            school: match.school || "",
            phone: match.phone || "",
            email: match.email || "",
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
            docKontrak: match.docKontrak || "",
            ...Object.fromEntries(EXTRA_STUDENT_DOCUMENT_FIELDS.map((field) => [field, match[field] || ""]))
          });
        }

        syncEntityToFirestore("activeStudents", assignedStudentId, state.activeStudents.find(s => s.id === assignedStudentId));

        // Auto-provision or update a system user account
        const protectedRoles = ["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"];
        // Only match by a real email: an empty email used to match any account
        // whose email is also empty (e.g. auto-created alumni accounts) and
        // overwrite that account's class/studentId.
        const matchEmail = (match.email || "").trim().toLowerCase();
        const existingUser = matchEmail
          ? state.users.find(u => (u.username || "").trim().toLowerCase() === matchEmail || (u.email || "").trim().toLowerCase() === matchEmail)
          : undefined;
        if (existingUser) {
          if (!protectedRoles.includes(existingUser.role)) {
            existingUser.assignedClass = payload.class || "";
            existingUser.studentId = assignedStudentId;
            existingUser.profilePicture = match.docFoto ? (match.docFoto.includes('|') ? match.docFoto.split('|')[1] : match.docFoto) : (existingUser.profilePicture || "");
            if (match.statusPendaftaran === "Alumni") existingUser.role = "Alumni";
            // Backfill the password the student set at registration if the
            // account somehow ended up with none - otherwise approval leaves
            // them with an account that exists but can never log in.
            if (!existingUser.password) {
              existingUser.password = isHashedPassword(match.password) ? match.password : hashPassword(match.password || "123456");
            }
            syncEntityToFirestore("users", existingUser.username, existingUser);
          }
        } else {
          const newUserObj = {
            username: matchEmail || assignedStudentId.toLowerCase(),
            name: match.name,
            email: match.email,
            password: isHashedPassword(match.password) ? match.password : hashPassword(match.password || "123456"),
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
        deleteEntityFromFirestore("registeredStudents", approvedStudent.id);

        res.json({ success: true, updated: approvedStudent });
        return true;
      }
    }


    if (dataType === "registeredStudents" && action === "reject") {
      const studentId = payload.id;
      const index = state.registeredStudents.findIndex(s => s.id === studentId);
      if (index !== -1) {
        state.registeredStudents[index].status = "Ditolak";
        syncEntityToFirestore("registeredStudents", state.registeredStudents[index].id, state.registeredStudents[index]);
        res.json({ success: true, updated: state.registeredStudents[index] });
        return true;
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
      
      // 23-10-2026: deleting a registration never deletes an active student any
      // more. The old cascade matched active students by name (deleting another
      // student with the same name) and wiped the real student when an admin
      // removed a phantom registrant that shares the student's id.
      if (registeredToDelete && !isPhantomRegistration(registeredToDelete, state.activeStudents)) {
        // Cascade delete the registrant's own login account (id or email, not name)
        const userAccount = state.users.find(
          (u: any) => !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && (
                      (u.studentId && u.studentId === id) ||
                      (u.email && registeredToDelete.email && u.email.trim().toLowerCase() === registeredToDelete.email.trim().toLowerCase()))
        );
        if (userAccount) {
          state.users = state.users.filter((u: any) => u.username !== userAccount.username);
          deleteEntityFromFirestore("users", userAccount.username);
        }
      }
      
      res.json({ success: true, id });
      return true;
    }


    if (dataType === "registeredStudents" && action === "add") {
      const newReg = {
        id: payload.id || `REG-${Date.now()}`,
        ...payload,
      };
      state.registeredStudents.unshift(newReg);
      syncEntityToFirestore("registeredStudents", newReg.id, newReg);
      res.json({ success: true, item: newReg });
      return true;
    }

    if (dataType === "registeredStudents" && (action === "update" || action === "edit" || action === "update_status")) {
      const { id } = payload;
      const target = findRegistrationUpdateTarget(state.registeredStudents, state.activeStudents, payload);
      const index = target.kind === "registration" ? target.index : -1;

      const processUpdateReg = async () => {
        let processedPayload = { ...payload };

        // Process Base64 uploads if present
        const docFields = [
          "docFoto", "docAkta", "docIjazahSD", "docIjazahSMP", "docIjazahSMA",
          "docKK", "docKTP", "docTranskip", "docPraMCU", "docVaksin",
          "docCV1", "docCV2", "docCV3", "docCV4", "docCV5", "docMoU", "docKontrak", "proofOfPayment",
          ...EXTRA_STUDENT_DOCUMENT_FIELDS
        ];

        for (const field of docFields) {
          if (processedPayload[field] && typeof processedPayload[field] === "string" && processedPayload[field].startsWith("data:")) {
            const folder = field === "docFoto" ? "profile_pictures" : field === "proofOfPayment" ? "payments" : "student_docs";
            processedPayload[field] = await uploadBase64IfPresent(processedPayload[field], `${field}_${id || "student"}`, folder);
          }
        }

        if (index !== -1) {
          state.registeredStudents[index] = {
            ...state.registeredStudents[index],
            ...processedPayload
          };
          const student = state.registeredStudents[index];

          // Force zero billing for alumni
          if (student.statusPendaftaran === "Alumni") {
            student.paymentAmount = 0;
            student.paymentStatus = "Lunas";
          }

          // Sync to activeStudents - only the fields this request actually sent.
          const actIndex = findRecordIndex(state.activeStudents, { id, email: student.email, name: student.name });
          if (actIndex !== -1) {
            applySentFieldsToActiveStudent(state.activeStudents[actIndex], processedPayload);
          }

          // Sync to users
          const userIndex = state.users.findIndex(u => 
            !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && (
              (u.studentId === id) || 
              (student.email && u.email && u.email.trim().toLowerCase() === student.email.trim().toLowerCase()) ||
              (student.email && u.username && u.username.trim().toLowerCase() === student.email.trim().toLowerCase()) ||
              (!student.email && u.name && student.name && u.name.trim().toLowerCase() === student.name.trim().toLowerCase())
            )
          );
          if (userIndex !== -1) {
            if (student.name) state.users[userIndex].name = student.name;
            if (student.email) state.users[userIndex].email = student.email;
            if (student.phone) state.users[userIndex].phone = student.phone;
            if (student.district) state.users[userIndex].district = student.district;
            if (student.program) state.users[userIndex].assignedClass = student.program;
            if (student.docFoto) {
              state.users[userIndex].profilePicture = student.docFoto.includes('|') ? student.docFoto.split('|')[1] : student.docFoto;
            }
            syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
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
                   id: `CAS-${uniqueIdSuffix()}`,
                   code: payment.id,
                   date: todayJakartaISO(),
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
          if (typeof invalidateStateCache === "function") invalidateStateCache();
          const regId = state.registeredStudents[index]?.id || '';
          touchSyncMeta({ source: 'registeredStudents', ...(regId ? { id: regId } : {}), action: 'update' }).catch(() => {});
          return res.json({ success: true, updated: state.registeredStudents[index] });
        } else if (target.kind === "activeStudent") {
          // Already approved: the registration no longer exists, so the
          // documents belong to the active student. Never create a registrant here.
          const act = state.activeStudents[target.index];
          applySentFieldsToActiveStudent(act, processedPayload, true);
          if (typeof invalidateStateCache === "function") invalidateStateCache();
          return res.json({ success: true, updated: act });
        } else {
          return res.status(404).json({ success: false, error: "Data pendaftar tidak ditemukan (mungkin sudah disetujui atau dihapus). Muat ulang halaman." });
        }
      };

      try {
        await processUpdateReg();
      } catch (err) {
        console.error("Error updating registered student:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to update registration record." });
          return true;
        }
      }
      return true;
    }
  return false;
}
