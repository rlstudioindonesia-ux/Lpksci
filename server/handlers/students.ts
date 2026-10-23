import type { Request, Response } from "express";
import { syncEntityToFirestore, syncEntityToFirestoreAsync, deleteEntityFromFirestore, uploadBufferToFirebaseStorage, touchSyncMeta, getEntityFromFirestore, getLastLocalWriteAt } from "../../src/db/firebase-adapter.ts";
import { hashPassword, isHashedPassword } from "../auth-utils.ts";
import { invalidateStateCache } from "../stateCache.ts";
import { nextSequentialId, collectUsedStudentIds } from "../../src/lib/idGenerator.ts";
import { findRecordIndex } from "../../src/lib/recordMatching.ts";
import { normalizeGender } from "../../src/lib/gender.ts";
import { EXTRA_STUDENT_DOCUMENT_FIELDS } from "../../src/lib/studentDocuments.ts";

const STRIPPED_PLACEHOLDERS = new Set(["[BERKAS_TERSIMPAN]", "[FOTO_TERSIMPAN]", "[BUKTI_TERSIMPAN]"]);

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

// Active student records
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export async function handleStudentsState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any): Promise<boolean> {


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
              password: hashPassword("123456"),
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
          // studentId link first: a name-only match could delete the account of a
          // different student who happens to share the name.
          const studentRoles = ["Siswa", "Alumni"];
          const userAccount =
            state.users.find((u: any) => u.studentId && u.studentId === id) ||
            (state.users.filter((u: any) => studentRoles.includes(u.role) && !u.studentId && u.name && studentToDelete.name && u.name.trim().toLowerCase() === studentToDelete.name.trim().toLowerCase()).length === 1
              ? state.users.find((u: any) => studentRoles.includes(u.role) && !u.studentId && u.name && u.name.trim().toLowerCase() === studentToDelete.name.trim().toLowerCase())
              : undefined);
          if (userAccount) {
            state.users = state.users.filter((u: any) => u.username !== userAccount.username);
            deleteEntityFromFirestore("users", userAccount.username);
          }

          // Cascade delete from registeredStudents
          const regMatchIdx = findRecordIndex(state.registeredStudents, { id, email: studentToDelete.email, name: studentToDelete.name });
          const regStudent = regMatchIdx !== -1 ? state.registeredStudents[regMatchIdx] : undefined;
          if (regStudent) {
            state.registeredStudents = state.registeredStudents.filter((s: any) => s.id !== regStudent.id);
            deleteEntityFromFirestore("registeredStudents", regStudent.id);
          }
        }
        if (typeof invalidateStateCache === "function") invalidateStateCache();
        const targetId = id || payload?.id || "";
        touchSyncMeta({ source: "activeStudents", ...(targetId ? { id: targetId } : {}), action: "delete" }).catch(() => {});
        res.json({ success: true, id: targetId });
        return true;
      }
      if (action === "add") {
        const { name, batch, class: className, status, prefecture, city, company, latitude, longitude, sensei, graduationYear } = payload;
        const newId = nextSequentialId("SIS", collectUsedStudentIds(state));

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

        syncEntityToFirestore("activeStudents", newStudent.id, newStudent);
        if (typeof invalidateStateCache === "function") invalidateStateCache();
        touchSyncMeta({ source: "activeStudents", id: newStudent.id, action: "add" }).catch(() => {});
        res.json({ success: true, item: newStudent });
        return true;
      }

      if (action === "update" || action === "edit" || action === "update_status") {
        // /api/state replaces heavy base64 fields with a placeholder; a client echoing
        // the whole student object back must not overwrite the real file with it.
        for (const key of Object.keys(payload || {})) {
          if (STRIPPED_PLACEHOLDERS.has(payload[key])) delete payload[key];
        }
        const {
          id,
          status,
          class: className,
          program,
          prefecture,
          city,
          company,
          latitude,
          longitude,
          profilePicture,
          docFoto,
          district,
          birthDate,
          gender,
          education,
          school,
          japaneseLevel,
          sensei,
          statusPendaftaran,
          graduationYear,
          phone,
          name,
          email,
          password,
          batch,
          currentChapter,
          keterangan,
          mitraSO,
          jobKeterangan,
          job1Bidang,
          job1TanggalMensetsu,
          job1Lokasi,
          job2Bidang,
          job2TanggalMensetsu,
          job2Lokasi,
          bulanKelulusan,
          attitudeScore,
          kaiwaScore,
          bobotNilaiRekomendasi,
          docAkta,
          docIjazahSD,
          docIjazahSMP,
          docIjazahSMA,
          docKK,
          docKTP,
          docTranskip,
          docPraMCU,
          docVaksin,
          docCV1,
          docCV2,
          docCV3,
          docCV4,
          docCV5,
          docMoU,
          docKontrak,
          verifiedDocs,
        } = payload;

        // id first, then email, then a unique name (see src/lib/recordMatching.ts)
        const index = findRecordIndex(state.activeStudents, { id, name: payload.name, email: payload.email });

        const effectiveClass = className !== undefined ? className : program;
        let effectivePhoto = profilePicture || docFoto;

        const processUpdateStudent = async () => {
          for (const field of EXTRA_STUDENT_DOCUMENT_FIELDS) {
            if (typeof payload[field] === "string" && payload[field].startsWith("data:")) {
              payload[field] = await uploadBase64IfPresent(payload[field], `${field}_${id || "student"}`, "student_docs");
            }
          }
          if (effectivePhoto && typeof effectivePhoto === "string" && effectivePhoto.startsWith("data:")) {
            effectivePhoto = await uploadBase64IfPresent(effectivePhoto, `student_${id || "photo"}`, "profile_pictures");
          }

          let finalDocAkta = docAkta !== undefined ? await uploadBase64IfPresent(docAkta, `docAkta_${id || "student"}`, "student_docs") : undefined;
          let finalDocIjazahSD = docIjazahSD !== undefined ? await uploadBase64IfPresent(docIjazahSD, `docIjazahSD_${id || "student"}`, "student_docs") : undefined;
          let finalDocIjazahSMP = docIjazahSMP !== undefined ? await uploadBase64IfPresent(docIjazahSMP, `docIjazahSMP_${id || "student"}`, "student_docs") : undefined;
          let finalDocIjazahSMA = docIjazahSMA !== undefined ? await uploadBase64IfPresent(docIjazahSMA, `docIjazahSMA_${id || "student"}`, "student_docs") : undefined;
          let finalDocKK = docKK !== undefined ? await uploadBase64IfPresent(docKK, `docKK_${id || "student"}`, "student_docs") : undefined;
          let finalDocKTP = docKTP !== undefined ? await uploadBase64IfPresent(docKTP, `docKTP_${id || "student"}`, "student_docs") : undefined;
          let finalDocTranskip = docTranskip !== undefined ? await uploadBase64IfPresent(docTranskip, `docTranskip_${id || "student"}`, "student_docs") : undefined;
          let finalDocPraMCU = docPraMCU !== undefined ? await uploadBase64IfPresent(docPraMCU, `docPraMCU_${id || "student"}`, "student_docs") : undefined;
          let finalDocVaksin = docVaksin !== undefined ? await uploadBase64IfPresent(docVaksin, `docVaksin_${id || "student"}`, "student_docs") : undefined;
          let finalDocCV1 = docCV1 !== undefined ? await uploadBase64IfPresent(docCV1, `docCV1_${id || "student"}`, "student_docs") : undefined;
          let finalDocCV2 = docCV2 !== undefined ? await uploadBase64IfPresent(docCV2, `docCV2_${id || "student"}`, "student_docs") : undefined;
          let finalDocCV3 = docCV3 !== undefined ? await uploadBase64IfPresent(docCV3, `docCV3_${id || "student"}`, "student_docs") : undefined;
          let finalDocCV4 = docCV4 !== undefined ? await uploadBase64IfPresent(docCV4, `docCV4_${id || "student"}`, "student_docs") : undefined;
          let finalDocCV5 = docCV5 !== undefined ? await uploadBase64IfPresent(docCV5, `docCV5_${id || "student"}`, "student_docs") : undefined;
          let finalDocMoU = docMoU !== undefined ? await uploadBase64IfPresent(docMoU, `docMoU_${id || "student"}`, "student_docs") : undefined;
          let finalDocKontrak = docKontrak !== undefined ? await uploadBase64IfPresent(docKontrak, `docKontrak_${id || "student"}`, "student_docs") : undefined;

          if (index !== -1) {
            // This instance's in-memory copy can be older than Firestore (another
            // Cloud Run instance may have changed the student's status since).
            // Saving would then write the stale status back over the real one,
            // which is how statuses kept "resetting" to Belajar. Refresh the
            // record from Firestore first - unless this instance wrote it itself
            // a moment ago and that write may still be in flight.
            const currentId = state.activeStudents[index]?.id;
            if (currentId && Date.now() - getLastLocalWriteAt("activeStudents", currentId) > 5000) {
              const fresh = await getEntityFromFirestore("activeStudents", currentId);
              if (fresh) {
                state.activeStudents[index] = { ...state.activeStudents[index], ...fresh, id: currentId };
              }
            }

            // Guarantee all scores and fields in payload are copied to memory & Firestore
            Object.keys(payload).forEach((key) => {
              if (key !== "id" && payload[key] !== undefined) {
                state.activeStudents[index][key] = payload[key];
              }
            });
            if (status) {
              // Canonical spelling (the VVIP edit form used to save "On Progres Job").
              state.activeStudents[index].status = status === "On Progres Job" ? "On Proges Job" : status;
            }
            if (name) {
              state.activeStudents[index].name = name.trim();
            }
            if (email !== undefined) {
              state.activeStudents[index].email = email.trim();
            }
            if (batch !== undefined) {
              state.activeStudents[index].batch = batch;
            }
            if (phone !== undefined) {
              state.activeStudents[index].phone = phone;
            }
            if (district !== undefined) {
              state.activeStudents[index].district = district;
            }
            if (birthDate !== undefined) {
              state.activeStudents[index].birthDate = birthDate;
            }
            if (gender !== undefined) {
              // "L"/"P"/"LAKI-LAKI"/... -> "Laki-laki"/"Perempuan" (unknown values kept as sent)
              state.activeStudents[index].gender = normalizeGender(gender) || gender;
            }
            if (education !== undefined) {
              state.activeStudents[index].education = education;
            }
            if (school !== undefined) {
              state.activeStudents[index].school = school;
            }
            if (japaneseLevel !== undefined) {
              state.activeStudents[index].japaneseLevel = japaneseLevel;
            }
            if (effectivePhoto !== undefined) {
              state.activeStudents[index].profilePicture = effectivePhoto;
              state.activeStudents[index].docFoto = effectivePhoto;
            }
            if (finalDocAkta !== undefined) state.activeStudents[index].docAkta = finalDocAkta;
            if (finalDocIjazahSD !== undefined) state.activeStudents[index].docIjazahSD = finalDocIjazahSD;
            if (finalDocIjazahSMP !== undefined) state.activeStudents[index].docIjazahSMP = finalDocIjazahSMP;
            if (finalDocIjazahSMA !== undefined) state.activeStudents[index].docIjazahSMA = finalDocIjazahSMA;
            if (finalDocKK !== undefined) state.activeStudents[index].docKK = finalDocKK;
            if (finalDocKTP !== undefined) state.activeStudents[index].docKTP = finalDocKTP;
            if (finalDocTranskip !== undefined) state.activeStudents[index].docTranskip = finalDocTranskip;
            if (finalDocPraMCU !== undefined) state.activeStudents[index].docPraMCU = finalDocPraMCU;
            if (finalDocVaksin !== undefined) state.activeStudents[index].docVaksin = finalDocVaksin;
            if (finalDocCV1 !== undefined) state.activeStudents[index].docCV1 = finalDocCV1;
            if (finalDocCV2 !== undefined) state.activeStudents[index].docCV2 = finalDocCV2;
            if (finalDocCV3 !== undefined) state.activeStudents[index].docCV3 = finalDocCV3;
            if (finalDocCV4 !== undefined) state.activeStudents[index].docCV4 = finalDocCV4;
            if (finalDocCV5 !== undefined) state.activeStudents[index].docCV5 = finalDocCV5;
            if (finalDocMoU !== undefined) state.activeStudents[index].docMoU = finalDocMoU;
            if (finalDocKontrak !== undefined) state.activeStudents[index].docKontrak = finalDocKontrak;
            if (verifiedDocs !== undefined) state.activeStudents[index].verifiedDocs = verifiedDocs;
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
            if (!statusPendaftaran && state.activeStudents[index].statusPendaftaran !== "Siswa Baru" && state.activeStudents[index].statusPendaftaran !== "Siswa") {
              state.activeStudents[index].statusPendaftaran = "Alumni";
              state.activeStudents[index].kategoriPendaftaran = "Alumni";
            }
            
            state.activeStudents[index].class = "";
            state.activeStudents[index].sensei = "";

            if (prefecture !== undefined) {
              state.activeStudents[index].prefecture = prefecture;
            }
            if (city !== undefined) {
              state.activeStudents[index].city = city;
            }
            if (company !== undefined) {
              state.activeStudents[index].company = company;
            }
            if (latitude !== undefined && longitude !== undefined) {
              state.activeStudents[index].latitude = Number(latitude);
              state.activeStudents[index].longitude = Number(longitude);
            }
            syncActiveStudentToAlumniUser(
              state.activeStudents[index].id,
              state.activeStudents[index].name,
              state.activeStudents[index].status,
              state.activeStudents[index].profilePicture
            );
          } else {
            if (effectiveClass !== undefined) {
              state.activeStudents[index].class = effectiveClass;
              if (effectiveClass) {
                const classSensei = state.users.find(
                  (u: any) =>
                    u.role === "Pengajar" &&
                    u.assignedClass &&
                    u.assignedClass.toLowerCase() === effectiveClass.toLowerCase()
                );
                if (classSensei) {
                  state.activeStudents[index].sensei = classSensei.name;
                } else {
                  state.activeStudents[index].sensei = "-";
                }
              } else {
                state.activeStudents[index].sensei = "-";
              }
            }
          }

          if (sensei !== undefined) {
            state.activeStudents[index].sensei = sensei;
          }
          if (currentChapter !== undefined) {
            state.activeStudents[index].currentChapter = Number(currentChapter);
          }
          if (keterangan !== undefined) {
            state.activeStudents[index].keterangan = keterangan;
          }
          if (mitraSO !== undefined) {
            state.activeStudents[index].mitraSO = mitraSO;
          }
          if (jobKeterangan !== undefined) {
            state.activeStudents[index].jobKeterangan = jobKeterangan;
          }
          if (job1Bidang !== undefined) {
            state.activeStudents[index].job1Bidang = job1Bidang;
          }
          if (job1TanggalMensetsu !== undefined) {
            state.activeStudents[index].job1TanggalMensetsu = job1TanggalMensetsu;
          }
          if (job1Lokasi !== undefined) {
            state.activeStudents[index].job1Lokasi = job1Lokasi;
          }
          if (job2Bidang !== undefined) {
            state.activeStudents[index].job2Bidang = job2Bidang;
          }
          if (job2TanggalMensetsu !== undefined) {
            state.activeStudents[index].job2TanggalMensetsu = job2TanggalMensetsu;
          }
          if (job2Lokasi !== undefined) {
            state.activeStudents[index].job2Lokasi = job2Lokasi;
          }
          if (bulanKelulusan !== undefined) {
            state.activeStudents[index].bulanKelulusan = bulanKelulusan;
          }
          if (attitudeScore !== undefined) {
            state.activeStudents[index].attitudeScore =
              attitudeScore !== null && attitudeScore !== "" ? Number(attitudeScore) : undefined;
          }
          if (kaiwaScore !== undefined) {
            state.activeStudents[index].kaiwaScore =
              kaiwaScore !== null && kaiwaScore !== "" ? Number(kaiwaScore) : undefined;
          }
          if (bobotNilaiRekomendasi !== undefined) {
            state.activeStudents[index].bobotNilaiRekomendasi =
              bobotNilaiRekomendasi !== null && bobotNilaiRekomendasi !== ""
                ? Number(bobotNilaiRekomendasi)
                : undefined;
          }
          if (payload.fiveSScore !== undefined) {
            state.activeStudents[index].fiveSScore = Number(payload.fiveSScore) || 0;
          }
          if (payload.ethicsScore !== undefined) {
            state.activeStudents[index].ethicsScore = Number(payload.ethicsScore) || 0;
          }
          if (payload.mathScore !== undefined) {
            state.activeStudents[index].mathScore = Number(payload.mathScore) || 0;
          }
          if (payload.japaneseScore !== undefined) {
            state.activeStudents[index].japaneseScore = Number(payload.japaneseScore) || 0;
          }
          if (payload.attendanceScore !== undefined) {
            state.activeStudents[index].attendanceScore = Number(payload.attendanceScore) || 0;
          }

          const actStudent = state.activeStudents[index];

          // Synchronize changes to registeredStudents if record exists
          const regIndex = findRecordIndex(state.registeredStudents, { id, email: actStudent.email, name: actStudent.name });
          if (regIndex !== -1) {
            state.registeredStudents[regIndex] = {
              ...state.registeredStudents[regIndex],
              name: actStudent.name,
              phone: actStudent.phone || state.registeredStudents[regIndex].phone,
              email: actStudent.email || state.registeredStudents[regIndex].email,
              district: actStudent.district || state.registeredStudents[regIndex].district,
              birthDate: actStudent.birthDate || state.registeredStudents[regIndex].birthDate,
              gender: actStudent.gender || state.registeredStudents[regIndex].gender,
              education: actStudent.education || state.registeredStudents[regIndex].education,
              school: actStudent.school || state.registeredStudents[regIndex].school,
              graduationYear: actStudent.graduationYear || state.registeredStudents[regIndex].graduationYear,
              japaneseLevel: actStudent.japaneseLevel || state.registeredStudents[regIndex].japaneseLevel,
              program: effectiveClass || state.registeredStudents[regIndex].program,
              statusPendaftaran: actStudent.statusPendaftaran || state.registeredStudents[regIndex].statusPendaftaran,
              docFoto: effectivePhoto || state.registeredStudents[regIndex].docFoto,
              fiveSScore: actStudent.fiveSScore !== undefined ? actStudent.fiveSScore : state.registeredStudents[regIndex].fiveSScore,
              ethicsScore: actStudent.ethicsScore !== undefined ? actStudent.ethicsScore : state.registeredStudents[regIndex].ethicsScore,
              mathScore: actStudent.mathScore !== undefined ? actStudent.mathScore : state.registeredStudents[regIndex].mathScore,
              japaneseScore: actStudent.japaneseScore !== undefined ? actStudent.japaneseScore : state.registeredStudents[regIndex].japaneseScore,
              attendanceScore: actStudent.attendanceScore !== undefined ? actStudent.attendanceScore : state.registeredStudents[regIndex].attendanceScore,
            };
            if (password && password.trim() !== "") {
              state.registeredStudents[regIndex].password = isHashedPassword(password)
                ? password
                : hashPassword(password);
            }
            syncEntityToFirestore(
              "registeredStudents",
              state.registeredStudents[regIndex].id,
              state.registeredStudents[regIndex]
            );
          }

          // Sync up to UserAccount!
          // Prefer the account linked by studentId; the name/email fallbacks below
          // could otherwise pick another student's account when names collide.
          const linkedUserIndex = state.users.findIndex(
            (u: any) =>
              !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) &&
              u.studentId && u.studentId === actStudent.id
          );
          const userIndex = linkedUserIndex !== -1 ? linkedUserIndex : state.users.findIndex(
            (u: any) =>
              !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) &&
              ((u.studentId && u.studentId === id) ||
                (u.name && u.name.trim().toLowerCase() === actStudent.name.trim().toLowerCase()) ||
                (actStudent.email && u.email && u.email.trim().toLowerCase() === actStudent.email.trim().toLowerCase()) ||
                (actStudent.email &&
                  u.username &&
                  u.username.trim().toLowerCase() === actStudent.email.trim().toLowerCase()) ||
                (regIndex !== -1 &&
                  u.email &&
                  state.registeredStudents[regIndex].email &&
                  u.email.trim().toLowerCase() === state.registeredStudents[regIndex].email.trim().toLowerCase()) ||
                (regIndex !== -1 &&
                  u.username &&
                  state.registeredStudents[regIndex].email &&
                  u.username.trim().toLowerCase() === state.registeredStudents[regIndex].email.trim().toLowerCase()))
          );

          if (userIndex !== -1) {
            if (actStudent.name) state.users[userIndex].name = actStudent.name;
            if (actStudent.email) state.users[userIndex].email = actStudent.email;
            if (actStudent.phone) state.users[userIndex].phone = actStudent.phone;
            if (actStudent.district) state.users[userIndex].district = actStudent.district;
            if (effectivePhoto) state.users[userIndex].profilePicture = effectivePhoto;
            if (effectiveClass !== undefined) state.users[userIndex].assignedClass = effectiveClass;
            if (isAlumniStatus) state.users[userIndex].role = "Alumni";
            if (password && password.trim() !== "") {
              state.users[userIndex].password = isHashedPassword(password)
                ? password
                : hashPassword(password);
            }
            syncEntityToFirestore("users", state.users[userIndex].username, state.users[userIndex]);
          }

          await syncEntityToFirestoreAsync("activeStudents", state.activeStudents[index].id, state.activeStudents[index]);
          if (typeof invalidateStateCache === "function") invalidateStateCache();
          const activeId = state.activeStudents[index]?.id || "";
          touchSyncMeta({ source: "activeStudents", ...(activeId ? { id: activeId } : {}), action: "update" }).catch(() => {});
          return res.json({ success: true, item: state.activeStudents[index] });
        } else {
          // If student was not found in activeStudents, check registeredStudents
          const regIndex = findRecordIndex(state.registeredStudents, { id, name: payload.name, email: payload.email });
          if (regIndex !== -1) {
            state.registeredStudents[regIndex] = {
              ...state.registeredStudents[regIndex],
              ...payload,
              name: payload.name ? payload.name.trim() : state.registeredStudents[regIndex].name,
              program: effectiveClass || state.registeredStudents[regIndex].program,
              docFoto: effectivePhoto || state.registeredStudents[regIndex].docFoto,
              fiveSScore: payload.fiveSScore !== undefined ? Number(payload.fiveSScore) : state.registeredStudents[regIndex].fiveSScore,
              ethicsScore: payload.ethicsScore !== undefined ? Number(payload.ethicsScore) : state.registeredStudents[regIndex].ethicsScore,
              mathScore: payload.mathScore !== undefined ? Number(payload.mathScore) : state.registeredStudents[regIndex].mathScore,
              japaneseScore: payload.japaneseScore !== undefined ? Number(payload.japaneseScore) : state.registeredStudents[regIndex].japaneseScore,
              attendanceScore: payload.attendanceScore !== undefined ? Number(payload.attendanceScore) : state.registeredStudents[regIndex].attendanceScore,
            };
            if (password && password.trim() !== "") {
              state.registeredStudents[regIndex].password = isHashedPassword(password)
                ? password
                : hashPassword(password);
            }
            await syncEntityToFirestoreAsync(
              "registeredStudents",
              state.registeredStudents[regIndex].id,
              state.registeredStudents[regIndex]
            );
            if (typeof invalidateStateCache === "function") invalidateStateCache();
            const regId = state.registeredStudents[regIndex]?.id || "";
            touchSyncMeta({ source: "registeredStudents", ...(regId ? { id: regId } : {}), action: "update" }).catch(() => {});
            return res.json({ success: true, item: state.registeredStudents[regIndex] });
          }
          return res.status(404).json({ error: "Student not found" });
        }
      };

      try {
        await processUpdateStudent();
      } catch (err) {
        console.error("Error updating student:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to update student" });
          return true;
        }
      }
      return true;
    }
  }
  return false;
}
