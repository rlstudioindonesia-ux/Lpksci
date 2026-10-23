import { checkEssayAnswer } from "../../lib/essayAnswer";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Save,
  User,
  BookOpen,
  Award,
  Clock,
  Check,
  HelpCircle,
  FileText,
  Sparkles
} from "lucide-react";

// Shared, stricter implementation (src/lib/essayAnswer.ts).
export { checkEssayAnswer };

interface StudentQuizReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  chapterNumber: number;
  chapterTitle?: string;
  subject?: string;
  quizzes: any[];
  assessment: any;
  onUpdateState?: (dataType: string, action: string, payload: any) => Promise<boolean>;
  currentUser?: any;
}

export default function StudentQuizReviewModal({
  isOpen,
  onClose,
  student,
  chapterNumber,
  chapterTitle,
  subject = "Bahasa Jepang",
  quizzes = [],
  assessment,
  onUpdateState,
  currentUser
}: StudentQuizReviewModalProps) {
  // Extract saved quiz details or construct from student choices
  const initialDetails = assessment?.details?.quizDetails || assessment?.quizDetails || [];
  const studentAnswersMap = assessment?.details?.studentQuizAnswers || assessment?.studentAnswers || {};
  const studentEssayAnswersMap = assessment?.details?.studentQuizEssayAnswers || assessment?.essayAnswers || {};

  // Build effective list of quizzes (prefer quizzes prop, fallback to assessment details)
  const effectiveQuizzes = React.useMemo(() => {
    if (quizzes && quizzes.length > 0) return quizzes;
    if (initialDetails && initialDetails.length > 0) {
      return initialDetails.map((d: any, idx: number) => {
        const cIndices = Array.isArray(d.correctAnswerIndices) && d.correctAnswerIndices.length > 0
          ? d.correctAnswerIndices.map(Number)
          : (d.correctAnswerIndex !== undefined ? [Number(d.correctAnswerIndex)] : [0]);
        return {
          id: d.quizId || d.id || `detail-${idx}`,
          question: d.question || `Soal ${idx + 1}`,
          questionType: d.questionType || (d.studentEssay ? "essay" : (cIndices.length > 1 ? "pilihan_ganda_kompleks" : "pilihan_ganda")),
          options: d.options || [],
          points: d.maxPoints || d.points || 10,
          correctAnswerEssay: d.correctAnswerEssay || d.correctAnswerText || "",
          correctAnswerIndex: cIndices[0] !== undefined ? cIndices[0] : (d.correctAnswerIndex !== undefined ? Number(d.correctAnswerIndex) : 0),
          correctAnswerIndices: cIndices,
          allowMultipleAnswers: !!d.allowMultipleAnswers || d.questionType === "pilihan_ganda_kompleks" || cIndices.length > 1,
          imageUrl: d.imageUrl,
          audioUrl: d.audioUrl
        };
      });
    }
    return [];
  }, [quizzes, initialDetails]);

  // Local state for essay points adjustment and notes
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [questionNotes, setQuestionNotes] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState<string>(assessment?.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize custom points per question
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    const initialNotes: Record<string, string> = {};

    effectiveQuizzes.forEach((q: any) => {
      const qId = q.id;
      const pointsMax = Number(q.points) || 10;
      const detail = initialDetails.find((d: any) => d.quizId === qId || d.id === qId);

      if (detail && detail.adjustedPoints !== undefined) {
        initialScores[qId] = Number(detail.adjustedPoints);
        if (detail.correctionNote) initialNotes[qId] = detail.correctionNote;
      } else {
        // Compute default score
        if (q.questionType === "essay") {
          const studentAns = studentEssayAnswersMap[qId] || detail?.studentEssay || "";
          const keyAns = q.correctAnswerEssay || q.correctAnswerText || detail?.correctAnswerEssay || "";
          
          if (checkEssayAnswer(studentAns, keyAns)) {
            initialScores[qId] = pointsMax;
          } else {
            initialScores[qId] = detail?.isCorrect ? pointsMax : 0;
          }
        } else {
          // Multiple choice (Single or Multi-Answer)
          const rawStudentChoice = studentAnswersMap[qId] !== undefined 
            ? studentAnswersMap[qId] 
            : detail?.studentChoice;
          
          const correctKeys: number[] = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
            ? q.correctAnswerIndices.map(Number)
            : (Array.isArray(detail?.correctAnswerIndices) && detail.correctAnswerIndices.length > 0
              ? detail.correctAnswerIndices.map(Number)
              : [q.correctAnswerIndex !== undefined ? Number(q.correctAnswerIndex) : (detail?.correctAnswerIndex !== undefined ? Number(detail.correctAnswerIndex) : 0)]);

          if (rawStudentChoice === undefined || rawStudentChoice === null) {
            initialScores[qId] = 0;
          } else {
            const studentKeys: number[] = Array.isArray(rawStudentChoice)
              ? rawStudentChoice.map(Number)
              : [Number(rawStudentChoice)];
            
            if (studentKeys.length === correctKeys.length) {
              const sortedStudent = [...studentKeys].sort((a, b) => a - b);
              const sortedCorrect = [...correctKeys].sort((a, b) => a - b);
              const isMatch = sortedStudent.every((val, i) => val === sortedCorrect[i]);
              initialScores[qId] = isMatch ? pointsMax : 0;
            } else {
              initialScores[qId] = 0;
            }
          }
        }
      }
    });

    setQuestionScores(initialScores);
    setQuestionNotes(initialNotes);
    setGeneralNotes(assessment?.notes || "");
  }, [effectiveQuizzes, assessment]);

  // Compute total points max & current earned score
  const totalMaxPoints = effectiveQuizzes.reduce((acc: number, q: any) => acc + (Number(q.points) || 10), 0) || 1;
  const currentEarnedPoints = Object.values(questionScores).reduce((acc, pts) => acc + (Number(pts) || 0), 0);
  const calculatedPercentage = Math.min(100, Math.round((currentEarnedPoints / totalMaxPoints) * 100));

  // Handler to set points for a question
  const handleSetPoints = (qId: string, points: number) => {
    setQuestionScores((prev) => ({
      ...prev,
      [qId]: points
    }));
  };

  // Handler to save corrected assessment
  const handleSaveCorrection = async () => {
    if (!onUpdateState) {
      alert("Fungsi penyimpanan tidak tersedia.");
      return;
    }

    setIsSaving(true);
    try {
      const studentId = student?.id || student?.studentId || assessment?.studentId;
      const studentName = student?.name || assessment?.studentName || "Siswa";
      const finalGrade = calculatedPercentage >= 85 ? "A" : calculatedPercentage >= 75 ? "B" : calculatedPercentage >= 60 ? "C" : "D";

      // Build updated quiz details
      const updatedDetails = effectiveQuizzes.map((q: any) => {
        const qId = q.id;
        const detail = initialDetails.find((d: any) => d.quizId === qId || d.id === qId);
        const maxPts = Number(q.points) || 10;
        const currentPts = questionScores[qId] !== undefined ? questionScores[qId] : 0;
        const isEssay = q.questionType === "essay";

        const rawStudentChoice = studentAnswersMap[qId] !== undefined 
          ? studentAnswersMap[qId] 
          : (detail?.studentChoice ?? q.studentChoice);
        const studentChoice = Array.isArray(rawStudentChoice)
          ? rawStudentChoice.map(Number)
          : (rawStudentChoice !== undefined && rawStudentChoice !== null ? Number(rawStudentChoice) : undefined);
        const studentEssay = studentEssayAnswersMap[qId] || detail?.studentEssay || q.studentEssay || "";

        return {
          quizId: qId,
          question: q.question,
          questionType: q.questionType || (isEssay ? "essay" : "pilihan_ganda"),
          options: q.options || [],
          correctAnswerIndex: q.correctAnswerIndex,
          correctAnswerIndices: q.correctAnswerIndices || (q.correctAnswerIndex !== undefined ? [Number(q.correctAnswerIndex)] : [0]),
          allowMultipleAnswers: !!q.allowMultipleAnswers || q.questionType === "pilihan_ganda_kompleks",
          correctAnswerEssay: q.correctAnswerEssay || q.correctAnswerText || "",
          studentChoice,
          studentEssay,
          maxPoints: maxPts,
          adjustedPoints: currentPts,
          isCorrect: currentPts > 0,
          correctionNote: questionNotes[qId] || ""
        };
      });

      const updatedPayload = {
        id: assessment?.id,
        studentId,
        studentName,
        chapterNumber,
        title: chapterTitle || `Bab ${chapterNumber}`,
        subTitle: assessment?.subTitle || undefined,
        lessonId: assessment?.lessonId || undefined,
        targetClass: assessment?.targetClass || student?.class || undefined,
        status: "Telah Dinilai",
        score: calculatedPercentage,
        grade: finalGrade,
        subject: subject || "Bahasa Jepang",
        assessedBy: currentUser?.name || "Instruktur / Sensei",
        assessedDate: new Date().toISOString(),
        notes: generalNotes || `Kuis Bab ${chapterNumber}${assessment?.subTitle ? ` (${assessment.subTitle})` : ""} telah dikoreksi Sensei (Nilai: ${calculatedPercentage}%)`,
        studentAnswers: studentAnswersMap,
        essayAnswers: studentEssayAnswersMap,
        quizDetails: updatedDetails,
        submittedAt: assessment?.submittedAt || assessment?.details?.submittedAt || new Date().toISOString(),
        details: {
          quizDetails: updatedDetails,
          studentQuizAnswers: studentAnswersMap,
          studentQuizEssayAnswers: studentEssayAnswersMap,
          lastEvaluatedBy: currentUser?.name || "Sensei",
          lastEvaluatedAt: new Date().toISOString()
        }
      };

      const ok = await onUpdateState("chapterAssessments", "update", updatedPayload);
      if (ok !== false) {
        alert(`✅ Koreksi nilai kuis Bab ${chapterNumber} untuk ${studentName} berhasil disimpan!\nNilai Akhir: ${calculatedPercentage}%`);
        onClose();
      } else {
        alert("Gagal menyimpan koreksi nilai.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan koreksi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in text-slate-900">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col h-[92vh] max-h-[92vh] my-auto relative shrink-0">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold text-amber-300 shrink-0">
                {student?.name ? student.name.substring(0, 2).toUpperCase() : "SW"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Bab {chapterNumber}
                  </span>
                  <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {subject}
                  </span>
                </div>
                <h3 className="font-display font-black text-lg sm:text-xl text-white mt-0.5">
                  Hasil & Koreksi Jawaban: {student?.name || assessment?.studentName || "Siswa"}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {student?.class ? `Kelas: ${student.class} • ` : ""}
                  Submitted: {assessment?.submittedAt ? new Date(assessment.submittedAt).toLocaleString("id-ID") : "Selesai Mengerjakan"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Score Stats Bar */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Nilai Akurasi</span>
              <span className={`text-xl font-black ${calculatedPercentage >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
                {calculatedPercentage}%
              </span>
            </div>

            <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Poin</span>
              <span className="text-xl font-black text-white">
                {currentEarnedPoints} <span className="text-xs font-normal text-slate-400">/ {totalMaxPoints}</span>
              </span>
            </div>

            <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Soal</span>
              <span className="text-xl font-black text-white">{effectiveQuizzes.length} Soal</span>
            </div>

            <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Status Koreksi</span>
              <span className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Siap Evaluasi</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/70">
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Tips Koreksi Sensei:</p>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                Anda dapat secara langsung memeriksa jawaban essay siswa di bawah ini. Jika jawaban siswa memiliki sedikit kesalahan typo / ejaan huruf namun bermakna benar, Anda dapat mengklik tombol <strong>"✓ Tandai Benar (Typo Ditoleransi)"</strong> untuk memberikan nilai penuh.
              </p>
            </div>
          </div>

          {/* List Soal & Jawaban */}
          <div className="space-y-5">
            <h4 className="font-display font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Lembar Jawaban Siswa ({effectiveQuizzes.length} Pertanyaan)</span>
            </h4>

            {effectiveQuizzes.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                Tidak ada data kuis ditemukan untuk Bab ini.
              </div>
            ) : (
              effectiveQuizzes.map((q: any, idx: number) => {
                const qId = q.id;
                const maxPts = Number(q.points) || 10;
                const currentPts = questionScores[qId] !== undefined ? questionScores[qId] : 0;
                const isEssay = q.questionType === "essay";
                const isFullPoints = currentPts === maxPts;
                const isPartial = currentPts > 0 && currentPts < maxPts;

                const detail = initialDetails.find((d: any) => d.quizId === qId || d.id === qId);
                const rawStudentChoice = studentAnswersMap[qId] !== undefined ? studentAnswersMap[qId] : (detail?.studentChoice ?? q.studentChoice);
                const studentChoices: number[] = Array.isArray(rawStudentChoice)
                  ? rawStudentChoice.map(Number)
                  : (rawStudentChoice !== undefined && rawStudentChoice !== null ? [Number(rawStudentChoice)] : []);
                
                const correctKeys: number[] = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
                  ? q.correctAnswerIndices.map(Number)
                  : [q.correctAnswerIndex !== undefined ? Number(q.correctAnswerIndex) : 0];

                const isMultiAnswer = correctKeys.length > 1 || q.allowMultipleAnswers || q.questionType === "pilihan_ganda_kompleks";
                const studentEssay = (studentEssayAnswersMap[qId] || "").trim();
                const keyEssay = (q.correctAnswerEssay || q.correctAnswerText || "").trim();

                return (
                  <div
                    key={qId || idx}
                    className={`bg-white rounded-2xl border-2 p-4 sm:p-5 space-y-4 shadow-2xs transition ${
                      isFullPoints
                        ? "border-emerald-200 hover:border-emerald-300"
                        : isPartial
                        ? "border-amber-200 hover:border-amber-300"
                        : "border-rose-200 hover:border-rose-300"
                    }`}
                  >
                    {/* Header Soal */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-900 text-white text-xs font-black px-2.5 py-1 rounded-xl">
                          Soal #{idx + 1}
                        </span>
                        <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-purple-200">
                          {isEssay ? "📝 Essay / Isian" : "🔘 Pilihan Ganda"}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Maks: {maxPts} Poin
                        </span>
                      </div>

                      {/* Current Point Status Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-bold text-slate-600">Skor Diperoleh:</span>
                        <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                          <input
                            type="number"
                            min={0}
                            max={maxPts}
                            value={currentPts}
                            onChange={(e) => handleSetPoints(qId, Math.min(maxPts, Math.max(0, Number(e.target.value) || 0)))}
                            className="w-12 bg-white border border-slate-300 rounded-lg px-1 py-0.5 text-center font-black text-xs text-purple-700 outline-none focus:border-purple-600"
                          />
                          <span className="text-[11px] font-extrabold text-slate-500">/ {maxPts} Poin</span>
                        </div>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-snug">{q.question}</p>
                      
                      {/* Media if present */}
                      {q.imageUrl && (
                        <img src={q.imageUrl} alt="Soal" className="mt-2.5 max-h-48 rounded-xl object-contain border border-slate-200" />
                      )}
                      {q.audioUrl && (
                        <audio controls src={q.audioUrl} className="mt-2.5 w-full max-w-md h-9" />
                      )}
                    </div>

                    {/* Multiple Choice Answers View */}
                    {!isEssay && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Pilihan Jawaban {isMultiAnswer ? "(Multi-Jawaban / Kotak Centang)" : ""}:
                          </span>
                          {isMultiAnswer && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">
                              {correctKeys.length} Kunci Jawaban Benar
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || ["", "", "", ""]).map((opt: string, optIdx: number) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isSelected = studentChoices.includes(optIdx);
                            const isCorrectKey = correctKeys.includes(optIdx);

                            let bgClass = "bg-slate-50 border-slate-200 text-slate-700";
                            let badgeText = "";

                            if (isSelected && isCorrectKey) {
                              bgClass = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-300";
                              badgeText = "✓ Pilihan Siswa (BENAR)";
                            } else if (isSelected && !isCorrectKey) {
                              bgClass = "bg-rose-50 border-rose-400 text-rose-900 font-bold ring-1 ring-rose-200";
                              badgeText = "✕ Pilihan Siswa (SALAH)";
                            } else if (isCorrectKey) {
                              bgClass = "bg-emerald-50/70 border-emerald-300 text-emerald-800 font-semibold";
                              badgeText = "🔑 Kunci Benar";
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${bgClass}`}
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className={`h-6 w-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                    isCorrectKey ? "bg-emerald-600 text-white" : isSelected ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-700"
                                  }`}>
                                    {letter}
                                  </span>
                                  <span className="truncate">{opt || `- Opsi ${letter} -`}</span>
                                </div>
                                {badgeText && (
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                                    isSelected && isCorrectKey ? "bg-emerald-600 text-white" : isSelected ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-800"
                                  }`}>
                                    {badgeText}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Essay / Isian Answers View & Interactive Correction */}
                    {isEssay && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Jawaban Siswa */}
                          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                              ✏️ Jawaban Siswa:
                            </span>
                            <div className="bg-white border border-slate-300 p-2.5 rounded-lg text-xs font-mono text-slate-900 font-bold break-words min-h-[42px] flex items-center">
                              {studentEssay ? (
                                <span>"{studentEssay}"</span>
                              ) : (
                                <span className="text-slate-400 italic font-normal">(Tidak diisi oleh siswa)</span>
                              )}
                            </div>
                          </div>

                          {/* Kunci Jawaban Sensei */}
                          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                              🔑 Kunci Jawaban Acuan:
                            </span>
                            <div className="bg-white border border-emerald-300 p-2.5 rounded-lg text-xs font-mono text-emerald-900 font-bold break-words min-h-[42px] flex items-center">
                              {keyEssay ? `"${keyEssay}"` : <span className="text-slate-400 italic font-normal">(Tidak ada kunci essay)</span>}
                            </div>
                          </div>
                        </div>

                        {/* Direct Sensei Correction Controls */}
                        <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-purple-900 mr-1">
                              Koreksi Sensei:
                            </span>

                            {/* Full Points (Typo Tolerated) */}
                            <button
                              type="button"
                              onClick={() => handleSetPoints(qId, maxPts)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                currentPts === maxPts
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300"
                              }`}
                              title="Setujui jawaban siswa dengan memberikan nilai penuh (meskipun ada typo)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ Tandai Benar ({maxPts} Poin)</span>
                            </button>

                            {/* Half Points */}
                            <button
                              type="button"
                              onClick={() => handleSetPoints(qId, Math.round(maxPts / 2))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                currentPts === Math.round(maxPts / 2) && currentPts !== maxPts
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-white hover:bg-amber-50 text-amber-700 border border-amber-300"
                              }`}
                              title="Beri setengah nilai untuk jawaban mendekati"
                            >
                              <span>½ Setengah Poin ({Math.round(maxPts / 2)})</span>
                            </button>

                            {/* Zero Points */}
                            <button
                              type="button"
                              onClick={() => handleSetPoints(qId, 0)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                currentPts === 0
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-white hover:bg-rose-50 text-rose-700 border border-rose-300"
                              }`}
                              title="Tandai jawaban salah"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>✕ Salah (0 Poin)</span>
                            </button>
                          </div>

                          {/* Quick note input per question */}
                          <input
                            type="text"
                            value={questionNotes[qId] || ""}
                            onChange={(e) => setQuestionNotes({ ...questionNotes, [qId]: e.target.value })}
                            placeholder="Catatan koreksi (opsional)..."
                            className="bg-white border border-purple-300 focus:border-purple-600 px-3 py-1.5 rounded-xl text-xs text-slate-800 outline-none w-full sm:w-56"
                          />
                        </div>
                      </div>
                    )}

                    {(q.explanation || detail?.explanation) && (
                      <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs space-y-1.5 shadow-2xs text-left">
                        <div className="flex items-center gap-2 font-black text-amber-900">
                          <span className="text-base">💡</span>
                          <span className="uppercase tracking-wider text-[11px]">Pembahasan & Penjelasan Soal:</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap pl-6 text-xs">
                          {q.explanation || detail?.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* General Notes Input */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-purple-600" />
              <span>Catatan / Catatan Evaluasi Keseluruhan dari Sensei:</span>
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Tuliskan masukan atau catatan untuk siswa ini mengenai kuis Bab ini..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-purple-600 p-3 rounded-xl text-xs font-medium text-slate-800 outline-none h-20 resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              Nilai Akhir Terkalkulasi: <strong className="text-purple-700 font-extrabold text-sm">{calculatedPercentage}%</strong> ({currentEarnedPoints}/{totalMaxPoints} Poin)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveCorrection}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan..." : "💾 Simpan Hasil Koreksi & Update Nilai"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
