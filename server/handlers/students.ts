import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";
import { hashPassword } from "../auth-utils.ts";

// Active student records
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleStudentsState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


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

        syncEntityToFirestore("activeStudents", newStudent.id, newStudent);
        return res.json({ success: true, item: newStudent });
      }

      if (action === "update" || action === "edit") {
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

            syncEntityToFirestore("activeStudents", state.activeStudents[index].id, state.activeStudents[index]);
            return res.json({ success: true, item: state.activeStudents[index] });
         } else {
            return res.status(404).json({ error: "Student not found to update." });
         }
      }

      if (action === "update_status") {
        const { id, status, class: className, prefecture, city, company, latitude, longitude, profilePicture, sensei, statusPendaftaran, graduationYear, phone, name, batch, currentChapter, keterangan, mitraSO, jobKeterangan, job1Bidang, job1TanggalMensetsu, job1Lokasi, job2Bidang, job2TanggalMensetsu, job2Lokasi, bulanKelulusan, attitudeScore, kaiwaScore, bobotNilaiRekomendasi } = payload;
        const index = state.activeStudents.findIndex(s => s.id === id);
        if (index !== -1) {
          if (status) {
            state.activeStudents[index].status = status;
          }
          if (name) {
            state.activeStudents[index].name = name;
          }
          if (batch !== undefined) {
            state.activeStudents[index].batch = batch;
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
            state.activeStudents[index].attitudeScore = attitudeScore !== null && attitudeScore !== "" ? Number(attitudeScore) : undefined;
          }
          if (kaiwaScore !== undefined) {
            state.activeStudents[index].kaiwaScore = kaiwaScore !== null && kaiwaScore !== "" ? Number(kaiwaScore) : undefined;
          }
          if (bobotNilaiRekomendasi !== undefined) {
            state.activeStudents[index].bobotNilaiRekomendasi = bobotNilaiRekomendasi !== null && bobotNilaiRekomendasi !== "" ? Number(bobotNilaiRekomendasi) : undefined;
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
  return false;
}
