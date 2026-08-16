import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";

// LMS lessons, comments, quizzes, and chapter assessments
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleLmsState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {

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
        syncEntityToFirestore("lmsLessons", newLesson.id, newLesson);
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
          syncEntityToFirestore("lmsLessons", state.lmsLessons[index].id, state.lmsLessons[index]);
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
        syncEntityToFirestore("lmsComments", newComment.id, newComment);
        return res.json({ success: true, item: newComment });
      }

      if (action === "edit" || action === "update") {
        const index = state.lmsComments.findIndex(c => c.id === payload.id);
        if (index !== -1) {
          state.lmsComments[index] = {
            ...state.lmsComments[index],
            ...payload
          };
          syncEntityToFirestore("lmsComments", state.lmsComments[index].id, state.lmsComments[index]);
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
        syncEntityToFirestore("lmsQuizzes", newQuiz.id, newQuiz);
        return res.json({ success: true, item: newQuiz });
      }

      if (action === "edit" || action === "update") {
        const index = state.lmsQuizzes.findIndex(q => q.id === payload.id);
        if (index !== -1) {
          state.lmsQuizzes[index] = {
            ...state.lmsQuizzes[index],
            ...payload
          };
          syncEntityToFirestore("lmsQuizzes", state.lmsQuizzes[index].id, state.lmsQuizzes[index]);
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

        syncEntityToFirestore("chapterAssessments", record.id, record);
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
  return false;
}
