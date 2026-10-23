import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore, uploadBufferToFirebaseStorage, mergeEntityFieldsToFirestore } from "../../src/db/firebase-adapter.ts";
import { todayJakartaISO } from "../../src/lib/dateUtils.ts";
import { uniqueIdSuffix } from "../../src/lib/idGenerator.ts";

// Attendance, salaries, and teacher leave/report/contract records
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleHrState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "attendance" && action === "add") {
      let photoUrl = payload.photo || payload.photoUrl || payload.proof || "";

      const processAttendance = async () => {
        if (photoUrl && typeof photoUrl === "string" && photoUrl.startsWith("data:image")) {
          try {
            const commaIdx = photoUrl.indexOf(",");
            const semiIdx = photoUrl.indexOf(";");
            const mime = (semiIdx !== -1 && commaIdx !== -1) ? photoUrl.substring(5, semiIdx) : "image/jpeg";
            const b64 = commaIdx !== -1 ? photoUrl.substring(commaIdx + 1) : photoUrl;
            const buf = Buffer.from(b64, "base64");
            const filename = `student_absen_${payload.studentId || "siswa"}_${Date.now()}.jpg`;
            photoUrl = await uploadBufferToFirebaseStorage(buf, filename, mime, "attendance_photos");
          } catch (storageErr) {
            console.warn("[Firebase Storage] Note during student attendance photo upload:", storageErr);
          }
        }

        const newAtt = {
          id: `ATT-${uniqueIdSuffix()}`,
          studentId: payload.studentId,
          studentName: payload.studentName,
          date: payload.date || todayJakartaISO(),
          status: payload.status,
          subject: payload.subject,
          notes: payload.notes || "",
          class: payload.class || "",
          sensei: payload.sensei || "",
          type: payload.type || "",
          location: payload.location || "",
          photo: photoUrl,
          photoUrl: photoUrl,
          year: payload.year || "",
          role: payload.role || "",
          time: payload.time || "",
          hasPermission: !!payload.hasPermission
        };
        state.attendance.unshift(newAtt);
        syncEntityToFirestore("attendance", newAtt.id, newAtt);

        // Update student's attendanceScore dynamically
        if (payload.studentId) {
          const student = state.activeStudents.find((s: any) => s.id === payload.studentId);
          if (student) {
            const stRecords = state.attendance.filter((a: any) => a.studentId === payload.studentId);
            const presentCount = stRecords.filter((a: any) => a.status === "Hadir").length;
            const totalRecords = stRecords.length;
            student.attendanceScore = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

            // Also sync to firestore if using firebase
            mergeEntityFieldsToFirestore("activeStudents", student.id, { attendanceScore: student.attendanceScore });
          }
        }
        return res.json({ success: true, item: newAtt });
      };

      processAttendance().catch((err) => {
        console.error("Error saving attendance:", err);
        return res.status(500).json({ error: "Failed to save attendance" });
      });
      return true;
    }


    if ((dataType === "attendance" || dataType === "attendanceRecords") && action === "delete") {
      const { id } = payload;
      const attRecord = state.attendance.find((a: any) => a.id === id);
      const studentId = attRecord?.studentId;
      state.attendance = state.attendance.filter((a: any) => a.id !== id);
      if (id) deleteEntityFromFirestore("attendance", id);
      if (studentId) {
        const student = state.activeStudents.find(s => s.id === studentId);
        if (student) {
          const stRecords = state.attendance.filter(a => a.studentId === studentId);
          const presentCount = stRecords.filter(a => a.status === "Hadir").length;
          const totalRecords = stRecords.length;
          student.attendanceScore = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
          mergeEntityFieldsToFirestore("activeStudents", student.id, { attendanceScore: student.attendanceScore });
        }
      }
      return res.json({ success: true, id });
    }


    if ((dataType === "attendance" || dataType === "attendanceRecords") && (action === "bulk" || action === "bulkSync")) {
      const items = Array.isArray(payload) ? payload : (payload.items || []);
      if (!state.attendance) state.attendance = [];
      const idMap = new Set(state.attendance.map((a: any) => a.id));
      for (const item of items) {
        if (!idMap.has(item.id)) {
          state.attendance.push(item);
          idMap.add(item.id);
        }
      }
      return res.json({ success: true, count: state.attendance.length });
    }

    if ((dataType === "attendance" || dataType === "attendanceRecords") && (action === "edit" || action === "upsert" || action === "sync")) {
      const index = state.attendance.findIndex((a: any) => a.id === payload.id);
      if (index !== -1) {
        state.attendance[index] = { ...state.attendance[index], ...payload };
        syncEntityToFirestore("attendance", state.attendance[index].id, state.attendance[index]);
      } else {
        state.attendance.push(payload);
        syncEntityToFirestore("attendance", payload.id, payload);
      }

      // Recompute the student's attendanceScore in case status changed.
      const studentId = payload.studentId;
      if (studentId) {
        const student = state.activeStudents.find((s: any) => s.id === studentId);
        if (student) {
          const stRecords = state.attendance.filter((a: any) => a.studentId === studentId);
          const presentCount = stRecords.filter((a: any) => a.status === "Hadir").length;
          const totalRecords = stRecords.length;
          student.attendanceScore = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
          mergeEntityFieldsToFirestore("activeStudents", student.id, { attendanceScore: student.attendanceScore });
        }
      }
      return res.json({ success: true, item: payload });
    }


    if (dataType === "salaries" && action === "add") {
      if (!state.salaries) state.salaries = [];
      const newSalary = {
        id: `SAL-${uniqueIdSuffix()}`,
        staffName: payload.staffName,
        role: payload.role || "Staff",
        amount: Number(payload.amount),
        monthString: payload.monthString || "Bulan Ini",
        paymentDate: payload.paymentDate || todayJakartaISO(),
        status: payload.status || "Lunas",
        notes: payload.notes || ""
      };
      state.salaries.unshift(newSalary);
      syncEntityToFirestore("salaries", newSalary.id, newSalary);
      return res.json({ success: true, item: newSalary });
    }


    if (dataType === "salaries" && action === "edit") {
      if (!state.salaries) state.salaries = [];
      const index = state.salaries.findIndex((s: any) => s.id === payload.id);
      if (index !== -1) {
        state.salaries[index] = {
          ...state.salaries[index],
          staffName: payload.staffName ?? state.salaries[index].staffName,
          role: payload.role ?? state.salaries[index].role,
          amount: payload.amount !== undefined ? Number(payload.amount) : state.salaries[index].amount,
          monthString: payload.monthString ?? state.salaries[index].monthString,
          paymentDate: payload.paymentDate ?? state.salaries[index].paymentDate,
          status: payload.status ?? state.salaries[index].status,
          notes: payload.notes ?? state.salaries[index].notes,
        };
        syncEntityToFirestore("salaries", state.salaries[index].id, state.salaries[index]);
        return res.json({ success: true, item: state.salaries[index] });
      }
      return res.status(404).json({ error: "Salary record not found" });
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


    if (dataType === "teacherLeaves") {
      if (!state.teacherLeaves) state.teacherLeaves = [];
      if (action === "add") {
        const newLeave = {
          id: payload.id || `LEAVE-${Date.now()}`,
          teacherName: payload.teacherName,
          startDate: payload.startDate,
          endDate: payload.endDate,
          reason: payload.reason || "",
          status: "Pending",
          requestDate: payload.requestDate || new Date().toISOString()
        };
        state.teacherLeaves.unshift(newLeave);
        syncEntityToFirestore("teacherLeaves", newLeave.id, newLeave);
        return res.json({ success: true, item: newLeave });
      }
      if (action === "update") {
        const { id, status } = payload;
        const index = state.teacherLeaves.findIndex((l: any) => l.id === id);
        if (index !== -1) {
          state.teacherLeaves[index].status = status;
          syncEntityToFirestore("teacherLeaves", id, state.teacherLeaves[index]);
          return res.json({ success: true, item: state.teacherLeaves[index] });
        }
        return res.status(404).json({ error: "Leave request not found" });
      }
      if (action === "delete") {
        const { id } = payload;
        state.teacherLeaves = state.teacherLeaves.filter((l: any) => l.id !== id);
        if (id) deleteEntityFromFirestore("teacherLeaves", id);
        return res.json({ success: true, id });
      }
    }


    if (dataType === "teacherReports") {
      if (!state.teacherReports) state.teacherReports = [];
      if (action === "add") {
        const newReport = {
          id: payload.id || `REP-${Date.now()}`,
          teacherName: payload.teacherName,
          type: payload.type || "Agenda",
          content: payload.content || "",
          link: payload.link || "",
          fileUrl: payload.fileUrl || "",
          submittedDate: payload.submittedDate || payload.date || todayJakartaISO()
        };
        state.teacherReports.unshift(newReport);
        syncEntityToFirestore("teacherReports", newReport.id, newReport);
        return res.json({ success: true, item: newReport });
      }
      if (action === "delete") {
        const { id } = payload;
        state.teacherReports = state.teacherReports.filter((r: any) => r.id !== id);
        if (id) deleteEntityFromFirestore("teacherReports", id);
        return res.json({ success: true, id });
      }
    }


    if (dataType === "teacherContracts") {
      if (!state.teacherContracts) state.teacherContracts = [];
      if (action === "add") {
        const newContract = {
          id: payload.id || `CONTRACT-${Date.now()}`,
          teacherName: payload.teacherName,
          content: payload.content || "",
          status: payload.status || "Menunggu TTD"
        };
        state.teacherContracts.unshift(newContract);
        syncEntityToFirestore("teacherContracts", newContract.id, newContract);
        return res.json({ success: true, item: newContract });
      }
      if (action === "update") {
        const { id } = payload;
        const index = state.teacherContracts.findIndex((c: any) => c.id === id);
        if (index !== -1) {
          state.teacherContracts[index] = { ...state.teacherContracts[index], ...payload };
          syncEntityToFirestore("teacherContracts", state.teacherContracts[index].id, state.teacherContracts[index]);
          return res.json({ success: true, item: state.teacherContracts[index] });
        }
        return res.status(404).json({ error: "Contract not found" });
      }
      if (action === "sign") {
        const { teacherName, date } = payload;
        const index = state.teacherContracts.findIndex((c: any) => c.teacherName === teacherName);
        if (index !== -1) {
          state.teacherContracts[index].status = "Disetujui";
          state.teacherContracts[index].signedDate = date || new Date().toISOString();
          syncEntityToFirestore("teacherContracts", state.teacherContracts[index].id, state.teacherContracts[index]);
          return res.json({ success: true, item: state.teacherContracts[index] });
        }
        return res.status(404).json({ error: "Contract not found for this teacher" });
      }
      if (action === "delete") {
        const { id } = payload;
        state.teacherContracts = state.teacherContracts.filter((c: any) => c.id !== id);
        if (id) deleteEntityFromFirestore("teacherContracts", id);
        return res.json({ success: true, id });
      }
    }
  return false;
}
