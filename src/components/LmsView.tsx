/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { uploadFileToFirebase, downloadFile, getEmbeddablePdfUrl } from "../lib/storageHelper";
import { MediaViewerModal } from "./MediaViewerModal";
import { ConfirmForm } from "./ConfirmForm";
import { Play, BookOpen, Calendar, HelpCircle, GraduationCap, CheckCircle, Award, 
  AlertCircle, ChevronRight, Check, X, RefreshCw, Clock, Calculator,
  Plus, Trash2, Edit3, Video, FileText, Save, Download, Info, MessageSquare, User, Users, Upload, Eye, ExternalLink,
  Percent, Hash, Brain, Scale, Volume2, Lock, Unlock, ChevronDown, ChevronUp, RotateCcw, Copy, CheckCircle2,
  CheckSquare, Square
, PanelLeftClose, Search, MapPin, Camera, SlidersHorizontal, Bell, ArrowLeft, Star } from "lucide-react";
import { AttendanceRecord, ActiveStudent, UserAccount, LMSLesson, ChapterAssessment, JobOrder } from "../types";
import { CHAPTERS_LIST, MATH_CHAPTERS_LIST } from "../chapters";
import { StudentAttendanceManager } from "./lms/StudentAttendanceManager";
import LmsProgressSegment from "./lms/LmsProgressSegment";
import LmsBabSegment from "./lms/LmsBabSegment";
import LmsDokumenSegment from "./lms/LmsDokumenSegment";
import LmsAbsenSegment from "./lms/LmsAbsenSegment";
import { formatVideoEmbedUrl, getDirectVideoUrl, isYouTubeOrStreamingUrl } from "../lib/videoHelper";
import { isMathSubject, isJapaneseSubject, isSameSubject, getCanonicalSubjectSlug } from "../lib/subjectHelper";



interface LmsViewProps {
  currentUser: UserAccount | null;
  attendanceRecords: AttendanceRecord[];
  activeStudents: ActiveStudent[];
  lmsLessons?: LMSLesson[];
  chapterAssessments?: ChapterAssessment[];
  jobOrders?: JobOrder[];
  onAddAttendance: (payload: any) => Promise<boolean>;
  onUpdateState?: (dataType: string, action: string, payload: any) => Promise<boolean>;
  initialSubTab?: string;
  systemState?: any;
  hideWelcomeBanner?: boolean;
}


const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = React.useState("");
  React.useEffect(() => {
    if (!deadline) return;
    const updateTime = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("Waktu Habis");
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        let timeStr = "";
        if (d > 0) timeStr += `${d}h `;
        timeStr += `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        setTimeLeft(timeStr);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  if (!deadline) return null;
  return <span className="font-mono">{timeLeft || "Menghitung..."}</span>;
};


const ToastNotification = ({ message, onClose }: { message: string, onClose: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
      <div className="bg-white/20 p-1.5 rounded-lg">
        <Bell className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-xs">Pemberitahuan Baru</span>
        <span className="text-[10px] opacity-90">{message}</span>
      </div>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-md transition">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};


export const CBTTimer = ({ 
  startTime, 
  durationMinutes, 
  onExpire,
  className = "",
  compact = false
}: { 
  startTime: number; 
  durationMinutes: number; 
  onExpire: () => void;
  className?: string;
  compact?: boolean;
}) => {
  const [timeLeft, setTimeLeft] = React.useState("");
  const [isWarning, setIsWarning] = React.useState(false);
  const [isCritical, setIsCritical] = React.useState(false);
  const onExpireRef = React.useRef(onExpire);

  React.useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  
  React.useEffect(() => {
    let expired = false;
    const mountTime = Date.now();
    const baseStart = startTime || mountTime;
    const updateTime = () => {
      if (expired) return;
      const now = Date.now();
      const end = baseStart + durationMinutes * 60 * 1000;
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("00:00 (Waktu Habis)");
        setIsCritical(true);
        // Only trigger onExpire if the timer was running for at least 5 seconds after mount
        // to avoid instant kick-out on retake initialization or render race
        if (now - mountTime >= 5000) {
          expired = true;
          if (onExpireRef.current) {
            onExpireRef.current();
          }
        }
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        let timeStr = "";
        if (h > 0) timeStr += `${h.toString().padStart(2, '0')}:`;
        timeStr += `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        setTimeLeft(timeStr);
        setIsWarning(diff < 5 * 60 * 1000); // < 5 menit
        setIsCritical(diff < 2 * 60 * 1000); // < 2 menit
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);
  
  if (compact) {
    return (
      <div 
        title="Sisa waktu pengerjaan kuis"
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl border font-mono font-black text-xs shadow-xs transition-all ${
          isCritical
            ? "bg-red-600 text-white border-red-700 animate-pulse ring-2 ring-red-300"
            : isWarning
              ? "bg-amber-500 text-white border-amber-600 animate-pulse ring-2 ring-amber-300"
              : "bg-rose-50 text-rose-700 border-rose-300"
        } ${className}`}
      >
        <span className="text-sm">⏱️</span>
        <span>{timeLeft || "Menghitung..."}</span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-black text-xs sm:text-sm shadow-xs transition-all ${
        isCritical 
          ? "bg-red-600 text-white border-red-700 animate-bounce ring-2 ring-red-400" 
          : isWarning 
            ? "bg-amber-500 text-white border-amber-600 animate-pulse ring-2 ring-amber-300" 
            : "bg-rose-50 text-rose-700 border-rose-300"
      } ${className}`}
    >
      <span className="text-base">⏳</span>
      <span>Sisa Waktu: <strong>{timeLeft || "Menghitung..."}</strong></span>
    </div>
  );
};

const getEmbeddableUrl = (url: string | null) => {
  if (!url) return undefined;
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  return url;
};

export function seededShuffle<T>(array: T[], seedStr: string): T[] {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const prng = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };

  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const dataURLtoBlob = (dataurl: string) => {
  try {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error("Error parsing base64 to blob", err);
    return null;
  }
};

