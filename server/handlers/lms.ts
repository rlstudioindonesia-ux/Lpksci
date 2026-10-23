import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore, syncEntityToFirestoreAsync, deleteEntityFromFirestoreAsync, uploadBufferToFirebaseStorage, touchSyncMeta } from "../../src/db/firebase-adapter.ts";
import { invalidateStateCache } from "../stateCache.ts";
import { isSameSubject, getCanonicalSubjectSlug } from "../../src/lib/subjectHelper.ts";
import { isQuizInBatchScope } from "../../src/lib/quizBatchScope.ts";
import { mergeQuizRetake } from "../../src/lib/quizRetake.ts";
import { todayJakartaISO } from "../../src/lib/dateUtils.ts";
import { uniqueIdSuffix } from "../../src/lib/idGenerator.ts";

async function uploadBase64IfPresent(dataStr: string | undefined, prefix: string, folder: string): Promise<string> {
  if (!dataStr || typeof dataStr !== "string" || !dataStr.startsWith("data:")) {
    return dataStr || "";
  }
  try {
    const commaIdx = dataStr.indexOf(",");
    const semiIdx = dataStr.indexOf(";");
    const mime = (semiIdx !== -1 && commaIdx !== -1) ? dataStr.substring(5, semiIdx) : "application/pdf";
    const b64 = commaIdx !== -1 ? dataStr.substring(commaIdx + 1) : dataStr;
    const buf = Buffer.from(b64, "base64");
    const ext = mime.includes("pdf") ? "pdf" : mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : (mime.split("/")[1] || "jpg");
    const filename = `${prefix}_${Date.now()}.${ext}`;
    const firebaseUrl = await uploadBufferToFirebaseStorage(buf, filename, mime, folder);
    console.log(`[Firebase Storage] Uploaded assignment/material ${filename} to ${folder}:`, firebaseUrl);
    return firebaseUrl;
  } catch (err) {
    console.warn(`[Firebase Storage] Note during ${folder} upload:`, err);
    return dataStr;
  }
}

