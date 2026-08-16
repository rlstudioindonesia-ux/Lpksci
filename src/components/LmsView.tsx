/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { uploadFileToFirebase, downloadFile, getEmbeddablePdfUrl } from "../lib/storageHelper";
import { ConfirmForm } from "./ConfirmForm";
import { Play, BookOpen, Calendar, HelpCircle, GraduationCap, CheckCircle, Award, 
  AlertCircle, ChevronRight, Check, X, RefreshCw, Clock, Calculator,
  Plus, Trash2, Edit3, Video, FileText, Save, Download, Info, MessageSquare, User, Users, Upload, Eye, ExternalLink,
  Percent, Hash, Brain, Scale, Volume2, Lock, Unlock, ChevronDown, ChevronUp, RotateCcw
, PanelLeftClose, Search, MapPin, Camera, SlidersHorizontal, Bell, ArrowLeft, Star } from "lucide-react";
import { AttendanceRecord, ActiveStudent, UserAccount, LMSLesson, ChapterAssessment, JobOrder } from "../types";
import { CHAPTERS_LIST, MATH_CHAPTERS_LIST } from "../chapters";
import { StudentAttendanceManager } from "./lms/StudentAttendanceManager";
import LmsProgressSegment from "./lms/LmsProgressSegment";
import LmsBabSegment from "./lms/LmsBabSegment";
import LmsDokumenSegment from "./lms/LmsDokumenSegment";
import LmsAbsenSegment from "./lms/LmsAbsenSegment";



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