export default function LmsView({
  currentUser,
  attendanceRecords,
  activeStudents,
  lmsLessons,
  chapterAssessments = [],
  jobOrders = [],
  onAddAttendance,
  onUpdateState,
  initialSubTab,
  systemState,
  hideWelcomeBanner
}: LmsViewProps) {
  const isReadOnlyView = false;

  const matchingStudent = React.useMemo(() => {
    if (!currentUser) return null;
    const studentId = (currentUser.studentId || "").trim().toLowerCase();
    const nameLower = (currentUser.name || "").trim().toLowerCase();
    const emailLower = (currentUser.email || "").trim().toLowerCase();
    const usernameLower = (currentUser.username || "").trim().toLowerCase();
    
    return (activeStudents || []).find((s: any) => {
      const sId = (s.id || "").trim().toLowerCase();
      const sName = (s.name || "").trim().toLowerCase();
      const sEmail = (s.email || "").trim().toLowerCase();
      const sUsername = (s.username || "").trim().toLowerCase();
      
      if (studentId && sId === studentId) return true;
      if (nameLower && sName === nameLower) return true;
      if (emailLower && sEmail === emailLower) return true;
      if (usernameLower && sUsername === usernameLower) return true;
      return false;
    });
  }, [activeStudents, currentUser]);

  const [activeTab, setActiveTab] = React.useState<"dashboard" | "materi" | "tugas" | "progress" | "laporan">("dashboard");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [notifiedLessonIds, setNotifiedLessonIds] = React.useState<Set<string>>(new Set());
  const [pdfViewerUrl, setPdfViewerUrl] = React.useState<string | null>(null);
  // Default to the browser's own native PDF rendering rather than Google's
  // gview embed - gview frequently fails to load (blank iframe) for URLs
  // it can't freely crawl (private buckets, data: URIs, etc.), and modern
  // browsers render PDFs in an <iframe> natively just fine. Google Docs
  // Viewer stays available as a manual fallback for the rare non-PDF file.
  const [useGoogleDocs, setUseGoogleDocs] = React.useState(false);
  const [blobPdfUrl, setBlobPdfUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pdfViewerUrl) {
      if (blobPdfUrl) {
        URL.revokeObjectURL(blobPdfUrl);
        setBlobPdfUrl(null);
      }
      return;
    }

    const trimmed = pdfViewerUrl.trim();
    if (trimmed.startsWith("data:")) {
      const blob = dataURLtoBlob(trimmed);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setBlobPdfUrl(url);
        setUseGoogleDocs(false); // Google Docs cannot view local data/blob URLs
      } else {
        setBlobPdfUrl(null);
      }
    } else {
      if (blobPdfUrl) {
        URL.revokeObjectURL(blobPdfUrl);
        setBlobPdfUrl(null);
      }
      // Standard HTTP/HTTPS URLs work best with Google Docs inside frames
      setUseGoogleDocs(true);
    }
  }, [pdfViewerUrl]);

  const [activeQuizChapterId, setActiveQuizChapterId] = React.useState<number | null>(null);
  const [isQuizShuffleEnabled, setIsQuizShuffleEnabled] = React.useState<boolean>(true);
  const [shuffleSalt, setShuffleSalt] = React.useState<number>(0);
  const [retakeAttemptsMap, setRetakeAttemptsMap] = React.useState<Record<string, number>>(() => {
    try {
      const userKey = currentUser?.studentId || currentUser?.id || currentUser?.username || 'user';
      const stored = localStorage.getItem(`cbtRetakeMap_${userKey}`);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });
  const [showAdminAnswerKeys, setShowAdminAnswerKeys] = React.useState<boolean>(false);
  const [simulatedSubmission, setSimulatedSubmission] = React.useState<boolean>(false);
  const [batchShuffleQuestions, setBatchShuffleQuestions] = React.useState<boolean>(true);
  const [isSavingQuizBatch, setIsSavingQuizBatch] = React.useState<boolean>(false);

  React.useEffect(() => {
  if (pdfViewerUrl) {
      window.history.pushState({ pdfViewerOpen: true }, "");
    }
  }, [pdfViewerUrl]);

  React.useEffect(() => {
    const handlePopState = () => {
      if (pdfViewerUrl) {
        setPdfViewerUrl(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pdfViewerUrl]);

  const [cbtStartTimes, setCbtStartTimes] = React.useState<Record<string, number>>({});
  
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('cbtStartTimes');
      if (stored) setCbtStartTimes(JSON.parse(stored));
    } catch(e){}
  }, []);

  const handleStartCbt = (id: string) => {
    const newTs = { ...cbtStartTimes, [id]: Date.now() };
    setCbtStartTimes(newTs);
    localStorage.setItem('cbtStartTimes', JSON.stringify(newTs));
  };

  
  React.useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  React.useEffect(() => {
    if (!lmsLessons || !currentUser || currentUser.role !== "Siswa") return;
    const activeAssignments = lmsLessons.filter(l => 
      l.difficulty === "Tugas" && 
      (l.isMandiri || l.targetClass === "Semua" || l.targetClass === currentUser.assignedClass) &&
      (!l.deadline || new Date(l.deadline).getTime() > Date.now())
    );
    activeAssignments.forEach(assignment => {
      if (!notifiedLessonIds.has(assignment.id)) {
        const msg = "Tugas Baru: " + assignment.title;
        setToastMessage(msg);
        if ("Notification" in window && Notification.permission === "granted") {
           try { new Notification(msg, { body: "Silakan cek LMS E-Benkyou.", icon: "/logo.png" }); } catch(e) {}
        }
        // @ts-ignore
        if (window.Android && typeof window.Android.showNotification === 'function') {
           // @ts-ignore
           window.Android.showNotification(msg, "Silakan cek LMS E-Benkyou.");
        }
        // @ts-ignore
        if (window.JSBridge && typeof window.JSBridge.showNotification === 'function') {
           // @ts-ignore
           window.JSBridge.showNotification(msg, "Silakan cek LMS E-Benkyou.");
        }
        setNotifiedLessonIds(prev => new Set(prev).add(assignment.id));
      }
    });
  }, [lmsLessons, currentUser, notifiedLessonIds]);

  const [activeSubTab, setActiveSubTab] = React.useState(initialSubTab || "bab");
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    } else {
      setActiveSubTab("bab");
    }
  }, [initialSubTab]);
  const [progressSubject, setProgressSubject] = React.useState("Bahasa Jepang");
  const [viewingDoc, setViewingDoc] = React.useState<{ title: string; url: string } | null>(null);
  const [viewingAttendancePhoto, setViewingAttendancePhoto] = React.useState<string | null>(null);
  
  const [scoreKanji, setScoreKanji] = React.useState<number | "">("");
  const [scoreKotoba, setScoreKotoba] = React.useState<number | "">("");
  const [scoreBumpo, setScoreBumpo] = React.useState<number | "">("");
  const [scoreKaiwa, setScoreKaiwa] = React.useState<number | "">("");
  const [assessmentSubject, setAssessmentSubject] = React.useState("Bahasa Jepang");
  const [gradingNotes, setGradingNotes] = React.useState("");
  const [isGradingSubmitting, setIsGradingSubmitting] = React.useState(false);
  
  
  const [isQuizSubmitted, setIsQuizSubmitted] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [essayAnswer, setEssayAnswer] = React.useState("");
  const [quizIndex, setQuizIndex] = React.useState(0);
  const [quizScore, setQuizScore] = React.useState(0);
  const [showQuizResults, setShowQuizResults] = React.useState(false);
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>("");
  const [quizSubMode, setQuizSubMode] = React.useState("belajar");
  const [isQuizFormOpen, setIsQuizFormOpen] = React.useState(false);
  const [newQuiz, setNewQuiz] = React.useState<any>({
    subject: "Bahasa Jepang",
    questionType: "pilihan_ganda",
    question: "",
    options: ["", "", "", ""],
    correctAnswerIndex: 0,
    correctAnswerEssay: ""
  });
  const [quizBatch, setQuizBatch] = React.useState<any[]>([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = React.useState<number>(0);
  const [batchDeadline, setBatchDeadline] = React.useState<string>("");
  const [batchDurationMinutes, setBatchDurationMinutes] = React.useState<number | "">("");
  const [batchTargetClass, setBatchTargetClass] = React.useState<string>("Semua");
  const [selectedBabNumber, setSelectedBabNumber] = React.useState<number>(1);
  const [batchChapterNumber, setBatchChapterNumber] = React.useState<number>(1);
  const [batchSubject, setBatchSubject] = React.useState<string>("Bahasa Jepang");
  const [batchSubTitle, setBatchSubTitle] = React.useState<string>("");
  const [batchLessonId, setBatchLessonId] = React.useState<string>("");
  const [activeQuizSubTitle, setActiveQuizSubTitle] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (activeQuizChapterId !== null) {
      const subKey = activeQuizSubTitle ? `_${encodeURIComponent(activeQuizSubTitle)}` : "";
      const key = `kuis_ch_${activeQuizChapterId}${subKey}`;
      if (!cbtStartTimes[key]) {
        handleStartCbt(key);
      }
    }
  }, [activeQuizChapterId, activeQuizSubTitle]);
  const [detectedDraft, setDetectedDraft] = React.useState<{ key: string; draft: any; count: number; chapterNumber: number; savedAt: number } | null>(null);
  const [selectedPracticePacket, setSelectedPracticePacket] = React.useState("N4_Paket1");
  const [practiceAnswers, setPracticeAnswers] = React.useState<any>({});
  const [studentQuizAnswers, _setStudentQuizAnswers] = React.useState<Record<string, number>>({});
  const [studentQuizEssayAnswers, _setStudentQuizEssayAnswers] = React.useState<Record<string, string>>({});
  const [submittedQuizIds, _setSubmittedQuizIds] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    if (isQuizFormOpen) {
      if (quizBatch[0]?.chapterNumber) {
        setBatchChapterNumber(Number(quizBatch[0].chapterNumber));
      } else if (selectedBabNumber) {
        setBatchChapterNumber(Number(selectedBabNumber));
      }
      if (quizBatch[0]?.subject) {
        setBatchSubject(quizBatch[0].subject);
      } else if (assessmentSubject) {
        setBatchSubject(assessmentSubject);
      }
    }
  }, [isQuizFormOpen]);

  // Auto-save draft of quizzes while editing so Sensei never loses their work
  React.useEffect(() => {
    if (isQuizFormOpen && quizBatch.length > 0) {
      const hasContent = quizBatch.some(q => (q.question && q.question.trim().length > 0) || q.imageUrl || q.audioUrl);
      if (hasContent && typeof window !== "undefined") {
        try {
          const draftKey = `lms_quiz_draft_${batchSubject || "Bahasa Jepang"}_ch${batchChapterNumber || 1}`;
          localStorage.setItem(draftKey, JSON.stringify({
            savedAt: Date.now(),
            chapterNumber: batchChapterNumber,
            subject: batchSubject,
            targetClass: batchTargetClass,
            durationMinutes: batchDurationMinutes,
            deadline: batchDeadline,
            shuffleQuestions: batchShuffleQuestions,
            quizzes: quizBatch
          }));
        } catch (e) {}
      }
    }
  }, [quizBatch, isQuizFormOpen, batchChapterNumber, batchSubject, batchTargetClass, batchDurationMinutes, batchDeadline, batchShuffleQuestions]);

  // Check for restorable draft when quiz form opens (Non-blocking, banner UI)
  React.useEffect(() => {
    if (isQuizFormOpen && typeof window !== "undefined") {
      const targetCh = batchChapterNumber || selectedBabNumber || 1;
      const targetSubj = batchSubject || assessmentSubject || "Bahasa Jepang";
      const draftKey = `lms_quiz_draft_${targetSubj}_ch${targetCh}`;
      try {
        const savedDraftRaw = localStorage.getItem(draftKey);
        if (savedDraftRaw) {
          const draft = JSON.parse(savedDraftRaw);
          if (Array.isArray(draft.quizzes) && draft.quizzes.length > 0) {
            const currentFilledCount = quizBatch.filter(q => q.question?.trim() || q.imageUrl || q.audioUrl).length;
            const draftFilledCount = draft.quizzes.filter((q: any) => q.question?.trim() || q.imageUrl || q.audioUrl).length;
            if (draftFilledCount > currentFilledCount) {
              setDetectedDraft({
                key: draftKey,
                draft,
                count: draftFilledCount,
                chapterNumber: targetCh,
                savedAt: draft.savedAt || Date.now()
              });
            }
          }
        }
      } catch (e) {}
    } else {
      setDetectedDraft(null);
    }
  }, [isQuizFormOpen]);

  const handleRestoreDraft = () => {
    if (!detectedDraft) return;
    const draft = detectedDraft.draft;
    if (Array.isArray(draft.quizzes) && draft.quizzes.length > 0) {
      setQuizBatch(draft.quizzes);
      if (draft.deadline) setBatchDeadline(draft.deadline);
      if (draft.durationMinutes !== undefined) setBatchDurationMinutes(draft.durationMinutes);
      if (draft.targetClass) setBatchTargetClass(draft.targetClass);
      if (draft.subject) setBatchSubject(draft.subject);
      if (draft.chapterNumber) {
        setBatchChapterNumber(Number(draft.chapterNumber));
        setSelectedBabNumber(Number(draft.chapterNumber));
      }
    }
    setDetectedDraft(null);
  };

  const handleDismissDraft = () => {
    if (detectedDraft && typeof window !== "undefined") {
      try {
        localStorage.removeItem(detectedDraft.key);
      } catch (e) {}
    }
    setDetectedDraft(null);
  };

  // Robust, zero-loss atomic batch saver for chapter quizzes
  const handleSaveAllQuizzes = async () => {
    const validQuizzes = quizBatch.filter(q => {
      const hasText = typeof q.question === "string" && q.question.trim().length > 0;
      const hasMedia = !!(q.imageUrl || q.audioUrl || q.videoUrl);
      const hasOptions = Array.isArray(q.options) && q.options.some((opt: any) => typeof opt === "string" && opt.trim().length > 0);
      const hasAnswer = (typeof q.correctAnswerEssay === "string" && q.correctAnswerEssay.trim().length > 0) || (typeof q.correctAnswerText === "string" && q.correctAnswerText.trim().length > 0);
      return hasText || hasMedia || hasOptions || hasAnswer;
    });

    if (validQuizzes.length === 0) {
      alert("Harap isi pertanyaan atau pilihan jawaban kuis sebelum menyimpan.");
      return;
    }

    setIsSavingQuizBatch(true);
    try {
      if (onUpdateState) {
        const targetChapter = Number(batchChapterNumber || selectedBabNumber || 1);
        setSelectedBabNumber(targetChapter);
        const seenIds = new Set<string>();
        const preparedQuizzes = validQuizzes.map((q, idx) => {
          let id = q.id && typeof q.id === "string" && !q.id.startsWith("TEMP_") ? q.id : "";
          if (!id || seenIds.has(id)) {
            id = `QZ-${targetChapter}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 8)}_${Math.floor(Math.random() * 100000)}`;
          }
          seenIds.add(id);

          const cIndices = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
            ? q.correctAnswerIndices.map(Number)
            : (q.correctAnswerIndex !== undefined ? [Number(q.correctAnswerIndex)] : [0]);
          const isMulti = !!q.allowMultipleAnswers || q.questionType === "pilihan_ganda_kompleks" || cIndices.length > 1;

          return {
            ...q,
            id,
            chapterNumber: targetChapter,
            chapterId: targetChapter,
            questionType: isMulti ? "pilihan_ganda_kompleks" : (q.questionType || "pilihan_ganda"),
            allowMultipleAnswers: isMulti,
            correctAnswerIndices: cIndices,
            correctAnswerIndex: cIndices[0] !== undefined ? cIndices[0] : 0,
            subTitle: (q.subTitle !== undefined && q.subTitle !== "") ? q.subTitle : (batchSubTitle || ""),
            lessonId: (q.lessonId !== undefined && q.lessonId !== "") ? q.lessonId : (batchLessonId || ""),
            targetClass: batchTargetClass || "Semua",
            subject: batchSubject || "Bahasa Jepang",
            deadline: batchDeadline || "",
            durationMinutes: batchDurationMinutes !== "" && batchDurationMinutes !== undefined ? Number(batchDurationMinutes) : undefined,
            shuffleQuestions: batchShuffleQuestions !== false,
            points: q.points !== undefined && q.points !== "" ? Number(q.points) : 10,
            required: q.required !== undefined ? !!q.required : true,
            explanation: q.explanation || ""
          };
        });

        const batchPayload = {
          chapterNumber: targetChapter,
          chapterId: targetChapter,
          subTitle: batchSubTitle || "",
          lessonId: batchLessonId || "",
          targetClass: batchTargetClass || "Semua",
          subject: batchSubject || "Bahasa Jepang",
          deadline: batchDeadline || "",
          durationMinutes: batchDurationMinutes !== "" && batchDurationMinutes !== undefined ? Number(batchDurationMinutes) : undefined,
          shuffleQuestions: batchShuffleQuestions !== false,
          quizzes: preparedQuizzes
        };

        const success = await onUpdateState('lmsQuizzes', 'batch_upsert', batchPayload);
        if (success) {
          alert(`✅ Berhasil menyimpan seluruh ${preparedQuizzes.length} soal kuis ${batchSubTitle ? `(${batchSubTitle})` : ""} untuk Bab ${targetChapter}! Data tersimpan aktif dan aman di Firestore.`);
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem(`lms_quiz_draft_${batchSubject || "Bahasa Jepang"}_ch${targetChapter}`);
            } catch (e) {}
          }
          setDetectedDraft(null);
          setIsQuizFormOpen(false);
          return;
        } else {
          alert("Terjadi kendala saat menyimpan kuis ke database. Silakan coba lagi.");
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan kuis batch ke Firestore:", err);
      alert("Terjadi kendala koneksi saat menyimpan kuis. Pastikan internet aktif dan coba lagi.");
    } finally {
      setIsSavingQuizBatch(false);
    }
  };

  React.useEffect(() => {
    try {
      const userKey = currentUser?.studentId || currentUser?.id || currentUser?.username || 'user';
      const p1 = localStorage.getItem(`cbtAnswers_${userKey}`);
      if (p1) _setStudentQuizAnswers(JSON.parse(p1));
      else _setStudentQuizAnswers({});

      const p2 = localStorage.getItem(`cbtEssayAnswers_${userKey}`);
      if (p2) _setStudentQuizEssayAnswers(JSON.parse(p2));
      else _setStudentQuizEssayAnswers({});

      const p3 = localStorage.getItem(`cbtSubmittedIds_${userKey}`);
      if (p3) _setSubmittedQuizIds(JSON.parse(p3));
      else _setSubmittedQuizIds([]);
    } catch(e){}
  }, [currentUser?.studentId, currentUser?.id, currentUser?.username]);

  const [retakingQuizIds, setRetakingQuizIds] = React.useState<string[]>([]);

  // Rehydrate answers and submission status from Firestore chapterAssessments when available
  React.useEffect(() => {
    if (!currentUser) return;
    const targetStudentId = (matchingStudent?.id || currentUser?.studentId || currentUser?.id || "").trim().toLowerCase();
    const targetStudentName = (matchingStudent?.name || currentUser?.name || "").trim().toLowerCase();
    const targetEmail = (currentUser?.email || matchingStudent?.email || "").trim().toLowerCase();
    const allAssess = systemState?.chapterAssessments || chapterAssessments || [];
    
    const myAssessments = allAssess.filter((a: any) => {
      const aId = (a.studentId || "").trim().toLowerCase();
      const aName = (a.studentName || "").trim().toLowerCase();
      const aEmail = (a.studentEmail || "").trim().toLowerCase();
      return (targetStudentId && aId === targetStudentId) ||
             (targetEmail && (aId === targetEmail || aEmail === targetEmail)) ||
             (targetStudentId && (a.id || "").toLowerCase().includes(targetStudentId)) ||
             (targetStudentName && aName && (aName === targetStudentName || targetStudentName.includes(aName) || aName.includes(targetStudentName)));
    });

    if (myAssessments.length > 0) {
      const dbSubmittedIds: string[] = [];
      const dbAnswers: Record<string, any> = {};
      const dbEssayAnswers: Record<string, string> = {};

      myAssessments.forEach((a: any) => {
        const details = a.details?.quizDetails || a.quizDetails || [];
        details.forEach((d: any) => {
          if (d.quizId && !dbSubmittedIds.includes(d.quizId)) {
            dbSubmittedIds.push(d.quizId);
          }
        });
        const ans = a.details?.studentQuizAnswers || a.studentAnswers || {};
        Object.assign(dbAnswers, ans);
        const essayAns = a.details?.studentQuizEssayAnswers || a.essayAnswers || {};
        Object.assign(dbEssayAnswers, essayAns);
        Object.keys(ans).forEach(id => {
          if (!dbSubmittedIds.includes(id)) dbSubmittedIds.push(id);
        });
        Object.keys(essayAns).forEach(id => {
          if (!dbSubmittedIds.includes(id)) dbSubmittedIds.push(id);
        });
      });

      if (dbSubmittedIds.length > 0) {
        _setSubmittedQuizIds((prev: string[]) => {
          const filteredDb = dbSubmittedIds.filter(id => !retakingQuizIds.includes(id));
          const currentFiltered = prev.filter(id => !retakingQuizIds.includes(id));
          const merged = [...new Set([...currentFiltered, ...filteredDb])];
          try {
            const userKey = currentUser?.studentId || currentUser?.id || currentUser?.username || 'user';
            localStorage.setItem(`cbtSubmittedIds_${userKey}`, JSON.stringify(merged));
          } catch(e){}
          return merged;
        });
      }

      if (Object.keys(dbAnswers).length > 0) {
        const cleanAnswers = { ...dbAnswers };
        retakingQuizIds.forEach(id => delete cleanAnswers[id]);
        _setStudentQuizAnswers((prev: any) => ({ ...cleanAnswers, ...prev }));
      }
      if (Object.keys(dbEssayAnswers).length > 0) {
        const cleanEssayAnswers = { ...dbEssayAnswers };
        retakingQuizIds.forEach(id => delete cleanEssayAnswers[id]);
        _setStudentQuizEssayAnswers((prev: any) => ({ ...cleanEssayAnswers, ...prev }));
      }
    }
  }, [currentUser, matchingStudent, systemState?.chapterAssessments, chapterAssessments, retakingQuizIds]);

  const setStudentQuizAnswers = (val: any) => {
    const updated = typeof val === 'function' ? val(studentQuizAnswers) : val;
    _setStudentQuizAnswers(updated);
    try {
      const userKey = currentUser?.studentId || currentUser?.id || currentUser?.username || 'user';
      localStorage.setItem(`cbtAnswers_${userKey}`, JSON.stringify(updated));
    } catch(e){}
  };
  
  const setStudentQuizEssayAnswers = (val: any) => {
    const updated = typeof val === 'function' ? val(studentQuizEssayAnswers) : val;
    _setStudentQuizEssayAnswers(updated);
    try {
      const userKey = currentUser?.studentId || currentUser?.id || currentUser?.username || 'user';
      localStorage.setItem(`cbtEssayAnswers_${userKey}`, JSON.stringify(updated));
    } catch(e){}
  };
  
  const setSubmittedQuizIds = (val: any) => {
    const updated = typeof val === 'function' ? val(submittedQuizIds) : val;
    _setSubmittedQuizIds(updated);
    try {
      const userKey = currentUser?.studentId || currentUser?.id || currentUser?.username || 'user';
      localStorage.setItem(`cbtSubmittedIds_${userKey}`, JSON.stringify(updated));
    } catch(e){}
  };

  const handleRetakeQuiz = (chapterNum: number, quizIds: string[], subTitle?: string | null) => {
    // 1. Mark quiz IDs as active retake so they aren't re-marked as submitted by DB rehydration
    setRetakingQuizIds((prev: string[]) => [...new Set([...prev, ...quizIds])]);

    // 2. Remove from submitted quizzes state
    setSubmittedQuizIds((prev: string[]) => prev.filter(id => !quizIds.includes(id)));

    // 3. Reset student answers for retaken quizzes
    setStudentQuizAnswers((prev: any) => {
      const next = { ...prev };
      quizIds.forEach(id => delete next[id]);
      return next;
    });
    setStudentQuizEssayAnswers((prev: any) => {
      const next = { ...prev };
      quizIds.forEach(id => delete next[id]);
      return next;
    });

    // 4. Reset CBT Start Times to fresh Date.now() for full duration
    const now = Date.now();
    const effectiveSubTitle = subTitle !== undefined ? subTitle : activeQuizSubTitle;
    const subKey = effectiveSubTitle ? `_${encodeURIComponent(effectiveSubTitle)}` : "";
    const timerKey = `kuis_ch_${chapterNum}${subKey}`;
    setCbtStartTimes((prev: any) => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`kuis_ch_${chapterNum}`)) {
          delete next[k];
        }
      });
      next[timerKey] = now;
      next[`kuis_ch_${chapterNum}`] = now;
      try {
        localStorage.setItem('cbtStartTimes', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 5. Clean up localStorage for user
    try {
      const userKey = currentUser?.studentId || matchingStudent?.id || currentUser?.id || currentUser?.username || 'user';
      const rawSubmitted = localStorage.getItem(`cbtSubmittedIds_${userKey}`);
      if (rawSubmitted) {
        const parsed = JSON.parse(rawSubmitted);
        const filtered = parsed.filter((id: string) => !quizIds.includes(id));
        localStorage.setItem(`cbtSubmittedIds_${userKey}`, JSON.stringify(filtered));
      }
      const rawAns = localStorage.getItem(`cbtAnswers_${userKey}`);
      if (rawAns) {
        const parsed = JSON.parse(rawAns);
        quizIds.forEach(id => delete parsed[id]);
        localStorage.setItem(`cbtAnswers_${userKey}`, JSON.stringify(parsed));
      }
      const rawEssay = localStorage.getItem(`cbtEssayAnswers_${userKey}`);
      if (rawEssay) {
        const parsed = JSON.parse(rawEssay);
        quizIds.forEach(id => delete parsed[id]);
        localStorage.setItem(`cbtEssayAnswers_${userKey}`, JSON.stringify(parsed));
      }
    } catch (e) {}

    // 6. Increment shuffle salt & retake attempt count so questions are shuffled into a fresh new order
    setShuffleSalt(prev => prev + 1);
    const userKey = currentUser?.studentId || matchingStudent?.id || currentUser?.id || currentUser?.username || 'user';
    const retakeKey = `${userKey}_ch${chapterNum}`;
    setRetakeAttemptsMap((prev: Record<string, number>) => {
      const nextCount = (prev[retakeKey] || 0) + 1;
      const updated = { ...prev, [retakeKey]: nextCount };
      try {
        localStorage.setItem(`cbtRetakeMap_${userKey}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 7. Reset simulated submission & ensure quiz view is active
    setSimulatedSubmission(false);
    setActiveQuizChapterId(chapterNum);
    if (subTitle !== undefined) {
      setActiveQuizSubTitle(subTitle);
    }
  };
  const [practiceShowExplanations, setPracticeShowExplanations] = React.useState<any>({});
  const [selectedClassFilter, setSelectedClassFilter] = React.useState("Semua");
  const [showAllChapters, setShowAllChapters] = React.useState(false);
  const [gradingIsUnlocked, setGradingIsUnlocked] = React.useState(false);
  const [gradingStatus, setGradingStatus] = React.useState("Draft");
  const [expandedLessons, setExpandedLessons] = React.useState<string[]>([]);
  const [progressTabMode, setProgressTabMode] = React.useState<"penilaian" | "penilaian_bab" | "sikap">("penilaian_bab");
  const [babCurrentPage, setBabCurrentPage] = React.useState(1);
  const [tugasCurrentPage, setTugasCurrentPage] = React.useState(1);
  const [evalSelectedLessonId, setEvalSelectedLessonId] = React.useState<string>("");
  const [evalSelectedBabId, setEvalSelectedBabId] = React.useState<number | "">("");
  const [isChaptersMinimized, setIsChaptersMinimized] = React.useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Assignment states
  const [submittingLessons, setSubmittingLessons] = React.useState<Record<string, boolean>>({});
  const [tugasScores, setTugasScores] = React.useState<Record<string, string>>({});
  const [tugasNotes, setTugasNotes] = React.useState<Record<string, string>>({});
  const [tugasGrades, setTugasGrades] = React.useState<Record<string, string>>({});
  const [tugasGradingSubmitting, setTugasGradingSubmitting] = React.useState<Record<string, boolean>>({});

  // Deletion Confirmation Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteType, setDeleteType] = React.useState<"lesson" | "quiz" | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = React.useState<string>("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const lmsClassesMap = React.useMemo(() => {
    const rawList = [...(systemState?.customization?.lmsClasses || []), ...(systemState?.lmsClasses || [])];
    const studentClasses = (activeStudents || []).map(s => (s.class || "").trim()).filter(Boolean);
    const seenClasses = new Set(rawList.map(c => (c.name || "").trim().toLowerCase()));
    
    studentClasses.forEach(scName => {
      const lower = scName.toLowerCase();
      if (!seenClasses.has(lower) && lower !== "belum diplot" && lower !== "belum ada kelas" && lower !== "semua" && lower !== "semua kelas") {
        rawList.push({
          id: scName,
          name: scName,
          isActive: true,
          method: "Offline",
          chapters: CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1 })),
          mathChapters: MATH_CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1 }))
        });
        seenClasses.add(lower);
      }
    });

    const seen = new Set<string>();
    const uniqueRawList = rawList.filter(c => {
      const nameKey = (c.name || c.id || "").trim().toLowerCase();
      if (!nameKey || seen.has(nameKey)) return false;
      seen.add(nameKey);
      return true;
    });

    const map = new Map();
    const cleanStr = (s: string) => {
      if (!s) return "";
      return s.trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
    };
    uniqueRawList.forEach((c: any) => {
      if (c?.name) {
        map.set(cleanStr(c.name), {
          chapters: c.chapters || [],
          mathChapters: c.mathChapters || []
        });
      }
    });
    return map;
  }, [systemState?.customization?.lmsClasses, systemState?.lmsClasses, activeStudents]);

  const getClassChaptersList = React.useCallback((cls: string, sub: string, showAll: boolean = false): any[] => {
    const cleanStr = (s: string) => {
      if (!s) return "";
      return s.trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
    };
    const targetCls = cleanStr(cls);
    const entry = lmsClassesMap.get(targetCls);
    
    let chapters: any[] = [];
    if (isMathSubject(sub)) {
      chapters = entry?.mathChapters || [];
      if (chapters.length === 0) {
        chapters = MATH_CHAPTERS_LIST.map(ch => ({ ...ch, isActive: true, activeDate: "" }));
      }
    } else {
      chapters = entry?.chapters || [];
      if (chapters.length === 0) {
        chapters = CHAPTERS_LIST.map(ch => ({ ...ch, isActive: true, activeDate: "" }));
      }
    }
    
    // Dynamic Mandiri Cross-Class Sync: Collect all Mandiri chapters across ALL classes in systemState / lmsClassesMap
    const seenNums = new Set(chapters.map((ch: any) => Number(ch.number)));
    const mandiriExtra: any[] = [];
    
    lmsClassesMap.forEach((classEntry: any) => {
      const classChapters = isMathSubject(sub) ? (classEntry?.mathChapters || []) : (classEntry?.chapters || []);
      (classChapters || []).forEach((ch: any) => {
        const isMandiri = ch?.isMandiri === true || (isMathSubject(sub) ? Number(ch?.number) > 25 : Number(ch?.number) > 35);
        if (isMandiri && ch && ch.number && !seenNums.has(Number(ch.number))) {
          seenNums.add(Number(ch.number));
          mandiriExtra.push({ ...ch, isMandiri: true, isActive: true });
        }
      });
    });

    (systemState?.lmsLessons || []).forEach((l: any) => {
      const chNum = Number(l?.chapterNumber);
      if (!chNum) return;
      const isSubMatch = isMathSubject(sub) ? isMathSubject(l?.subject) : !isMathSubject(l?.subject);
      const isMandiri = l?.isMandiri === true || (isMathSubject(sub) ? chNum > 25 : chNum > 35);
      if (isSubMatch && isMandiri && !seenNums.has(chNum)) {
        seenNums.add(chNum);
        mandiriExtra.push({
          number: chNum,
          title: l.title || (isMathSubject(sub) ? `Bab ${chNum} Mandiri SSW` : `Bab ${chNum} Mandiri`),
          isMandiri: true,
          isActive: true
        });
      }
    });

    if (mandiriExtra.length > 0) {
      chapters = [...chapters, ...mandiriExtra].sort((a: any, b: any) => Number(a.number) - Number(b.number));
    }

    if (!showAll) {
      return chapters.filter((c: any) => c.isActive !== false);
    }
    return chapters;
  }, [lmsClassesMap, systemState?.lmsLessons]);

  const getResolvedChapterNum = React.useCallback((clsName: string, rawVal: any, sub: string): number => {
    if (!rawVal) return 0;
    const num = Number(rawVal);
    const isFukushu = (clsName || "").toUpperCase().includes("FUKUSHU") || (clsName || "").toUpperCase().includes("FUKUSU");
    if (isFukushu && num <= 10) {
      const trulyActiveChapters = getClassChaptersList(clsName, sub, false);
      const hasStandardChapters = trulyActiveChapters.some((ch: any) => ch.number < 26);
      if (!hasStandardChapters) {
        return 25 + num;
      }
    }
    return num;
  }, [getClassChaptersList]);
  
  const toggleLessonExpanded = (id: string) => {
    setExpandedLessons((prev: any) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.includes(id)) {
        return list.filter((x: any) => x !== id);
      } else {
        return [...list, id];
      }
    });
  };
  const handleToggleLessonLock = async (lesson: any) => {
    if (!onUpdateState) return;
    await onUpdateState("lmsLessons", "update", {
      ...lesson,
      isLocked: !lesson.isLocked
    });
  };
  const handleOpenEditLesson = (lesson: any) => {
    setSelectedLessonToEdit(lesson);
    setLessonSubject(lesson.subject || "Bahasa Jepang");
    setSelectedBabNumber(lesson.chapterNumber || 1);
    setLessonDifficulty(lesson.difficulty || "Umum");
    setLessonTitle(lesson.title || "");
    setLessonJapaneseTitle(lesson.japaneseTitle || "");
    setLessonContentType(lesson.contentType || "text_only");
    setLessonUploadMethod(lesson.uploadMethod || "url");
    setLessonVideoUrl(lesson.videoUrl || "");
    setLessonSlidesUrl(lesson.slidesUrl || "");
    setLessonBookUrl(lesson.bookUrl || "");
    setLessonAudioData(lesson.audioData || "");
    setLessonContent(lesson.content || "");
    setLessonIsLocked(!!lesson.isLocked);
    setLessonTargetClass(lesson.targetClass || "Semua");
    setLessonDeadline(lesson.deadline || "");
    setLessonDurationMinutes(lesson.durationMinutes || "");
    setIsLessonFormOpen(true);
  };
  const handleLessonDelete = (id: string, name: string) => {
    setDeleteType("lesson");
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setDeleteConfirmOpen(true);
  };
  const handleQuizDelete = (id: string, name: string) => {
    setDeleteType("quiz");
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!onUpdateState || !deleteTargetId || !deleteType) return;
    setIsDeleting(true);
    try {
      if (deleteType === "lesson") {
        await onUpdateState("lmsLessons", "delete", { id: deleteTargetId });
      } else if (deleteType === "quiz") {
        await onUpdateState("lmsQuizzes", "delete", { id: deleteTargetId });
      }
    } catch (err) {
      console.error("Gagal menghapus data:", err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteType(null);
      setDeleteTargetId(null);
      setDeleteTargetName("");
    }
  };

  const [isLessonFormOpen, setIsLessonFormOpen] = React.useState(false);
  const [lessonTargetClass, setLessonTargetClass] = React.useState("Semua");
  const [selectedClassForLms, setSelectedClassForLms] = React.useState<string | null>(null);
  const [selectedLessonToEdit, setSelectedLessonToEdit] = React.useState<any>(null);
  const [lessonError, setLessonError] = React.useState("");
  const [lessonSubject, setLessonSubject] = React.useState("Bahasa Jepang");
  const [lessonDifficulty, setLessonDifficulty] = React.useState("Umum");
  const [lessonTitle, setLessonTitle] = React.useState("");
  const [lessonJapaneseTitle, setLessonJapaneseTitle] = React.useState("");
  const [lessonContentType, setLessonContentType] = React.useState("text_only");
  const [lessonUploadMethod, setLessonUploadMethod] = React.useState("url");
  const [lessonVideoUrl, setLessonVideoUrl] = React.useState("");
  const [lessonSlidesUrl, setLessonSlidesUrl] = React.useState("");
  const [lessonBookUrl, setLessonBookUrl] = React.useState("");
  const [lessonAudioData, setLessonAudioData] = React.useState<any>(null);
  const [isRecordingAudio, setIsRecordingAudio] = React.useState(false);
  const [lessonIsLocked, setLessonIsLocked] = React.useState(false);
  const [lessonContent, setLessonContent] = React.useState("");
  const [lessonDeadline, setLessonDeadline] = React.useState("");
  const [lessonDurationMinutes, setLessonDurationMinutes] = React.useState<number | "">("");
  const [isSubmittingLesson, setIsSubmittingLesson] = React.useState(false);
  const [isFileUploading, setIsFileUploading] = React.useState(false);
  const [uploadProgressText, setUploadProgressText] = React.useState<string>("");

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = (window as any).MediaRecorder?.isTypeSupported?.('audio/webm') 
        ? 'audio/webm' 
        : ((window as any).MediaRecorder?.isTypeSupported?.('audio/mp4') ? 'audio/mp4' : '');
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/mp3" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setLessonAudioData(reader.result as string);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Gagal mengakses mikrofon. Pastikan Anda telah memberikan izin.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };
  const handleFileUpload = async (e: any, setter: any, typeName = "berkas") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsFileUploading(true);
    setLessonError("");
    setUploadProgressText(`⚡ Mengompres & mengunggah ${file.name}...`);
    try {
      const url = await uploadFileToFirebase(file, "lms_materials", (status) => {
        setUploadProgressText(status);
      });
      setter(url);
      setUploadProgressText(`✓ ${file.name} berhasil diunggah ke Firebase Storage`);
    } catch (err: any) {
      console.error("File upload failed:", err);
      setLessonError(err?.message || `Gagal mengunggah ${typeName}. Pastikan ukuran berkas wajar dan format didukung.`);
      setUploadProgressText("");
    } finally {
      setIsFileUploading(false);
    }
  };
  const handleGradeSubmit = async (
    statusOverride?: string | Event,
    targetStudentId?: string,
    targetChapterNumber?: number,
    customScores?: {
      scoreKotoba?: number | string;
      scoreBumpo?: number | string;
      scoreKaiwa?: number | string;
      scoreKanji?: number | string;
      notes?: string;
    }
  ) => {
    if (typeof statusOverride === "object" && statusOverride && 'preventDefault' in statusOverride) {
      statusOverride.preventDefault();
    }
    if (isReadOnlyView) return;

    let submitStatus = "Telah Dinilai";
    if (typeof statusOverride === "string") {
      submitStatus = statusOverride;
    }

    if (currentUser?.role === "Siswa") {
      submitStatus = statusOverride as string;
    }

    setIsGradingSubmitting(true);

    try {
      const effStudentId = targetStudentId || viewStudentId;
      const targetStudent = (activeStudents || []).find((s: any) => s.id === effStudentId) || (filteredActiveStudents || []).find((s: any) => s.id === effStudentId);

      const effChapterNumber = targetChapterNumber !== undefined
        ? Number(targetChapterNumber)
        : (activeSubTab === "progress" && evalSelectedBabId !== "" ? Number(evalSelectedBabId) : Number(selectedBabNumber || 1));

      const rawKotoba = customScores?.scoreKotoba !== undefined ? customScores.scoreKotoba : scoreKotoba;
      const rawBumpo = customScores?.scoreBumpo !== undefined ? customScores.scoreBumpo : scoreBumpo;
      const rawKaiwa = customScores?.scoreKaiwa !== undefined ? customScores.scoreKaiwa : scoreKaiwa;
      const rawKanji = customScores?.scoreKanji !== undefined ? customScores.scoreKanji : scoreKanji;
      const effNotes = customScores?.notes !== undefined ? customScores.notes : gradingNotes;

      const finalKotoba = Number(rawKotoba) || 0;
      const finalBumpo = Number(rawBumpo) || 0;
      const finalKaiwa = Number(rawKaiwa) || 0;
      const finalKanji = Number(rawKanji) || 0;
      const computedAverage = Math.round(((finalKotoba + finalBumpo + finalKaiwa + finalKanji) / 4) * 10) / 10;

      let letterGrade = "E";
      if (computedAverage >= 90) letterGrade = "A";
      else if (computedAverage >= 80) letterGrade = "B";
      else if (computedAverage >= 70) letterGrade = "C";
      else if (computedAverage >= 60) letterGrade = "D";

      // Canonical assessment doc ID
      const subjSlug = getCanonicalSubjectSlug(assessmentSubject);
      const canonicalDocId = `asses-${effStudentId}-${subjSlug}-ch${effChapterNumber}`;

      const payload: any = {
        id: canonicalDocId,
        studentId: effStudentId,
        studentName: targetStudent?.name || "Siswa",
        chapterId: `ch-${effChapterNumber}`,
        chapterNumber: Number(effChapterNumber),
        title: `Bab ${effChapterNumber}`,
        subject: assessmentSubject || (subjSlug === "matematika" ? "Matematika" : "Bahasa Jepang"),
        status: "Telah Dinilai",
        score: computedAverage,
        scoreKotoba: finalKotoba,
        scoreBumpo: finalBumpo,
        scoreKaiwa: finalKaiwa,
        scoreKanji: finalKanji,
        grade: letterGrade,
        notes: effNotes || "",
        assessedBy: currentUser?.name || "Sensei Utama",
        assessedDate: new Date().toISOString().split("T")[0],
        timestamp: Date.now()
      };

      if (onUpdateState) {
        const ok = await onUpdateState("chapterAssessments", "UPDATE", payload);
        if (ok) {
          alert(`Nilai Bab ${effChapterNumber} untuk ${targetStudent?.name || "Siswa"} (Grade ${letterGrade} - ${computedAverage}) berhasil disimpan!`);
        } else {
          alert("Gagal menyimpan nilai ke database.");
        }
      }
    } catch (err) {
      console.error("Error submitting grade:", err);
      alert("Gagal menyimpan nilai.");
    } finally {
      setIsGradingSubmitting(false);
    }
  };
  const handleLessonSubmit = async (e: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!lessonTitle.trim()) {
      setLessonError("Judul materi wajib diisi");
      return;
    }
    if (isFileUploading) {
      setLessonError("Harap tunggu hingga proses upload berkas selesai.");
      return;
    }
    setIsSubmittingLesson(true);
    setLessonError("");
    
    const isMathSub = isMathSubject(lessonSubject);
    const isChapterNumMandiri = isMathSub ? Number(selectedBabNumber) > 25 : Number(selectedBabNumber) > 35;
    const currentClassChapters = getClassChaptersList(selectedClassFilter || "Semua", lessonSubject, true);
    const currChapter = currentClassChapters.find((ch: any) => Number(ch.number) === Number(selectedBabNumber));
    const isMandiriLesson = currChapter?.isMandiri === true || isChapterNumMandiri || selectedLessonToEdit?.isMandiri === true;

    const payload: any = {
      subject: lessonSubject,
      chapterNumber: Number(selectedBabNumber),
      difficulty: lessonDifficulty,
      title: lessonTitle,
      japaneseTitle: lessonJapaneseTitle,
      contentType: lessonContentType,
      uploadMethod: lessonUploadMethod,
      videoUrl: lessonContentType === "video" ? (formatVideoEmbedUrl(lessonVideoUrl) || lessonVideoUrl) : lessonVideoUrl,
      slidesUrl: lessonSlidesUrl,
      bookUrl: lessonBookUrl,
      audioData: lessonAudioData || "",
      content: lessonContent,
      isLocked: lessonIsLocked,
      isMandiri: isMandiriLesson,
      targetClass: isMandiriLesson ? "Semua" : lessonTargetClass,
      deadline: lessonDeadline,
      durationMinutes: lessonDurationMinutes ? Number(lessonDurationMinutes) : undefined
    };

    if (selectedLessonToEdit) {
      payload.id = selectedLessonToEdit.id;
    }

    if (!onUpdateState) {
      setLessonError("System update handler is not configured.");
      setIsSubmittingLesson(false);
      return;
    }

    const ok = await onUpdateState("lmsLessons", selectedLessonToEdit ? "update" : "add", payload);
    setIsSubmittingLesson(false);
    
    if (ok) {
      // BROADCAST LOGIC: If it's a "Tugas", automatically create/ensure assessments for all students in the target class
      if (payload.difficulty === "Tugas" && onUpdateState) {
        const targetClass = payload.targetClass || "Semua";
        const studentsToBroadcast = (activeStudents || []).filter(s => 
          targetClass === "Semua" || s.class === targetClass
        );

        for (const student of studentsToBroadcast) {
          // Check if assessment already exists for this student and chapter/subject/title to avoid duplicate/reset
          const exists = (chapterAssessments || []).some(a => 
            a.studentId === student.id && 
            a.chapterNumber === payload.chapterNumber && 
            (a.subject || "Bahasa Jepang") === (payload.subject || "Bahasa Jepang") &&
            a.title === payload.title
          );

          if (!exists) {
            const assessPayload = {
              studentId: student.id,
              studentName: student.name,
              chapterNumber: payload.chapterNumber,
              title: payload.title,
              status: "Belum Belajar",
              subject: payload.subject || "Bahasa Jepang",
              lessonId: payload.id // will be undefined if "add", but server logic handles it
            };
            // Note: We don't await to avoid blocking the UI too much, or we can await in a loop
            // But for reliability with onUpdateState (which calls fetchState), we might need to be careful.
            // However, onUpdateState is async, so we'll just fire them.
            onUpdateState("chapterAssessments", "update", assessPayload);
          }
        }
      }

      setIsLessonFormOpen(false);
      // Reset form
      setSelectedLessonToEdit(null);
      setLessonTitle("");
      setLessonJapaneseTitle("");
      setLessonVideoUrl("");
      setLessonSlidesUrl("");
      setLessonBookUrl("");
      setLessonAudioData("");
      setLessonContent("");
      setLessonDeadline("");
      setLessonDurationMinutes("");
    } else {
      setLessonError("Gagal menyimpan materi, silakan coba lagi.");
    }
  };

  const handleSetChapterActiveDate = async (cls: string, chapterNum: number, activeDate: string) => {
    if (!onUpdateState) return;
    const lmsClasses = allClasses;
    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      if ((c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase()) {
        const isMath = assessmentSubject === "SSW";
        const chaptersKey = isMath ? "mathChapters" : "chapters";
        let chapters = c[chaptersKey] || [];
        if (chapters.length === 0) {
          const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
          chapters = baseTemplate.map((ch: any) => ({
            ...ch,
            isActive: true,
            activeDate: ""
          }));
        }
        const updatedChapters = chapters.map((ch: any) => {
          if (ch.number === chapterNum) {
            return {
              ...ch,
              activeDate: activeDate
            };
          }
          return ch;
        });
        return {
          ...c,
          id: classId,
          [chaptersKey]: updatedChapters
        };
      }
      return {
        ...c,
        id: classId
      };
    });
    
    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
  };

  const handleActivateChapterInLms = async (cls: string, chapterNum: number) => {
    if (!onUpdateState) return;
    const targetCls = (cls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "").trim();
    if (!targetCls) {
      alert("Harap pilih kelas terlebih dahulu.");
      return;
    }

    await handleSetClassActiveChapter(targetCls, chapterNum, true);
    setToastMessage(`Akses Bab ${chapterNum} berhasil dibuka untuk kelas ${targetCls}!`);
  };

  const handleDeactivateChapterInLms = async (cls: string, chapterNum: number) => {
    if (!onUpdateState) return;
    const targetCls = (cls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "").trim();
    if (!targetCls) {
      alert("Harap pilih kelas terlebih dahulu.");
      return;
    }

    const norm = (s: string) => (s || "").trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
    const classObj = allClasses.find((c: any) => (c.name || "").trim().toLowerCase() === targetCls.toLowerCase() || norm(c.name) === norm(targetCls));
    const isMath = assessmentSubject === "SSW";
    const activeChapterNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";
    const currentActive = classObj ? Number(classObj[activeChapterNumKey] || 1) : 1;

    const newActiveNum = chapterNum >= currentActive ? Math.max(0, chapterNum - 1) : currentActive;
    await handleSetClassActiveChapter(targetCls, newActiveNum, false, chapterNum);
    setToastMessage(`Akses Bab ${chapterNum} berhasil ditutup untuk kelas ${targetCls}.`);
  };

  const handleToggleChapterActive = async (cls: string, chapterNum: number, currentActive: boolean) => {
    if (!onUpdateState) return;
    const targetCls = (cls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "").trim();
    if (!targetCls) return;

    if (currentActive) {
      await handleDeactivateChapterInLms(targetCls, chapterNum);
    } else {
      await handleActivateChapterInLms(targetCls, chapterNum);
    }
  };

  const handleUnlockAllChapters = async (cls: string) => {
    if (!onUpdateState) return;
    const targetCls = (cls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "").trim();
    const lmsClasses = allClasses;
    const norm = (s: string) => (s || "").trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      if ((c.name || "").trim().toLowerCase() === targetCls.toLowerCase() || norm(c.name) === norm(targetCls)) {
        const isMath = assessmentSubject === "SSW";
        const chaptersKey = isMath ? "mathChapters" : "chapters";
        let chapters = c[chaptersKey] || [];
        if (chapters.length === 0) {
          const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
          chapters = baseTemplate.map((ch: any) => ({
            ...ch,
            isActive: true,
            activeDate: ""
          }));
        }
        const updatedChapters = chapters.map((ch: any) => ({
          ...ch,
          isActive: true,
          activeDate: ""
        }));
        return {
          ...c,
          id: classId,
          [chaptersKey]: updatedChapters
        };
      }
      return {
        ...c,
        id: classId
      };
    });
    
    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
    onUpdateState("lmsClasses", "update", updatedLmsClasses).catch(() => {});
  };

  const handleSetClassActiveChapter = async (cls: string, chapterNum: number, setActiveFlag: boolean = true, targetChapterToToggle?: number) => {
    if (!onUpdateState) return;
    const targetCls = (cls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "").trim();
    const lmsClasses = allClasses;
    const norm = (s: string) => (s || "").trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
    const normTarget = targetCls.toLowerCase();

    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      if ((c.name || "").trim().toLowerCase() === normTarget || norm(c.name) === norm(targetCls)) {
        const isMath = assessmentSubject === "SSW";
        const chaptersKey = isMath ? "mathChapters" : "chapters";
        const activeChapterNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";

        let chapters = c[chaptersKey] || [];
        if (chapters.length === 0) {
          const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
          chapters = baseTemplate.map((ch: any) => ({
            ...ch,
            isActive: true,
            activeDate: ""
          }));
        }

        const chToSet = targetChapterToToggle !== undefined ? targetChapterToToggle : chapterNum;

        const updatedChapters = chapters.map((ch: any) => {
          if (ch.number === chToSet) {
            return {
              ...ch,
              isActive: setActiveFlag,
              activeDate: setActiveFlag ? (ch.activeDate || new Date().toISOString().split("T")[0]) : ""
            };
          }
          if (setActiveFlag && ch.number <= chapterNum) {
            return {
              ...ch,
              isActive: true
            };
          }
          return ch;
        });

        return {
          ...c,
          id: classId,
          [activeChapterNumKey]: chapterNum,
          [chaptersKey]: updatedChapters
        };
      }
      return {
        ...c,
        id: classId
      };
    });
    
    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
    onUpdateState("lmsClasses", "update", updatedLmsClasses).catch(() => {});
  };

  const handleAddMandiriChapter = async (
    cls: string,
    customData?: { title?: string; japaneseTitle?: string; description?: string; number?: number; applyToAll?: boolean }
  ): Promise<boolean> => {
    if (!onUpdateState) return false;
    const rawTargetClsName = (cls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "").trim();
    if (!rawTargetClsName) {
      setToastMessage("Harap pilih kelas terlebih dahulu untuk menambahkan Bab Mandiri.");
      return false;
    }
    const isApplyToAll = customData?.applyToAll !== false; // Mandiri materials apply to ALL classes by default
    const lmsClasses = allClasses.length > 0 ? allClasses : [{ name: rawTargetClsName, type: "regular", isActive: true }];
    let newChapterNum = customData?.number || 1;

    const isMath = assessmentSubject === "SSW";
    const chaptersKey = isMath ? "mathChapters" : "chapters";
    const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;

    if (!customData?.number) {
      let maxNum = baseTemplate.length;
      lmsClasses.forEach((c: any) => {
        const chs = c[chaptersKey] || [];
        chs.forEach((ch: any) => {
          if (Number(ch.number) > maxNum) maxNum = Number(ch.number);
        });
      });
      newChapterNum = maxNum + 1;
    } else {
      newChapterNum = Number(customData.number);
    }

    const newChapter = {
      number: newChapterNum,
      title: (customData?.title || "").trim() || `Bab Mandiri ${newChapterNum}`,
      japaneseTitle: (customData?.japaneseTitle || "").trim() || "Bab Mandiri",
      description: (customData?.description || "").trim() || "Bab pembelajaran mandiri yang ditambahkan langsung oleh pengajar.",
      isActive: true,
      isMandiri: true,
      activeDate: new Date().toISOString()
    };

    const norm = (s: string) => (s || "").trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
    let foundTarget = false;

    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      const isMatch = isApplyToAll || (c.name || "").trim().toLowerCase() === rawTargetClsName.toLowerCase() || norm(c.name) === norm(rawTargetClsName);

      if (isMatch) {
        foundTarget = true;
        let chapters = c[chaptersKey] || [];
        if (chapters.length === 0) {
          chapters = baseTemplate.map((ch: any) => ({
            ...ch,
            isActive: true,
            activeDate: ""
          }));
        }

        const cleanChapters = chapters.filter((ch: any) => Number(ch.number) !== Number(newChapterNum));
        const mergedChapters = [...cleanChapters, newChapter].sort((a: any, b: any) => Number(a.number) - Number(b.number));

        return {
          ...c,
          id: classId,
          [chaptersKey]: mergedChapters
        };
      }
      return {
        ...c,
        id: classId
      };
    });

    if (!foundTarget) {
      const initialChapters = baseTemplate.map((ch: any) => ({
        ...ch,
        isActive: true,
        activeDate: ""
      }));
      const cleanInitial = initialChapters.filter((ch: any) => Number(ch.number) !== Number(newChapterNum));
      const mergedChapters = [...cleanInitial, newChapter].sort((a: any, b: any) => Number(a.number) - Number(b.number));
      updatedLmsClasses.push({
        id: "KLS-" + Math.random().toString(36).substr(2, 9),
        name: rawTargetClsName,
        type: "regular",
        isActive: true,
        [chaptersKey]: mergedChapters
      });
    }
    
    const ok = await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
    // Double-sync directly to lmsClasses collection for guaranteed persistence
    onUpdateState("lmsClasses", "update", updatedLmsClasses).catch(() => {});
    if (ok) {
      setSelectedBabNumber(newChapterNum);
      const titleToShow = (customData?.title || "").trim() || `Bab Mandiri ${newChapterNum}`;
      setToastMessage(`✓ ${titleToShow} (Bab ${newChapterNum}) untuk SEMUA KELAS berhasil ditambahkan!`);
      return true;
    } else {
      setToastMessage("Gagal menambahkan Bab Mandiri.");
      return false;
    }
  };

  const handleEditMandiriChapter = async (
    cls: string,
    chapterNum: number,
    updatedData: { title?: string; japaneseTitle?: string; description?: string; number?: number; applyToAll?: boolean }
  ): Promise<boolean> => {
    if (!onUpdateState) return false;
    const rawTargetClsName = (cls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "").trim();
    if (!rawTargetClsName) {
      setToastMessage("Harap pilih kelas terlebih dahulu.");
      return false;
    }
    const isApplyToAll = updatedData?.applyToAll !== false; // Mandiri edits apply across all classes by default

    const lmsClasses = allClasses.length > 0 ? allClasses : [{ name: rawTargetClsName, type: "regular", isActive: true }];
    const isMath = assessmentSubject === "SSW";
    const chaptersKey = isMath ? "mathChapters" : "chapters";
    const newNum = updatedData.number !== undefined ? Number(updatedData.number) : chapterNum;
    const norm = (s: string) => (s || "").trim().toLowerCase().replace(/^kelas[:\s]*/i, "");

    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      const isMatch = isApplyToAll || (c.name || "").trim().toLowerCase() === rawTargetClsName.toLowerCase() || norm(c.name) === norm(rawTargetClsName);

      if (isMatch) {
        let chapters = c[chaptersKey] || [];
        if (chapters.length === 0) {
          const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
          chapters = baseTemplate.map((ch: any) => ({
            ...ch,
            isActive: true,
            activeDate: ""
          }));
        }

        const updatedChapters = chapters.map((ch: any) => {
          if (Number(ch.number) === Number(chapterNum)) {
            return {
              ...ch,
              number: newNum,
              title: updatedData.title !== undefined ? updatedData.title.trim() : ch.title,
              japaneseTitle: updatedData.japaneseTitle !== undefined ? updatedData.japaneseTitle.trim() : ch.japaneseTitle,
              description: updatedData.description !== undefined ? updatedData.description.trim() : ch.description,
              isMandiri: true,
              updatedAt: new Date().toISOString()
            };
          }
          return ch;
        });

        return {
          ...c,
          id: classId,
          [chaptersKey]: updatedChapters
        };
      }
      return {
        ...c,
        id: classId
      };
    });

    const ok = await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
    onUpdateState("lmsClasses", "update", updatedLmsClasses).catch(() => {});

    if (ok) {
      setSelectedBabNumber(newNum);
      setToastMessage(`✓ Perubahan Bab ${newNum} ${isApplyToAll ? "untuk SEMUA KELAS" : ""} berhasil disimpan.`);
      return true;
    } else {
      setToastMessage("Gagal menyimpan perubahan Bab Mandiri.");
      return false;
    }
  };

  const handleDeleteMandiriChapter = async (
    cls: string,
    chapterNum: number
  ): Promise<boolean> => {
    if (!onUpdateState) return false;
    const targetClsName = (cls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "").trim();
    const isMath = assessmentSubject === "SSW";
    const chaptersKey = isMath ? "mathChapters" : "chapters";
    let fallbackChapterNum = 1;
    const norm = (s: string) => (s || "").trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
    const isTargetAll = !targetClsName || targetClsName.toLowerCase() === "semua" || targetClsName.toLowerCase() === "semua kelas";

    const lmsClasses = allClasses.length > 0 ? allClasses : [{ name: targetClsName || "Kelas Utama", type: "regular", isActive: true }];
    let hasDeletedAny = false;

    const isStandard = isMath ? Number(chapterNum) <= 25 : Number(chapterNum) <= 35;
    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      let chapters = c[chaptersKey] || [];
      if (chapters.length === 0) {
        const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
        chapters = baseTemplate.map((ch: any) => ({
          ...ch,
          isActive: true,
          activeDate: ""
        }));
      }

      const targetChapter = chapters.find((ch: any) => Number(ch.number) === Number(chapterNum));
      if (targetChapter && (targetChapter.isMandiri || !isStandard)) {
        hasDeletedAny = true;
        const remainingChapters = chapters.filter((ch: any) => Number(ch.number) !== Number(chapterNum));
        if (remainingChapters.length > 0) {
          const prevChapters = remainingChapters.filter((ch: any) => Number(ch.number) < Number(chapterNum));
          fallbackChapterNum = prevChapters.length > 0 ? prevChapters[prevChapters.length - 1].number : remainingChapters[0].number;
        }
        return {
          ...c,
          id: classId,
          [chaptersKey]: remainingChapters
        };
      }
      return {
        ...c,
        id: classId
      };
    });

    const ok = await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
    onUpdateState("lmsClasses", "update", updatedLmsClasses).catch(() => {});

    if (ok) {
      if (Number(selectedBabNumber) === Number(chapterNum)) {
        setSelectedBabNumber(fallbackChapterNum);
      }
      setToastMessage(`✓ Bab Mandiri ${chapterNum} berhasil dihapus dari kurikulum kelas.`);
      return true;
    } else {
      setToastMessage("Gagal menghapus Bab Mandiri.");
      return false;
    }
  };

  const getClassChaptersCount = (cls: string, sub: string, showAll: boolean = false) => {
    const chapters = getClassChaptersList(cls, sub, showAll);
    return chapters.length;
  };
  const isSiswaOrAlumni = currentUser?.role === "Siswa" || currentUser?.role === "Alumni";

  const allClasses = React.useMemo(() => {
    // Merge classes from customization and top-level lmsClasses and deduplicate by trimmed name
    const rawList = [...(systemState?.customization?.lmsClasses || []), ...(systemState?.lmsClasses || [])];
    
    // Also extract any classes from activeStudents and users that aren't in rawList
    const userClasses = (systemState?.users || []).map(u => (u.assignedClass || "").trim()).filter(Boolean);
    const studentClasses = [...(activeStudents || []).map(s => (s.class || (s as any).assignedClass || "").trim()), ...userClasses].filter(Boolean);
    const seenClasses = new Set(rawList.map(c => (c.name || "").trim().toLowerCase()));
    
    studentClasses.forEach(scName => {
      const lower = scName.toLowerCase();
      if (!seenClasses.has(lower) && lower !== "belum diplot" && lower !== "belum ada kelas" && lower !== "semua" && lower !== "semua kelas") {
        rawList.push({
          id: scName,
          name: scName,
          isActive: true,
          method: "Offline",
          chapters: CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1 })),
          mathChapters: MATH_CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1 }))
        });
        seenClasses.add(lower);
      }
    });

    const seen = new Set<string>();
    return rawList.filter(c => {
      const nameKey = (c.name || c.id || "").trim().toLowerCase();
      if (!nameKey || seen.has(nameKey)) return false;
      seen.add(nameKey);
      return true;
    });
  }, [systemState?.lmsClasses, systemState?.customization?.lmsClasses, systemState?.users, activeStudents]);

  const vvipPlottedStudents = React.useMemo(() => {
    let list = activeStudents || [];
    list = list.filter((s: any) => {
      const sClass = (s.class || "").trim().toLowerCase();
      if (!sClass || sClass === "" || sClass === "belum diplot" || sClass === "belum ada kelas" || sClass === "semua" || sClass === "semua kelas") {
        return false;
      }
      // If student is suspended in user accounts, exclude them; otherwise include them since they are plotted
      const sId = (s.id || "").trim().toLowerCase();
      const sName = (s.name || "").trim().toLowerCase();
      
      const matchedUser = (systemState?.users || []).find((u: any) => {
        const uId = (u.studentId || "").trim().toLowerCase();
        const uName = (u.name || "").trim().toLowerCase();
        return (uId && uId === sId) || (uName && uName === sName);
      });
      if (matchedUser && matchedUser.status === "Suspended") {
        return false;
      }
      return true;
    });
    return list;
  }, [activeStudents, systemState?.users]);

  const officialClasses = React.useMemo(() => {
    return [...(systemState?.customization?.lmsClasses || []), ...(systemState?.lmsClasses || [])]
      .filter(c => c.isActive !== false)
      .reduce((acc: any[], current: any) => {
        const x = acc.find((item: any) => item.name === current.name);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
  }, [systemState]);

  const dropdownClasses = React.useMemo(() => {
    const list = allClasses.filter(c => c.isActive !== false);
    if (currentUser?.role === "VVIP") {
      const occupiedClassNames = new Set(vvipPlottedStudents.map(s => (s.class || "").trim().toLowerCase()));
      if (occupiedClassNames.size === 0) return list;
      return list.filter(c => occupiedClassNames.has((c.name || "").trim().toLowerCase()));
    }
    if (currentUser?.role === "Pengajar") {
      const pClass = (currentUser?.assignedClass || "").trim().toLowerCase();
      if (pClass === "semua" || pClass === "semua kelas") {
        return list;
      }
      if (pClass && pClass !== "belum diplot" && pClass !== "belum ada kelas") {
        return list.filter(c => (c.name || "").trim().toLowerCase() === pClass);
      }
      return [];
    }
    return list;
  }, [allClasses, currentUser?.role, currentUser?.assignedClass, vvipPlottedStudents]);

  // For VVIP or Pengajar or Admin viewing a specific class, automatically set selectedClassFilter to the assignedClass if available
  React.useEffect(() => {
    const isRestrictedRole = currentUser?.role === "VVIP" || currentUser?.role === "Pengajar";
    if (currentUser?.assignedClass && currentUser.assignedClass !== "Semua" && currentUser.assignedClass !== "Semua Kelas" && currentUser.assignedClass !== "Belum Diplot") {
      if (selectedClassFilter !== currentUser.assignedClass) {
        setSelectedClassFilter(currentUser.assignedClass);
      }
    } else if (isRestrictedRole && (selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas")) {
      if (dropdownClasses.length > 0) {
        setSelectedClassFilter(dropdownClasses[0].name);
      }
    }
  }, [currentUser?.assignedClass, currentUser?.role, dropdownClasses, selectedClassFilter]);

  const filteredActiveStudents = React.useMemo(() => {
    let list = (activeStudents || []);
    if (currentUser?.role === "VVIP") {
      list = (activeStudents || []);
    } else if (currentUser?.role === "Pengajar") {
      const pClass = (currentUser?.assignedClass || "").trim().toLowerCase();
      if (pClass === "semua" || pClass === "semua kelas") {
        // Keep full list
      } else if (pClass && pClass !== "belum diplot" && pClass !== "belum ada kelas") {
        list = list.filter((s: any) => (s.class || "").trim().toLowerCase() === pClass);
      } else {
        return [];
      }
    }
    
    if (selectedClassFilter && selectedClassFilter !== "Semua" && selectedClassFilter !== "Semua Kelas") {
      list = list.filter((s: any) => {
        const sClass = (s.class || "").trim().toLowerCase();
        const fClass = selectedClassFilter.trim().toLowerCase();
        return sClass === fClass;
      });
    }
    return list;
  }, [activeStudents, selectedClassFilter, currentUser, vvipPlottedStudents]);

  const itemsPerPage = 10;
  
  const totalBabPages = Math.ceil(filteredActiveStudents.length / itemsPerPage);
  const paginatedBabStudents = React.useMemo(() => {
    const startIndex = (babCurrentPage - 1) * itemsPerPage;
    return filteredActiveStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActiveStudents, babCurrentPage]);

  const totalTugasPages = Math.ceil(filteredActiveStudents.length / itemsPerPage);
  const paginatedTugasStudents = React.useMemo(() => {
    const startIndex = (tugasCurrentPage - 1) * itemsPerPage;
    return filteredActiveStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActiveStudents, tugasCurrentPage]);

  React.useEffect(() => {
    if (totalBabPages > 0 && babCurrentPage > totalBabPages) {
      setBabCurrentPage(totalBabPages);
    }
  }, [filteredActiveStudents.length, totalBabPages, babCurrentPage]);

  React.useEffect(() => {
    if (totalTugasPages > 0 && tugasCurrentPage > totalTugasPages) {
      setTugasCurrentPage(totalTugasPages);
    }
  }, [filteredActiveStudents.length, totalTugasPages, tugasCurrentPage]);

  // Set default student if current selection is not in filtered list
  const hasInitializedDefaultStudent = React.useRef(false);

  React.useEffect(() => {
    if (filteredActiveStudents.length > 0) {
      if (!hasInitializedDefaultStudent.current) {
        if (currentUser?.role === "Siswa" || currentUser?.role === "Alumni") {
          setSelectedStudentId(currentUser.studentId || filteredActiveStudents[0].id);
        } else {
          setSelectedStudentId(filteredActiveStudents[0].id);
        }
        hasInitializedDefaultStudent.current = true;
      } else {
        if (selectedStudentId) {
          const stillExists = filteredActiveStudents.some(s => s.id === selectedStudentId);
          if (!stillExists) {
            if (currentUser?.role === "Siswa" || currentUser?.role === "Alumni") {
              const myId = currentUser.studentId || "";
              if (filteredActiveStudents.some(s => s.id === myId)) {
                setSelectedStudentId(myId);
              } else {
                setSelectedStudentId(filteredActiveStudents[0].id);
              }
            } else {
              setSelectedStudentId(filteredActiveStudents[0].id);
            }
          }
        }
      }
    } else {
      setSelectedStudentId("");
    }
  }, [filteredActiveStudents, selectedStudentId, currentUser]);

  const viewStudentId = (isSiswaOrAlumni ? (matchingStudent?.id || currentUser?.studentId) : selectedStudentId) || (currentUser?.studentId || "SIS-001");
  const viewStudent = (filteredActiveStudents || []).find((s: any) => s.id === viewStudentId) || (filteredActiveStudents || [])[0];

  
  const activeStudentClass = React.useMemo(() => {
    if (currentUser?.role === "Pengajar" && (!currentUser?.assignedClass || currentUser?.assignedClass === "Belum Diplot" || currentUser?.assignedClass === "Belum ada kelas")) {
      return null;
    }
    if (isSiswaOrAlumni && (matchingStudent?.class || (matchingStudent as any)?.assignedClass)) {
      return matchingStudent.class || (matchingStudent as any)?.assignedClass;
    }
    if (isSiswaOrAlumni && currentUser?.assignedClass && currentUser.assignedClass !== "Belum Diplot" && currentUser.assignedClass !== "Belum ada kelas") {
      return currentUser.assignedClass;
    }
    if (viewStudent && !isSiswaOrAlumni) return viewStudent.class || (viewStudent as any)?.assignedClass;
    if (selectedClassForLms) return selectedClassForLms;
    if (currentUser?.assignedClass && currentUser.assignedClass !== "Belum Diplot" && currentUser.assignedClass !== "Belum ada kelas") return currentUser.assignedClass;
    return null;
  }, [viewStudent, selectedClassForLms, isSiswaOrAlumni, currentUser, matchingStudent]);

  const currentClassObj = React.useMemo(() => {
    if (!activeStudentClass) return null;
    return allClasses.find(
      (c) => (c.name || "").trim().toLowerCase() === activeStudentClass.trim().toLowerCase()
    );
  }, [activeStudentClass, allClasses]);

  const isClassActive = currentClassObj ? currentClassObj.isActive !== false : true;
  const isAdminOrVvip = ["Pengajar", "Admin", "Admin Super", "Admin Biasa", "VVIP"].includes(currentUser?.role || "");
  const isVvipOrAdmin = currentUser?.role === "VVIP" || ["Admin", "Admin Super", "Admin Biasa"].includes(currentUser?.role || "");

  const handleToggleClassActive = async () => {
    if (!onUpdateState || !activeStudentClass) return;
    const baseClasses = systemState?.customization?.lmsClasses || [];
    const updatedClasses = [...baseClasses];
    const targetIdx = updatedClasses.findIndex(
      (item) => item.id.toLowerCase() === activeStudentClass.toLowerCase() || item.name.toLowerCase() === activeStudentClass.toLowerCase()
    );
    
    if (targetIdx !== -1) {
      updatedClasses[targetIdx] = {
        ...updatedClasses[targetIdx],
        isActive: true
      };
    } else {
      const templateClass = allClasses.find(
        (c) => (c.name || "").trim().toLowerCase() === activeStudentClass.trim().toLowerCase()
      );
      updatedClasses.push({
        id: activeStudentClass,
        name: activeStudentClass,
        isActive: true,
        type: templateClass?.type || "reguler",
        method: templateClass?.method || "Offline",
        chapters: templateClass?.chapters || CHAPTERS_LIST.map(ch => ({ ...ch, isActive: true }))
      });
    }

    const ok = await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedClasses
    });
    if (ok) {
      alert(`Kelas ${activeStudentClass} berhasil diaktifkan!`);
    } else {
      alert("Gagal mengaktifkan kelas.");
    }
  };

  const currentClassMaxBab = React.useMemo(() => {
    const cls = activeStudentClass || (dropdownClasses[0]?.name || "");
    if (!cls) return `${CHAPTERS_LIST.length}`;
    const classObj = allClasses.find(c => (c.name || "").trim().toLowerCase() === cls.trim().toLowerCase());
    const activeChapterNumKey = assessmentSubject === "SSW" ? "activeMathChapterNum" : "activeChapterNum";
    const activeCount = classObj?.[activeChapterNumKey] || 1;
    const totalCount = getClassChaptersList(cls, assessmentSubject, true).length;
    return `${activeCount} / ${totalCount}`;
  }, [activeStudentClass, dropdownClasses, allClasses, assessmentSubject]);

  const studentAssessmentsMap = React.useMemo(() => {
    const map = new Map<string, any[]>();
    (chapterAssessments || []).forEach(c => {
      if (!c.studentId) return;
      const list = map.get(c.studentId) || [];
      list.push(c);
      map.set(c.studentId, list);
    });
    return map;
  }, [chapterAssessments]);
  React.useEffect(() => {
    if (viewStudentId) {
      const targetChapter = (activeSubTab === "progress" && evalSelectedBabId !== "")
        ? Number(evalSelectedBabId)
        : Number(selectedBabNumber || 1);

      const assessment = (chapterAssessments || []).find(
        (a: any) => (a.studentId || "").trim() === (viewStudentId || "").trim() &&
                    Number(a.chapterNumber) === Number(targetChapter) &&
                    isSameSubject(a.subject, assessmentSubject)
      );
      if (assessment) {
        setGradingStatus(assessment.status || "Belum Belajar");
        setScoreKotoba(assessment.scoreKotoba ?? assessment.details?.kotoba ?? assessment.details?.aritmatika ?? "");
        setScoreBumpo(assessment.scoreBumpo ?? assessment.details?.bumpo ?? assessment.details?.rasio ?? "");
        setScoreKaiwa(assessment.scoreKaiwa ?? assessment.details?.kaiwa ?? assessment.details?.spasial ?? "");
        setScoreKanji(assessment.scoreKanji ?? assessment.details?.kanji ?? assessment.details?.logika ?? "");
        setGradingNotes(assessment.notes || "");
      } else {
        setGradingStatus("Belum Belajar");
        setScoreKotoba("");
        setScoreBumpo("");
        setScoreKaiwa("");
        setScoreKanji("");
        setGradingNotes("");
      }
    }
  }, [viewStudentId, selectedBabNumber, evalSelectedBabId, activeSubTab, assessmentSubject, chapterAssessments]);

  const hasInitializedBabRef = React.useRef({ studentId: "", subject: "" });

  React.useEffect(() => {
    // CRITICAL: Only auto-jump selectedBabNumber for students viewing their own portal (isSiswaOrAlumni)!
    // Sensei/Admin/Pengajar inspecting or grading students must NEVER have their active chapter hijacked!
    if (!isSiswaOrAlumni) return;

    if (viewStudentId) {
      if (hasInitializedBabRef.current.studentId === viewStudentId && hasInitializedBabRef.current.subject === assessmentSubject) {
        return;
      }
      const targetStudent = activeStudents.find(s => s.id === viewStudentId);
      if (targetStudent) {
        const studentAsss = (studentAssessmentsMap.get(viewStudentId) || []).filter((c: any) => isSameSubject(c.subject, assessmentSubject));
        const classObj = allClasses.find(c => (c.name || "").trim().toLowerCase() === (targetStudent.class || "").trim().toLowerCase());
        const activeChapterNumKey = assessmentSubject === "SSW" ? "activeMathChapterNum" : "activeChapterNum";
        const trulyActiveChapters = getClassChaptersList(targetStudent.class || "", assessmentSubject, false);
        const rawStudentChapter = targetStudent?.currentChapter;
        const studentChapter = getResolvedChapterNum(targetStudent.class || "", rawStudentChapter, assessmentSubject);

        const rawClassActiveChapter = classObj?.[activeChapterNumKey];
        const hasClassActive = rawClassActiveChapter !== undefined && rawClassActiveChapter !== null;
        const classActiveChapter = getResolvedChapterNum(targetStudent.class || "", rawClassActiveChapter, assessmentSubject);

        let nextTarget = 1;
        if (studentChapter) {
          nextTarget = studentChapter;
        } else if (hasClassActive) {
          nextTarget = classActiveChapter || 1;
        } else {
          nextTarget = trulyActiveChapters[0]?.number || 1;
          for (const ch of trulyActiveChapters) {
            const asses = studentAsss.find((c: any) => c.chapterNumber === ch.number);
            if (!asses || asses.status !== "Telah Dinilai") {
              nextTarget = ch.number;
              break;
            }
          }
        }
        setSelectedBabNumber(Number(nextTarget));
        hasInitializedBabRef.current = { studentId: viewStudentId, subject: assessmentSubject };
      }
    }
  }, [viewStudentId, isSiswaOrAlumni, assessmentSubject, activeStudents, studentAssessmentsMap, allClasses, getClassChaptersList]);


  const studentAttendanceMap = React.useMemo(() => {
    const map = new Map<string, any[]>();
    (attendanceRecords || []).forEach(r => {
      if (r.studentId) {
        const listId = map.get(r.studentId) || [];
        listId.push(r);
        map.set(r.studentId, listId);
      }
      if (r.studentName) {
        const listName = map.get(r.studentName) || [];
        listName.push(r);
        map.set(r.studentName, listName);
      }
    });
    return map;
  }, [attendanceRecords]);

  const isAlumniClass = React.useMemo(() => {
    if (!activeStudentClass) return false;
    if (activeStudentClass.toLowerCase().includes("alumni")) return true;
    const lmsClasses = allClasses;
    const foundClass = lmsClasses.find((c: any) => c.name.toLowerCase() === activeStudentClass.toLowerCase() || c.id.toLowerCase() === activeStudentClass.toLowerCase());
    return foundClass?.type === "alumni";
  }, [activeStudentClass, allClasses]);

  const currentChapterObj = React.useMemo(() => {
    if (!activeStudentClass) return null;
    const chapters = getClassChaptersList(activeStudentClass, assessmentSubject, true);
    return chapters.find((ch: any) => ch.number === selectedBabNumber);
  }, [activeStudentClass, assessmentSubject, selectedBabNumber, allClasses]);

    // Get real quizzes from systemState
  const realQuizzes = systemState?.lmsQuizzes || [];
  const quizQuestions = realQuizzes.filter(q => q.subject === "Bahasa Jepang" || q.subject === "SSW");
  
  const checkEssayAnswer = (studentAns?: string, correctKey?: string): boolean => {
    if (!studentAns || typeof studentAns !== "string" || !studentAns.trim()) return false;
    if (!correctKey || typeof correctKey !== "string" || !correctKey.trim()) return true;

    const cleanPunctuation = (s: string) =>
      s.trim().toLowerCase().replace(/[.,!?:;'"~`\s。、？！「」]/g, "");

    const cleanStudent = cleanPunctuation(studentAns);
    const cleanKey = cleanPunctuation(correctKey);

    if (!cleanStudent) return false;
    if (cleanStudent === cleanKey) return true;

    const keyVariants = correctKey
      .trim()
      .toLowerCase()
      .split(/[,;\n\/|]+/)
      .map(k => k.trim())
      .filter(Boolean);

    for (const variant of keyVariants) {
      const cleanVariant = cleanPunctuation(variant);
      if (!cleanVariant) continue;

      // 1. Exact match (ignoring whitespace & punctuation)
      if (cleanStudent === cleanVariant) return true;

      // 2. Student answer contains the key variant (e.g. sentence containing the target word)
      // Only valid if target key has length >= 2 and student answer is longer than key
      if (cleanVariant.length >= 2 && cleanStudent.length > cleanVariant.length && cleanStudent.includes(cleanVariant)) {
        return true;
      }

      // 3. Typo tolerance: strictly for long words (>= 5 chars) with at most 1 character typo
      if (cleanVariant.length >= 5 && Math.abs(cleanStudent.length - cleanVariant.length) <= 1) {
        let diff = 0;
        let i = 0, j = 0;
        while (i < cleanStudent.length && j < cleanVariant.length) {
          if (cleanStudent[i] !== cleanVariant[j]) {
            diff++;
            if (diff > 1) break;
            if (cleanStudent.length > cleanVariant.length) i++;
            else if (cleanStudent.length < cleanVariant.length) j++;
            else { i++; j++; }
          } else {
            i++;
            j++;
          }
        }
        if (diff <= 1) return true;
      }
    }

    return false;
  };

  // Group into practice packets (10 per packet)
  const practicePackets = [];
  for (let i = 0; i < realQuizzes.length; i += 10) {
    const packetQuestions = realQuizzes.slice(i, i + 10).map((q, idx) => ({
      id: q.id,
      q: q.question,
      options: q.options || [],
      correct: q.correctAnswerIndex || 0,
      correctAnswerEssay: q.correctAnswerEssay || q.correctAnswerText || "",
      desc: q.questionType === "essay" 
        ? (q.correctAnswerEssay ? `Kunci jawaban: ${q.correctAnswerEssay}` : "Soal essay untuk latihan mandiri.")
        : ("Jawaban yang benar adalah opsi ke-" + ((q.correctAnswerIndex || 0) + 1)),
      type: q.questionType || "pilihan_ganda"
    }));
    practicePackets.push({
      id: "paket-" + (i / 10 + 1),
      name: "Paket " + (i / 10 + 1) + " (" + packetQuestions.length + " Soal)",
      subject: "Campuran",
      questions: packetQuestions
    });
  }
  const handleOptionSelect = (index: number) => {
    if (isQuizSubmitted) return;
    setSelectedOption(index);
  };

  const handleQuizSubmit = () => {
    if (isQuizSubmitted) return;
    const currentQ = quizQuestions[quizIndex];
    if (currentQ?.questionType === "essay") {
      if (!essayAnswer.trim()) return;
      setIsQuizSubmitted(true);
      const isCorrect = checkEssayAnswer(essayAnswer, currentQ?.correctAnswerEssay || currentQ?.correctAnswerText);
      if (isCorrect) {
        setQuizScore(prev => prev + Math.round(100 / (quizQuestions.length || 1)));
      }
    } else {
      if (selectedOption === null) return;
      setIsQuizSubmitted(true);
      if (selectedOption === currentQ?.correctAnswerIndex) {
        setQuizScore(prev => prev + Math.round(100 / (quizQuestions.length || 1)));
      }
    }
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setEssayAnswer("");
    setIsQuizSubmitted(false);
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      setShowQuizResults(true);
    }
  };

  const handleResetQuiz = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setIsQuizSubmitted(false);
    setQuizScore(0);
    setShowQuizResults(false);
  };

  const isSiswa = currentUser?.role === "Siswa" || currentUser?.role === "Alumni";
  const isAlumniUser = currentUser?.role === "Alumni";
  const hasNoClass = (currentUser?.role === "Siswa" && (!activeStudentClass || activeStudentClass.trim() === "" || activeStudentClass === "Belum Diplot")) ||
                     (currentUser?.role === "Alumni" && (!activeStudentClass || activeStudentClass.trim() === "" || activeStudentClass === "Belum Diplot" || !isAlumniClass)) ||
                     (currentUser?.role === "Pengajar" && (!activeStudentClass || activeStudentClass.trim() === "" || activeStudentClass === "Belum Diplot" || activeStudentClass === "Belum ada kelas"));

  if (currentUser?.role === "Pengajar" && (!activeStudentClass || activeStudentClass.trim() === "" || activeStudentClass === "Belum Diplot" || activeStudentClass === "Belum ada kelas")) {
    return (
      <div className="space-y-6 py-6 text-left animate-fade-in">
        <div className="bg-gradient-to-r from-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-15">
            <Users className="h-44 w-44" />
          </div>
          <div className="relative max-w-xl space-y-2">
            <span className="bg-rose-500/30 text-rose-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-rose-500/20">
              Akses Terbatas: Pengajar Belum Diplot
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Halo, Sensei {currentUser?.name || "Agus Sensei"}!</h2>
            <p className="text-xs text-indigo-100 font-light leading-relaxed">
              Anda masuk dengan akun sebagai <strong>Sensei (Pengajar)</strong>, namun Anda belum diploting untuk mengampu kelas manapun oleh Admin SCI di database.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-2xl mx-auto my-6 shadow-xs space-y-5">
          <div className="mx-auto w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-150 text-2xl animate-bounce">
            ⚠️
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="font-display font-black text-slate-900 text-base">Belum Ada Sesi Kelas yang Diampu</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Karena Anda belum diplot untuk mengajar kelas tertentu di <strong>Admin Desk</strong>, saat ini Anda tidak dapat melihat materi harian, mengoreksi tugas, atau melakukan absensi kelas di LMS.
            </p>
          </div>
          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 text-left space-y-1.5 max-w-lg mx-auto">
            <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">💡 Apa yang harus dilakukan?</h5>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Silakan hubungi <strong>Admin LPK SCI / Sensei Utama</strong> untuk memploting Anda (<strong>{currentUser?.name || "Agus Sensei"}</strong>) sebagai pengajar di salah satu kelas aktif melalui panel <strong>Manajemen Pengajar / Manajemen Kelas</strong> di Admin Desk. Setelah diplot, akses LMS kelas Anda akan terbuka secara otomatis baik di desktop maupun mobile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminOrVvip && !selectedClassForLms && !currentUser?.assignedClass && !viewStudent) {
    return (
      <div className="space-y-6 py-6 text-left animate-fade-in">
        <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-15">
            <Users className="h-44 w-44" />
          </div>
          <div className="relative max-w-xl space-y-2">
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              Panel Akses E-Learning
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Pilih Kelas Belajar</h2>
            <p className="text-xs text-blue-100 font-light leading-relaxed">
              Sebagai Admin/VVIP, Anda dapat memantau progres materi dan kuis di berbagai kelas yang tersedia. Silakan pilih salah satu kelas di bawah ini.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allClasses.map((cls: any) => (
            <button
              key={cls.id || cls.name}
              onClick={() => setSelectedClassForLms(cls.name)}
              className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl transition shadow-sm text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${cls.isAlumni ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"}`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{cls.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  BAB {cls.activeChapterNum || 1} AKTIF
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {cls.isAlumni ? "Program Alumni" : "Program Diklat Reguler"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                  {cls.method || "Offline"}
                </span>
              </div>
            </button>
          ))}
          {allClasses.length === 0 && (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-500">Belum ada kelas yang terdaftar di sistem.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

    if (activeQuizChapterId !== null) {
    const targetClassForQuiz = (activeStudentClass || currentUser?.assignedClass || selectedClassFilter || "").trim().toLowerCase();
    const activeChaptersListForQuiz = getClassChaptersList(targetClassForQuiz, assessmentSubject, true);
    const chapter = activeChaptersListForQuiz.find(c => c.number === activeQuizChapterId) || {
      number: activeQuizChapterId,
      title: `Bab ${activeQuizChapterId}`
    };

    const lmsQuizzes = systemState?.lmsQuizzes || [];
    const isStaff = ["Admin", "Admin Super", "Admin Biasa", "VVIP", "Pengajar", "Sensei"].includes(currentUser?.role || "");

    // 1. Match quizzes by chapterNumber or chapterId (supporting number or string format)
    const allChapterQuizzes = lmsQuizzes.filter((q: any) => {
      const chNum = q.chapterNumber !== undefined ? Number(q.chapterNumber) : (q.chapterId !== undefined ? Number(q.chapterId) : NaN);
      return chNum === chapter.number || String(q.chapterNumber) === String(chapter.number) || String(q.chapterId) === String(chapter.number);
    });

    let filteredQuizzes = allChapterQuizzes.filter((q: any) => {
      const qClass = (q.targetClass || "Semua").trim().toLowerCase();
      const isMandiriQuiz = q.isMandiri === true || (assessmentSubject === "SSW" ? Number(chapter.number) > 25 : Number(chapter.number) > 35);
      const matchClass = (isStaff && (targetClassForQuiz === "" || targetClassForQuiz === "semua" || targetClassForQuiz === "semua kelas"))
        ? true
        : (isMandiriQuiz || qClass === "semua" || qClass === "semua kelas" || targetClassForQuiz === "" || qClass === targetClassForQuiz);
      if (!matchClass) return false;

      if (q.subject && assessmentSubject && !isSameSubject(q.subject, assessmentSubject)) {
        return false;
      }
      return true;
    });

    // Fallback: If filteredQuizzes is empty because of class/subject string mismatch, use all chapter quizzes
    if (filteredQuizzes.length === 0 && allChapterQuizzes.length > 0) {
      filteredQuizzes = allChapterQuizzes;
    }

    if (activeQuizSubTitle) {
      const targetSub = String(activeQuizSubTitle).trim().toLowerCase();
      const subFiltered = filteredQuizzes.filter((q: any) => {
        const qSub = (q.subTitle || "").trim().toLowerCase();
        return qSub === targetSub ||
          (targetSub === `kuis utama bab ${chapter.number}` && !qSub);
      });
      if (subFiltered.length > 0) {
        filteredQuizzes = subFiltered;
      }
    }

    if (filteredQuizzes.length === 0) {
      return (
        <div className="fixed inset-0 bg-slate-50 z-[9999] flex flex-col h-[100dvh] w-screen overflow-y-auto">
          <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm sticky top-0 z-50">
            <button onClick={() => { setActiveQuizChapterId(null); setActiveQuizSubTitle(null); }} className="flex items-center gap-2 p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold text-sm">Kembali</span>
            </button>
            <div className="flex-1 text-center font-bold text-sm px-4 truncate text-slate-800">
              Kuis Bab {chapter.number}: {chapter.title} {activeQuizSubTitle ? `• ${activeQuizSubTitle}` : ""}
            </div>
            <div className="w-24"></div>
          </div>
          <div className="flex-1 max-w-xl w-full mx-auto p-6 flex items-center justify-center">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-4 w-full">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                📝
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Belum Ada Soal Kuis</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Belum ada soal kuis yang terdaftar untuk Bab {chapter.number}{activeQuizSubTitle ? ` (${activeQuizSubTitle})` : ""}. Silakan buat soal kuis terlebih dahulu melalui menu materi.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => { setActiveQuizChapterId(null); setActiveQuizSubTitle(null); }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Kembali ke Materi
                </button>
                {isStaff && (
                  <button
                    onClick={() => {
                      setActiveQuizChapterId(null);
                      const existingForBab = (systemState?.lmsQuizzes || []).filter((q: any) => {
                        const chNum = q.chapterNumber !== undefined ? Number(q.chapterNumber) : (q.chapterId !== undefined ? Number(q.chapterId) : NaN);
                        return (chNum === chapter.number || String(q.chapterNumber) === String(chapter.number) || String(q.chapterId) === String(chapter.number)) &&
                          (!q.subject || isSameSubject(q.subject, assessmentSubject));
                      });

                      const newBlank = {
                        id: "QZ-" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
                        subject: assessmentSubject || "Bahasa Jepang",
                        chapterNumber: chapter.number,
                        chapterId: chapter.number,
                        questionType: "pilihan_ganda",
                        question: "",
                        options: ["", "", "", ""],
                        correctAnswerIndex: 0,
                        correctAnswerIndices: [0],
                        allowMultipleAnswers: false,
                        correctAnswerEssay: "",
                        correctAnswerText: "",
                        imageUrl: "",
                        videoUrl: "",
                        audioUrl: ""
                      };

                      if (existingForBab.length > 0) {
                        const loaded = existingForBab.map((q: any) => {
                          const cIndices = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
                            ? q.correctAnswerIndices.map(Number)
                            : (q.correctAnswerIndex !== undefined ? [Number(q.correctAnswerIndex)] : [0]);
                          return {
                            ...q,
                            chapterNumber: chapter.number,
                            options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["", "", "", ""],
                            correctAnswerIndex: cIndices[0] !== undefined ? cIndices[0] : 0,
                            correctAnswerIndices: cIndices,
                            allowMultipleAnswers: !!q.allowMultipleAnswers || q.questionType === "pilihan_ganda_kompleks" || cIndices.length > 1,
                          };
                        });
                        setQuizBatch([...loaded, newBlank]);
                        setSelectedBatchIndex(loaded.length);
                      } else {
                        setQuizBatch([newBlank]);
                        setSelectedBatchIndex(0);
                      }
                      setSelectedBabNumber(chapter.number);
                      setBatchChapterNumber(chapter.number);
                      setBatchSubject(assessmentSubject || "Bahasa Jepang");
                      setIsQuizFormOpen(true);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    + Buat Soal Kuis Sekarang
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Question randomization (Google Form style shuffle)
    const isShuffleConfigured = filteredQuizzes[0]?.shuffleQuestions !== false;
    const isShuffleActive = isQuizShuffleEnabled && isShuffleConfigured;

    const displayQuizzes = (() => {
      if (!isShuffleActive || filteredQuizzes.length <= 1) {
        return filteredQuizzes;
      }
      const userKey = currentUser?.studentId || matchingStudent?.id || currentUser?.id || currentUser?.username || 'student';
      const retakeKey = `${userKey}_ch${chapter.number}`;
      const studentAttempt = retakeAttemptsMap[retakeKey] || 0;
      const seedKey = isStaff
        ? `${currentUser?.id || 'staff'}_ch${chapter.number}_salt${shuffleSalt}`
        : `${userKey}_ch${chapter.number}${studentAttempt > 0 ? `_attempt_${studentAttempt}` : ''}_salt${shuffleSalt}`;
      return seededShuffle(filteredQuizzes, seedKey);
    })();

    const isRetakeActiveForChapter = filteredQuizzes.some(q => retakingQuizIds.includes(q.id));
    const cbtStarted = !!cbtStartTimes[`kuis_ch_${chapter.number}`];
    const hasStudentSubmitted = !isRetakeActiveForChapter && filteredQuizzes.length > 0 && filteredQuizzes.every(q => submittedQuizIds.includes(q.id));
    const isSubmitted = hasStudentSubmitted || simulatedSubmission;
    const isQuizDeadlinePassed = filteredQuizzes[0]?.deadline ? new Date() > new Date(filteredQuizzes[0].deadline) : false;
    
    // Auto-grading calculations for both MCQ & Essay
    const isQuizItemCorrect = (q: any) => {
      if (q.questionType === "essay") {
        const studentAns = studentQuizEssayAnswers[q.id];
        const key = q.correctAnswerEssay || q.correctAnswerText;
        return checkEssayAnswer(studentAns, key);
      }
      const rawAns = studentQuizAnswers[q.id];
      if (rawAns === undefined || rawAns === null) return false;
      const studentKeys: number[] = Array.isArray(rawAns) ? rawAns.map(Number) : [Number(rawAns)];
      const correctKeys: number[] = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
        ? q.correctAnswerIndices.map(Number)
        : [q.correctAnswerIndex !== undefined ? Number(q.correctAnswerIndex) : 0];

      if (studentKeys.length !== correctKeys.length) return false;
      const sortedStudent = [...studentKeys].sort((a, b) => a - b);
      const sortedCorrect = [...correctKeys].sort((a, b) => a - b);
      return sortedStudent.every((val, idx) => val === sortedCorrect[idx]);
    };

    const correctQuizzesList = filteredQuizzes.filter(isQuizItemCorrect);
    const totalScore = filteredQuizzes.length > 0 ? Math.round((correctQuizzesList.length / filteredQuizzes.length) * 100) : 0;
    const hasEssayQuizzes = filteredQuizzes.some(q => q.questionType === "essay");
    const hasMcqQuizzes = filteredQuizzes.some(q => q.questionType !== "essay");

    const quizDurationMinutes = (() => {
      const found = filteredQuizzes.find((q: any) => q.durationMinutes !== undefined && q.durationMinutes !== null && q.durationMinutes !== "" && Number(q.durationMinutes) > 0);
      if (found) return Number(found.durationMinutes);
      if (filteredQuizzes[0]?.durationMinutes && Number(filteredQuizzes[0].durationMinutes) > 0) return Number(filteredQuizzes[0].durationMinutes);
      return null;
    })();

    const cbtTimerKey = `kuis_ch_${chapter.number}${activeQuizSubTitle ? `_${encodeURIComponent(activeQuizSubTitle)}` : ""}`;
    const cbtEffectiveStartTime = (() => {
      if (isRetakeActiveForChapter) {
        return cbtStartTimes[cbtTimerKey] || Date.now();
      }
      const recorded = cbtStartTimes[cbtTimerKey] || cbtStartTimes[`kuis_ch_${chapter.number}`];
      return recorded || Date.now();
    })();

    const submitStudentAssessment = async (isAutoExpire = false) => {
      const allQuizIds = filteredQuizzes.map(q => q.id);
      const newSubmitted = [...submittedQuizIds];
      allQuizIds.forEach(id => {
        if (!newSubmitted.includes(id)) newSubmitted.push(id);
      });
      setSubmittedQuizIds(newSubmitted);
      setRetakingQuizIds(prev => prev.filter(id => !allQuizIds.includes(id)));
      try {
        const userKey = currentUser?.studentId || matchingStudent?.id || currentUser?.id || currentUser?.username || 'user';
        localStorage.setItem(`cbtSubmittedIds_${userKey}`, JSON.stringify(newSubmitted));
      } catch(e){}

      const resolvedStudent = matchingStudent || (activeStudents || []).find((s: any) => {
        const cId = (currentUser?.studentId || currentUser?.id || "").trim().toLowerCase();
        const cEmail = (currentUser?.email || "").trim().toLowerCase();
        const cUsername = (currentUser?.username || "").trim().toLowerCase();
        const cName = (currentUser?.name || "").trim().toLowerCase();
        const sId = (s.id || "").trim().toLowerCase();
        const sEmail = (s.email || "").trim().toLowerCase();
        const sName = (s.name || "").trim().toLowerCase();
        return (cId && sId === cId) ||
               (cEmail && (sEmail === cEmail || sId === cEmail)) ||
               (cUsername && (sEmail === cUsername || sId === cUsername)) ||
               (cName && sName === cName);
      });

      const sId = resolvedStudent?.id || currentUser?.studentId || currentUser?.id || "SIS-001";
      const sName = resolvedStudent?.name || currentUser?.name || "Siswa";

      const submissionDetails = filteredQuizzes.map(q => {
        const rawChoice = studentQuizAnswers[q.id];
        const studentChoice = Array.isArray(rawChoice)
          ? rawChoice.map(Number)
          : (rawChoice !== undefined && rawChoice !== null ? Number(rawChoice) : undefined);
        const studentEssay = (studentQuizEssayAnswers[q.id] || "").trim();
        const isEssay = q.questionType === "essay";
        const isCorrect = isQuizItemCorrect(q);
        const cIndices = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
          ? q.correctAnswerIndices.map(Number)
          : [q.correctAnswerIndex !== undefined ? Number(q.correctAnswerIndex) : 0];

        return {
          quizId: q.id,
          question: q.question,
          questionType: q.questionType || (isEssay ? "essay" : (cIndices.length > 1 ? "pilihan_ganda_kompleks" : "pilihan_ganda")),
          options: q.options || [],
          correctAnswerIndex: cIndices[0] !== undefined ? cIndices[0] : (q.correctAnswerIndex || 0),
          correctAnswerIndices: cIndices,
          allowMultipleAnswers: !!q.allowMultipleAnswers || q.questionType === "pilihan_ganda_kompleks" || cIndices.length > 1,
          correctAnswerEssay: q.correctAnswerEssay || q.correctAnswerText || "",
          studentChoice,
          studentEssay,
          isCorrect,
          points: q.points || 10,
          explanation: q.explanation || ""
        };
      });

      const assessPayload = {
        studentId: sId,
        studentName: sName,
        studentEmail: currentUser?.email || resolvedStudent?.email || "",
        chapterNumber: chapter.number,
        title: chapter.title || `Bab ${chapter.number}`,
        subTitle: activeQuizSubTitle || filteredQuizzes[0]?.subTitle || "",
        lessonId: filteredQuizzes[0]?.lessonId || "",
        targetClass: filteredQuizzes[0]?.targetClass || currentUser?.assignedClass || resolvedStudent?.class || "",
        status: totalScore >= 75 ? "Telah Dinilai" : "Selesai Belajar",
        score: totalScore,
        subject: assessmentSubject || "Bahasa Jepang",
        assessedBy: "Sistem CBT (Otomatis)",
        notes: `Kuis Bab ${chapter.number}${activeQuizSubTitle ? ` (${activeQuizSubTitle})` : ""}: ${correctQuizzesList.length}/${filteredQuizzes.length} benar (Akurasi: ${totalScore}%)${isAutoExpire ? " [Waktu Habis Auto-Submit]" : ""}`,
        studentAnswers: studentQuizAnswers,
        essayAnswers: studentQuizEssayAnswers,
        submittedAt: new Date().toISOString(),
        details: {
          quizDetails: submissionDetails,
          studentQuizAnswers: studentQuizAnswers,
          studentQuizEssayAnswers: studentQuizEssayAnswers,
          submittedAt: new Date().toISOString()
        }
      };

      if (onUpdateState) {
        await onUpdateState("chapterAssessments", "update", assessPayload);
      } else {
        try {
          await fetch("/api/state/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dataType: "chapterAssessments",
              action: "update",
              payload: assessPayload
            })
          });
        } catch (e) {
          console.error("Direct fetch error:", e);
        }
      }
    };

    const handleTimerExpire = () => {
      if (!isSubmitted) {
        if (isStaff) {
          setSimulatedSubmission(true);
        } else {
          submitStudentAssessment(true);
        }
      }
    };

    const answeredQuizzesCount = filteredQuizzes.filter(q => {
      if (q.questionType === "essay") {
        return !!(studentQuizEssayAnswers[q.id]?.trim());
      }
      const ans = studentQuizAnswers[q.id];
      if (ans === undefined || ans === null) return false;
      if (Array.isArray(ans)) return ans.length > 0;
      return true;
    }).length;

    return (
      <div className="fixed inset-0 bg-slate-50 z-[9999] flex flex-col h-[100dvh] w-screen overflow-y-auto">
        {/* Sticky Header with Timer on top */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-sm sticky top-0 z-50">
           <button onClick={() => { setActiveQuizChapterId(null); setActiveQuizSubTitle(null); setSimulatedSubmission(false); }} className="flex items-center gap-1.5 sm:gap-2 p-2 hover:bg-slate-100 text-slate-700 rounded-xl transition cursor-pointer shrink-0">
             <ArrowLeft className="w-5 h-5" />
             <span className="font-bold text-xs sm:text-sm">Kembali</span>
           </button>

           <div className="flex-1 text-center font-bold text-xs sm:text-sm px-2 sm:px-4 truncate text-slate-800">
             Kuis Bab {chapter.number}: {chapter.title} {activeQuizSubTitle ? `• ${activeQuizSubTitle}` : ""}
           </div>

           <div className="flex items-center gap-2 shrink-0">
             {/* Timer Compact in Top Header */}
             {quizDurationMinutes && !isSubmitted && (
               <CBTTimer 
                 key={`header_${cbtEffectiveStartTime}`}
                 startTime={cbtEffectiveStartTime} 
                 durationMinutes={quizDurationMinutes} 
                 onExpire={handleTimerExpire}
                 compact={true}
               />
             )}
             <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 sm:px-3 py-1 rounded-full border border-slate-200">
               {filteredQuizzes.length} Soal
             </span>
           </div>
        </div>

        {/* Staff Toolbar (Preview / Simulasi / Acak Soal) */}
        {isStaff && (
          <div className="bg-indigo-900 text-white px-4 py-2.5 shadow-sm text-xs flex flex-wrap items-center justify-between gap-3 sticky top-16 z-40">
            <div className="flex items-center gap-2 font-medium">
              <span className="bg-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-indigo-100">
                Mode Pratinjau Pengajar
              </span>
              <span className="text-indigo-200 hidden sm:inline">•</span>
              <span className="text-indigo-100 text-[11px] hidden sm:inline">
                Kelas: <strong>{filteredQuizzes[0]?.targetClass || "Semua"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAdminAnswerKeys(!showAdminAnswerKeys)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  showAdminAnswerKeys ? "bg-amber-400 text-amber-950 shadow-sm" : "bg-indigo-800/80 hover:bg-indigo-800 text-indigo-100"
                }`}
              >
                <span>{showAdminAnswerKeys ? "👁️ Sembunyikan Kunci" : "👁️ Tampilkan Kunci"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuizShuffleEnabled(!isQuizShuffleEnabled)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  isQuizShuffleEnabled ? "bg-emerald-500 text-white shadow-sm" : "bg-indigo-800/80 hover:bg-indigo-800 text-indigo-200"
                }`}
                title="Aktifkan/nonaktifkan fitur acak urutan soal seperti Google Form"
              >
                <span>🔀 Acak Soal: {isQuizShuffleEnabled ? "Aktif" : "Nonaktif"}</span>
              </button>

              {isQuizShuffleEnabled && (
                <button
                  type="button"
                  onClick={() => setShuffleSalt(s => s + 1)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-800 hover:bg-indigo-700 text-indigo-100 transition cursor-pointer flex items-center gap-1"
                  title="Kocok ulang urutan soal untuk melihat variasi tampilan soal"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Kocok Urutan</span>
                </button>
              )}

              {isSubmitted ? (
                <button
                  type="button"
                  onClick={() => setSimulatedSubmission(false)}
                  className="px-3 py-1 rounded-lg text-[11px] font-bold bg-white text-indigo-900 hover:bg-indigo-50 transition cursor-pointer"
                >
                  🔄 Ulangi Simulasi
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSimulatedSubmission(true)}
                  className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-white transition cursor-pointer shadow-xs"
                >
                  🧪 Uji Nilai Otomatis
                </button>
              )}
            </div>
          </div>
        )}

        {/* WAKTU PENGERJAAN KUIS DILETAKKAN DI ATAS SAAT MENGERJAKAN */}
        {!isSubmitted && (
          <div className={`bg-gradient-to-r from-rose-50/95 via-purple-50/95 to-indigo-50/95 backdrop-blur-md border-b border-rose-200/90 px-3 sm:px-6 py-2.5 sticky ${isStaff ? "top-[6.5rem]" : "top-16"} z-30 shadow-xs transition-all`}>
            <div className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg animate-pulse">⏱️</span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-900 block leading-tight">
                      Waktu Pengerjaan Kuis
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {quizDurationMinutes ? `Batas waktu: ${quizDurationMinutes} menit` : "Kuis tanpa batasan durasi"}
                    </span>
                  </div>
                </div>

                {quizDurationMinutes ? (
                  <CBTTimer 
                    key={`banner_${cbtEffectiveStartTime}`}
                    startTime={cbtEffectiveStartTime} 
                    durationMinutes={quizDurationMinutes} 
                    onExpire={handleTimerExpire}
                  />
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-xl border border-emerald-300 flex items-center gap-1 font-mono">
                    <span>✓ Bebas Waktu</span>
                  </span>
                )}
              </div>

              {/* Progress counter & progress bar */}
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-rose-200/60">
                <span className="text-[11px] sm:text-xs">
                  Progres: <strong className="text-purple-700 font-black">{answeredQuizzesCount}</strong> / {filteredQuizzes.length} Soal
                </span>
                <div className="w-24 sm:w-36 bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300/50">
                  <div 
                    className="bg-purple-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${filteredQuizzes.length > 0 ? Math.round((answeredQuizzesCount / filteredQuizzes.length) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-700">
                  {filteredQuizzes.length > 0 ? Math.round((answeredQuizzesCount / filteredQuizzes.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Student Banner when shuffle is active */}
        {!isStaff && isShuffleActive && (
          <div className="bg-indigo-50/80 border-b border-indigo-100 px-4 py-2 text-center text-xs text-indigo-800 font-medium flex items-center justify-center gap-2">
            <span>🔀</span>
            <span>Urutan soal diacak otomatis untuk setiap siswa seperti Google Form.</span>
          </div>
        )}
        
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-24">
           {isSubmitted ? (
             <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 mb-8 text-center shadow-sm space-y-5">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full text-2xl font-bold">
                  🎉
                </div>
                <div>
                  <h3 className="text-emerald-900 font-extrabold text-2xl">Kuis Selesai</h3>
                  <p className="text-emerald-700 text-sm mt-1">
                    {simulatedSubmission 
                      ? "Hasil uji coba penilaian simulasi kuis telah dihitung secara otomatis." 
                      : "Anda telah menyelesaikan kuis ini. Hasil penilaian otomatis telah dihitung."}
                  </p>
                </div>
                
                <div className="inline-block bg-white border border-emerald-200 rounded-3xl px-10 py-6 shadow-sm">
                   <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1.5">Total Nilai Kuis (Otomatis)</p>
                   <p className="text-5xl font-black text-slate-800">{totalScore} <span className="text-lg font-bold text-slate-400">/ 100</span></p>
                   <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                     <span>Benar: <strong className="text-emerald-600">{correctQuizzesList.length}</strong> / {filteredQuizzes.length} Soal</span>
                     <span>•</span>
                     <span>Akurasi: <strong>{totalScore}%</strong></span>
                   </div>
                </div>

                {hasEssayQuizzes && (
                  <div>
                    <p className="text-xs text-emerald-800 bg-emerald-100/70 p-3 rounded-2xl inline-block font-medium border border-emerald-200 max-w-xl mx-auto">
                      💡 Soal essay telah dinilai secara otomatis sesuai dengan kunci jawaban yang ditentukan.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => { setActiveQuizChapterId(null); setSimulatedSubmission(false); }}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Kembali ke Materi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isStaff) {
                        setSimulatedSubmission(false);
                      } else {
                        handleRetakeQuiz(chapter.number, filteredQuizzes.map(q => q.id), activeQuizSubTitle);
                      }
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>🔄 {isStaff ? "Ulangi Uji Coba Kuis" : "Kerjakan Ulang Kuis (Buka Soal)"}</span>
                  </button>
                </div>
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                  <h3 className="font-bold text-slate-800 text-base">Informasi Pengerjaan Kuis</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>Jumlah: <strong className="text-slate-700">{filteredQuizzes.length} Soal</strong></span>
                    <span>•</span>
                    <span>Format: <strong className="text-slate-700">{hasMcqQuizzes && hasEssayQuizzes ? "Pilihan Ganda & Essay" : hasEssayQuizzes ? "Essay" : "Pilihan Ganda"}</strong></span>
                    {isShuffleActive && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">🔀 Soal Diacak</span>
                      </>
                    )}
                  </div>
               </div>
               {quizDurationMinutes ? (
                 <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-2xl flex items-center gap-3">
                   <span className="text-xs font-bold text-rose-800">⏱️ Batas Durasi:</span>
                   <span className="text-xs font-black text-rose-900 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-2xs font-mono">
                     {quizDurationMinutes} Menit
                   </span>
                   <span className="text-[11px] text-rose-700 font-medium hidden sm:inline">
                     (Timer waktu aktif disematkan di bagian atas layar)
                   </span>
                 </div>
               ) : (
                 <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600 font-medium flex items-center gap-1.5">
                   <span>⏱️</span>
                   <span>Tanpa Batas Waktu</span>
                 </div>
               )}
             </div>
           )}

           {/* Header Pembahasan & Tinjauan Soal saat Kuis Selesai */}
           {isSubmitted && (
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
               <div>
                 <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                   <span>📝 Pembahasan & Tinjauan Soal</span>
                   <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                     {displayQuizzes.length} Soal
                   </span>
                 </h4>
                 <p className="text-xs text-slate-500 mt-0.5">
                   Periksa jawaban yang telah dikerjakan beserta kunci pembahasan di bawah ini.
                 </p>
               </div>
               {!isStaff && (
                 <button
                   type="button"
                   onClick={() => handleRetakeQuiz(chapter.number, filteredQuizzes.map(q => q.id), activeQuizSubTitle)}
                   className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer underline self-start sm:self-auto"
                 >
                   <span>Ingin mengulang kuis? Klik Kerjakan Ulang</span>
                 </button>
               )}
             </div>
           )}

           <div className="space-y-6">
              {displayQuizzes.map((quiz, idx) => {
                  const isQSubmitted = submittedQuizIds.includes(quiz.id) || simulatedSubmission;
                  const selectedAns = studentQuizAnswers[quiz.id];
                  const essayAns = studentQuizEssayAnswers[quiz.id] || "";
                  const isCorrect = isQuizItemCorrect(quiz);
                  const keyEssay = quiz.correctAnswerEssay || quiz.correctAnswerText || "";

                  const correctKeys: number[] = Array.isArray(quiz.correctAnswerIndices) && quiz.correctAnswerIndices.length > 0
                    ? quiz.correctAnswerIndices.map(Number)
                    : [quiz.correctAnswerIndex !== undefined ? Number(quiz.correctAnswerIndex) : 0];
                  const isMultiChoice = correctKeys.length > 1 || !!quiz.allowMultipleAnswers || quiz.questionType === "pilihan_ganda_kompleks";
                  const studentChoices: number[] = Array.isArray(selectedAns)
                    ? selectedAns.map(Number)
                    : (selectedAns !== undefined && selectedAns !== null ? [Number(selectedAns)] : []);

                  return (
                    <div key={quiz.id} className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm relative">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
                            Soal {idx + 1} <span className="text-slate-400 font-normal">dari {displayQuizzes.length}</span>
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-md uppercase">
                            {quiz.questionType === "essay" ? "Essay" : isMultiChoice ? "☑️ Pilihan Ganda Kompleks (Bisa >1 Jawaban)" : "🔘 Pilihan Ganda"}
                          </span>
                        </div>
                        {isStaff && showAdminAnswerKeys && (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            {quiz.questionType === "essay" 
                              ? `🔑 Kunci: ${keyEssay || "(Belum ada)"}` 
                              : `🔑 Kunci: Opsi ${correctKeys.map(k => String.fromCharCode(65 + k)).join(", ")}`}
                          </span>
                        )}
                      </div>
                      
                      {quiz.imageUrl && (
                        <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={quiz.imageUrl} alt="Gambar Soal Kuis" className="w-full h-auto max-h-72 object-contain" />
                        </div>
                      )}
                      
                      <div className="text-base font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {quiz.question}
                      </div>

                      {quiz.questionType === "essay" ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            rows={3}
                            disabled={isQSubmitted || isQuizDeadlinePassed}
                            placeholder={isQuizDeadlinePassed && !isQSubmitted ? "Batas waktu pengerjaan telah berakhir." : "Ketik jawaban Anda di sini..."}
                            value={essayAns}
                            onChange={(e) => setStudentQuizEssayAnswers({...studentQuizEssayAnswers, [quiz.id]: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 focus:outline-indigo-500 focus:bg-white transition disabled:opacity-75"
                          />
                          
                          {/* Essay Feedback when Submitted */}
                          {isQSubmitted && (
                            <div className={`mt-3 p-4 rounded-2xl text-xs space-y-2 border ${
                              isCorrect ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}>
                              <div className="flex items-center justify-between font-bold">
                                <span>{isCorrect ? "🎉 Jawaban Essay Benar!" : "❌ Jawaban Essay Kurang Tepat"}</span>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                  isCorrect ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                                }`}>
                                  {isCorrect ? "Poin Penuh (100%)" : "Poin 0%"}
                                </span>
                              </div>
                              <div className="space-y-1.5 bg-white/90 p-3.5 rounded-xl border border-black/5 text-slate-700">
                                <div>
                                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Jawaban Anda:</span>
                                  <p className="font-semibold text-xs text-slate-800 mt-0.5">{essayAns || "(Kosong / Tidak diisi)"}</p>
                                </div>
                                {keyEssay ? (
                                  <div className="pt-2 border-t border-slate-100">
                                    <span className="font-bold text-[10px] text-emerald-700 uppercase tracking-wider">Kunci Jawaban yang Benar:</span>
                                    <p className="font-bold text-xs text-emerald-900 mt-0.5">{keyEssay}</p>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                                    (Tidak ada kunci jawaban spesifik yang ditentukan).
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          {isMultiChoice && !isQSubmitted && (
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl flex items-center gap-1.5 self-start">
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Pilihan Ganda Kompleks: Anda dapat memilih lebih dari 1 jawaban yang benar (centang semua yang sesuai).</span>
                            </span>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(quiz.options || []).map((opt: string, oIdx: number) => {
                              const isSelected = isMultiChoice ? studentChoices.includes(oIdx) : selectedAns === oIdx;
                              const isCorrectOpt = correctKeys.includes(oIdx);
                              let btnStyle = "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50";
                              if (isQSubmitted) {
                                if (isCorrectOpt) {
                                  btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                                } else if (isSelected) {
                                  btnStyle = "bg-rose-50 border-rose-300 text-rose-800 font-medium";
                                } else {
                                  btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                                }
                              } else if (isSelected) {
                                btnStyle = "bg-indigo-50 border-indigo-400 text-indigo-700 font-bold shadow-xs ring-1 ring-indigo-300";
                              }

                              const handleClickOption = () => {
                                if (isQSubmitted || isQuizDeadlinePassed) return;
                                if (isMultiChoice) {
                                  let nextChoices: number[];
                                  if (studentChoices.includes(oIdx)) {
                                    nextChoices = studentChoices.filter(i => i !== oIdx);
                                  } else {
                                    nextChoices = [...studentChoices, oIdx].sort((a, b) => a - b);
                                  }
                                  setStudentQuizAnswers({ ...studentQuizAnswers, [quiz.id]: nextChoices });
                                } else {
                                  setStudentQuizAnswers({ ...studentQuizAnswers, [quiz.id]: oIdx });
                                }
                              };

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  disabled={isQSubmitted || isQuizDeadlinePassed}
                                  onClick={handleClickOption}
                                  className={`px-4 py-3.5 rounded-2xl text-left text-sm transition flex items-start gap-3 cursor-pointer ${btnStyle}`}
                                >
                                  <span className={`font-black text-[10px] px-2.5 py-1 rounded-lg uppercase shrink-0 mt-0.5 border flex items-center justify-center ${
                                    isSelected 
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs" 
                                      : "bg-slate-100 border-slate-200 text-slate-600"
                                  }`}>
                                    {isMultiChoice ? (isSelected ? "✓ " : " ") : ""}{String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="leading-snug pt-0.5 flex-1">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {isQSubmitted && (
                        <div className="space-y-2 mt-2">
                          {quiz.questionType !== "essay" && (
                            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                              isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}>
                              <span>
                                {isCorrect 
                                  ? "🎉 Jawaban Benar!" 
                                  : `❌ Kurang Tepat. Jawaban yang benar adalah Opsi ${correctKeys.map(k => String.fromCharCode(65 + k)).join(", ")}.`}
                              </span>
                            </div>
                          )}

                          {quiz.explanation ? (
                            <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs space-y-1.5 shadow-2xs text-left">
                              <div className="flex items-center gap-2 font-black text-amber-900">
                                <span className="text-base">💡</span>
                                <span className="uppercase tracking-wider text-[11px]">Pembahasan & Penjelasan Jawaban:</span>
                              </div>
                              <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap pl-6 text-xs sm:text-sm">
                                {quiz.explanation}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isSubmitted && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-12">
                    <div className="text-xs text-slate-500 font-medium">
                      {isStaff ? (
                        <span>💡 Mode Simulasi Pengajar: Anda dapat menguji penilaian otomatis atau melihat tampilan soal layaknya siswa.</span>
                      ) : (
                        <span>Pastikan semua pertanyaan telah dijawab sebelum mengirimkan kuis.</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => {
                            const allQuizIds = filteredQuizzes.map(q => q.id);
                            const updatedAnswers = { ...studentQuizAnswers };
                            const updatedEssayAnswers = { ...studentQuizEssayAnswers };
                            allQuizIds.forEach(id => {
                              delete updatedAnswers[id];
                              delete updatedEssayAnswers[id];
                            });
                            setStudentQuizAnswers(updatedAnswers);
                            setStudentQuizEssayAnswers(updatedEssayAnswers);
                            setSimulatedSubmission(false);
                          }}
                          className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Reset Jawaban
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (isStaff) {
                            setSimulatedSubmission(true);
                          } else {
                            submitStudentAssessment(false);
                          }
                        }}
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-md cursor-pointer transition active:scale-95"
                      >
                        {isStaff ? "🧪 Uji Coba Penilaian (Simulasi Kirim)" : "Finish Attempt (Kirim Jawaban)"}
                      </button>
                    </div>
                  </div>
                )}
             </div>
        </div>
      </div>
    );
  }

  if (pdfViewerUrl) {
    const resolvedUrl = blobPdfUrl || (pdfViewerUrl.startsWith("/") ? window.location.origin + pdfViewerUrl : pdfViewerUrl);
    const embedUrl = useGoogleDocs && !pdfViewerUrl.startsWith("data:")
      ? `https://docs.google.com/gview?url=${encodeURIComponent(resolvedUrl)}&embedded=true`
      : resolvedUrl;

    return createPortal(
      <div className="fixed inset-0 bg-white z-[100000] flex flex-col h-[100dvh] w-screen">
        <div className="h-14 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-900 text-white flex items-center justify-between px-4 shrink-0 shadow-md relative z-20">
           <button onClick={() => { 
             setPdfViewerUrl(null); 
             if (window.history.state && window.history.state.pdfViewerOpen) {
               window.history.back();
             }
           }} className="flex items-center gap-2 p-2 hover:bg-white/15 rounded-lg transition cursor-pointer font-bold text-sm">
             <ArrowLeft className="w-5 h-5" />
             <span>Kembali</span>
           </button>
           <div className="font-bold text-sm px-4 truncate max-w-[40%] sm:max-w-none">Penampil Dokumen PDF</div>
           <div className="flex items-center gap-2">
             <button
               onClick={() => downloadFile(pdfViewerUrl, "dokumen_lms.pdf")}
               className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
             >
               <Download className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Unduh PDF</span>
             </button>
             <a
               href={resolvedUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
             >
               <ExternalLink className="w-3.5 h-3.5" />
               <span>Tab Baru</span>
             </a>
           </div>
        </div>
        
        {/* Helper bar & view selector */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 shrink-0 z-10">
           <div className="flex items-center gap-1.5 min-w-0">
             <span className="text-base shrink-0">💡</span>
             <div className="flex flex-col min-w-0">
               <span className="truncate">
                 {pdfViewerUrl.startsWith("data:")
                   ? "Dokumen terenkripsi lokal (Base64). Direndisikan langsung menggunakan engine browser."
                   : `Mode aktif: ${useGoogleDocs ? "Google Docs Viewer" : "Penampil Langsung Browser (Disarankan)"}`}
               </span>
               {useGoogleDocs && !pdfViewerUrl.startsWith("data:") && (
                 <span className="text-[10px] text-amber-700 mt-0.5 font-semibold leading-tight">
                   ⚠️ Google Docs Viewer terkadang gagal memuat file (halaman kosong). Jika kosong, ganti ke <strong>Penampil Langsung</strong> atau klik <strong>Tab Baru / Unduh PDF</strong>.
                 </span>
               )}
             </div>
           </div>
           
           {!pdfViewerUrl.startsWith("data:") && (
             <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
               <button
                 onClick={() => setUseGoogleDocs(!useGoogleDocs)}
                 className="font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-md shadow-2xs hover:bg-emerald-50 transition cursor-pointer text-[11px] flex items-center gap-1"
               >
                 <RefreshCw className="w-3 h-3" />
                 Ganti ke {useGoogleDocs ? "Penampil Langsung" : "Google Docs Viewer"}
               </button>
             </div>
           )}
        </div>

        <div className="flex-1 w-full bg-slate-100 overflow-hidden relative">
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-0 absolute inset-0 bg-white" 
            title="PDF Document Viewer"
            key={useGoogleDocs ? "gdocs" : "native"}
          />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="space-y-6 py-6 relative">
      {toastMessage && (
        <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
      {!hideWelcomeBanner && (
      <div className={`rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden transition-all duration-350 ${
        isAlumniClass 
          ? "bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-950 border border-emerald-600/30 shadow-emerald-900/10" 
          : "bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900"
      }`}>
        <div className="absolute right-0 top-0 opacity-15">
          <BookOpen className="h-44 w-44" />
        </div>
        <div className="relative max-w-xl space-y-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            isAlumniClass ? "bg-emerald-500/30 text-emerald-200" : "bg-blue-500/30 text-blue-200"
          }`}>
            PORTAL LMS E-BENKYOULPK SC {isAlumniClass ? "(PROGRAM ALUMNI)" : ""}
          </span>
          {isAdminOrVvip && selectedClassForLms && !viewStudent && (
            <button
              onClick={() => setSelectedClassForLms(null)}
              className="absolute top-0 right-0 bg-white/20 hover:bg-white/30 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-2xl backdrop-blur-md transition border-l border-b border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Ganti Kelas Pantauan
            </button>
          )}

          <h2 className="font-display text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
            Halo, {currentUser?.name}!
            {(() => {
              const uClass = activeStudentClass || "";
              if (!uClass || uClass === "Semua" || uClass === "Semua Kelas") {
                return (
                  <span className="text-[10px] uppercase font-black tracking-widest bg-amber-500/35 text-white px-3 py-1 rounded-full border border-amber-400">
                    Semua Kelas (Monitoring)
                  </span>
                );
              }
              const uClassObj = allClasses.find(
                (c) => c.id.toLowerCase() === uClass.toLowerCase() || c.name.toLowerCase() === uClass.toLowerCase()
              );
              let displaySenseiName = "Belum diplot";
              
              // Prioritize fetching the actual Sensei user assigned to this class to ensure name is synced with Manajemen Akun & Sensei
              const senseiUser = systemState?.users?.find(
                (u: any) => u.role === "Pengajar" && (u.assignedClass || "").toLowerCase() === uClass.toLowerCase()
              );

              if (senseiUser?.name) {
                displaySenseiName = senseiUser.name;
              } else if (isSiswaOrAlumni && matchingStudent?.sensei) {
                displaySenseiName = matchingStudent.sensei;
              } else {
                const studentInClassWithSensei = (activeStudents || []).find(
                  (s: any) => (s.class || "").trim().toLowerCase() === uClass.toLowerCase() && s.sensei
                );
                if (studentInClassWithSensei?.sensei) {
                  displaySenseiName = studentInClassWithSensei.sensei;
                }
              }
              return (
                <span className="flex flex-wrap items-center gap-1.5 mt-1 lg:mt-0">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border leading-none ${
                    isAlumniClass 
                      ? "bg-emerald-500/35 text-white border-emerald-400" 
                      : "bg-blue-500/35 text-white border-blue-400"
                  }`}>
                    Plotting: {uClass}
                  </span>
                  <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-rose-500/35 text-white border border-rose-400 leading-none">
                    👨‍🏫 Sensei: {displaySenseiName}
                  </span>
                  {uClassObj?.period && (
                    <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-violet-500/35 text-white border border-violet-400 leading-none">
                      📅 Periode: {uClassObj.period}
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-slate-500/35 text-white border border-slate-400 leading-none">
                    📍 Metode: {uClassObj?.method || "Offline"}
                  </span>
                </span>
              );
            })()}
          </h2>
        </div>
      </div>
      )}

      {initialSubTab !== "dokumen" && (
      <div className="w-full mb-6">
        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2 font-mono text-left">Pilih Mata Pelajaran (Subject):</p>
        <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-2.5 rounded-3xl border border-slate-200/80">
          <button
            onClick={() => {
              setAssessmentSubject("Bahasa Jepang");
              setLessonSubject("Bahasa Jepang");
              setProgressSubject("Bahasa Jepang");
              setSelectedBabNumber(1);
            }}
            className={`flex items-center justify-start gap-4 py-3.5 px-5 rounded-2xl border text-sm transition-all duration-200 active:scale-95 cursor-pointer text-left ${
              assessmentSubject === "Bahasa Jepang"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black"
                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
            }`}
          >
            <span className="text-2xl filter drop-shadow-xs shrink-0">🇯🇵</span>
            <div className="leading-none flex-1">
              <span className="block text-xs font-black uppercase tracking-tight">Bahasa Jepang</span>
              <span className="block text-[8px] font-mono mt-1 opacity-80 uppercase tracking-widest">Materi &amp; 25 Bab Tata Bahasa</span>
            </div>
            {assessmentSubject === "Bahasa Jepang" && (
              <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
            )}
          </button>

          <button
            onClick={() => {
              setAssessmentSubject("SSW");
              setLessonSubject("SSW");
              setProgressSubject("SSW");
              setSelectedBabNumber(1);
            }}
            className={`flex items-center justify-start gap-4 py-3.5 px-5 rounded-2xl border text-sm transition-all duration-200 active:scale-95 cursor-pointer text-left ${
              assessmentSubject === "SSW"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black"
                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
            }`}
          >
            <span className="text-2xl filter drop-shadow-xs shrink-0">📐</span>
            <div className="leading-none flex-1">
              <span className="block text-xs font-black uppercase tracking-tight">Matematika (SSW)</span>
              <span className="block text-[8px] font-mono mt-1 opacity-80 uppercase tracking-widest">Materi &amp; 25 Bab Berhitung</span>
            </div>
            {assessmentSubject === "SSW" && (
              <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
            )}
          </button>
        </div>
      </div>
      )}

      {/* Segment tabs */}
      {initialSubTab !== "dokumen" && (
      <div className="w-full">
        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2 font-mono text-left">Pilih Menu Pembelajaran:</p>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
          {[
            {
              id: "bab",
              name: `Materi & ${currentClassMaxBab} Bab`,
              desc: "Kurikulum Terstruktur",
              ic: GraduationCap,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              actColor: "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15",
              isActive: activeSubTab === "bab",
              onClick: () => setActiveSubTab("bab")
            },
            {
              id: "absen",
              name: "Absen Harian",
              desc: "Presensi Real-time",
              ic: Calendar,
              color: "text-amber-600",
              bg: "bg-amber-50",
              actColor: "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-600/15",
              isActive: activeSubTab === "absen",
              onClick: () => setActiveSubTab("absen")
            },
            ...(currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP" ? [
              {
                id: "progress",
                name: "Progress & Nilai",
                desc: "Rekap Evaluasi",
                ic: Award,
                color: "text-rose-600",
                bg: "bg-rose-50",
                actColor: "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/15",
                isActive: activeSubTab === "progress" && progressTabMode !== "sikap",
                onClick: () => {
                  setActiveSubTab("progress");
                  if (progressTabMode === "sikap") {
                    setProgressTabMode("penilaian_bab");
                  }
                }
              },
              {
                id: "sikap",
                name: "Kelayakan Order Job",
                desc: "Evaluasi 5S & Sikap",
                ic: Star,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                actColor: "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/15",
                isActive: activeSubTab === "progress" && progressTabMode === "sikap",
                onClick: () => {
                  setActiveSubTab("progress");
                  setProgressTabMode("sikap");
                }
              }
            ] : [])
          ].map((tab) => {
            const Icon = tab.ic;
            const isActive = tab.isActive;

            return (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? tab.actColor
                    : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <span className={`p-2 rounded-lg shrink-0 transition ${isActive ? "bg-white/20 text-white" : tab.bg + " " + tab.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 leading-none select-none">
                  <span className={`block text-[10px] font-black uppercase tracking-tight ${isActive ? "text-white" : "text-slate-800"}`}>{tab.name}</span>
                  <span className={`block text-[8px] font-mono mt-0.5 font-bold ${isActive ? "text-white/80" : "text-slate-400"}`}>{tab.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Subtab Content */}
      <div className="pt-2">
        {/* Banner for inactive class - visible to staff only */}
        {!isClassActive && !isSiswaOrAlumni && (
          <div className="mb-4 p-4.5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-xs">
            <div className="flex items-start gap-3">
              <span className="h-9 w-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold text-lg">⚠️</span>
              <div>
                <h4 className="font-display font-black text-slate-900 text-xs sm:text-sm">Kelas "{activeStudentClass}" Nonaktif</h4>
                <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">Status kelas ini dinonaktifkan di Manajemen Kelas, sehingga siswa tidak dapat mengakses materi & kuis.</p>
              </div>
            </div>
            {(currentUser?.role === "Pengajar" || currentUser?.role === "VVIP" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa") && (
              <button
                type="button"
                onClick={handleToggleClassActive}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold rounded-xl shadow-md cursor-pointer transition active:scale-95 shrink-0 flex items-center gap-1 uppercase"
              >
                ⚡ Aktifkan Kelas Sekarang
              </button>
            )}
          </div>
        )}

        {/* Locked screen for students when the class is inactive - applies to "bab" and "kuis" subtabs */}
        {!isClassActive && isSiswaOrAlumni && (activeSubTab === "bab") && (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-lg mx-auto my-12 shadow-md space-y-4 animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center border border-rose-100 text-2xl animate-bounce">
              🔒
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-black text-slate-900 text-base">LMS E-Benkyou Kelas Anda Belum Aktif</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Maaf, akses materi dan kuis untuk kelas <strong className="text-indigo-600">{activeStudentClass}</strong> saat ini sedang dinonaktifkan oleh administrasi.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Informasi & Solusi:</h5>
              <p className="text-[10px] text-slate-600 font-normal leading-relaxed">
                Silakan hubungi Sensei Utama, Wali Kelas, atau bagian Akademik LPK SCI untuk melakukan aktivasi status kelas belajar Anda agar dapat kembali melanjutkan pembelajaran mandiri di LMS.
              </p>
            </div>
          </div>
        )}

        {/* SUBTAB 2: ATTENDANCE (ABSENSI) */}
        {activeSubTab === "absen" && <LmsAbsenSegment activeStudentClass={activeStudentClass} activeStudents={activeStudents} allClasses={allClasses} assessmentSubject={assessmentSubject} attendanceRecords={attendanceRecords} currentUser={currentUser} matchingStudent={matchingStudent} onAddAttendance={onAddAttendance} onUpdateState={onUpdateState} selectedBabNumber={selectedBabNumber} setActiveSubTab={setActiveSubTab} setViewingAttendancePhoto={setViewingAttendancePhoto} />}

        {/* SUBTAB 4: HARIAN BAB */}
        {activeSubTab === "bab" && (!isSiswaOrAlumni || isClassActive) && <LmsBabSegment activeStudentClass={activeStudentClass} activeStudents={activeStudents} allClasses={allClasses} assessmentSubject={assessmentSubject} batchChapterNumber={batchChapterNumber} setBatchChapterNumber={setBatchChapterNumber} batchSubject={batchSubject} setBatchSubject={setBatchSubject} batchSubTitle={batchSubTitle} setBatchSubTitle={setBatchSubTitle} batchLessonId={batchLessonId} setBatchLessonId={setBatchLessonId} activeQuizSubTitle={activeQuizSubTitle} setActiveQuizSubTitle={setActiveQuizSubTitle} cbtStartTimes={cbtStartTimes} chapterAssessments={chapterAssessments} currentUser={currentUser} expandedLessons={expandedLessons} filteredActiveStudents={filteredActiveStudents} getClassChaptersCount={getClassChaptersCount} getClassChaptersList={getClassChaptersList} getResolvedChapterNum={getResolvedChapterNum} handleActivateChapterInLms={handleActivateChapterInLms} handleDeactivateChapterInLms={handleDeactivateChapterInLms} handleAddMandiriChapter={handleAddMandiriChapter} handleEditMandiriChapter={handleEditMandiriChapter} handleDeleteMandiriChapter={handleDeleteMandiriChapter} handleLessonDelete={handleLessonDelete} handleOpenEditLesson={handleOpenEditLesson} handleStartCbt={handleStartCbt} handleRetakeQuiz={handleRetakeQuiz} isAlumniClass={isAlumniClass} isSidebarCollapsed={isSidebarCollapsed} isSiswaOrAlumni={isSiswaOrAlumni} lmsLessons={lmsLessons} onUpdateState={onUpdateState} selectedBabNumber={selectedBabNumber} selectedClassFilter={selectedClassFilter} selectedStudentId={selectedStudentId} setActiveQuizChapterId={setActiveQuizChapterId} setActiveSubTab={setActiveSubTab} setBatchDeadline={setBatchDeadline} setBatchDurationMinutes={setBatchDurationMinutes} setBatchTargetClass={setBatchTargetClass} setCbtStartTimes={setCbtStartTimes} setEvalSelectedLessonId={setEvalSelectedLessonId} setIsLessonFormOpen={setIsLessonFormOpen} setIsQuizFormOpen={setIsQuizFormOpen} setIsSidebarCollapsed={setIsSidebarCollapsed} setLessonBookUrl={setLessonBookUrl} setLessonContent={setLessonContent} setLessonContentType={setLessonContentType} setLessonDeadline={setLessonDeadline} setLessonDifficulty={setLessonDifficulty} setLessonDurationMinutes={setLessonDurationMinutes} setLessonError={setLessonError} setLessonIsLocked={setLessonIsLocked} setLessonJapaneseTitle={setLessonJapaneseTitle} setLessonSlidesUrl={setLessonSlidesUrl} setLessonSubject={setLessonSubject} setLessonTargetClass={setLessonTargetClass} setLessonTitle={setLessonTitle} setLessonVideoUrl={setLessonVideoUrl} setNewQuiz={setNewQuiz} setPdfViewerUrl={setPdfViewerUrl} setProgressTabMode={setProgressTabMode} setQuizBatch={setQuizBatch} setSelectedBabNumber={setSelectedBabNumber} setSelectedBatchIndex={setSelectedBatchIndex} setSelectedLessonToEdit={setSelectedLessonToEdit} setSelectedStudentId={setSelectedStudentId} setShowAllChapters={setShowAllChapters} setSubmittingLessons={setSubmittingLessons} showAllChapters={showAllChapters} studentAssessmentsMap={studentAssessmentsMap} submittedQuizIds={submittedQuizIds} submittingLessons={submittingLessons} systemState={systemState} toggleLessonExpanded={toggleLessonExpanded} />}
        {/* SUBTAB DOKUMEN: 17 Dokumen Persyaratan & Akademik */}
        {activeSubTab === "dokumen" && <LmsDokumenSegment currentUser={currentUser} onUpdateState={onUpdateState} setViewingDoc={setViewingDoc} systemState={systemState} />}

        {/* SUBTAB PROGRESS: Khusus Staf Sensei */}
        {activeSubTab === "progress" && (currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && <LmsProgressSegment activeStudentClass={activeStudentClass} assessmentSubject={assessmentSubject} attendanceRecords={attendanceRecords} babCurrentPage={babCurrentPage} chapterAssessments={chapterAssessments} currentUser={currentUser} evalSelectedBabId={evalSelectedBabId} evalSelectedLessonId={evalSelectedLessonId} filteredActiveStudents={filteredActiveStudents} getClassChaptersCount={getClassChaptersCount} getClassChaptersList={getClassChaptersList} gradingNotes={gradingNotes} handleGradeSubmit={handleGradeSubmit} isAlumniClass={isAlumniClass} isGradingSubmitting={isGradingSubmitting} isReadOnlyView={isReadOnlyView} isVvipOrAdmin={isVvipOrAdmin} itemsPerPage={itemsPerPage} lmsLessons={lmsLessons} onUpdateState={onUpdateState} paginatedBabStudents={paginatedBabStudents} paginatedTugasStudents={paginatedTugasStudents} progressTabMode={progressTabMode} scoreBumpo={scoreBumpo} scoreKaiwa={scoreKaiwa} scoreKanji={scoreKanji} scoreKotoba={scoreKotoba} selectedClassFilter={selectedClassFilter} selectedStudentId={selectedStudentId} setAssessmentSubject={setAssessmentSubject} setBabCurrentPage={setBabCurrentPage} setEvalSelectedBabId={setEvalSelectedBabId} setEvalSelectedLessonId={setEvalSelectedLessonId} setGradingNotes={setGradingNotes} setPdfViewerUrl={setPdfViewerUrl} setProgressTabMode={setProgressTabMode} setScoreBumpo={setScoreBumpo} setScoreKaiwa={setScoreKaiwa} setScoreKanji={setScoreKanji} setScoreKotoba={setScoreKotoba} setSelectedStudentId={setSelectedStudentId} setTugasCurrentPage={setTugasCurrentPage} setTugasGrades={setTugasGrades} setTugasGradingSubmitting={setTugasGradingSubmitting} setTugasNotes={setTugasNotes} setTugasScores={setTugasScores} studentAttendanceMap={studentAttendanceMap} systemState={systemState} totalBabPages={totalBabPages} totalTugasPages={totalTugasPages} tugasCurrentPage={tugasCurrentPage} tugasGradingSubmitting={tugasGradingSubmitting} tugasNotes={tugasNotes} tugasScores={tugasScores} />}
      </div>

      {/* GOOGLE FORM STYLE QUIZ BUILDER MODAL */}
      {isQuizFormOpen && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fade-in text-slate-900">
          <div className="bg-slate-100 rounded-3xl border border-slate-300 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col h-[96vh] max-h-[96vh]">
            {/* Google Forms Characteristic Top Accent Banner */}
            <div className="h-3.5 bg-gradient-to-r from-purple-700 via-indigo-600 to-emerald-500 w-full shrink-0" />

            {/* Modal Header */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center shadow-2xs shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-base sm:text-lg text-slate-900 leading-tight">
                      Pembuat Kuis LMS (Google Form)
                    </h3>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200 hidden sm:inline-block">
                      Bab {batchChapterNumber} ({batchSubject || "Bahasa Jepang"})
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 hidden sm:flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Firestore &amp; Storage Aktif</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Model formulir bersusun ke bawah. Tentukan kunci jawaban langsung di bawah tiap opsi pilihan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAllQuizzes}
                  disabled={isFileUploading || isSavingQuizBatch || quizBatch.filter(q => q.question?.trim() || q.imageUrl || q.audioUrl).length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Simpan kuis langsung ke Firestore"
                >
                  {isSavingQuizBatch ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Simpan Kuis</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuizFormOpen(false)}
                  className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                  title="Tutup formulir"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Question Jump Bar */}
            <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 py-2 overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono select-none shrink-0 mr-1">
                Lompat ke Soal:
              </span>
              {quizBatch.map((q, idx) => {
                const isFilled = !!q.question?.trim();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`google-form-question-${idx}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      setSelectedBatchIndex(idx);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                      idx === selectedBatchIndex
                        ? "bg-purple-700 text-white shadow-xs border-purple-800 ring-2 ring-purple-300"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${isFilled ? "bg-emerald-500" : "bg-amber-400"}`} />
                    <span>#{idx + 1}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  const template = {
                    id: "QZ-" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                    subject: batchSubject || "Bahasa Jepang",
                    questionType: "pilihan_ganda",
                    question: "",
                    options: ["", "", "", ""],
                    correctAnswerIndex: 0,
                    correctAnswerIndices: [0],
                    allowMultipleAnswers: false,
                    correctAnswerEssay: "",
                    correctAnswerText: "",
                    chapterNumber: batchChapterNumber,
                    deadline: batchDeadline || "",
                    durationMinutes: batchDurationMinutes || "",
                    imageUrl: "",
                    videoUrl: "",
                    audioUrl: ""
                  };
                  setQuizBatch(prev => [...prev, template]);
                  setTimeout(() => {
                    const nextIdx = quizBatch.length;
                    const el = document.getElementById(`google-form-question-${nextIdx}`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Tambah Soal</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-3 sm:p-6 overflow-y-auto space-y-5 text-left flex-1 bg-slate-100/70">
              {/* Draft Recovery Notification Banner */}
              {detectedDraft && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black">
                        Ditemukan Draf Tersimpan ({detectedDraft.count} Soal untuk Bab {detectedDraft.chapterNumber})
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium">
                        Draf tersimpan otomatis di perangkat Anda pada {new Date(detectedDraft.savedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}. Klik pulihkan untuk melanjutkan.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Pulihkan Draf
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissDraft}
                      className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition cursor-pointer"
                      title="Abaikan draf"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Google Forms Header Card: General Quiz Information */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="border-b border-slate-150 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <span>⚙️ Pengaturan &amp; Identitas Kuis Bab</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tentukan bab, kelas target, waktu pengerjaan, dan pengacakan untuk seluruh soal kuis ini.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl self-start sm:self-auto font-bold">
                    Total {quizBatch.length} Soal Bersusun
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Bab Target */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>📖 Bab Target</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={batchChapterNumber}
                      onChange={(e) => {
                        const newBab = Number(e.target.value);
                        if (newBab === batchChapterNumber) return;

                        setBatchChapterNumber(newBab);
                        setSelectedBabNumber(newBab);

                        const existingForBab = (systemState?.lmsQuizzes || []).filter((q: any) => {
                          const chNum = q.chapterNumber !== undefined ? Number(q.chapterNumber) : (q.chapterId !== undefined ? Number(q.chapterId) : NaN);
                          return (chNum === newBab || String(q.chapterNumber) === String(newBab) || String(q.chapterId) === String(newBab)) &&
                            (!q.subject || q.subject === (batchSubject || assessmentSubject || "Bahasa Jepang"));
                        });

                        const hasUserWork = quizBatch.some(q => (q.question && q.question.trim().length > 0) || q.imageUrl || q.audioUrl);
                        if (hasUserWork && existingForBab.length === 0) {
                          setQuizBatch(prev => prev.map(q => ({ ...q, chapterNumber: newBab, chapterId: newBab })));
                          return;
                        }

                        if (existingForBab.length > 0) {
                          const loaded = existingForBab.map((q: any) => {
                            const cIndices = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
                              ? q.correctAnswerIndices.map(Number)
                              : (q.correctAnswerIndex !== undefined ? [Number(q.correctAnswerIndex)] : [0]);
                            const isMulti = !!q.allowMultipleAnswers || q.questionType === "pilihan_ganda_kompleks" || cIndices.length > 1;
                            return {
                              ...q,
                              chapterNumber: newBab,
                              options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["", "", "", ""],
                              correctAnswerIndex: cIndices[0] !== undefined ? cIndices[0] : 0,
                              correctAnswerIndices: cIndices,
                              allowMultipleAnswers: isMulti,
                              questionType: q.questionType || (isMulti ? "pilihan_ganda_kompleks" : "pilihan_ganda")
                            };
                          });
                          const newBlank = {
                            id: "QZ-" + Date.now() + "_" + Math.random().toString(36).substring(2, 9) + "_" + Math.floor(Math.random() * 100000),
                            subject: batchSubject || assessmentSubject || "Bahasa Jepang",
                            chapterNumber: newBab,
                            chapterId: newBab,
                            questionType: "pilihan_ganda",
                            question: "",
                            options: ["", "", "", ""],
                            correctAnswerIndex: 0,
                            correctAnswerIndices: [0],
                            allowMultipleAnswers: false,
                            correctAnswerEssay: "",
                            correctAnswerText: "",
                            imageUrl: "",
                            videoUrl: "",
                            audioUrl: ""
                          };
                          setQuizBatch([...loaded, newBlank]);
                          setSelectedBatchIndex(loaded.length);
                        } else {
                          setQuizBatch(prev => prev.map(q => ({ ...q, chapterNumber: newBab, chapterId: newBab })));
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:border-purple-600 focus:bg-white outline-none cursor-pointer"
                    >
                      {getClassChaptersList(activeStudentClass, batchSubject || assessmentSubject, true).map((ch: any) => (
                        <option key={ch.number} value={ch.number}>
                          Bab {ch.number}: {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mata Pelajaran */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">📚 Mata Pelajaran</label>
                    <select
                      value={batchSubject}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBatchSubject(val);
                        setQuizBatch(prev => prev.map(q => ({ ...q, subject: val })));
                      }}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:border-purple-600 focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="Bahasa Jepang">🇯🇵 Bahasa Jepang</option>
                      <option value="SSW">📐 SSW (SSW)</option>
                    </select>
                  </div>

                  {/* Kelas Sasaran */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">👥 Kelas Sasaran</label>
                    <select
                      value={batchTargetClass}
                      onChange={(e) => setBatchTargetClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:border-purple-600 focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="Semua">Semua Kelas</option>
                      {officialClasses.map((c: any) => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Durasi Pengerjaan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">⏱️ Batas Durasi Kuis</label>
                    <select
                      value={batchDurationMinutes || ""}
                      onChange={(e) => setBatchDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:border-purple-600 focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="">Tanpa Batas Waktu</option>
                      <option value="5">5 Menit</option>
                      <option value="10">10 Menit</option>
                      <option value="15">15 Menit</option>
                      <option value="20">20 Menit</option>
                      <option value="30">30 Menit</option>
                      <option value="45">45 Menit</option>
                      <option value="60">60 Menit (1 Jam)</option>
                      <option value="90">90 Menit (1.5 Jam)</option>
                      <option value="120">120 Menit (2 Jam)</option>
                    </select>
                  </div>

                  {/* Tenggang Waktu (Deadline) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">📅 Tenggang Waktu (Deadline)</label>
                    <input
                      type="datetime-local"
                      value={batchDeadline || ""}
                      onChange={(e) => setBatchDeadline(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-800 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  {/* Acak Urutan Soal (Google Form Style) */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50/50 transition cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={batchShuffleQuestions}
                        onChange={(e) => setBatchShuffleQuestions(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-xs">🔀 Acak Urutan Soal Tiap Siswa</span>
                    </label>
                  </div>

                  {/* Sub-Bab / Sub-Materi Kuis (Support multiple quizzes per Bab) */}
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <span>🏷️ Judul Sub-Bab / Sub-Materi Kuis</span>
                        <span className="text-[10px] text-purple-700 font-normal">(Membuat kuis untuk materi spesifik di Bab ini)</span>
                      </label>
                      {batchSubTitle && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setBatchSubTitle("");
                            setBatchLessonId("");
                            setQuizBatch(prev => prev.map(q => ({ ...q, subTitle: "", lessonId: "" })));
                          }}
                          className="text-[10px] text-purple-700 hover:text-purple-950 underline self-start sm:self-auto cursor-pointer font-semibold"
                        >
                          Reset ke Kuis Utama
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={batchSubTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBatchSubTitle(val);
                        setQuizBatch(prev => prev.map(q => ({ ...q, subTitle: val })));
                      }}
                      placeholder={`Contoh: Sub 1: Kosakata Bab ${batchChapterNumber} / Tata Bahasa Bunpou / Menyimak Kaiwa`}
                      className="w-full bg-white border border-purple-300 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none placeholder:text-slate-400 font-sans"
                    />
                    {(() => {
                      const chapterLessons = (lmsLessons || systemState?.lmsLessons || []).filter(
                        (l: any) => l.chapterNumber === batchChapterNumber && (!l.subject || l.subject === batchSubject)
                      );
                      if (chapterLessons.length === 0) return null;
                      return (
                        <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-purple-800 font-bold shrink-0">Tautkan ke materi bab ini:</span>
                          {chapterLessons.map((l: any) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                setBatchSubTitle(l.title);
                                setBatchLessonId(l.id);
                                setQuizBatch(prev => prev.map(q => ({ ...q, subTitle: l.title, lessonId: l.id })));
                              }}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer flex items-center gap-1 ${
                                batchSubTitle === l.title
                                  ? "bg-purple-700 text-white border-purple-800 font-bold shadow-2xs"
                                  : "bg-white text-purple-900 border-purple-200 hover:bg-purple-100"
                              }`}
                            >
                              <span>{l.contentType === "video" ? "🎬" : l.contentType === "slide" ? "📽️" : "📝"}</span>
                              <span>{l.title}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* STACK OF QUESTION CARDS (GOOGLE FORM STYLE) */}
              <div className="space-y-5">
                {quizBatch.map((q, qIdx) => {
                  const isMultipleChoice = q.questionType !== "essay";
                  const options = Array.isArray(q.options) && q.options.length > 0 ? q.options : ["", "", "", ""];
                  const correctIndices: number[] = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
                    ? q.correctAnswerIndices.map(Number)
                    : (q.correctAnswerIndex !== undefined ? [Number(q.correctAnswerIndex)] : [0]);
                  const isMultiAnswer = !!q.allowMultipleAnswers || q.questionType === "pilihan_ganda_kompleks" || correctIndices.length > 1;
                  const selectedKey = correctIndices[0] !== undefined ? correctIndices[0] : 0;

                  return (
                    <div
                      key={q.id || qIdx}
                      id={`google-form-question-${qIdx}`}
                      onClick={() => setSelectedBatchIndex(qIdx)}
                      className={`bg-white rounded-2xl sm:rounded-3xl border-2 transition-all p-4 sm:p-7 space-y-4 shadow-sm relative ${
                        qIdx === selectedBatchIndex
                          ? "border-purple-500 border-l-[10px] border-l-purple-600 ring-4 ring-purple-100/70 shadow-md"
                          : "border-slate-200/90 border-l-[10px] border-l-transparent hover:border-slate-300"
                      }`}
                    >
                      {/* Top Bar of Question Card (Google Form Style) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-purple-600 text-white text-xs font-black px-3 py-1 rounded-xl shadow-2xs">
                            Pertanyaan #{qIdx + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                            {isMultipleChoice ? `${options.length} Pilihan Jawaban` : "Essay / Isian"}
                          </span>
                          {isMultiAnswer && isMultipleChoice && (
                            <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <CheckSquare className="w-3 h-3" />
                              <span>Multi-Kunci (&gt;1 Jawaban Benar)</span>
                            </span>
                          )}
                          {q.required !== false && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                              * Wajib Diisi
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {/* Question Type Selector */}
                          <select
                            value={isMultiAnswer && isMultipleChoice ? "pilihan_ganda_kompleks" : (q.questionType || "pilihan_ganda")}
                            onChange={(e) => {
                              const val = e.target.value;
                              const isKompleks = val === "pilihan_ganda_kompleks";
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy[qIdx] = {
                                  ...copy[qIdx],
                                  questionType: val,
                                  allowMultipleAnswers: isKompleks,
                                  correctAnswerIndices: isKompleks ? correctIndices : [correctIndices[0] || 0],
                                  correctAnswerIndex: correctIndices[0] || 0,
                                };
                                return copy;
                              });
                            }}
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-purple-500"
                          >
                            <option value="pilihan_ganda">🔘 Pilihan Ganda (1 Jawaban Benar)</option>
                            <option value="pilihan_ganda_kompleks">☑️ Pilihan Ganda Kompleks (Bisa &gt;1 Jawaban Benar)</option>
                            <option value="essay">📝 Essay / Isian Singkat</option>
                          </select>

                          {/* Duplicate Question */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const clone = {
                                ...q,
                                id: "QZ-" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                                options: [...options]
                              };
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy.splice(qIdx + 1, 0, clone);
                                return copy;
                              });
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                            title="Duplikat Soal Ini"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Duplikat</span>
                          </button>

                          {/* Delete Question */}
                          {quizBatch.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Hapus Soal #${qIdx + 1}?`)) {
                                  const filtered = quizBatch.filter((_, i) => i !== qIdx);
                                  setQuizBatch(filtered);
                                  setSelectedBatchIndex(prev => (prev >= filtered.length ? filtered.length - 1 : prev));
                                }
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                              title="Hapus Soal Ini"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden md:inline">Hapus</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Question Text Input (Google Form Style Textarea) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                          <span>Teks Pertanyaan Soal:</span>
                          {!q.question?.trim() && (
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Harap isi pertanyaan
                            </span>
                          )}
                        </label>
                        <textarea
                          value={q.question || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuizBatch(prev => {
                              const copy = [...prev];
                              copy[qIdx] = { ...copy[qIdx], question: val };
                              return copy;
                            });
                          }}
                          rows={2}
                          placeholder={`Tuliskan pertanyaan soal #${qIdx + 1} di sini... (contoh: Apa arti kosakata 'Ohayou Gozaimasu'?)`}
                          className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 px-4 py-3 rounded-2xl text-sm font-medium text-slate-900 outline-none transition placeholder-slate-400"
                        />
                      </div>

                      {/* Media Attachments Section (Gambar & Audio) */}
                      <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <span>📎 Lampiran Media (Opsional):</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Gambar atau Rekaman Suara</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Gambar Attachment */}
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">🖼️ Gambar</span>
                            {q.imageUrl ? (
                              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                                <img src={q.imageUrl} alt="Lampiran Soal" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuizBatch(prev => {
                                      const copy = [...prev];
                                      copy[qIdx] = { ...copy[qIdx], imageUrl: "" };
                                      return copy;
                                    });
                                  }}
                                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition cursor-pointer"
                                  title="Hapus gambar"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isFileUploading}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsFileUploading(true);
                                  try {
                                    const url = await uploadFileToFirebase(file, "lms_quizzes");
                                    setQuizBatch(prev => {
                                      const copy = [...prev];
                                      copy[qIdx] = { ...copy[qIdx], imageUrl: url };
                                      return copy;
                                    });
                                  } catch (err) {
                                    alert("Gagal mengunggah gambar");
                                  } finally {
                                    setIsFileUploading(false);
                                  }
                                }}
                                className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-purple-100 cursor-pointer"
                              />
                            )}
                          </div>

                          {/* Audio Attachment */}
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">🎙️ Audio (Suara)</span>
                            {q.audioUrl ? (
                              <div className="relative rounded-lg p-2 border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                                <audio src={q.audioUrl} controls className="w-full h-8" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuizBatch(prev => {
                                      const copy = [...prev];
                                      copy[qIdx] = { ...copy[qIdx], audioUrl: "" };
                                      return copy;
                                    });
                                  }}
                                  className="bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition cursor-pointer shrink-0"
                                  title="Hapus audio"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <input
                                type="file"
                                accept="audio/*"
                                disabled={isFileUploading}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsFileUploading(true);
                                  try {
                                    const url = await uploadFileToFirebase(file, "lms_quizzes");
                                    setQuizBatch(prev => {
                                      const copy = [...prev];
                                      copy[qIdx] = { ...copy[qIdx], audioUrl: url };
                                      return copy;
                                    });
                                  } catch (err) {
                                    alert("Gagal mengunggah audio");
                                  } finally {
                                    setIsFileUploading(false);
                                  }
                                }}
                                className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-purple-100 cursor-pointer"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* OPTIONS SECTION: MULTIPLE CHOICE (GOOGLE FORM STYLE WITH DYNAMIC OPTIONS) */}
                      {isMultipleChoice ? (
                        <div className="space-y-3.5 pt-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150 pb-2">
                            <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                              <span>{isMultiAnswer ? "☑️ Pilihan Jawaban (Multi-Kunci):" : "🔘 Pilihan Jawaban:"}</span>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                                {options.length} Opsi Tersedia
                              </span>
                            </label>

                            {/* Mode Toggle Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  const nextMulti = !isMultiAnswer;
                                  copy[qIdx] = {
                                    ...copy[qIdx],
                                    allowMultipleAnswers: nextMulti,
                                    questionType: nextMulti ? "pilihan_ganda_kompleks" : "pilihan_ganda",
                                    correctAnswerIndices: nextMulti ? correctIndices : [correctIndices[0] || 0],
                                    correctAnswerIndex: correctIndices[0] || 0,
                                  };
                                  return copy;
                                });
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                isMultiAnswer
                                  ? "bg-purple-600 text-white border-purple-700 shadow-2xs"
                                  : "bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-300"
                              }`}
                              title="Klik untuk mengaktifkan/menonaktifkan lebih dari 1 jawaban benar"
                            >
                              {isMultiAnswer ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                              <span>{isMultiAnswer ? "✓ Multi-Jawaban Benar Aktif" : "+ Izinkan >1 Jawaban Benar"}</span>
                            </button>
                          </div>

                          {isMultiAnswer && (
                            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
                              <span className="text-base">💡</span>
                              <span><strong>Mode Multi-Jawaban Aktif:</strong> Anda dapat memilih lebih dari satu opsi sebagai kunci jawaban yang benar. Klik opsi manapun untuk menambah atau menghapus kunci jawaban.</span>
                            </div>
                          )}

                          {/* Options List */}
                          <div className="space-y-3">
                            {options.map((opt, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isCorrect = correctIndices.includes(optIdx);

                              const handleToggleKey = () => {
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  if (isMultiAnswer) {
                                    let newKeys: number[];
                                    if (correctIndices.includes(optIdx)) {
                                      if (correctIndices.length > 1) {
                                        newKeys = correctIndices.filter(k => k !== optIdx);
                                      } else {
                                        newKeys = correctIndices;
                                      }
                                    } else {
                                      newKeys = [...correctIndices, optIdx].sort((a, b) => a - b);
                                    }
                                    copy[qIdx] = {
                                      ...copy[qIdx],
                                      correctAnswerIndices: newKeys,
                                      correctAnswerIndex: newKeys[0] || 0,
                                      allowMultipleAnswers: true,
                                      questionType: "pilihan_ganda_kompleks"
                                    };
                                  } else {
                                    copy[qIdx] = {
                                      ...copy[qIdx],
                                      correctAnswerIndex: optIdx,
                                      correctAnswerIndices: [optIdx],
                                      allowMultipleAnswers: false,
                                      questionType: "pilihan_ganda"
                                    };
                                  }
                                  return copy;
                                });
                              };

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all ${
                                    isCorrect
                                      ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-200 shadow-2xs"
                                      : "border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300"
                                  }`}
                                >
                                  {/* Input row (Radio bullet / Checkbox + Letter badge + Text input + Delete) */}
                                  <div className="flex items-center gap-2.5">
                                    {/* Google Form Style Selector Button */}
                                    <button
                                      type="button"
                                      onClick={handleToggleKey}
                                      className={`h-7 w-7 ${isMultiAnswer ? "rounded-lg" : "rounded-full"} flex items-center justify-center transition cursor-pointer shrink-0 ${
                                        isCorrect
                                          ? "border-2 border-emerald-600 bg-emerald-600 shadow-xs text-white"
                                          : "border-2 border-slate-400 hover:border-purple-600 bg-white"
                                      }`}
                                      title={isMultiAnswer ? `Klik untuk jadikan/hapus Opsi ${letter} sebagai Kunci Jawaban` : `Klik untuk jadikan Opsi ${letter} sebagai Kunci Jawaban`}
                                    >
                                      {isCorrect ? (
                                        isMultiAnswer ? <Check className="h-4 w-4 stroke-[3]" /> : <div className="h-2 w-2 rounded-full bg-white" />
                                      ) : (
                                        <div className="h-1.5 w-1.5 rounded-full bg-transparent group-hover:bg-purple-400" />
                                      )}
                                    </button>

                                    {/* Letter badge */}
                                    <div
                                      className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 select-none shadow-2xs ${
                                        isCorrect
                                          ? "bg-emerald-600 text-white"
                                          : "bg-white border border-slate-300 text-slate-700"
                                      }`}
                                    >
                                      {letter}
                                    </div>

                                    {/* Option Text Input */}
                                    <input
                                      type="text"
                                      id={`google-form-opt-${qIdx}-${optIdx}`}
                                      value={opt}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const newOpts = [...options, ""];
                                          setQuizBatch(prev => {
                                            const copy = [...prev];
                                            copy[qIdx] = { ...copy[qIdx], options: newOpts };
                                            return copy;
                                          });
                                          setTimeout(() => {
                                            const el = document.getElementById(`google-form-opt-${qIdx}-${options.length}`);
                                            if (el) el.focus();
                                          }, 60);
                                        }
                                      }}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setQuizBatch(prev => {
                                          const copy = [...prev];
                                          const newOpts = [...(copy[qIdx].options || ["", "", "", ""])];
                                          newOpts[optIdx] = val;
                                          copy[qIdx] = { ...copy[qIdx], options: newOpts };
                                          return copy;
                                        });
                                      }}
                                      placeholder={`Tuliskan pilihan ${letter} (contoh: Opsi ${letter})`}
                                      className="flex-1 bg-white border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none transition placeholder-slate-400"
                                    />

                                    {/* Delete Option (X) */}
                                    {options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuizBatch(prev => {
                                            const copy = [...prev];
                                            const newOpts = copy[qIdx].options.filter((_: any, i: number) => i !== optIdx);
                                            let newIndices = correctIndices
                                              .filter(k => k !== optIdx)
                                              .map(k => (k > optIdx ? k - 1 : k));
                                            if (newIndices.length === 0) newIndices = [0];
                                            copy[qIdx] = {
                                              ...copy[qIdx],
                                              options: newOpts,
                                              correctAnswerIndices: newIndices,
                                              correctAnswerIndex: newIndices[0] || 0
                                            };
                                            return copy;
                                          });
                                        }}
                                        className="h-8 w-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer shrink-0"
                                        title={`Hapus pilihan ${letter}`}
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Direct Answer Key Button Underneath Each Option */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={handleToggleKey}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                                        isCorrect
                                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                                          : "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-300 hover:border-emerald-400"
                                      }`}
                                    >
                                      {isCorrect ? (
                                        <>
                                          <CheckCircle2 className="w-4 h-4 text-white" />
                                          <span>{isMultiAnswer ? `✓ Kunci Benar (Opsi ${letter})` : `✓ Kunci Jawaban (Benar)`}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 inline-block" />
                                          <span>{isMultiAnswer ? `+ Tambah Opsi ${letter} Sebagai Kunci Benar` : `Pilih Opsi ${letter} Sebagai Kunci`}</span>
                                        </>
                                      )}
                                    </button>

                                    {isCorrect && (
                                      <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <span>✓ Termasuk salah satu kunci jawaban benar</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Google Forms Signature "Tambahkan Opsi" Row */}
                          <div 
                            onClick={() => {
                              const newOpts = [...options, ""];
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy[qIdx] = { ...copy[qIdx], options: newOpts };
                                return copy;
                              });
                              setTimeout(() => {
                                const el = document.getElementById(`google-form-opt-${qIdx}-${options.length}`);
                                if (el) el.focus();
                              }, 60);
                            }}
                            className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-purple-500 bg-white/70 hover:bg-purple-50/60 transition cursor-pointer group select-none shadow-2xs"
                            title="Klik untuk menambahkan opsi pilihan baru"
                          >
                            <div className="h-7 w-7 rounded-full border-2 border-slate-400 group-hover:border-purple-600 flex items-center justify-center text-slate-400 group-hover:text-purple-700 bg-white transition shrink-0">
                              <Plus className="h-4 w-4" />
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-600 group-hover:text-purple-900">
                                Tambahkan opsi ({String.fromCharCode(65 + options.length)}) <span className="font-normal text-[11px] text-slate-400 ml-1 hidden sm:inline">• atau tekan Enter saat mengetik pilihan</span>
                              </span>
                              <span className="text-[11px] font-extrabold text-purple-700 bg-purple-100 group-hover:bg-purple-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Tambah Opsi {String.fromCharCode(65 + options.length)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Quick Presets & Options Management Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                                Preset Opsi:
                              </span>

                              {/* Button Add 1 Option */}
                              <button
                                type="button"
                                onClick={() => {
                                  setQuizBatch(prev => {
                                    const copy = [...prev];
                                    const newOpts = [...(copy[qIdx].options || ["", "", "", ""]), ""];
                                    copy[qIdx] = { ...copy[qIdx], options: newOpts };
                                    return copy;
                                  });
                                  setTimeout(() => {
                                    const el = document.getElementById(`google-form-opt-${qIdx}-${options.length}`);
                                    if (el) el.focus();
                                  }, 60);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <Plus className="h-3 w-3" />
                                <span>+ Opsi {String.fromCharCode(65 + options.length)}</span>
                              </button>

                              {/* Preset 5 Options (A-E) */}
                              {options.length !== 5 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuizBatch(prev => {
                                      const copy = [...prev];
                                      let cur = [...(copy[qIdx].options || [])];
                                      while (cur.length < 5) cur.push("");
                                      if (cur.length > 5) cur = cur.slice(0, 5);
                                      copy[qIdx] = { ...copy[qIdx], options: cur };
                                      return copy;
                                    });
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                                  title="Format 5 Pilihan (A, B, C, D, E) untuk standar ujian"
                                >
                                  5 Opsi (A - E)
                                </button>
                              )}

                              {/* Preset 4 Options (A-D) */}
                              {options.length !== 4 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuizBatch(prev => {
                                      const copy = [...prev];
                                      let cur = [...(copy[qIdx].options || [])];
                                      while (cur.length < 4) cur.push("");
                                      if (cur.length > 4) cur = cur.slice(0, 4);
                                      copy[qIdx] = { ...copy[qIdx], options: cur };
                                      return copy;
                                    });
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                                  title="Format 4 Pilihan (A, B, C, D)"
                                >
                                  4 Opsi (A - D)
                                </button>
                              )}

                              {/* Preset Benar / Salah (True/False) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setQuizBatch(prev => {
                                    const copy = [...prev];
                                    copy[qIdx] = { ...copy[qIdx], options: ["Benar", "Salah"], correctAnswerIndex: 0, correctAnswerIndices: [0] };
                                    return copy;
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                                title="Set 2 Pilihan: Benar / Salah"
                              >
                                2 Opsi (Benar / Salah)
                              </button>
                            </div>

                            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 flex-wrap">
                              <span>🔑 Kunci Aktif ({correctIndices.length}):</span>
                              <strong>Opsi {correctIndices.map(k => String.fromCharCode(65 + k)).join(", ")}</strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ESSAY SECTION: AUTO-GRADING KEY */
                        <div className="space-y-2.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                              <span>🔑 Kunci Jawaban Essay (Penilaian Otomatis)</span>
                            </label>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                              Auto-Grading Aktif
                            </span>
                          </div>
                          <textarea
                            value={q.correctAnswerEssay || q.correctAnswerText || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy[qIdx] = {
                                  ...copy[qIdx],
                                  correctAnswerEssay: val,
                                  correctAnswerText: val
                                };
                                return copy;
                              });
                            }}
                            rows={2}
                            className="w-full bg-white border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none resize-none text-slate-900 placeholder-slate-400 font-medium"
                            placeholder="Contoh: こんにちは, atau pisahkan dengan tanda koma (,) jika ada beberapa variasi penulisan yang benar..."
                          />
                          <p className="text-[10px] text-emerald-800 leading-relaxed">
                            💡 Siswa yang menuliskan kata di atas (tidak membedakan huruf besar/kecil) akan otomatis mendapatkan nilai 100%. Pisahkan alternatif jawaban dengan tanda koma (<code>,</code>).
                          </p>
                        </div>
                      )}

                      {/* Optional Pembahasan Jawaban */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <span>💡 Pembahasan / Penjelasan Jawaban (Opsional):</span>
                        </label>
                        <textarea
                          value={q.explanation || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuizBatch(prev => {
                              const copy = [...prev];
                              copy[qIdx] = { ...copy[qIdx], explanation: val };
                              return copy;
                            });
                          }}
                          rows={1}
                          placeholder="Tuliskan penjelasan atau arti materi yang akan ditampilkan ke siswa setelah kuis selesai..."
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-purple-500 outline-none"
                        />
                      </div>

                      {/* Google Form Style Bottom Toolbar of the Question Card */}
                      <div className="pt-3 border-t border-slate-150 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          {/* Poin Soal (Bobot Nilai) */}
                          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-bold text-slate-600">Bobot Poin:</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={q.points !== undefined ? q.points : 10}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 1;
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  copy[qIdx] = { ...copy[qIdx], points: val };
                                  return copy;
                                });
                              }}
                              className="w-12 bg-white border border-slate-300 rounded-lg px-1.5 py-0.5 text-center font-bold text-xs text-purple-700 outline-none focus:border-purple-500"
                            />
                            <span className="text-[10px] text-slate-400">Poin</span>
                          </div>

                          {/* Wajib Diisi (Required Toggle Switch) */}
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={q.required !== false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  copy[qIdx] = { ...copy[qIdx], required: checked };
                                  return copy;
                                });
                              }}
                              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-700">Wajib Diisi</span>
                          </label>
                        </div>

                        {/* Card Action Buttons (Duplicate, Delete, Insert Below) */}
                        <div className="flex items-center gap-2">
                          {/* Duplikat */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const clone = {
                                ...q,
                                id: "QZ-" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                                options: [...options]
                              };
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy.splice(qIdx + 1, 0, clone);
                                return copy;
                              });
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                            title="Duplikat pertanyaan ini"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Duplikat</span>
                          </button>

                          {/* Hapus */}
                          {quizBatch.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Hapus Soal #${qIdx + 1}?`)) {
                                  const filtered = quizBatch.filter((_, i) => i !== qIdx);
                                  setQuizBatch(filtered);
                                  setSelectedBatchIndex(prev => (prev >= filtered.length ? filtered.length - 1 : prev));
                                }
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                              title="Hapus pertanyaan ini"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </button>
                          )}

                          {/* Sisipkan Pertanyaan Baru */}
                          <button
                            type="button"
                            onClick={() => {
                              const template = {
                                id: "QZ-" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                                subject: batchSubject || "Bahasa Jepang",
                                questionType: "pilihan_ganda",
                                question: "",
                                options: ["", "", "", ""],
                                correctAnswerIndex: 0,
                                correctAnswerEssay: "",
                                correctAnswerText: "",
                                chapterNumber: batchChapterNumber,
                                deadline: batchDeadline || "",
                                durationMinutes: batchDurationMinutes || "",
                                imageUrl: "",
                                videoUrl: "",
                                audioUrl: "",
                                points: 10,
                                required: true
                              };
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy.splice(qIdx + 1, 0, template);
                                return copy;
                              });
                              setTimeout(() => {
                                const nextEl = document.getElementById(`google-form-question-${qIdx + 1}`);
                                if (nextEl) nextEl.scrollIntoView({ behavior: "smooth", block: "center" });
                              }, 100);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                            title="Sisipkan pertanyaan baru tepat di bawah soal ini"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>+ Sisipkan Soal</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Big Bottom Add Question Button */}
              <div className="pt-2 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    const template = {
                      id: "QZ-" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                      subject: batchSubject || "Bahasa Jepang",
                      questionType: "pilihan_ganda",
                      question: "",
                      options: ["", "", "", ""],
                      correctAnswerIndex: 0,
                      correctAnswerEssay: "",
                      correctAnswerText: "",
                      chapterNumber: batchChapterNumber,
                      deadline: batchDeadline || "",
                      durationMinutes: batchDurationMinutes || "",
                      imageUrl: "",
                      videoUrl: "",
                      audioUrl: ""
                    };
                    setQuizBatch(prev => [...prev, template]);
                    setTimeout(() => {
                      const nextIdx = quizBatch.length;
                      const el = document.getElementById(`google-form-question-${nextIdx}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 100);
                  }}
                  className="w-full py-5 rounded-3xl border-2 border-dashed border-purple-300 hover:border-purple-600 bg-white hover:bg-purple-50/50 text-purple-800 font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer group active:scale-98"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 group-hover:bg-purple-600 text-purple-700 group-hover:text-white flex items-center justify-center transition">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span>+ Tambah Pertanyaan Baru (Soal #{quizBatch.length + 1})</span>
                </button>
              </div>
            </div>

            {/* Sticky Bottom Modal Footer Bar (ALWAYS VISIBLE) */}
            <div className="bg-white border-t border-slate-200 p-3.5 sm:p-5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-30">
              <div className="text-xs text-slate-600 text-center sm:text-left flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>
                  Menyimpan <strong className="font-extrabold text-emerald-700">{quizBatch.filter(q => q.question?.trim()).length}</strong> dari <strong className="font-extrabold">{quizBatch.length}</strong> soal untuk <span className="font-bold text-purple-700">Bab {batchChapterNumber}</span>.
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsQuizFormOpen(false)}
                  className="flex-1 sm:flex-none border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const template = {
                      id: "QZ-" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                      subject: batchSubject || "Bahasa Jepang",
                      questionType: "pilihan_ganda",
                      question: "",
                      options: ["", "", "", ""],
                      correctAnswerIndex: 0,
                      correctAnswerEssay: "",
                      correctAnswerText: "",
                      chapterNumber: batchChapterNumber,
                      deadline: batchDeadline || "",
                      durationMinutes: batchDurationMinutes || "",
                      imageUrl: "",
                      videoUrl: "",
                      audioUrl: ""
                    };
                    setQuizBatch(prev => [...prev, template]);
                  }}
                  className="border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer hidden sm:flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Soal</span>
                </button>

                <button
                  type="button"
                  disabled={isFileUploading || isSavingQuizBatch || quizBatch.filter(q => q.question?.trim() || q.imageUrl || q.audioUrl).length === 0}
                  onClick={handleSaveAllQuizzes}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  {isSavingQuizBatch ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Menyimpan Semua Soal ke Database Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Simpan Semua Soal Kuis ({quizBatch.filter(q => q.question?.trim() || q.imageUrl || q.audioUrl).length} Soal)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isLessonFormOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {selectedLessonToEdit ? "📝" : "➕"}
                </span>
                <div>
                  <h3 className="font-display font-black text-slate-900 text-sm">
                    {lessonDifficulty === "Tugas"
                      ? (selectedLessonToEdit ? `Ubah Tugas: ${selectedLessonToEdit.id}` : `Tambah Tugas Baru`)
                      : (selectedLessonToEdit ? `Ubah Materi: ${selectedLessonToEdit.id}` : `Tambah Materi Baru`)}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-normal leading-tight">
                    {lessonDifficulty === "Tugas"
                      ? "Pastikan rincian tugas dan tenggang waktu sudah benar."
                      : "Pastikan data modul valid sesuai kurikulum standard."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLessonFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <ConfirmForm 
              confirmTitle={lessonDifficulty === "Tugas" ? "Simpan Tugas" : "Simpan Materi Pokok"} 
              confirmMessage={lessonDifficulty === "Tugas" ? "Publikasikan tugas baru ini?" : "Publikasikan modul pelajaran baru ini?"} 
              onSubmit={handleLessonSubmit} 
              className="flex-1 overflow-y-auto min-h-0 w-full p-6 space-y-4 text-left"
            >
              {lessonError && (
                <div className="p-3.5 bg-rose-50 border border-rose-150 text-rose-800 text-[11px] font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  <span>{lessonError}</span>
                </div>
              )}

              {/* Subject Select & Bab Number */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subjek Pelajaran</label>
                  <select
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="Bahasa Jepang">Bahasa Jepang</option>
                    <option value="SSW">SSW</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor Bab</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={selectedBabNumber}
                    onChange={(e) => setSelectedBabNumber(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kelas Sasaran</label>
                  <select
                    value={lessonTargetClass}
                    onChange={(e) => setLessonTargetClass(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {officialClasses.map((c: any) => (
                      <option key={c.id || c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kesulitan / Jenis</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dasar N5"
                    value={lessonDifficulty}
                    onChange={(e) => setLessonDifficulty(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Title & Jp Title */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {lessonDifficulty === "Tugas" ? "Nama / Judul Tugas" : "Nama / Judul Materi"}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    placeholder={lessonDifficulty === "Tugas" ? "Masukkan nama tugas..." : "Masukkan nama modul..."}
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                </div>

                {lessonSubject === "Bahasa Jepang" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Karakter Jepang (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 自己紹介 (じこしょうかい)"
                      value={lessonJapaneseTitle}
                      onChange={(e) => setLessonJapaneseTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600"
                    />
                  </div>
                )}
              </div>

              {/* Content Type Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jenis Konten Penunjang</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: "text_only", label: "Tulis 📝" },
                    { id: "video", label: "Video 🎬" },
                    { id: "slide", label: "Slide PPT 📽️" },
                    { id: "buku", label: "Buku PDF 📚" },
                    { id: "audio", label: "Suara 🎙️" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLessonContentType(t.id as any)}
                      className={`py-2 px-1 rounded-xl font-bold text-xs border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        lessonContentType === t.id
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span className="text-[10px] font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Embed URLs */}
              {lessonContentType === "video" && (
                <div className="animate-fade-in space-y-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tautan / Upload Video</label>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button type="button" onClick={() => setLessonUploadMethod("url")} className={`px-2 py-1 text-[9px] font-bold rounded-md cursor-pointer ${lessonUploadMethod === "url" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Link Video / YouTube</button>
                      <button type="button" onClick={() => setLessonUploadMethod("file")} className={`px-2 py-1 text-[9px] font-bold rounded-md cursor-pointer ${lessonUploadMethod === "file" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Upload Video</button>
                    </div>
                  </div>

                  {lessonUploadMethod === "url" ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="url"
                          required
                          placeholder="Paste link YouTube (contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/...)"
                          value={lessonVideoUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            // If user pastes full HTML iframe or standard youtube link, auto format
                            if (val.includes("youtube.com") || val.includes("youtu.be") || val.includes("<iframe") || val.includes("vimeo.com")) {
                              setLessonVideoUrl(formatVideoEmbedUrl(val));
                            } else {
                              setLessonVideoUrl(val);
                            }
                          }}
                          onBlur={() => {
                            if (lessonVideoUrl) {
                              setLessonVideoUrl(formatVideoEmbedUrl(lessonVideoUrl));
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          ✓ Otomatis mengonversi semua jenis link YouTube (watch, embed, live, shorts, youtu.be) agar tidak terjadi error &quot;refused to connect&quot;.
                        </span>
                        {lessonVideoUrl && (
                          <button
                            type="button"
                            onClick={() => setLessonVideoUrl("")}
                            className="text-rose-600 hover:underline font-bold shrink-0 ml-2 cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {/* Live Video Preview in Modal */}
                      {lessonVideoUrl && (
                        <div className="mt-2 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 mb-1">
                            <span className="flex items-center gap-1 text-emerald-600">
                              ✓ Pratinjau Video (Siap Ditampilkan di Materi)
                            </span>
                            <a
                              href={getDirectVideoUrl(lessonVideoUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-rose-600 hover:underline flex items-center gap-1 text-[9px] cursor-pointer"
                              title="Buka langsung di YouTube"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              Buka di YouTube
                            </a>
                          </div>
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-black">
                            <iframe
                              src={formatVideoEmbedUrl(lessonVideoUrl)}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              referrerPolicy="strict-origin-when-cross-origin"
                              title="Pratinjau Video Materi"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="video/*"
                        disabled={isFileUploading}
                        onChange={(e) => handleFileUpload(e, setLessonVideoUrl, "video")}
                        className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                      />
                      {lessonVideoUrl && (
                        <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                          <span className="truncate max-w-[240px] font-medium text-[11px]">✓ Video tersimpan di Firebase Storage</span>
                          <button type="button" onClick={() => setLessonVideoUrl("")} className="text-[10px] text-rose-600 hover:underline font-bold ml-2">Ganti</button>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                        <span>⚡ Auto-kompres & integrasi Firebase Storage aktif.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {lessonContentType === "slide" && (
                <div className="animate-fade-in space-y-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tautan / Upload Slide PPT & PDF</label>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button type="button" onClick={() => setLessonUploadMethod("url")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "url" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Link Semat / Google Slide</button>
                      <button type="button" onClick={() => setLessonUploadMethod("file")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "file" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Upload File PPT/PDF</button>
                    </div>
                  </div>
                  
                  {lessonUploadMethod === "url" ? (
                    <>
                      <input
                        type="url"
                        required
                        placeholder="Contoh: https://docs.google.com/presentation/d/.../embed"
                        value={lessonSlidesUrl}
                        onChange={(e) => setLessonSlidesUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">Gunakan link sebaran Google Slide dengan akhiran /embed atau tautan interaktif sejenis.</span>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".ppt,.pptx,.pdf,.odp,.pps,.ppsx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf,image/*"
                        disabled={isFileUploading}
                        onChange={(e) => handleFileUpload(e, setLessonSlidesUrl, "slide")}
                        className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                      />
                      {lessonSlidesUrl && (
                        <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-[11px]">✓ Slide tersimpan di Firebase Storage</span>
                            <a href={lessonSlidesUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-700 underline hover:text-emerald-900 truncate max-w-[160px]">Buka Berkas</a>
                          </div>
                          <button type="button" onClick={() => setLessonSlidesUrl("")} className="text-[10px] text-rose-600 hover:underline font-bold ml-2">Ganti</button>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Format: PPT, PPTX, PDF, ODP, Gambar</span>
                        <span className="text-emerald-600 font-semibold">⚡ Auto-kompres & Firebase Storage</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {lessonContentType === "buku" && (
                <div className="animate-fade-in space-y-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tautan / Upload Buku PDF & Modul</label>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button type="button" onClick={() => setLessonUploadMethod("url")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "url" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Link URL</button>
                      <button type="button" onClick={() => setLessonUploadMethod("file")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "file" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Upload File PDF</button>
                    </div>
                  </div>
                  
                  {lessonUploadMethod === "url" ? (
                    <>
                      <input
                        type="url"
                        required
                        placeholder="Contoh: https://example.com/buku/kurikulum_japanese.pdf"
                        value={lessonBookUrl}
                        onChange={(e) => setLessonBookUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">Tautan rujukan langsung ke server dokumen PDF atau berkas drive publik Anda.</span>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".pdf,application/pdf,.epub,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        disabled={isFileUploading}
                        onChange={(e) => handleFileUpload(e, setLessonBookUrl, "buku PDF")}
                        className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                      />
                      {lessonBookUrl && (
                        <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-[11px]">✓ Buku PDF tersimpan di Firebase Storage</span>
                            <a href={lessonBookUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-700 underline hover:text-emerald-900 truncate max-w-[160px]">Buka Berkas</a>
                          </div>
                          <button type="button" onClick={() => setLessonBookUrl("")} className="text-[10px] text-rose-600 hover:underline font-bold ml-2">Ganti</button>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Format: PDF, EPUB, DOCX</span>
                        <span className="text-emerald-600 font-semibold">⚡ Auto-kompres & Firebase Storage</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {uploadProgressText && (
                <div className={`p-2.5 rounded-xl text-xs font-medium border animate-fade-in ${
                  isFileUploading ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}>
                  <div className="flex items-center gap-2">
                    {isFileUploading && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full" />}
                    <span>{uploadProgressText}</span>
                  </div>
                </div>
              )}

              {lessonContentType === "audio" && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rekaman Suara / Audio</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-4">
                    {lessonAudioData ? (
                      <div className="w-full flex flex-col items-center gap-2">
                        <audio src={lessonAudioData} controls className="w-full max-w-sm" />
                        <button
                          type="button"
                          onClick={() => setLessonAudioData("")}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                        >
                          Hapus Rekaman
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-3">
                        {isRecordingAudio ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                              Sedang Merekam...
                            </div>
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="bg-rose-100 text-rose-700 hover:bg-rose-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2"
                            >
                              <div className="w-3 h-3 bg-rose-700 rounded-sm"></div> Berhenti
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                              type="button"
                              onClick={startRecording}
                              className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 w-full sm:w-auto justify-center"
                            >
                              <Volume2 className="w-4 h-4" /> Mulai Rekam
                            </button>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">ATAU</span>
                            <div className="relative">
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileUpload(e, setLessonAudioData)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <button
                                type="button"
                                className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 w-full sm:w-auto justify-center"
                              >
                                <Upload className="w-4 h-4" /> Upload MP3/Audio
                              </button>
                            </div>
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 text-center max-w-xs">
                          Gunakan mikrofon perangkat Anda untuk merekam suara (misal: pelafalan bahasa Jepang). Rekaman akan disimpan sebagai materi audio.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="lessonIsLockedCheckbox"
                  checked={lessonIsLocked}
                  onChange={(e) => setLessonIsLocked(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="lessonIsLockedCheckbox" className="text-xs text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer">
                  Kunci Materi Ini (Hanya dapat dibuka oleh Sensei/Admin/VIP)
                </label>
              </div>

              {/* Tenggang Waktu & Durasi Pengerjaan */}
              <div className="grid grid-cols-2 gap-3.5 pt-2.5 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tenggang Waktu (Deadline) - Opsional</label>
                  <input
                    type="datetime-local"
                    value={lessonDeadline || ""}
                    onChange={(e) => setLessonDeadline(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Durasi Pengerjaan (Menit) - Opsional</label>
                  <select
                    value={lessonDurationMinutes || ""}
                    onChange={(e) => setLessonDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 cursor-pointer text-slate-700 font-medium"
                  >
                    <option value="">Tanpa Batas Durasi</option>
                    <option value="5">5 Menit</option>
                    <option value="10">10 Menit</option>
                    <option value="15">15 Menit</option>
                    <option value="20">20 Menit</option>
                    <option value="30">30 Menit</option>
                    <option value="45">45 Menit</option>
                    <option value="60">60 Menit (1 Jam)</option>
                    <option value="90">90 Menit (1.5 Jam)</option>
                    <option value="120">120 Menit (2 Jam)</option>
                    <option value="180">180 Menit (3 Jam)</option>
                  </select>
                </div>
              </div>

              {/* Text Area Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {lessonDifficulty === "Tugas" ? "Isi Petunjuk & Deskripsi Tugas" : "Isi Ringkasan Materi & Keterangan"}
                </label>
                <textarea
                  rows={4}
                  placeholder={lessonDifficulty === "Tugas" ? "Ketik detail tugas, instruksi pengerjaan, rincian soal atau rujukan PR di sini..." : "Ketik deskripsi materi, langkah-langkah belajar, kisi-kisi atau terjemahan..."}
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-normal text-slate-700 leading-relaxed focus:outline-emerald-600 whitespace-pre-line"
                />
              </div>

              {/* Footer Actions inside form */}
              <div className="border-t border-slate-100 pt-4.5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsLessonFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLesson}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingLesson ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{lessonDifficulty === "Tugas" ? "Simpan Tugas" : "Simpan Materi"}</span>
                    </>
                  )}
                </button>
              </div>
            </ConfirmForm>

          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm">
                {viewingDoc.title}
              </h4>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 bg-slate-900 flex flex-col items-center justify-center min-h-[50vh] max-h-[70vh] overflow-y-auto gap-4">
              {!viewingDoc.url || (!viewingDoc.url.startsWith('http') && !viewingDoc.url.startsWith('data:')) ? (
                <div className="text-center p-8 bg-slate-800 rounded-2xl border border-slate-700 max-w-sm">
                  <div className="text-amber-500 text-3xl mb-2">⚠️</div>
                  <p className="text-sm font-bold text-slate-200">Berkas tidak tersedia</p>
                  <p className="text-xs text-slate-400 mt-1">Anda belum mengunggah dokumen ini.</p>
                </div>
              ) : viewingDoc.url.includes("application/pdf") || viewingDoc.url.toLowerCase().includes(".pdf") ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center max-w-md w-full">
                    <p className="text-xs text-slate-300 font-bold mb-3">
                      Dokumen ini adalah format PDF.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href={viewingDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Buka PDF di Tab Baru</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadFile(viewingDoc.url, `${viewingDoc.title}.pdf`)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Unduh PDF</span>
                      </button>
                    </div>
                  </div>
                  <iframe
                    src={getEmbeddablePdfUrl(viewingDoc.url)}
                    title="PDF Viewer"
                    className="w-full h-[45vh] bg-white rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="flex flex-wrap gap-3 justify-center items-center w-full">
                    <a
                      href={viewingDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Buka Gambar di Tab Baru</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadFile(viewingDoc.url, `${viewingDoc.title}.jpg`)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Unduh Gambar</span>
                    </button>
                  </div>
                  <div className="w-full overflow-auto flex items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-slate-800 max-h-[50vh]">
                    <img
                      src={viewingDoc.url}
                      alt="Dokumen"
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-[40vh] object-contain rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Deletion Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-fade-in flex flex-col">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-100 animate-pulse">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-display font-extrabold text-slate-950 mb-1.5">
                Konfirmasi Hapus Data
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-[260px] mb-4">
                Apakah Anda yakin ingin menghapus {deleteType === "lesson" ? "materi" : "kuis / soal"} ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              {/* Target Data Preview Box */}
              {deleteTargetName && (
                <div className="w-full bg-slate-50 border border-slate-150 rounded-2xl p-3 text-left mb-6">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Nama {deleteType === "lesson" ? "Materi" : "Kuis / Soal"}
                  </span>
                  <p className="text-xs font-bold text-slate-700 font-sans line-clamp-3 leading-relaxed">
                    {deleteTargetName}
                  </p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setDeleteType(null);
                    setDeleteTargetId(null);
                    setDeleteTargetName("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Ya, Hapus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingAttendancePhoto && (
        <MediaViewerModal
          url={viewingAttendancePhoto}
          title="Foto Bukti Presensi Siswa"
          onClose={() => setViewingAttendancePhoto(null)}
        />
      )}

    </div>
  );
}