// LMS lessons, comments, quizzes, and chapter assessments
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export async function handleLmsState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any): Promise<boolean> {

    if (dataType === "lmsLessons") {
      if (action === "add") {
        const processAddLesson = async () => {
          const lessonId = payload.id || `L-${payload.subject === "Bahasa Jepang" ? "JP" : payload.subject === "Matematika" ? "MT" : "ME"}-${uniqueIdSuffix()}`;
          
          let finalSlidesUrl = payload.slidesUrl || "";
          if (finalSlidesUrl && finalSlidesUrl.startsWith("data:")) {
            finalSlidesUrl = await uploadBase64IfPresent(finalSlidesUrl, `slides_${lessonId}`, "lms_materials");
          }

          let finalBookUrl = payload.bookUrl || "";
          if (finalBookUrl && finalBookUrl.startsWith("data:")) {
            finalBookUrl = await uploadBase64IfPresent(finalBookUrl, `book_${lessonId}`, "lms_materials");
          }

          let finalVideoUrl = payload.videoUrl || "";
          if (finalVideoUrl && finalVideoUrl.startsWith("data:")) {
            finalVideoUrl = await uploadBase64IfPresent(finalVideoUrl, `video_${lessonId}`, "lms_materials");
          }

          let finalQuizUrl = payload.quizUrl || "";
          if (finalQuizUrl && finalQuizUrl.startsWith("data:")) {
            finalQuizUrl = await uploadBase64IfPresent(finalQuizUrl, `quiz_${lessonId}`, "lms_quizzes");
          }

          let finalSoalUrl = payload.soalUrl || "";
          if (finalSoalUrl && finalSoalUrl.startsWith("data:")) {
            finalSoalUrl = await uploadBase64IfPresent(finalSoalUrl, `soal_${lessonId}`, "lms_materials");
          }

          const newLesson = {
            id: lessonId,
            subject: payload.subject,
            chapterNumber: Number(payload.chapterNumber || 1),
            title: payload.title,
            japaneseTitle: payload.japaneseTitle || "",
            difficulty: payload.difficulty || "Umum",
            contentType: payload.contentType || "text_only",
            uploadMethod: payload.uploadMethod || "url",
            content: payload.content || "",
            videoUrl: finalVideoUrl,
            slidesUrl: finalSlidesUrl,
            bookUrl: finalBookUrl,
            quizUrl: finalQuizUrl,
            soalUrl: finalSoalUrl,
            quizQuestions: payload.quizQuestions || [],
            quizStartTime: payload.quizStartTime || "",
            quizEndTime: payload.quizEndTime || "",
            audioData: payload.audioData || "",
            isLocked: !!payload.isLocked,
            targetClass: payload.targetClass || ""
          };
          state.lmsLessons.push(newLesson);
          syncEntityToFirestore("lmsLessons", newLesson.id, newLesson);
          if (typeof invalidateStateCache === "function") invalidateStateCache();
          return res.json({ success: true, item: newLesson });
        };
        try {
          await processAddLesson();
        } catch (err) {
          console.error("Error adding LMS lesson:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Gagal menyimpan materi LMS" });
            return true;
          }
        }
        return true;
      }

      if (action === "edit" || action === "update") {
        const index = state.lmsLessons.findIndex(l => l.id === payload.id);
        if (index !== -1) {
          const processEditLesson = async () => {
            // 23-10-2026: changing the quiz schedule used to DELETE every student's
            // grade for this lesson ("so they can redo"), even when only the
            // deadline was extended. Grades are never deleted here any more (owner's
            // request); a retake overwrites the record and keeps the best score.

            let finalSlidesUrl = payload.slidesUrl !== undefined ? payload.slidesUrl : state.lmsLessons[index].slidesUrl;
            if (finalSlidesUrl && finalSlidesUrl.startsWith("data:")) {
              finalSlidesUrl = await uploadBase64IfPresent(finalSlidesUrl, `slides_${payload.id}`, "lms_materials");
            }

            let finalBookUrl = payload.bookUrl !== undefined ? payload.bookUrl : state.lmsLessons[index].bookUrl;
            if (finalBookUrl && finalBookUrl.startsWith("data:")) {
              finalBookUrl = await uploadBase64IfPresent(finalBookUrl, `book_${payload.id}`, "lms_materials");
            }

            let finalVideoUrl = payload.videoUrl !== undefined ? payload.videoUrl : state.lmsLessons[index].videoUrl;
            if (finalVideoUrl && finalVideoUrl.startsWith("data:")) {
              finalVideoUrl = await uploadBase64IfPresent(finalVideoUrl, `video_${payload.id}`, "lms_materials");
            }

            let finalQuizUrl = payload.quizUrl !== undefined ? payload.quizUrl : state.lmsLessons[index].quizUrl;
            if (finalQuizUrl && finalQuizUrl.startsWith("data:")) {
              finalQuizUrl = await uploadBase64IfPresent(finalQuizUrl, `quiz_${payload.id}`, "lms_quizzes");
            }

            let finalSoalUrl = payload.soalUrl !== undefined ? payload.soalUrl : state.lmsLessons[index].soalUrl;
            if (finalSoalUrl && finalSoalUrl.startsWith("data:")) {
              finalSoalUrl = await uploadBase64IfPresent(finalSoalUrl, `soal_${payload.id}`, "lms_materials");
            }

            state.lmsLessons[index] = {
              ...state.lmsLessons[index],
              ...payload,
              slidesUrl: finalSlidesUrl,
              bookUrl: finalBookUrl,
              videoUrl: finalVideoUrl,
              quizUrl: finalQuizUrl,
              soalUrl: finalSoalUrl,
              chapterNumber: payload.chapterNumber !== undefined ? Number(payload.chapterNumber) : state.lmsLessons[index].chapterNumber
            };
            syncEntityToFirestore("lmsLessons", state.lmsLessons[index].id, state.lmsLessons[index]);
            if (typeof invalidateStateCache === "function") invalidateStateCache();
            res.json({ success: true, item: state.lmsLessons[index] });
            return true;
          };
          try {
            await processEditLesson();
          } catch (err) {
            console.error("Error updating LMS lesson:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Gagal memperbarui materi LMS" });
              return true;
            }
          }
          return true;
        }
        res.status(404).json({ error: "Lesson not found" });
        return true;
      }

      if (action === "delete") {
        const { id } = payload;
        state.lmsLessons = state.lmsLessons.filter(l => l.id !== id);
        if (id) deleteEntityFromFirestore("lmsLessons", id);
        if (typeof invalidateStateCache === "function") invalidateStateCache();
        res.json({ success: true, id });
        return true;
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
        res.json({ success: true, item: newComment });
        return true;
      }

      if (action === "edit" || action === "update") {
        const index = state.lmsComments.findIndex(c => c.id === payload.id);
        if (index !== -1) {
          state.lmsComments[index] = {
            ...state.lmsComments[index],
            ...payload
          };
          syncEntityToFirestore("lmsComments", state.lmsComments[index].id, state.lmsComments[index]);
          res.json({ success: true, item: state.lmsComments[index] });
          return true;
        }
        res.status(404).json({ error: "Comment not found" });
        return true;
      }

      if (action === "delete") {
        const { id } = payload;
        state.lmsComments = state.lmsComments.filter(c => c.id !== id);
        if (id) deleteEntityFromFirestore("lmsComments", id);
        res.json({ success: true, id });
        return true;
      }
    }


    if (dataType === "lmsQuizzes") {
      const normQuizAction = (action || "").toLowerCase();

      if (normQuizAction === "batch_upsert" || normQuizAction === "batch_save" || normQuizAction === "save_batch") {
        const processBatchQuiz = async () => {
          if (!state.lmsQuizzes) state.lmsQuizzes = [];
          const chapterNumber = Number(payload.chapterNumber || payload.chapterId || 1);
          const subject = payload.subject || "Bahasa Jepang";
          const targetClass = payload.targetClass || "Semua";
          const deadline = payload.deadline || "";
          const durationMinutes = payload.durationMinutes !== undefined && payload.durationMinutes !== "" ? Number(payload.durationMinutes) : undefined;
          const shuffleQuestions = payload.shuffleQuestions !== undefined ? !!payload.shuffleQuestions : true;
          const subTitle = (payload.subTitle ? String(payload.subTitle).trim() : "");
          const lessonId = (payload.lessonId ? String(payload.lessonId).trim() : "");
          const rawQuizzes = Array.isArray(payload.quizzes) ? payload.quizzes : [];

          // 1. Existing questions this batch replaces: same chapter, subject, class and
          //    Sub-Judul/Materi only (see src/lib/quizBatchScope.ts).
          const batchScope = { chapterNumber, subject, subTitle, lessonId, targetClass, incomingQuizzes: rawQuizzes };
          const oldQuizzesForChapter = state.lmsQuizzes.filter((q: any) => isQuizInBatchScope(q, batchScope));

          // 2. Process all incoming quizzes in parallel for media uploads (if any)
          const seenQuizIds = new Set<string>();
          const processedQuizzes = await Promise.all(
            rawQuizzes.map(async (q: any, idx: number) => {
              let quizId = q.id && typeof q.id === "string" && !q.id.startsWith("TEMP_") ? q.id : "";
              if (!quizId || seenQuizIds.has(quizId)) {
                quizId = `QZ-${chapterNumber}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 8)}_${Math.floor(Math.random() * 100000)}`;
              }
              seenQuizIds.add(quizId);

              let finalImg = q.imageUrl || "";
              if (finalImg && finalImg.startsWith("data:")) {
                finalImg = await uploadBase64IfPresent(finalImg, `quiz_img_${quizId}`, "lms_quizzes");
              }

              let finalAud = q.audioUrl || "";
              if (finalAud && finalAud.startsWith("data:")) {
                finalAud = await uploadBase64IfPresent(finalAud, `quiz_aud_${quizId}`, "lms_audio");
              }

              return {
                id: quizId,
                subject: q.subject || subject,
                chapterNumber: chapterNumber,
                chapterId: chapterNumber,
                subTitle: q.subTitle || subTitle || "",
                lessonId: q.lessonId || lessonId || "",
                targetClass: q.targetClass || targetClass,
                deadline: q.deadline !== undefined ? q.deadline : deadline,
                durationMinutes: q.durationMinutes !== undefined && q.durationMinutes !== ""
                  ? Number(q.durationMinutes)
                  : durationMinutes,
                questionType: q.questionType || "pilihan_ganda",
                question: q.question !== undefined ? q.question : "",
                options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["", "", "", ""],
                correctAnswerIndex: q.correctAnswerIndex !== undefined ? Number(q.correctAnswerIndex) : 0,
                correctAnswerEssay: q.correctAnswerEssay || q.correctAnswerText || "",
                correctAnswerText: q.correctAnswerText || q.correctAnswerEssay || "",
                shuffleQuestions: q.shuffleQuestions !== undefined ? !!q.shuffleQuestions : shuffleQuestions,
                imageUrl: finalImg,
                videoUrl: q.videoUrl || "",
                audioUrl: finalAud,
                points: q.points !== undefined ? Number(q.points) : 10,
                required: q.required !== undefined ? !!q.required : true,
                explanation: q.explanation || ""
              };
            })
          );

          // 3. Delete old questions that were removed in this batch (scoped to subTitle if provided)
          const newQuizIdSet = new Set(processedQuizzes.map(q => q.id));
          const toDelete = oldQuizzesForChapter.filter((oldQ: any) => oldQ.id && !newQuizIdSet.has(oldQ.id));
          if (toDelete.length > 0) {
            await Promise.all(toDelete.map((oldQ: any) => deleteEntityFromFirestoreAsync("lmsQuizzes", oldQ.id)));
          }

          // 4. Update in-memory state: keep everything outside this batch's scope
          state.lmsQuizzes = [
            ...state.lmsQuizzes.filter((q: any) => !isQuizInBatchScope(q, batchScope) && !newQuizIdSet.has(q.id)),
            ...processedQuizzes
          ];

          // 5. Persist ALL new quizzes to Firestore atomically
          await Promise.all(processedQuizzes.map(q => syncEntityToFirestoreAsync("lmsQuizzes", q.id, q)));

          // 6. Invalidate state cache so immediate /api/state fetches have the 100% up-to-date data
          if (typeof invalidateStateCache === "function") {
            invalidateStateCache();
          }

          console.log(`✅ [LMS Quiz Batch] Successfully saved all ${processedQuizzes.length} quizzes for Bab ${chapterNumber} (${subject}) to state and Firestore!`);
          return res.json({ success: true, count: processedQuizzes.length, items: processedQuizzes, chapterNumber, subject });
        };

        try {
          await processBatchQuiz();
        } catch (err) {
          console.error("Error in batch quiz upsert:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Gagal menyimpan kuis massal ke Firestore" });
            return true;
          }
        }
        return true;
      }

      if (normQuizAction === "add" || normQuizAction === "create") {
        const processAddQuiz = async () => {
          if (!state.lmsQuizzes) state.lmsQuizzes = [];
          const quizId = payload.id || `Q-${payload.subject === "Bahasa Jepang" ? "JP" : payload.subject === "SSW" ? "SW" : "ME"}-${uniqueIdSuffix()}`;
          
          let finalImg = payload.imageUrl || "";
          if (finalImg && finalImg.startsWith("data:")) {
            finalImg = await uploadBase64IfPresent(finalImg, `quiz_img_${quizId}`, "lms_quizzes");
          }

          let finalAud = payload.audioUrl || "";
          if (finalAud && finalAud.startsWith("data:")) {
            finalAud = await uploadBase64IfPresent(finalAud, `quiz_aud_${quizId}`, "lms_audio");
          }

          const newQuiz = {
            id: quizId,
            subject: payload.subject || "Bahasa Jepang",
            chapterNumber: Number(payload.chapterNumber || payload.chapterId || 1),
            chapterId: payload.chapterId || payload.chapterNumber || 1,
            targetClass: payload.targetClass || "Semua",
            deadline: payload.deadline || "",
            durationMinutes: payload.durationMinutes !== undefined && payload.durationMinutes !== "" ? Number(payload.durationMinutes) : undefined,
            questionType: payload.questionType || "pilihan_ganda",
            question: payload.question || "",
            options: payload.options || [],
            correctAnswerIndex: payload.correctAnswerIndex !== undefined ? Number(payload.correctAnswerIndex) : 0,
            correctAnswerEssay: payload.correctAnswerEssay || payload.correctAnswerText || "",
            correctAnswerText: payload.correctAnswerText || payload.correctAnswerEssay || "",
            shuffleQuestions: payload.shuffleQuestions !== undefined ? !!payload.shuffleQuestions : true,
            imageUrl: finalImg,
            videoUrl: payload.videoUrl || "",
            audioUrl: finalAud,
            points: payload.points !== undefined ? Number(payload.points) : 10,
            required: payload.required !== undefined ? !!payload.required : true,
            explanation: payload.explanation || ""
          };

          const existingIndex = state.lmsQuizzes.findIndex(q => q.id === quizId);
          if (existingIndex !== -1) {
            state.lmsQuizzes[existingIndex] = { ...state.lmsQuizzes[existingIndex], ...newQuiz };
            syncEntityToFirestore("lmsQuizzes", newQuiz.id, state.lmsQuizzes[existingIndex]);
            if (typeof invalidateStateCache === "function") invalidateStateCache();
            res.json({ success: true, item: state.lmsQuizzes[existingIndex] });
            return true;
          } else {
            state.lmsQuizzes.push(newQuiz);
            syncEntityToFirestore("lmsQuizzes", newQuiz.id, newQuiz);
            if (typeof invalidateStateCache === "function") invalidateStateCache();
            res.json({ success: true, item: newQuiz });
            return true;
          }
        };
        try {
          await processAddQuiz();
        } catch (err) {
          console.error("Error adding quiz:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Gagal menyimpan kuis LMS" });
            return true;
          }
        }
        return true;
      }

      if (normQuizAction === "edit" || normQuizAction === "update" || normQuizAction === "upsert") {
        const processEditQuiz = async () => {
          if (!state.lmsQuizzes) state.lmsQuizzes = [];
          const quizId = payload.id || `Q-${payload.subject === "Bahasa Jepang" ? "JP" : payload.subject === "SSW" ? "SW" : "ME"}-${uniqueIdSuffix()}`;
          const index = state.lmsQuizzes.findIndex(q => q.id === quizId);

          let finalImg = payload.imageUrl !== undefined ? payload.imageUrl : (index !== -1 ? state.lmsQuizzes[index].imageUrl : "");
          if (finalImg && finalImg.startsWith("data:")) {
            finalImg = await uploadBase64IfPresent(finalImg, `quiz_img_${quizId}`, "lms_quizzes");
          }

          let finalAud = payload.audioUrl !== undefined ? payload.audioUrl : (index !== -1 ? state.lmsQuizzes[index].audioUrl : "");
          if (finalAud && finalAud.startsWith("data:")) {
            finalAud = await uploadBase64IfPresent(finalAud, `quiz_aud_${quizId}`, "lms_audio");
          }

          const mergedQuiz = {
            id: quizId,
            subject: payload.subject || (index !== -1 ? state.lmsQuizzes[index].subject : "Bahasa Jepang"),
            chapterNumber: Number(payload.chapterNumber || payload.chapterId || (index !== -1 ? state.lmsQuizzes[index].chapterNumber : 1)),
            chapterId: payload.chapterId || payload.chapterNumber || (index !== -1 ? state.lmsQuizzes[index].chapterId : 1),
            targetClass: payload.targetClass || (index !== -1 ? state.lmsQuizzes[index].targetClass : "Semua"),
            deadline: payload.deadline !== undefined ? payload.deadline : (index !== -1 ? state.lmsQuizzes[index].deadline : ""),
            durationMinutes: payload.durationMinutes !== undefined && payload.durationMinutes !== "" 
              ? Number(payload.durationMinutes) 
              : (index !== -1 ? state.lmsQuizzes[index].durationMinutes : undefined),
            questionType: payload.questionType || (index !== -1 ? state.lmsQuizzes[index].questionType : "pilihan_ganda"),
            question: payload.question !== undefined ? payload.question : (index !== -1 ? state.lmsQuizzes[index].question : ""),
            options: payload.options || (index !== -1 ? state.lmsQuizzes[index].options : []),
            correctAnswerIndex: payload.correctAnswerIndex !== undefined 
              ? Number(payload.correctAnswerIndex) 
              : (index !== -1 ? state.lmsQuizzes[index].correctAnswerIndex : 0),
            correctAnswerEssay: payload.correctAnswerEssay || payload.correctAnswerText || (index !== -1 ? state.lmsQuizzes[index].correctAnswerEssay : ""),
            correctAnswerText: payload.correctAnswerText || payload.correctAnswerEssay || (index !== -1 ? state.lmsQuizzes[index].correctAnswerText : ""),
            shuffleQuestions: payload.shuffleQuestions !== undefined 
              ? !!payload.shuffleQuestions 
              : (index !== -1 && state.lmsQuizzes[index].shuffleQuestions !== undefined ? state.lmsQuizzes[index].shuffleQuestions : true),
            imageUrl: finalImg,
            videoUrl: payload.videoUrl !== undefined ? payload.videoUrl : (index !== -1 ? state.lmsQuizzes[index].videoUrl : ""),
            audioUrl: finalAud,
            points: payload.points !== undefined 
              ? Number(payload.points) 
              : (index !== -1 && state.lmsQuizzes[index].points !== undefined ? state.lmsQuizzes[index].points : 10),
            required: payload.required !== undefined 
              ? !!payload.required 
              : (index !== -1 && state.lmsQuizzes[index].required !== undefined ? state.lmsQuizzes[index].required : true),
            explanation: payload.explanation !== undefined 
              ? payload.explanation 
              : (index !== -1 ? state.lmsQuizzes[index].explanation : "")
          };

          if (index !== -1) {
            state.lmsQuizzes[index] = { ...state.lmsQuizzes[index], ...mergedQuiz };
            syncEntityToFirestore("lmsQuizzes", state.lmsQuizzes[index].id, state.lmsQuizzes[index]);
            if (typeof invalidateStateCache === "function") invalidateStateCache();
            res.json({ success: true, item: state.lmsQuizzes[index] });
            return true;
          } else {
            state.lmsQuizzes.push(mergedQuiz);
            syncEntityToFirestore("lmsQuizzes", mergedQuiz.id, mergedQuiz);
            if (typeof invalidateStateCache === "function") invalidateStateCache();
            res.json({ success: true, item: mergedQuiz });
            return true;
          }
        };
        try {
          await processEditQuiz();
        } catch (err) {
          console.error("Error updating quiz:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Gagal memperbarui kuis LMS" });
            return true;
          }
        }
        return true;
      }

      if (normQuizAction === "delete") {
        const { id } = payload;
        if (!state.lmsQuizzes) state.lmsQuizzes = [];
        state.lmsQuizzes = state.lmsQuizzes.filter(q => q.id !== id);
        if (id) deleteEntityFromFirestore("lmsQuizzes", id);
        if (typeof invalidateStateCache === "function") invalidateStateCache();
        res.json({ success: true, id });
        return true;
      }
    }


    if (dataType === "chapterAssessments") {
      const normAction = (action || "").toLowerCase();
      if (normAction === "update" || normAction === "upsert" || normAction === "add" || normAction === "create" || normAction === "edit" || normAction === "save") {
        if (!state.chapterAssessments) {
          state.chapterAssessments = [];
        }

        const processAssessment = async () => {
          const { id: payloadId, studentId, studentName, chapterNumber, title, status, score, scoreKotoba, scoreBumpo, scoreKaiwa, scoreKanji, grade, notes, assessedBy, subject, isUnlocked, lessonId, subTitle, targetClass, studentEmail } = payload;
          
          let cleanStudentId = String(studentId || "").trim();
          let finalStudentName = studentName ? String(studentName).trim() : "";
          const cleanSubject = String(subject || "Bahasa Jepang").trim().toLowerCase();
          const cleanChapterNum = chapterNumber !== undefined ? Number(chapterNumber) : 1;

          // Cross-reference activeStudents and users to always canonicalize cleanStudentId to official student ID (e.g. SIS-xxx)
          const matchedActive = (state.activeStudents || []).find((s: any) => {
            const sId = (s.id || "").trim().toLowerCase();
            const sEmail = (s.email || "").trim().toLowerCase();
            const sName = (s.name || "").trim().toLowerCase();
            const target = cleanStudentId.toLowerCase();
            return (sId && sId === target) ||
                   (sEmail && sEmail === target) ||
                   (target.includes("@") && sEmail === target) ||
                   (finalStudentName && finalStudentName !== "Siswa" && sName === finalStudentName.toLowerCase());
          });

          if (matchedActive) {
            cleanStudentId = matchedActive.id || cleanStudentId;
            if (!finalStudentName || finalStudentName === "Siswa") {
              finalStudentName = matchedActive.name || finalStudentName;
            }
          } else {
            const matchedUser = (state.users || []).find((u: any) => {
              const uId = (u.id || "").trim().toLowerCase();
              const uEmail = (u.email || "").trim().toLowerCase();
              const uUsername = (u.username || "").trim().toLowerCase();
              const target = cleanStudentId.toLowerCase();
              return (uId && uId === target) || (uEmail && uEmail === target) || (uUsername && uUsername === target);
            });
            if (matchedUser?.studentId) {
              cleanStudentId = matchedUser.studentId;
              if (!finalStudentName || finalStudentName === "Siswa") {
                finalStudentName = matchedUser.name || finalStudentName;
              }
            }
          }

          let index = state.chapterAssessments.findIndex(
            (c: any) => {
              if (payloadId && c.id === payloadId) return true;
              if (lessonId && c.lessonId && c.lessonId === lessonId) {
                return (c.studentId || "").trim().toLowerCase() === cleanStudentId.toLowerCase();
              }
              // A record whose studentId is ANOTHER known student is never "the same
              // student": matching by name used to pick it when two students share a
              // name, and it was then deleted below as a "duplicate" - wiping the
              // other student's grade for this chapter. Legacy records (no/unknown
              // studentId) keep the old id/name fallbacks.
              const recordStudentId = (c.studentId || "").trim().toLowerCase();
              const belongsToOtherStudent = !!recordStudentId &&
                recordStudentId !== cleanStudentId.toLowerCase() &&
                (state.activeStudents || []).some((s: any) => (s.id || "").trim().toLowerCase() === recordStudentId);
              const sameStudent = !belongsToOtherStudent && (
                recordStudentId === cleanStudentId.toLowerCase() ||
                (cleanStudentId && (c.id || "").toLowerCase().includes(cleanStudentId.toLowerCase())) ||
                (finalStudentName && c.studentName && c.studentName.toLowerCase() === finalStudentName.toLowerCase()));
              const sameChapter = Number(c.chapterNumber) === cleanChapterNum;
              const sameSubject = isSameSubject(c.subject, cleanSubject);
              return sameStudent && sameChapter && sameSubject;
            }
          );

          const existingRecord = index !== -1 ? state.chapterAssessments[index] : null;
          const subjSlug = getCanonicalSubjectSlug(cleanSubject);
          const canonicalId = payloadId || (lessonId 
            ? `asses-${cleanStudentId}-${lessonId}` 
            : `asses-${cleanStudentId}-${subjSlug}-ch${cleanChapterNum}`);
          const targetId = canonicalId;

          let finalSubmissionUrl = payload.submissionUrl !== undefined ? payload.submissionUrl : (existingRecord ? existingRecord.submissionUrl : undefined);
          if (finalSubmissionUrl && typeof finalSubmissionUrl === "string" && finalSubmissionUrl.startsWith("data:")) {
            const filePrefix = `tugas_${cleanStudentId || "siswa"}_${lessonId || targetId}`;
            finalSubmissionUrl = await uploadBase64IfPresent(finalSubmissionUrl, filePrefix, "lms_assignments");
          }

          const record = {
            id: targetId,
            studentId: cleanStudentId || (existingRecord ? existingRecord.studentId : undefined),
            studentName: finalStudentName || (existingRecord ? existingRecord.studentName : undefined),
            studentEmail: studentEmail || (existingRecord ? existingRecord.studentEmail : undefined),
            chapterNumber: cleanChapterNum,
            chapterId: `ch-${cleanChapterNum}`,
            title: title || (existingRecord ? existingRecord.title : `Bab ${cleanChapterNum}`),
            status: status || (existingRecord ? existingRecord.status : "Telah Dinilai"),
            score: score !== undefined && score !== null && score !== "" ? Number(score) : (existingRecord ? existingRecord.score : undefined),
            scoreKotoba: scoreKotoba !== undefined && scoreKotoba !== null && scoreKotoba !== "" ? Number(scoreKotoba) : (existingRecord ? existingRecord.scoreKotoba : undefined),
            scoreBumpo: scoreBumpo !== undefined && scoreBumpo !== null && scoreBumpo !== "" ? Number(scoreBumpo) : (existingRecord ? existingRecord.scoreBumpo : undefined),
            scoreKaiwa: scoreKaiwa !== undefined && scoreKaiwa !== null && scoreKaiwa !== "" ? Number(scoreKaiwa) : (existingRecord ? existingRecord.scoreKaiwa : undefined),
            scoreKanji: scoreKanji !== undefined && scoreKanji !== null && scoreKanji !== "" ? Number(scoreKanji) : (existingRecord ? existingRecord.scoreKanji : undefined),
            grade: grade || (existingRecord ? existingRecord.grade : undefined),
            notes: notes !== undefined ? notes : (existingRecord ? existingRecord.notes : ""),
            assessedBy: assessedBy || (existingRecord ? existingRecord.assessedBy : "Sensei Utama"),
            assessedDate: payload.assessedDate || todayJakartaISO(),
            timestamp: payload.timestamp || Date.now(),
            subject: subject || (existingRecord ? existingRecord.subject : (subjSlug === "matematika" ? "Matematika" : "Bahasa Jepang")),
            isUnlocked: isUnlocked !== undefined ? !!isUnlocked : (existingRecord ? !!existingRecord.isUnlocked : cleanChapterNum === 1),
            lessonId: lessonId || (existingRecord ? existingRecord.lessonId : undefined),
            subTitle: subTitle || payload.subTitle || (existingRecord ? existingRecord.subTitle : undefined),
            targetClass: targetClass || payload.targetClass || (existingRecord ? existingRecord.targetClass : undefined),
            submissionUrl: finalSubmissionUrl,
            submissionDate: payload.submissionDate || (existingRecord ? existingRecord.submissionDate : undefined),
            studentAnswers: payload.studentAnswers !== undefined ? payload.studentAnswers : (existingRecord ? existingRecord.studentAnswers : undefined),
            essayAnswers: payload.essayAnswers !== undefined ? payload.essayAnswers : (existingRecord ? existingRecord.essayAnswers : undefined),
            quizDetails: payload.quizDetails !== undefined ? payload.quizDetails : (existingRecord ? existingRecord.quizDetails : undefined),
            details: payload.details !== undefined ? payload.details : (existingRecord ? existingRecord.details : undefined),
            submittedAt: payload.submittedAt || (existingRecord ? existingRecord.submittedAt : undefined)
          };

          // Retake: same record is overwritten, but the best CBT score is kept
          // (src/lib/quizRetake.ts).
          const savedRecord = mergeQuizRetake(existingRecord, record);

          // Remove any duplicate records in memory for this student + chapter + subject
          const oldDuplicateIds: string[] = [];
          if (existingRecord && existingRecord.id && existingRecord.id !== targetId) {
            oldDuplicateIds.push(existingRecord.id);
          }
          state.chapterAssessments = state.chapterAssessments.filter((c: any) => {
            const isDup = (c.studentId || "").trim().toLowerCase() === cleanStudentId.toLowerCase() && 
                          Number(c.chapterNumber) === cleanChapterNum && 
                          isSameSubject(c.subject, cleanSubject) &&
                          (!lessonId || c.lessonId === lessonId) &&
                          c.id !== targetId;
            if (isDup) {
              if (c.id && !oldDuplicateIds.includes(c.id)) oldDuplicateIds.push(c.id);
              return false;
            }
            return true;
          });

          index = state.chapterAssessments.findIndex((c: any) => c.id === targetId);

          if (index !== -1) {
            state.chapterAssessments[index] = savedRecord;
          } else {
            state.chapterAssessments.push(savedRecord);
          }

          // Delete duplicates from Firestore asynchronously
          for (const dupId of oldDuplicateIds) {
            deleteEntityFromFirestore( "chapterAssessments", dupId);
          }

          // Write to Firestore and await confirmation to guarantee persistence
          try {
            await syncEntityToFirestoreAsync("chapterAssessments", savedRecord.id, savedRecord);
          } catch (syncErr) {
            console.warn("syncEntityToFirestoreAsync fallback for chapterAssessments:", syncErr);
            syncEntityToFirestore("chapterAssessments", savedRecord.id, savedRecord);
          }
          touchSyncMeta({ source: "api", dataType: "chapterAssessments", id: savedRecord.id, action: "upsert" }).catch(() => {});
          if (typeof invalidateStateCache === "function") invalidateStateCache();
          res.json({ success: true, item: savedRecord });
          return true;
        };

        try {
          await processAssessment();
        } catch (err) {
          console.error("Error processing chapter assessment / tugas:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Gagal menyimpan evaluasi tugas" });
            return true;
          }
        }
        return true;
      }

      if (normAction === "delete") {
        if (state.chapterAssessments) {
          state.chapterAssessments = state.chapterAssessments.filter((c: any) => c.id !== payload.id);
          const assessId = payload?.id || "";
          touchSyncMeta({ source: "api", dataType: "chapterAssessments", ...(assessId ? { id: assessId } : {}), action: "delete" }).catch(() => {});
        }
        if (typeof invalidateStateCache === "function") invalidateStateCache();
        res.json({ success: true });
        return true;
      }
    }
  return false;
}
