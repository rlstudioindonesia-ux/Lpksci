import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";

// Job Order applicant pipeline
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleJobOrdersState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


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
  return false;
}