export const CBTTimer = ({ startTime, durationMinutes, onExpire }: { startTime: number, durationMinutes: number, onExpire: () => void }) => {
  const [timeLeft, setTimeLeft] = React.useState("");
  
  React.useEffect(() => {
    let expired = false;
    const updateTime = () => {
      if (expired) return;
      const now = Date.now();
      const end = startTime + durationMinutes * 60 * 1000;
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Waktu Habis");
        expired = true;
        onExpire();
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        let timeStr = "";
        if (h > 0) timeStr += `${h.toString().padStart(2, '0')}:`;
        timeStr += `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        setTimeLeft(timeStr);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onExpire]);
  
  return (
    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 font-mono font-bold text-sm shadow-sm animate-pulse">
      ⏳ Sisa Waktu CBT: {timeLeft || "Menghitung..."}
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
      (l.targetClass === "Semua" || l.targetClass === currentUser.assignedClass) &&
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
    correctAnswerIndex: 0
  });
  const [quizBatch, setQuizBatch] = React.useState<any[]>([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = React.useState<number>(0);
  const [batchDeadline, setBatchDeadline] = React.useState<string>("");
  const [batchDurationMinutes, setBatchDurationMinutes] = React.useState<number | "">("");
  const [batchTargetClass, setBatchTargetClass] = React.useState<string>("Semua");
  const [selectedPracticePacket, setSelectedPracticePacket] = React.useState("N4_Paket1");
  const [practiceAnswers, setPracticeAnswers] = React.useState<any>({});
  const [studentQuizAnswers, _setStudentQuizAnswers] = React.useState<Record<string, number>>({});
  const [studentQuizEssayAnswers, _setStudentQuizEssayAnswers] = React.useState<Record<string, string>>({});
  const [submittedQuizIds, _setSubmittedQuizIds] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    try {
      const p1 = localStorage.getItem('cbtAnswers');
      if (p1) _setStudentQuizAnswers(JSON.parse(p1));
      const p2 = localStorage.getItem('cbtEssayAnswers');
      if (p2) _setStudentQuizEssayAnswers(JSON.parse(p2));
      const p3 = localStorage.getItem('cbtSubmittedIds');
      if (p3) _setSubmittedQuizIds(JSON.parse(p3));
    } catch(e){}
  }, []);

  const setStudentQuizAnswers = (val: any) => {
    const updated = typeof val === 'function' ? val(studentQuizAnswers) : val;
    _setStudentQuizAnswers(updated);
    localStorage.setItem('cbtAnswers', JSON.stringify(updated));
  };
  
  const setStudentQuizEssayAnswers = (val: any) => {
    const updated = typeof val === 'function' ? val(studentQuizEssayAnswers) : val;
    _setStudentQuizEssayAnswers(updated);
    localStorage.setItem('cbtEssayAnswers', JSON.stringify(updated));
  };
  
  const setSubmittedQuizIds = (val: any) => {
    const updated = typeof val === 'function' ? val(submittedQuizIds) : val;
    _setSubmittedQuizIds(updated);
    localStorage.setItem('cbtSubmittedIds', JSON.stringify(updated));
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

  const [attendanceClassFilter, setAttendanceClassFilter] = React.useState("Semua");
  const [attendanceSenseiFilter, setAttendanceSenseiFilter] = React.useState(() => {
    if (currentUser?.role === "Pengajar" && currentUser?.name) {
      return currentUser.name;
    }
    return "Semua";
  });
  const [attendanceSearchQuery, setAttendanceSearchQuery] = React.useState("");

  const isStaff = ["Pengajar", "Admin", "Admin Super", "Admin Biasa"].includes(currentUser?.role || "");

  const myAttendance = React.useMemo(() => {
    let list = attendanceRecords || [];
    if (!isStaff) {
      const studentId = matchingStudent?.id || currentUser?.studentId || currentUser?.username || "SIS-099";
      list = list.filter((rec: any) => rec.studentId === studentId);
    } else {
      if (attendanceClassFilter !== "Semua") {
        list = list.filter((rec: any) => (rec.class || "").toLowerCase() === attendanceClassFilter.toLowerCase());
      }
      if (attendanceSenseiFilter !== "Semua") {
        list = list.filter((rec: any) => (rec.sensei || "").toLowerCase() === attendanceSenseiFilter.toLowerCase());
      }
      if (attendanceSearchQuery.trim()) {
        const query = attendanceSearchQuery.toLowerCase();
        list = list.filter((rec: any) => 
          (rec.studentName || "").toLowerCase().includes(query) || 
          (rec.studentId || "").toLowerCase().includes(query) ||
          (rec.subject || "").toLowerCase().includes(query) ||
          (rec.status || "").toLowerCase().includes(query)
        );
      }
    }
    return list;
  }, [attendanceRecords, isStaff, matchingStudent, currentUser, attendanceClassFilter, attendanceSenseiFilter, attendanceSearchQuery]);
  
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
    if (sub === "SSW") {
      chapters = entry?.mathChapters || [];
      if (chapters.length === 0) {
        chapters = MATH_CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1, activeDate: "" }));
      }
    } else {
      chapters = entry?.chapters || [];
      if (chapters.length === 0) {
        chapters = CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1, activeDate: "" }));
      }
    }
    
    if (!showAll) {
      return chapters.filter((c: any) => c.isActive !== false);
    }
    return chapters;
  }, [lmsClassesMap]);

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
  const [selectedBabNumber, setSelectedBabNumber] = React.useState<number>(1);
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

  const startRecording = () => {};
  const stopRecording = () => {};
  const handleFileUpload = async (e: any, setter: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsFileUploading(true);
    setLessonError("");
    try {
      const url = await uploadFileToFirebase(file, "lms_materials");
      setter(url);
    } catch (err) {
      console.error(err);
      alert("Gagal upload berkas");
    } finally {
      setIsFileUploading(false);
    }
  };
  const handleGradeSubmit = async (statusOverride?: string | Event) => {
    if (typeof statusOverride === "object" && statusOverride.preventDefault) {
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
      const finalKotoba = Number(scoreKotoba) || 0;
      const finalBumpo = Number(scoreBumpo) || 0;
      const finalKaiwa = Number(scoreKaiwa) || 0;
      const finalKanji = Number(scoreKanji) || 0;
      const computedAverage = Math.round(((finalKotoba + finalBumpo + finalKaiwa + finalKanji) / 4) * 10) / 10;

      let letterGrade = "E";
      if (computedAverage >= 90) letterGrade = "A";
      else if (computedAverage >= 80) letterGrade = "B";
      else if (computedAverage >= 70) letterGrade = "C";
      else if (computedAverage >= 60) letterGrade = "D";

      const payload: any = {
        id: `asses-${viewStudentId}-${selectedBabNumber}-${Date.now()}`,
        studentId: viewStudentId,
        chapterId: `ch-${selectedBabNumber}`,
        chapterNumber: Number(selectedBabNumber),
        subject: assessmentSubject,
        status: submitStatus,
        score: computedAverage,
        grade: letterGrade,
        notes: gradingNotes,
        details: {
          kotoba: finalKotoba,
          bumpo: finalBumpo,
          kaiwa: finalKaiwa,
          kanji: finalKanji
        },
        assessedBy: currentUser?.name || "System",
        assessedDate: new Date().toLocaleDateString("id-ID")
      };

      if (onUpdateState) {
        await onUpdateState("chapterAssessments", "UPDATE", payload);
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
    
    const payload: any = {
      subject: lessonSubject,
      chapterNumber: Number(selectedBabNumber),
      difficulty: lessonDifficulty,
      title: lessonTitle,
      japaneseTitle: lessonJapaneseTitle,
      contentType: lessonContentType,
      uploadMethod: lessonUploadMethod,
      videoUrl: lessonVideoUrl,
      slidesUrl: lessonSlidesUrl,
      bookUrl: lessonBookUrl,
      audioData: lessonAudioData || "",
      content: lessonContent,
      isLocked: lessonIsLocked,
      targetClass: lessonTargetClass,
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
    const lmsClasses = allClasses;
    const classObj = lmsClasses.find((c: any) => (c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase());
    if (!classObj) return;

    const isMath = assessmentSubject === "SSW";
    const activeChapterNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";
    const rawClassActiveChapter = classObj[activeChapterNumKey];
    
    const classActiveChapter = getResolvedChapterNum(cls, rawClassActiveChapter, assessmentSubject);

    const trulyActiveChapters = getClassChaptersList(cls, assessmentSubject, false);
    if (trulyActiveChapters.length === 0) {
      alert("Gagal: Tidak ada bab aktif dalam kurikulum kelas ini.");
      return;
    }

    // Find target chapter position
    const targetIndex = trulyActiveChapters.findIndex((ch: any) => ch.number === chapterNum);
    if (targetIndex === -1) {
      alert("Gagal: Bab ini tidak termasuk dalam kurikulum aktif kelas ini.");
      return;
    }

    // Sequential Check:
    if (classActiveChapter === 0) {
      const firstCh = trulyActiveChapters[0];
      if (chapterNum !== firstCh.number) {
        alert(`Gagal: Pengaktifan bab harus berurutan. Silakan aktifkan Bab ${firstCh.number} terlebih dahulu.`);
        return;
      }
    } else {
      const activeIndex = trulyActiveChapters.findIndex((ch: any) => ch.number === classActiveChapter);
      if (activeIndex !== -1) {
        const nextCh = trulyActiveChapters[activeIndex + 1];
        if (!nextCh) {
          alert("Gagal: Semua bab dalam kurikulum kelas sudah diaktifkan.");
          return;
        }
        if (chapterNum !== nextCh.number) {
          alert(`Gagal: Pengaktifan bab harus berurutan. Silakan aktifkan Bab ${nextCh.number} terlebih dahulu.`);
          return;
        }
      }
    }

    // Determine what exact value to store for activeChapterNum
    let dbValueToSet = chapterNum;

    await handleSetClassActiveChapter(cls, dbValueToSet);
    alert(`Akses Bab ${chapterNum} berhasil diaktifkan! Status pembelajaran aktif.`);
  };

  const handleDeactivateChapterInLms = async (cls: string, chapterNum: number) => {
    if (!onUpdateState) return;
    const lmsClasses = allClasses;
    const classObj = lmsClasses.find((c: any) => (c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase());
    if (!classObj) return;

    const isMath = assessmentSubject === "SSW";
    const activeChapterNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";
    const rawClassActiveChapter = classObj[activeChapterNumKey];
    
    const classActiveChapter = getResolvedChapterNum(cls, rawClassActiveChapter, assessmentSubject);

    if (chapterNum !== classActiveChapter) {
      alert("Gagal: Hanya bab aktif terakhir yang dapat dinonaktifkan.");
      return;
    }

    const trulyActiveChapters = getClassChaptersList(cls, assessmentSubject, false);
    const activeIndex = trulyActiveChapters.findIndex((ch: any) => ch.number === classActiveChapter);
    
    let prevChapterNum = 0;
    if (activeIndex > 0) {
      prevChapterNum = trulyActiveChapters[activeIndex - 1].number;
    }

    let dbValueToSet = prevChapterNum;

    await handleSetClassActiveChapter(cls, dbValueToSet);
    alert(`Akses Bab ${chapterNum} berhasil dinonaktifkan.`);
  };

  const handleToggleChapterActive = async (cls: string, chapterNum: number, currentActive: boolean) => {
    if (!onUpdateState) return;
    const lmsClasses = allClasses;
    const isMath = assessmentSubject === "SSW";
    const chaptersKey = isMath ? "mathChapters" : "chapters";

    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      if ((c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase()) {
        const activeNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";
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
              isActive: !currentActive
            };
          }
          return ch;
        });

        const willBeActive = !currentActive;
        const additionalUpdate: any = {};
        if (willBeActive) {
          additionalUpdate[activeNumKey] = chapterNum;
        } else {
          additionalUpdate[activeNumKey] = Math.max(1, chapterNum - 1);
        }

        return {
          ...c,
          id: classId,
          [chaptersKey]: updatedChapters,
          ...additionalUpdate
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

  const handleUnlockAllChapters = async (cls: string) => {
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
        const updatedChapters = chapters.map((ch: any) => ({
          ...ch,
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
  };

  const handleSetClassActiveChapter = async (cls: string, chapterNum: number) => {
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
              activeDate: ""
            };
          }
          return ch;
        });
        const activeChapterNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";
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
  };

  const getClassChaptersCount = (cls: string, sub: string, showAll: boolean = false) => {
    const chapters = getClassChaptersList(cls, sub, showAll);
    return chapters.length;
  };
  const isSiswaOrAlumni = currentUser?.role === "Siswa" || currentUser?.role === "Alumni";

  const allClasses = React.useMemo(() => {
    // Merge classes from customization and top-level lmsClasses and deduplicate by trimmed name
    const rawList = [...(systemState?.customization?.lmsClasses || []), ...(systemState?.lmsClasses || [])];
    
    // Also extract any classes from activeStudents that aren't in rawList
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
    return rawList.filter(c => {
      const nameKey = (c.name || c.id || "").trim().toLowerCase();
      if (!nameKey || seen.has(nameKey)) return false;
      seen.add(nameKey);
      return true;
    });
  }, [systemState?.lmsClasses, systemState?.customization?.lmsClasses, activeStudents]);

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

  const viewStudentId = selectedStudentId || (currentUser?.studentId || "SIS-001");
  const viewStudent = (filteredActiveStudents || []).find((s: any) => s.id === viewStudentId) || (filteredActiveStudents || [])[0];

  
  const activeStudentClass = React.useMemo(() => {
    if (currentUser?.role === "Pengajar" && (!currentUser?.assignedClass || currentUser?.assignedClass === "Belum Diplot" || currentUser?.assignedClass === "Belum ada kelas")) {
      return null;
    }
    if (isSiswaOrAlumni && matchingStudent?.class) return matchingStudent.class;
    if (viewStudent && !isSiswaOrAlumni) return viewStudent.class;
    if (selectedClassForLms) return selectedClassForLms;
    if (currentUser?.assignedClass) return currentUser?.assignedClass;
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
    if (viewStudentId && selectedBabNumber) {
      const assessment = (chapterAssessments || []).find(
        (a: any) => a.studentId === viewStudentId && a.chapterNumber === Number(selectedBabNumber) && (a.subject || "Bahasa Jepang") === assessmentSubject
      );
      if (assessment) {
        setGradingStatus(assessment.status || "Belum Belajar");
        setScoreKotoba(assessment.details?.kotoba ?? assessment.details?.aritmatika ?? "");
        setScoreBumpo(assessment.details?.bumpo ?? assessment.details?.rasio ?? "");
        setScoreKaiwa(assessment.details?.kaiwa ?? assessment.details?.spasial ?? "");
        setScoreKanji(assessment.details?.kanji ?? assessment.details?.logika ?? "");
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
  }, [viewStudentId, selectedBabNumber, assessmentSubject, chapterAssessments]);

  const hasInitializedBabRef = React.useRef({ studentId: "", subject: "" });

  React.useEffect(() => {
    if (viewStudentId) {
      if (hasInitializedBabRef.current.studentId === viewStudentId && hasInitializedBabRef.current.subject === assessmentSubject) {
        return;
      }
      const targetStudent = activeStudents.find(s => s.id === viewStudentId);
      if (targetStudent) {
        const studentAsss = (studentAssessmentsMap.get(viewStudentId) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
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
  }, [viewStudentId, assessmentSubject, activeStudents, studentAssessmentsMap, allClasses, getClassChaptersList]);


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
  
  // Group into practice packets (10 per packet)
  const practicePackets = [];
  for (let i = 0; i < realQuizzes.length; i += 10) {
    const packetQuestions = realQuizzes.slice(i, i + 10).map((q, idx) => ({
      id: q.id,
      q: q.question,
      options: q.options || [],
      correct: q.correctAnswerIndex || 0,
      desc: "Jawaban yang benar adalah opsi ke-" + ((q.correctAnswerIndex || 0) + 1),
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
      // For essay, we assume correct or maybe no score impact for now, 
      // but let's give partial/full point just for completing it.
      setQuizScore(prev => prev + Math.round(100 / (quizQuestions.length || 1)));
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
    const targetClassForQuiz = activeStudentClass || currentUser?.assignedClass || "";
    const activeChaptersListForQuiz = getClassChaptersList(targetClassForQuiz, assessmentSubject, true);
    const chapter = activeChaptersListForQuiz.find(c => c.number === activeQuizChapterId);
    if (!chapter) {
      setActiveQuizChapterId(null);
      return null;
    }
    const lmsQuizzes = systemState?.lmsQuizzes || [];
    const filteredQuizzes = lmsQuizzes.filter((q: any) => String(q.chapterId) === String(chapter.number) || Number(q.chapterId) === chapter.number);
    const cbtStarted = !!cbtStartTimes[`kuis_ch_${chapter.number}`];
    const isSubmitted = filteredQuizzes.every(q => submittedQuizIds.includes(q.id));
    const isQuizDeadlinePassed = filteredQuizzes[0]?.deadline ? new Date() > new Date(filteredQuizzes[0].deadline) : false;
    const mcqQuizzes = filteredQuizzes.filter(q => q.questionType !== "essay");
    const correctMcqs = mcqQuizzes.filter(q => studentQuizAnswers[q.id] === q.correctAnswerIndex);
    const score = mcqQuizzes.length > 0 ? Math.round((correctMcqs.length / mcqQuizzes.length) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-slate-50 z-[9999] flex flex-col h-[100dvh] w-screen overflow-y-auto">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm sticky top-0 z-50">
           <button onClick={() => setActiveQuizChapterId(null)} className="flex items-center gap-2 p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition">
             <ArrowLeft className="w-5 h-5" />
             <span className="font-bold text-sm">Kembali</span>
           </button>
           <div className="flex-1 text-center font-bold text-sm px-4 truncate text-slate-800">
             Kuis Bab {chapter.number}: {chapter.title}
           </div>
           <div className="w-24"></div>
        </div>
        
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-24">
           {isSubmitted ? (
             <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 text-center shadow-sm">
                <h3 className="text-emerald-800 font-extrabold text-xl mb-2">🎉 Kuis Selesai</h3>
                <p className="text-emerald-700 text-sm mb-4">Anda telah menyelesaikan kuis ini.</p>
                {mcqQuizzes.length > 0 && (
                  <div className="inline-block bg-white border border-emerald-200 rounded-xl px-6 py-4 shadow-sm mb-4">
                     <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Nilai Pilihan Ganda</p>
                     <p className="text-4xl font-black text-slate-800">{score}</p>
                  </div>
                )}
                {filteredQuizzes.some(q => q.questionType === "essay") && (
                  <p className="text-xs text-emerald-600 bg-emerald-100/50 p-3 rounded-xl inline-block font-medium">
                    ✏️ Jawaban essay Anda telah tersimpan dan akan dinilai secara manual oleh Sensei.
                  </p>
                )}
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                  <h3 className="font-bold text-slate-800">Informasi Kuis</h3>
                  <p className="text-xs text-slate-500 mt-1">Jawablah semua pertanyaan di bawah ini dengan tepat.</p>
               </div>
               {filteredQuizzes[0]?.durationMinutes && (
                 <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                   <span className="text-xs font-bold text-slate-600">Sisa Waktu:</span>
                   {cbtStarted ? (
                     <CBTTimer 
                       startTime={cbtStartTimes[`kuis_ch_${chapter.number}`]} 
                       durationMinutes={filteredQuizzes[0].durationMinutes} 
                       onExpire={() => {
                         const allQuizIds = filteredQuizzes.map(q => q.id);
                         const newSubmitted = [...submittedQuizIds];
                         allQuizIds.forEach(id => {
                           if (!newSubmitted.includes(id)) newSubmitted.push(id);
                         });
                         setSubmittedQuizIds(newSubmitted);
                         setCbtStartTimes(prev => ({...prev}));
                       }} 
                     />
                   ) : (
                     <span className="text-sm font-black text-slate-800">{filteredQuizzes[0].durationMinutes}:00</span>
                   )}
                 </div>
               )}
             </div>
           )}

           {(!filteredQuizzes[0]?.durationMinutes || cbtStarted || isSubmitted || currentUser?.role !== "Siswa") ? (
             <div className="space-y-6">
                {filteredQuizzes.map((quiz, idx) => {
                  const isQSubmitted = submittedQuizIds.includes(quiz.id);
                  const selectedAns = studentQuizAnswers[quiz.id];
                  const essayAns = studentQuizEssayAnswers[quiz.id] || "";
                  const isCorrect = selectedAns === quiz.correctAnswerIndex;
                  return (
                    <div key={quiz.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm relative">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">Soal {idx + 1}</span>
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md uppercase">
                          {quiz.questionType === "essay" ? "Essay" : "Pilihan Ganda"}
                        </span>
                      </div>
                      
                      {quiz.imageUrl && (
                        <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={quiz.imageUrl} alt="Gambar Soal Kuis" className="w-full h-auto object-contain" />
                        </div>
                      )}
                      
                      <div className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-indigo-500 focus:bg-white transition disabled:opacity-60"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {(quiz.options || []).map((opt, oIdx) => {
                            const isSelected = selectedAns === oIdx;
                            const isCorrectOpt = oIdx === quiz.correctAnswerIndex;
                            let btnStyle = "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50";
                            if (isQSubmitted) {
                              if (isCorrectOpt) {
                                btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                              } else if (isSelected) {
                                btnStyle = "bg-rose-50 border-rose-300 text-rose-800";
                              } else {
                                btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                              }
                            } else if (isSelected) {
                              btnStyle = "bg-indigo-50 border-indigo-400 text-indigo-700 font-bold";
                            }
                            return (
                              <button
                                key={oIdx}
                                disabled={isQSubmitted || isQuizDeadlinePassed}
                                onClick={() => setStudentQuizAnswers({...studentQuizAnswers, [quiz.id]: oIdx})}
                                className={`px-4 py-3 rounded-xl text-left text-sm transition flex items-start gap-3 cursor-pointer ${btnStyle}`}
                              >
                                <span className="font-black bg-white/50 border border-black/5 text-slate-600 text-[10px] px-2 py-0.5 rounded-md uppercase shrink-0 mt-0.5">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="leading-snug">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {isQSubmitted && quiz.questionType !== "essay" && (
                        <div className={`mt-4 p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          <span>{isCorrect ? "🎉 Jawaban Benar!" : `❌ Kurang Tepat. Jawaban yang benar adalah Opsi ${String.fromCharCode(65 + quiz.correctAnswerIndex)}.`}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isSubmitted && currentUser?.role === "Siswa" && (
                  <div className="flex justify-end pt-4 pb-12">
                    <button
                      onClick={() => {
                        const allQuizIds = filteredQuizzes.map(q => q.id);
                        const newSubmitted = [...submittedQuizIds];
                        allQuizIds.forEach(id => {
                          if (!newSubmitted.includes(id)) newSubmitted.push(id);
                        });
                        setSubmittedQuizIds(newSubmitted);
                      }}
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer transition active:scale-95"
                    >
                      Finish Attempt (Submit)
                    </button>
                  </div>
                )}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Siap untuk memulai?</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm">Waktu Anda akan dihitung mundur setelah Anda menekan tombol di bawah ini. Pastikan Anda memiliki koneksi internet yang stabil.</p>
                <button 
                  onClick={() => handleStartCbt(`kuis_ch_${chapter.number}`)} 
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer transition active:scale-95"
                >
                  Start Attempt
                </button>
             </div>
           )}
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
        {activeSubTab === "bab" && (!isSiswaOrAlumni || isClassActive) && <LmsBabSegment activeStudentClass={activeStudentClass} activeStudents={activeStudents} allClasses={allClasses} assessmentSubject={assessmentSubject} cbtStartTimes={cbtStartTimes} chapterAssessments={chapterAssessments} currentUser={currentUser} expandedLessons={expandedLessons} filteredActiveStudents={filteredActiveStudents} getClassChaptersCount={getClassChaptersCount} getClassChaptersList={getClassChaptersList} getResolvedChapterNum={getResolvedChapterNum} handleActivateChapterInLms={handleActivateChapterInLms} handleDeactivateChapterInLms={handleDeactivateChapterInLms} handleLessonDelete={handleLessonDelete} handleOpenEditLesson={handleOpenEditLesson} handleStartCbt={handleStartCbt} isAlumniClass={isAlumniClass} isSidebarCollapsed={isSidebarCollapsed} isSiswaOrAlumni={isSiswaOrAlumni} lmsLessons={lmsLessons} onUpdateState={onUpdateState} selectedBabNumber={selectedBabNumber} selectedClassFilter={selectedClassFilter} selectedStudentId={selectedStudentId} setActiveQuizChapterId={setActiveQuizChapterId} setActiveSubTab={setActiveSubTab} setBatchDeadline={setBatchDeadline} setBatchDurationMinutes={setBatchDurationMinutes} setBatchTargetClass={setBatchTargetClass} setCbtStartTimes={setCbtStartTimes} setEvalSelectedLessonId={setEvalSelectedLessonId} setIsLessonFormOpen={setIsLessonFormOpen} setIsQuizFormOpen={setIsQuizFormOpen} setIsSidebarCollapsed={setIsSidebarCollapsed} setLessonBookUrl={setLessonBookUrl} setLessonContent={setLessonContent} setLessonContentType={setLessonContentType} setLessonDeadline={setLessonDeadline} setLessonDifficulty={setLessonDifficulty} setLessonDurationMinutes={setLessonDurationMinutes} setLessonError={setLessonError} setLessonIsLocked={setLessonIsLocked} setLessonJapaneseTitle={setLessonJapaneseTitle} setLessonSlidesUrl={setLessonSlidesUrl} setLessonSubject={setLessonSubject} setLessonTargetClass={setLessonTargetClass} setLessonTitle={setLessonTitle} setLessonVideoUrl={setLessonVideoUrl} setNewQuiz={setNewQuiz} setPdfViewerUrl={setPdfViewerUrl} setProgressTabMode={setProgressTabMode} setQuizBatch={setQuizBatch} setSelectedBabNumber={setSelectedBabNumber} setSelectedBatchIndex={setSelectedBatchIndex} setSelectedLessonToEdit={setSelectedLessonToEdit} setSelectedStudentId={setSelectedStudentId} setShowAllChapters={setShowAllChapters} setSubmittingLessons={setSubmittingLessons} showAllChapters={showAllChapters} studentAssessmentsMap={studentAssessmentsMap} submittedQuizIds={submittedQuizIds} submittingLessons={submittingLessons} systemState={systemState} toggleLessonExpanded={toggleLessonExpanded} />}
        {/* SUBTAB DOKUMEN: 17 Dokumen Persyaratan & Akademik */}
        {activeSubTab === "dokumen" && <LmsDokumenSegment currentUser={currentUser} onUpdateState={onUpdateState} setViewingDoc={setViewingDoc} systemState={systemState} />}

        {/* SUBTAB PROGRESS: Khusus Staf Sensei */}
        {activeSubTab === "progress" && (currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && <LmsProgressSegment assessmentSubject={assessmentSubject} attendanceRecords={attendanceRecords} babCurrentPage={babCurrentPage} chapterAssessments={chapterAssessments} currentUser={currentUser} evalSelectedBabId={evalSelectedBabId} evalSelectedLessonId={evalSelectedLessonId} filteredActiveStudents={filteredActiveStudents} getClassChaptersCount={getClassChaptersCount} gradingNotes={gradingNotes} handleGradeSubmit={handleGradeSubmit} isAlumniClass={isAlumniClass} isGradingSubmitting={isGradingSubmitting} isReadOnlyView={isReadOnlyView} isVvipOrAdmin={isVvipOrAdmin} itemsPerPage={itemsPerPage} lmsLessons={lmsLessons} onUpdateState={onUpdateState} paginatedBabStudents={paginatedBabStudents} paginatedTugasStudents={paginatedTugasStudents} progressTabMode={progressTabMode} scoreBumpo={scoreBumpo} scoreKaiwa={scoreKaiwa} scoreKanji={scoreKanji} scoreKotoba={scoreKotoba} selectedClassFilter={selectedClassFilter} selectedStudentId={selectedStudentId} setAssessmentSubject={setAssessmentSubject} setBabCurrentPage={setBabCurrentPage} setEvalSelectedBabId={setEvalSelectedBabId} setEvalSelectedLessonId={setEvalSelectedLessonId} setGradingNotes={setGradingNotes} setPdfViewerUrl={setPdfViewerUrl} setProgressTabMode={setProgressTabMode} setScoreBumpo={setScoreBumpo} setScoreKaiwa={setScoreKaiwa} setScoreKanji={setScoreKanji} setScoreKotoba={setScoreKotoba} setSelectedStudentId={setSelectedStudentId} setTugasCurrentPage={setTugasCurrentPage} setTugasGrades={setTugasGrades} setTugasGradingSubmitting={setTugasGradingSubmitting} setTugasNotes={setTugasNotes} setTugasScores={setTugasScores} studentAttendanceMap={studentAttendanceMap} systemState={systemState} totalBabPages={totalBabPages} totalTugasPages={totalTugasPages} tugasCurrentPage={tugasCurrentPage} tugasGradingSubmitting={tugasGradingSubmitting} tugasNotes={tugasNotes} tugasScores={tugasScores} />}
      </div>

      {/* SENSEI ACCORDION FORM DIALOG MODAL (ADD / EDIT LESSON) */}
      {isQuizFormOpen && (() => {
        const currentQuiz = quizBatch[selectedBatchIndex] || {
          subject: "Bahasa Jepang",
          questionType: "pilihan_ganda",
          question: "",
          options: ["", "", "", ""],
          correctAnswerIndex: 0,
          chapterNumber: undefined,
          deadline: "",
          durationMinutes: "",
          imageUrl: "",
          videoUrl: "",
          audioUrl: ""
        };

        return (
          <div className="fixed inset-0 z-[10000] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
              <div className="bg-slate-50 border-b border-slate-100 p-4 sm:p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900">Tambah Banyak Soal Kuis (Batch)</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Buat beberapa soal sekaligus dalam satu pop-up</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQuizFormOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Horizontal Question Navigation Tabs */}
              <div className="bg-slate-50/50 border-b border-slate-150 px-4 sm:px-6 py-2.5 overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono select-none mr-1 shrink-0">Daftar Soal ({quizBatch.length}):</span>
                {quizBatch.map((q, idx) => {
                  const isActive = idx === selectedBatchIndex;
                  const isQEmpty = !q.question?.trim();
                  return (
                    <div key={idx} className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedBatchIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-sm border-transparent"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isQEmpty ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                        <span>Soal {idx + 1}</span>
                      </button>
                      {quizBatch.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedBatch = quizBatch.filter((_, i) => i !== idx);
                            setQuizBatch(updatedBatch);
                            setSelectedBatchIndex(prev => {
                              if (prev >= updatedBatch.length) {
                                return updatedBatch.length - 1;
                              }
                              return prev;
                            });
                          }}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition shrink-0 cursor-pointer"
                          title="Hapus soal ini"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    const template = {
                      subject: currentQuiz.subject || "Bahasa Jepang",
                      questionType: "pilihan_ganda",
                      question: "",
                      options: ["", "", "", ""],
                      correctAnswerIndex: 0,
                      chapterNumber: currentQuiz.chapterNumber,
                      deadline: currentQuiz.deadline || "",
                      durationMinutes: currentQuiz.durationMinutes || "",
                      imageUrl: "",
                      videoUrl: "",
                      audioUrl: ""
                    };
                    setQuizBatch(prev => [...prev, template]);
                    setSelectedBatchIndex(quizBatch.length);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Soal</span>
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-left flex-1">
                {/* Pengaturan Kuis Keseluruhan (Global Settings) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                    <span className="text-base">⏳</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Tenggang Waktu &amp; Durasi Kuis (Global)</h4>
                      <p className="text-[10px] text-slate-500">Waktu penyelesaian ini berlaku untuk keseluruhan soal kuis dalam sesi ini</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Tenggang Waktu (Deadline)</label>
                      <input
                        type="datetime-local"
                        value={batchDeadline || ""}
                        onChange={(e) => setBatchDeadline(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Durasi Kuis (Menit)</label>
                      <select
                        value={batchDurationMinutes || ""}
                        onChange={(e) => setBatchDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:border-emerald-500 outline-none cursor-pointer text-slate-800 font-medium"
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Kelas Sasaran (Target)</label>
                      <select
                        value={batchTargetClass}
                        onChange={(e) => setBatchTargetClass(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:border-emerald-500 outline-none cursor-pointer text-slate-800 font-semibold"
                      >
                        <option value="Semua">Semua Kelas</option>
                        {officialClasses.map((c: any) => (
                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-3 mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">✍️ Mengedit: <strong className="font-bold">Soal #{selectedBatchIndex + 1}</strong></span>
                  <span className="text-[10px] text-slate-500 font-mono">Lampiran Media tersimpan otomatis di Firebase Storage</span>
                </div>

                {/* Lampiran Media (Opsional) - Pindah ke Atas */}
                <div className="space-y-3 p-4 bg-slate-50/60 border border-slate-200 rounded-2xl">
                  <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <span>📎 Lampiran Media Soal #{selectedBatchIndex + 1} (Opsional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Pratinjau langsung di bawah ini)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Upload Gambar */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2 text-left shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">🖼️ Gambar</span>
                        {currentQuiz.imageUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center">
                            <img src={currentQuiz.imageUrl} alt="Quiz Attachment" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => {
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], imageUrl: "" };
                                  return copy;
                                });
                              }}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">Belum ada gambar yang dilampirkan</div>
                        )}
                      </div>
                      {!currentQuiz.imageUrl && (
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
                                copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], imageUrl: url };
                                return copy;
                              });
                            } catch (err) {
                              console.error(err);
                              alert("Gagal upload gambar");
                            } finally {
                              setIsFileUploading(false);
                            }
                          }}
                          className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 disabled:opacity-50 cursor-pointer"
                        />
                      )}
                    </div>

                    {/* Upload Video */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2 text-left shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">🎬 Video</span>
                        {currentQuiz.videoUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center">
                            <video src={currentQuiz.videoUrl} controls className="max-h-full max-w-full" />
                            <button
                              type="button"
                              onClick={() => {
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], videoUrl: "" };
                                  return copy;
                                });
                              }}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">Belum ada video yang dilampirkan</div>
                        )}
                      </div>
                      {!currentQuiz.videoUrl && (
                        <input
                          type="file"
                          accept="video/*"
                          disabled={isFileUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsFileUploading(true);
                            try {
                              const url = await uploadFileToFirebase(file, "lms_quizzes");
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], videoUrl: url };
                                return copy;
                              });
                            } catch (err) {
                              console.error(err);
                              alert("Gagal upload video");
                            } finally {
                              setIsFileUploading(false);
                            }
                          }}
                          className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 disabled:opacity-50 cursor-pointer"
                        />
                      )}
                    </div>

                    {/* Upload Suara */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2 text-left shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">🎙️ Suara (Audio)</span>
                        {currentQuiz.audioUrl ? (
                          <div className="relative rounded-lg p-2 border border-slate-200 bg-white flex flex-col items-center gap-1">
                            <audio src={currentQuiz.audioUrl} controls className="w-full h-8" />
                            <button
                              type="button"
                              onClick={() => {
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], audioUrl: "" };
                                  return copy;
                                });
                              }}
                              className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition cursor-pointer"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">Belum ada rekaman suara yang dilampirkan</div>
                        )}
                      </div>
                      {!currentQuiz.audioUrl && (
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
                                copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], audioUrl: url };
                                return copy;
                              });
                            } catch (err) {
                              console.error(err);
                              alert("Gagal upload audio");
                            } finally {
                              setIsFileUploading(false);
                            }
                          }}
                          className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 disabled:opacity-50 cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                  {isFileUploading && (
                    <p className="text-[10px] text-amber-600 font-bold animate-pulse text-left mt-2">⚡ Sedang mengunggah berkas kuis ke Firebase Storage... Mohon tunggu.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Mata Pelajaran</label>
                    <select 
                      value={currentQuiz.subject}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuizBatch(prev => {
                          const copy = [...prev];
                          copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], subject: val };
                          return copy;
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="Bahasa Jepang">🇯🇵 Bahasa Jepang</option>
                      <option value="SSW">📐 SSW (SSW)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Jenis Soal</label>
                    <select 
                      value={currentQuiz.questionType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuizBatch(prev => {
                          const copy = [...prev];
                          copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], questionType: val };
                          return copy;
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="pilihan_ganda">Pilihan Ganda</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Pertanyaan</label>
                  <textarea 
                    value={currentQuiz.question}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuizBatch(prev => {
                        const copy = [...prev];
                        copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], question: val };
                        return copy;
                      });
                    }}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:border-blue-500 outline-none resize-none"
                    placeholder="Ketik pertanyaan di sini..."
                  />
                </div>

                {currentQuiz.questionType === "pilihan_ganda" && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700">Pilihan Jawaban</label>
                    {(currentQuiz.options || ["", "", "", ""]).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name={`correctAnswer-${selectedBatchIndex}`}
                          checked={currentQuiz.correctAnswerIndex === i}
                          onChange={() => {
                            setQuizBatch(prev => {
                              const copy = [...prev];
                              copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], correctAnswerIndex: i };
                              return copy;
                            });
                          }}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuizBatch(prev => {
                              const copy = [...prev];
                              const newOpts = [...(copy[selectedBatchIndex].options || ["", "", "", ""])];
                              newOpts[i] = val;
                              copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], options: newOpts };
                              return copy;
                            });
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm focus:border-emerald-500 outline-none"
                          placeholder={'Opsi ' + (i + 1)}
                        />
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-500 italic">* Pilih radio button untuk menandai jawaban yang benar.</p>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 border-t border-slate-100 p-4 sm:p-6 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] text-slate-500 font-mono text-center sm:text-left">
                  Menyimpan <span className="font-extrabold text-emerald-600">{quizBatch.filter(q => q.question?.trim()).length}</span> dari <span className="font-extrabold">{quizBatch.length}</span> soal yang valid.
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsQuizFormOpen(false)}
                    className="flex-1 sm:flex-none border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isFileUploading || quizBatch.filter(q => q.question?.trim()).length === 0}
                    onClick={async () => {
                      if (onUpdateState) {
                        const validQuizzes = quizBatch.filter(q => q.question?.trim());
                        for (const q of validQuizzes) {
                          const id = "QZ-" + Math.floor(Math.random() * 10000);
                          const payload = { 
                            ...q, 
                            id,
                            targetClass: batchTargetClass,
                            deadline: batchDeadline,
                            durationMinutes: batchDurationMinutes
                          };
                          await onUpdateState('lmsQuizzes', 'add', payload);
                        }
                      }
                      setIsQuizFormOpen(false);
                    }}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>Simpan Semua Soal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tautan / Upload Video</label>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button type="button" onClick={() => setLessonUploadMethod("url")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "url" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Link Semat</button>
                      <button type="button" onClick={() => setLessonUploadMethod("file")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "file" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Upload File</button>
                    </div>
                  </div>

                  {lessonUploadMethod === "url" ? (
                    <>
                      <input
                        type="url"
                        required
                        placeholder="Contoh: https://www.youtube.com/embed/dQw4w9WgXcQ"
                        value={lessonVideoUrl}
                        onChange={(e) => setLessonVideoUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">Harap gunakan format link embed mandiri demi menghindari blokir iframe oleh browser.</span>
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="video/*"
                        disabled={isFileUploading}
                        onChange={(e) => handleFileUpload(e, setLessonVideoUrl)}
                        className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                      />
                      {isFileUploading ? (
                        <span className="text-[9px] text-amber-600 font-bold block mt-1 animate-pulse">⚡ Mengunggah & mengompres berkas video... Mohon tunggu...</span>
                      ) : (
                        <span className="text-[9px] text-slate-400 block mt-1">Pilih file Video dari perangkat Anda. (Max 2MB direkomendasikan untuk upload lokal)</span>
                      )}
                    </>
                  )}
                </div>
              )}

              {lessonContentType === "slide" && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Link Semat / Embed Google Slides URL</label>
                  <input
                    type="url"
                    required
                    placeholder="Contoh: https://docs.google.com/presentation/d/.../embed"
                    value={lessonSlidesUrl}
                    onChange={(e) => setLessonSlidesUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                  <span className="text-[9px] text-slate-400 block mt-1">Gunakan link sebaran Google Slide dengan akhiran /embed atau tautan interaktif sejenis.</span>
                </div>
              )}

              {lessonContentType === "buku" && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tautan / Upload Buku PDF</label>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button type="button" onClick={() => setLessonUploadMethod("url")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "url" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Link Tautan</button>
                      <button type="button" onClick={() => setLessonUploadMethod("file")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "file" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Upload File</button>
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
                    <>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        disabled={isFileUploading}
                        onChange={(e) => handleFileUpload(e, setLessonBookUrl)}
                        className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                      />
                      {isFileUploading ? (
                        <span className="text-[9px] text-amber-600 font-bold block mt-1 animate-pulse">⚡ Mengunggah & mengompres dokumen PDF... Mohon tunggu...</span>
                      ) : (
                        <span className="text-[9px] text-slate-400 block mt-1">Pilih file PDF dari perangkat Anda. File berukuran besar mungkin tidak didukung.</span>
                      )}
                    </>
                  )}
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewingAttendancePhoto(null)}>
          <div className="bg-white rounded-3xl p-4 max-w-md w-full shadow-2xl relative space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                <span>📷</span> Foto Bukti Presensi
              </h4>
              <button
                onClick={() => setViewingAttendancePhoto(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[220px] max-h-[65vh]">
              <img
                src={viewingAttendancePhoto}
                alt="Foto Absen"
                className="max-h-[63vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="text-center pt-1">
              <button
                onClick={() => setViewingAttendancePhoto(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

