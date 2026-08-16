import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";
import { hashPassword, isHashedPassword } from "../auth-utils.ts";

// Registered student approval/rejection workflow
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleRegistrationState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


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
            docKontrak: match.docKontrak || ""
          });
        }

        syncEntityToFirestore("activeStudents", assignedStudentId, state.activeStudents.find(s => s.id === assignedStudentId));

        // Auto-provision or update a system user account
        const protectedRoles = ["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"];
        const existingUser = state.users.find(u => u.username === match.email || u.email === match.email);
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
            username: match.email,
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

        return res.json({ success: true, updated: approvedStudent });
      }
    }


    if (dataType === "registeredStudents" && action === "reject") {
      const studentId = payload.id;
      const index = state.registeredStudents.findIndex(s => s.id === studentId);
      if (index !== -1) {
        state.registeredStudents[index].status = "Ditolak";
        syncEntityToFirestore("registeredStudents", state.registeredStudents[index].id, state.registeredStudents[index]);
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
  return false;
}
