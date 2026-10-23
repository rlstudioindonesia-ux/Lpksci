import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore, uploadBufferToFirebaseStorage } from "../../src/db/firebase-adapter.ts";
import { hashPassword, isHashedPassword, stripPassword } from "../auth-utils.ts";

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

// User accounts
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleUsersState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


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

        const processAddUser = async () => {
          let profilePicUrl = payload.profilePicture || "";
          if (profilePicUrl && profilePicUrl.startsWith("data:")) {
            profilePicUrl = await uploadBase64IfPresent(profilePicUrl, `avatar_${username || "user"}`, "profile_pictures");
          }

          const newUser = { 
            username, 
            name, 
            email, 
            role, 
            studentId, 
            assignedClass, 
            profilePicture: profilePicUrl,
            password: isHashedPassword(password) ? password : hashPassword(password || "123456"), 
            japaneseLevel, 
            kecakapanSensei 
          };
          state.users.push(newUser);
          syncEntityToFirestore("users", newUser.username, newUser);

          // Sync to ActiveStudents if role is Siswa
          if (role === "Siswa" && studentId && assignedClass) {
            const actIndex = state.activeStudents.findIndex(s => s.id === studentId );
            if (actIndex !== -1) {
              state.activeStudents[actIndex].class = assignedClass;
              syncEntityToFirestore("activeStudents", state.activeStudents[actIndex].id, state.activeStudents[actIndex]);
            }
          }
          return res.json({ success: true, item: stripPassword(newUser) });
        };

        processAddUser().catch(err => {
          console.error("Error adding user:", err);
          return res.status(500).json({ error: "Failed to add user" });
        });
        return true;
      }
      if (action === "edit") {
        const { username, name, email, role, studentId, profilePicture, assignedClass, password, status, bankAccount, faceRegistered, faceBiometricData, lastActive, japaneseLevel, kecakapanSensei, docCV, docIjazah, docSertifikat, docKTP, birthDate, verifiedDocs } = payload;
        const index = state.users.findIndex(u => u.username === username);
        if (index !== -1) {
          const oldData = state.users[index];

          const processEditUser = async () => {
            let finalProfilePic = (profilePicture !== undefined && profilePicture !== "[BERKAS_TERSIMPAN]") ? profilePicture : state.users[index].profilePicture;
            if (finalProfilePic && typeof finalProfilePic === "string" && finalProfilePic.startsWith("data:")) {
              finalProfilePic = await uploadBase64IfPresent(finalProfilePic, `avatar_${username}`, "profile_pictures");
            }

            let finalDocCV = (docCV !== undefined && docCV !== "[BERKAS_TERSIMPAN]") ? docCV : state.users[index].docCV;
            if (finalDocCV && typeof finalDocCV === "string" && finalDocCV.startsWith("data:")) {
              finalDocCV = await uploadBase64IfPresent(finalDocCV, `docCV_${username}`, "sensei_docs");
            }

            let finalDocIjazah = (docIjazah !== undefined && docIjazah !== "[BERKAS_TERSIMPAN]") ? docIjazah : state.users[index].docIjazah;
            if (finalDocIjazah && typeof finalDocIjazah === "string" && finalDocIjazah.startsWith("data:")) {
              finalDocIjazah = await uploadBase64IfPresent(finalDocIjazah, `docIjazah_${username}`, "sensei_docs");
            }

            let finalDocSertifikat = (docSertifikat !== undefined && docSertifikat !== "[BERKAS_TERSIMPAN]") ? docSertifikat : state.users[index].docSertifikat;
            if (finalDocSertifikat && typeof finalDocSertifikat === "string" && finalDocSertifikat.startsWith("data:")) {
              finalDocSertifikat = await uploadBase64IfPresent(finalDocSertifikat, `docSertifikat_${username}`, "sensei_docs");
            }

            let finalDocKTP = (docKTP !== undefined && docKTP !== "[BERKAS_TERSIMPAN]") ? docKTP : state.users[index].docKTP;
            if (finalDocKTP && typeof finalDocKTP === "string" && finalDocKTP.startsWith("data:")) {
              finalDocKTP = await uploadBase64IfPresent(finalDocKTP, `docKTP_${username}`, "sensei_docs");
            }

            state.users[index] = {
              ...state.users[index],
              name: name !== undefined ? name : state.users[index].name,
              email: email !== undefined ? email : state.users[index].email,
              role: role !== undefined ? role : state.users[index].role,
              studentId: studentId !== undefined ? studentId : state.users[index].studentId,
              profilePicture: finalProfilePic,
              assignedClass: assignedClass !== undefined ? assignedClass : state.users[index].assignedClass,
              birthDate: birthDate !== undefined ? birthDate : state.users[index].birthDate,
              password: password !== undefined ? (isHashedPassword(password) ? password : hashPassword(password)) : state.users[index].password,
              status: status !== undefined ? status : (state.users[index].status || "Active"),
              bankAccount: bankAccount !== undefined ? bankAccount : state.users[index].bankAccount,
              faceRegistered: faceRegistered !== undefined ? faceRegistered : state.users[index].faceRegistered,
              faceBiometricData: faceBiometricData !== undefined ? faceBiometricData : state.users[index].faceBiometricData,
              lastActive: lastActive !== undefined ? lastActive : state.users[index].lastActive,
              japaneseLevel: japaneseLevel !== undefined ? japaneseLevel : state.users[index].japaneseLevel,
              kecakapanSensei: kecakapanSensei !== undefined ? kecakapanSensei : state.users[index].kecakapanSensei,
              docCV: finalDocCV,
              docIjazah: finalDocIjazah,
              docSertifikat: finalDocSertifikat,
              docKTP: finalDocKTP,
              verifiedDocs: verifiedDocs !== undefined ? verifiedDocs : state.users[index].verifiedDocs,
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
            const auditLogEntry = {
              id: `LOG-${Date.now()}`,
              user: req.body.actingUserName ? `[${req.body.userRole || 'Admin'}] ${req.body.actingUserName}` : "Admin/VVIP",
              action: actionMsg,
              target: state.users[index].username,
              time: new Date().toISOString(),
              type: "security",
              details: detailsMsg
            };
            state.logs.unshift(auditLogEntry);
            if (state.logs.length > 200) state.logs.pop();
            // Each log is synced as its own Firestore document - never re-pack the whole
            // array into one "audit_trail" doc, which can exceed Firestore's 1MB/doc limit
            // once entries carry embedded biometric photos.
            syncEntityToFirestore("logs", auditLogEntry.id, auditLogEntry);

            // Synchronize profile picture, name, and class down to ActiveStudents and registeredStudents if they exist
            const currentUserObj = state.users[index];
            if (["Siswa", "Alumni"].includes(currentUserObj.role)) {
              const regIndex = state.registeredStudents.findIndex(rs =>
                (currentUserObj.email && (rs.email || "").trim().toLowerCase() === (currentUserObj.email || "").trim().toLowerCase()) ||
                (rs.name || "").trim().toLowerCase() === (currentUserObj.name || "").trim().toLowerCase()
              );
              if (regIndex !== -1) {
                let updatedReg = false;
                if (currentUserObj.profilePicture && state.registeredStudents[regIndex].docFoto !== currentUserObj.profilePicture) {
                  state.registeredStudents[regIndex].docFoto = currentUserObj.profilePicture;
                  updatedReg = true;
                }
                if (currentUserObj.birthDate && state.registeredStudents[regIndex].birthDate !== currentUserObj.birthDate) {
                  state.registeredStudents[regIndex].birthDate = currentUserObj.birthDate;
                  updatedReg = true;
                }
                if (updatedReg) {
                  syncEntityToFirestore("registeredStudents", state.registeredStudents[regIndex].id, state.registeredStudents[regIndex]);
                }
              }

              const actIndex = state.activeStudents.findIndex(s => 
                (currentUserObj.studentId && s.id === currentUserObj.studentId) || 
                (regIndex !== -1 && s.id === state.registeredStudents[regIndex].id) ||
                (currentUserObj.name && (s.name || "").trim().toLowerCase() === (currentUserObj.name || "").trim().toLowerCase())
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
                if (currentUserObj.birthDate && state.activeStudents[actIndex].birthDate !== currentUserObj.birthDate) {
                  state.activeStudents[actIndex].birthDate = currentUserObj.birthDate;
                  updatedAct = true;
                }
                if (updatedAct) {
                  syncEntityToFirestore("activeStudents", state.activeStudents[actIndex].id, state.activeStudents[actIndex]);
                }
              }
            }
            syncEntityToFirestore("users", state.users[index].username, state.users[index]);
            return res.json({ success: true, item: stripPassword(state.users[index]) });
          };

          processEditUser().catch(err => {
            console.error("Error editing user:", err);
            return res.status(500).json({ error: "Failed to edit user" });
          });
          return true;
        }
        return res.status(404).json({ error: "User tidak ditemukan!" });
      }
      if (action === "updateBank") {
        const { username, bankAccount } = payload;
        const index = state.users.findIndex(u => u.username === username);
        if (index !== -1) {
          state.users[index].bankAccount = bankAccount;
          syncEntityToFirestore("users", state.users[index].username, state.users[index]);
          return res.json({ success: true, item: stripPassword(state.users[index]) });
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
          return res.json({ success: true, item: stripPassword(state.users[index]) });
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
  return false;
}
