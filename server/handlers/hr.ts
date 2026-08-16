import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";

// Attendance, salaries, and teacher leave/report/contract records
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleHrState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "attendance" && action === "add") {
      const newAtt = {
        id: `ATT-${Date.now().toString().slice(-4)}`,
        studentId: payload.studentId,
        studentName: payload.studentName,
        date: payload.date || new Date().toISOString().split("T")[0],
        status: payload.status,
        subject: payload.subject,
        notes: payload.notes || "",
        class: payload.class || "",
        sensei: payload.sensei || "",
        type: payload.type || "",
        location: payload.location || "",
        photo: payload.photo || "",
        year: payload.year || "",
        role: payload.role || "",
        time: payload.time || "",
        hasPermission: !!payload.hasPermission
      };
      state.attendance.unshift(newAtt);
      syncEntityToFirestore("attendance", newAtt.id, newAtt);

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


    if (dataType === "attendance" && action === "delete") {
      const { id } = payload;
      state.attendance = state.attendance.filter((a: any) => a.id !== id);
      if (id) deleteEntityFromFirestore("attendance", id);
      return res.json({ success: true, id });
    }


    if (dataType === "attendance" && action === "edit") {
      const index = state.attendance.findIndex((a: any) => a.id === payload.id);
      if (index !== -1) {
        state.attendance[index] = { ...state.attendance[index], ...payload };
        syncEntityToFirestore("attendance", state.attendance[index].id, state.attendance[index]);

        // Recompute the student's attendanceScore in case status changed.
        const studentId = state.attendance[index].studentId;
        if (studentId) {
          const student = state.activeStudents.find(s => s.id === studentId);
          if (student) {
            const stRecords = state.attendance.filter(a => a.studentId === studentId);
            const presentCount = stRecords.filter(a => a.status === "Hadir").length;
            const totalRecords = stRecords.length;
            student.attendanceScore = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
            syncEntityToFirestore("activeStudents", student.id, student);
          }
        }
        return res.json({ success: true, item: state.attendance[index] });
      }
      return res.status(404).json({ error: "Attendance record not found" });
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
          submittedDate: payload.submittedDate || payload.date || new Date().toISOString().split("T")[0]
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
