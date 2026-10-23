import React from "react";
import { findStudentForUser } from "../../lib/recordMatching";
import { AlertTriangle, Award, BookOpen, Calculator, ChevronDown, ChevronUp, Download, Edit3, ExternalLink, Eye, FileText, GraduationCap, Lock, PanelLeftClose, Plus, RefreshCw, Trash2, Unlock, Upload, Volume2, X } from "lucide-react";
import { downloadFile, uploadFileToFirebase, getEmbeddablePdfUrl } from "../../lib/storageHelper";
import { isAlumniClassName } from "../../lib/alumniStatus";
import { CBTTimer } from "../LmsView";
import StudentQuizReviewModal from "./StudentQuizReviewModal";
import { formatVideoEmbedUrl, getDirectVideoUrl, isYouTubeOrStreamingUrl } from "../../lib/videoHelper";
import { isSameSubject, isMathSubject } from "../../lib/subjectHelper";

interface LmsBabSegmentProps {
  activeStudentClass: any;
  activeStudents: any;
  allClasses: any;
  assessmentSubject: any;
  cbtStartTimes: any;
  chapterAssessments: any;
  currentUser: any;
  expandedLessons: any;
  filteredActiveStudents: any;
  getClassChaptersCount: any;
  getClassChaptersList: any;
  getResolvedChapterNum: any;
  handleActivateChapterInLms: any;
  handleAddMandiriChapter: any;
  handleEditMandiriChapter?: any;
  handleDeleteMandiriChapter?: any;
  handleDeactivateChapterInLms: any;
  handleLessonDelete: any;
  handleOpenEditLesson: any;
  handleStartCbt: any;
  handleRetakeQuiz?: any;
  isAlumniClass: any;
  isSidebarCollapsed: any;
  isSiswaOrAlumni: any;
  lmsLessons: any;
  onUpdateState: any;
  selectedBabNumber: any;
  selectedClassFilter: any;
  batchChapterNumber?: number;
  setBatchChapterNumber?: (ch: number) => void;
  batchSubject?: string;
  setBatchSubject?: (subj: string) => void;
  batchSubTitle?: string;
  setBatchSubTitle?: (val: string) => void;
  batchLessonId?: string;
  setBatchLessonId?: (val: string) => void;
  activeQuizSubTitle?: string | null;
  setActiveQuizSubTitle?: (val: string | null) => void;
  selectedStudentId: any;
  setActiveQuizChapterId: any;
  setActiveSubTab: any;
  setBatchDeadline: any;
  setBatchDurationMinutes: any;
  setBatchTargetClass: any;
  setCbtStartTimes: any;
  setEvalSelectedLessonId: any;
  setIsLessonFormOpen: any;
  setIsQuizFormOpen: any;
  setIsSidebarCollapsed: any;
  setLessonBookUrl: any;
  setLessonContent: any;
  setLessonContentType: any;
  setLessonDeadline: any;
  setLessonDifficulty: any;
  setLessonDurationMinutes: any;
  setLessonError: any;
  setLessonIsLocked: any;
  setLessonJapaneseTitle: any;
  setLessonSlidesUrl: any;
  setLessonSubject: any;
  setLessonTargetClass: any;
  setLessonTitle: any;
  setLessonVideoUrl: any;
  setNewQuiz: any;
  setPdfViewerUrl: any;
  setProgressTabMode: any;
  setQuizBatch: any;
  setSelectedBabNumber: any;
  setSelectedBatchIndex: any;
  setSelectedLessonToEdit: any;
  setSelectedStudentId: any;
  setShowAllChapters: any;
  setSubmittingLessons: any;
  showAllChapters: any;
  studentAssessmentsMap: any;
  submittedQuizIds: any;
  submittingLessons: any;
  systemState: any;
  toggleLessonExpanded: any;
}

export default function LmsBabSegment({ activeStudentClass, activeStudents, allClasses, assessmentSubject, batchChapterNumber, setBatchChapterNumber, batchSubject, setBatchSubject, batchSubTitle, setBatchSubTitle, batchLessonId, setBatchLessonId, activeQuizSubTitle, setActiveQuizSubTitle, cbtStartTimes, chapterAssessments, currentUser, expandedLessons, filteredActiveStudents, getClassChaptersCount, getClassChaptersList, getResolvedChapterNum, handleActivateChapterInLms, handleAddMandiriChapter, handleEditMandiriChapter, handleDeleteMandiriChapter, handleDeactivateChapterInLms, handleLessonDelete, handleOpenEditLesson, handleStartCbt, handleRetakeQuiz, isAlumniClass, isSidebarCollapsed, isSiswaOrAlumni, lmsLessons, onUpdateState, selectedBabNumber, selectedClassFilter, selectedStudentId, setActiveQuizChapterId, setActiveSubTab, setBatchDeadline, setBatchDurationMinutes, setBatchTargetClass, setCbtStartTimes, setEvalSelectedLessonId, setIsLessonFormOpen, setIsQuizFormOpen, setIsSidebarCollapsed, setLessonBookUrl, setLessonContent, setLessonContentType, setLessonDeadline, setLessonDifficulty, setLessonDurationMinutes, setLessonError, setLessonIsLocked, setLessonJapaneseTitle, setLessonSlidesUrl, setLessonSubject, setLessonTargetClass, setLessonTitle, setLessonVideoUrl, setNewQuiz, setPdfViewerUrl, setProgressTabMode, setQuizBatch, setSelectedBabNumber, setSelectedBatchIndex, setSelectedLessonToEdit, setSelectedStudentId, setShowAllChapters, setSubmittingLessons, showAllChapters, studentAssessmentsMap, submittedQuizIds, submittingLessons, systemState, toggleLessonExpanded }: LmsBabSegmentProps) {
  const [pendingTugasFiles, setPendingTugasFiles] = React.useState<Record<string, File | null>>({});
  const [reviewModalStudent, setReviewModalStudent] = React.useState<any>(null);
  const [reviewModalChapter, setReviewModalChapter] = React.useState<any>(null);
  const [reviewModalQuizzes, setReviewModalQuizzes] = React.useState<any[]>([]);
  const [reviewModalAssessment, setReviewModalAssessment] = React.useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState<boolean>(false);
  const [quizChoiceModalChapter, setQuizChoiceModalChapter] = React.useState<any>(null);
  const [newSubTitleInput, setNewSubTitleInput] = React.useState<string>("");
  const [selectedSubLessonId, setSelectedSubLessonId] = React.useState<string>("");
  const [senseiChapterTab, setSenseiChapterTab] = React.useState<"all" | "rekap" | "materi">("all");

  const [isMandiriModalOpen, setIsMandiriModalOpen] = React.useState<boolean>(false);
  const [editingMandiriChapter, setEditingMandiriChapter] = React.useState<any | null>(null);
  const [mandiriTargetClass, setMandiriTargetClass] = React.useState<string>("");
  const [mandiriChapterNumber, setMandiriChapterNumber] = React.useState<number>(1);
  const [mandiriTitle, setMandiriTitle] = React.useState<string>("");
  const [mandiriJapaneseTitle, setMandiriJapaneseTitle] = React.useState<string>("");
  const [mandiriDescription, setMandiriDescription] = React.useState<string>("");
  const [mandiriApplyToAll, setMandiriApplyToAll] = React.useState<boolean>(true);
  const [isSavingMandiri, setIsSavingMandiri] = React.useState<boolean>(false);

  // Mandiri Chapter Delete Confirmation Modal state
  const [mandiriChapterToDelete, setMandiriChapterToDelete] = React.useState<{ chapter: any; targetClass: string } | null>(null);
  const [isDeletingMandiri, setIsDeletingMandiri] = React.useState<boolean>(false);
  const [mandiriDeleteError, setMandiriDeleteError] = React.useState<string | null>(null);

  const handleOpenMandiriModal = (targetCls: string) => {
    const cls = targetCls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "";
    const existingChapters = getClassChaptersList(cls, assessmentSubject, true);
    const maxNum = existingChapters.reduce((max: number, ch: any) => Math.max(max, Number(ch.number) || 0), 0);
    const nextNum = maxNum + 1;

    setEditingMandiriChapter(null);
    setMandiriTargetClass(cls);
    setMandiriChapterNumber(nextNum);
    setMandiriTitle(`Bab ${nextNum}: `);
    setMandiriJapaneseTitle("");
    setMandiriDescription("Bab pembelajaran mandiri yang ditambahkan langsung oleh pengajar.");
    setMandiriApplyToAll(true);
    setIsMandiriModalOpen(true);
  };

  const isChapterMandiri = React.useCallback((ch: any): boolean => {
    if (!ch) return false;
    if (ch.isMandiri === true) return true;
    const num = Number(ch.number) || 0;
    return assessmentSubject === "SSW" ? num > 25 : num > 35;
  }, [assessmentSubject]);

  const handleOpenEditMandiriModal = (targetCls: string, chapter: any) => {
    const cls = targetCls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "";
    setEditingMandiriChapter(chapter);
    setMandiriTargetClass(cls);
    setMandiriChapterNumber(Number(chapter.number) || 1);
    setMandiriTitle(chapter.title || "");
    setMandiriJapaneseTitle(chapter.japaneseTitle || "");
    setMandiriDescription(chapter.description || "");
    setMandiriApplyToAll(true);
    setIsMandiriModalOpen(true);
  };

  const handleDeleteMandiriClick = (targetCls: string, chapter: any) => {
    if (!isChapterMandiri(chapter)) {
      setMandiriDeleteError("Bab ini adalah Bab Kurikulum Standar dan tidak dapat dihapus. Hanya Bab Tambahan Mandiri yang dapat dihapus.");
      return;
    }
    const cls = targetCls || activeStudentClass || selectedClassFilter || allClasses[0]?.name || "";
    setMandiriDeleteError(null);
    setMandiriChapterToDelete({ chapter, targetClass: cls });
  };

  const handleConfirmDeleteMandiri = async () => {
    if (!mandiriChapterToDelete) return;
    const { chapter, targetClass } = mandiriChapterToDelete;
    setIsDeletingMandiri(true);
    try {
      if (handleDeleteMandiriChapter) {
        await handleDeleteMandiriChapter(targetClass, Number(chapter.number));
      }
      setMandiriChapterToDelete(null);
    } catch (err) {
      console.error("Error deleting mandiri chapter:", err);
    } finally {
      setIsDeletingMandiri(false);
    }
  };

  const handleSaveMandiriModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mandiriTitle.trim()) {
      return;
    }
    setIsSavingMandiri(true);
    try {
      if (editingMandiriChapter && handleEditMandiriChapter) {
        const success = await handleEditMandiriChapter(mandiriTargetClass, editingMandiriChapter.number, {
          number: Number(mandiriChapterNumber) || editingMandiriChapter.number,
          title: mandiriTitle.trim(),
          japaneseTitle: mandiriJapaneseTitle.trim() || "Bab Mandiri",
          description: mandiriDescription.trim() || "Bab pembelajaran mandiri yang ditambahkan langsung oleh pengajar.",
          applyToAll: mandiriApplyToAll
        });
        if (success) {
          setIsMandiriModalOpen(false);
          setEditingMandiriChapter(null);
        }
      } else {
        const success = await handleAddMandiriChapter(mandiriTargetClass, {
          number: Number(mandiriChapterNumber) || 1,
          title: mandiriTitle.trim(),
          japaneseTitle: mandiriJapaneseTitle.trim() || "Bab Mandiri",
          description: mandiriDescription.trim() || "Bab pembelajaran mandiri yang ditambahkan langsung oleh pengajar.",
          applyToAll: mandiriApplyToAll
        });
        if (success) {
          setIsMandiriModalOpen(false);
        }
      }
    } catch (err) {
      console.error("Error saving mandiri chapter:", err);
    } finally {
      setIsSavingMandiri(false);
    }
  };

  const handleStartNewSubQuiz = (targetChapter: any, initialSubTitle?: string, initialLessonId?: string) => {
    const chNum = targetChapter.number;
    const defaultSub = initialSubTitle || `Sub 1: Kuis Materi Bab ${chNum}`;
    const defaultBlank = {
      id: "QZ-" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      subject: assessmentSubject || "Bahasa Jepang",
      questionType: "pilihan_ganda",
      question: "",
      options: ["", "", "", ""],
      correctAnswerIndex: 0,
      correctAnswerIndices: [0],
      allowMultipleAnswers: false,
      correctAnswerEssay: "",
      correctAnswerText: "",
      chapterNumber: chNum,
      chapterId: chNum,
      subTitle: defaultSub,
      lessonId: initialLessonId || "",
      deadline: "",
      durationMinutes: "",
      targetClass: activeStudentClass || "Semua",
      imageUrl: "",
      videoUrl: "",
      audioUrl: ""
    };
    setNewQuiz(defaultBlank);
    setQuizBatch([defaultBlank]);
    setSelectedBatchIndex(0);
    setBatchDeadline("");
    setBatchDurationMinutes("");
    setBatchTargetClass(activeStudentClass || "Semua");
    if (setBatchSubTitle) setBatchSubTitle(defaultSub);
    if (setBatchLessonId) setBatchLessonId(initialLessonId || "");
    setSelectedBabNumber(chNum);
    if (setBatchChapterNumber) setBatchChapterNumber(chNum);
    if (setBatchSubject) setBatchSubject(assessmentSubject || "Bahasa Jepang");
    setQuizChoiceModalChapter(null);
    setIsQuizFormOpen(true);
  };

  const handleOpenEditSubQuiz = (targetChapter: any, sub: any) => {
    const chNum = targetChapter.number;
    const loaded = (sub.quizzes || []).map((q: any) => {
      const cIndices = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
        ? q.correctAnswerIndices.map(Number)
        : (q.correctAnswerIndex !== undefined ? [Number(q.correctAnswerIndex)] : [0]);
      return {
        ...q,
        chapterNumber: chNum,
        options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["", "", "", ""],
        correctAnswerIndex: cIndices[0] !== undefined ? cIndices[0] : (q.correctAnswerIndex !== undefined ? Number(q.correctAnswerIndex) : 0),
        correctAnswerIndices: cIndices,
        allowMultipleAnswers: !!q.allowMultipleAnswers || q.questionType === "pilihan_ganda_kompleks" || cIndices.length > 1,
      };
    });
    const defaultBlank = {
      id: "QZ-" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      subject: assessmentSubject || "Bahasa Jepang",
      questionType: "pilihan_ganda",
      question: "",
      options: ["", "", "", ""],
      correctAnswerIndex: 0,
      correctAnswerIndices: [0],
      allowMultipleAnswers: false,
      correctAnswerEssay: "",
      correctAnswerText: "",
      chapterNumber: chNum,
      chapterId: chNum,
      subTitle: sub.subTitle,
      lessonId: sub.lessonId || "",
      deadline: sub.deadline || "",
      durationMinutes: sub.durationMinutes || "",
      targetClass: sub.targetClass || activeStudentClass || "Semua",
      imageUrl: "",
      videoUrl: "",
      audioUrl: ""
    };
    setQuizBatch([...loaded, defaultBlank]);
    setSelectedBatchIndex(loaded.length);
    setBatchDeadline(sub.deadline || "");
    setBatchDurationMinutes(sub.durationMinutes || "");
    setBatchTargetClass(sub.targetClass || activeStudentClass || "Semua");
    if (setBatchSubTitle) setBatchSubTitle(sub.subTitle);
    if (setBatchLessonId) setBatchLessonId(sub.lessonId || "");
    setSelectedBabNumber(chNum);
    if (setBatchChapterNumber) setBatchChapterNumber(chNum);
    if (setBatchSubject) setBatchSubject(assessmentSubject || "Bahasa Jepang");
    setQuizChoiceModalChapter(null);
    setIsQuizFormOpen(true);
  };

  const handleDeleteSubQuiz = async (subTitleToDelete: string, quizIds: string[]) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus seluruh ${quizIds.length} soal pada "${subTitleToDelete}"?`)) return;
    try {
      for (const qId of quizIds) {
        await onUpdateState('lmsQuizzes', 'delete', { id: qId });
      }
    } catch (err) {
      console.error("Gagal menghapus sub kuis:", err);
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in" id="lms-bab-section-container">
    
                {/* Teacher, Admin, VVIP: select student to view/assess */}
                {true && (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{currentUser?.role === "Pengajar" ? "👩‍🏫" : "👥"}</span>
                        <div>
                          <h4 className="font-display font-bold text-slate-800 text-xs">
                            {currentUser?.role === "Pengajar" ? "Pilih Siswa Bimbingan" : "Data Siswa Kelas"}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-normal">
                            Daftar siswa bimbingan aktif di kelas ini beserta status progres pembelajaran.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        
                        
                        <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                          isAlumniClass 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          Materi: {assessmentSubject}
                        </span>
                      </div>
                    </div>
    
                    <div className="flex overflow-x-auto gap-2 pt-1.5 pb-2 scrollbar-thin scrollbar-thumb-slate-200" id="lms-teacher-student-roster">
                      {filteredActiveStudents.map((student) => {
                        const isSelected = selectedStudentId === student.id;
                        const studentAssessments = (studentAssessmentsMap.get(student.id) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
                        const completed = studentAssessments.filter((c: any) => c.status === "Telah Dinilai").length;
                        const pending = studentAssessments.filter((c: any) => c.status === "Selesai Belajar").length;
                        const isAlumni = isAlumniClassName(student.class);
    
                        return (
                          <button
                            key={`${student.id}-${student.name}`}
                            type="button"
                            onClick={() => setSelectedStudentId(student.id)}
                            className={`shrink-0 w-44 sm:w-56 p-3 rounded-xl border text-left transition relative cursor-pointer ${
                              isSelected
                                ? isAlumni
                                  ? "bg-emerald-50 border-emerald-500 shadow-3xs ring-2 ring-emerald-100"
                                  : "bg-blue-50 border-blue-500 shadow-3xs ring-2 ring-blue-100"
                                : isAlumni
                                  ? "bg-emerald-50/40 hover:bg-emerald-100/95 border-emerald-200 text-emerald-900"
                                  : "bg-sky-50/40 hover:bg-sky-100/90 border-sky-200 text-sky-900"
                            }`}
                          >
                            <p className={`font-black text-[13px] sm:text-sm uppercase tracking-wide truncate ${isSelected ? isAlumni ? "text-emerald-900" : "text-blue-900" : "text-slate-900"}`}>
                              {student.name}
                            </p>
                            <p className={`text-[9px] font-medium font-mono ${isAlumni ? "text-emerald-600/90" : "text-sky-600"}`}>
                              {student.id} • {student.class}
                            </p>
                            
                            <div className="flex gap-1.5 mt-2 text-[9px] font-bold">
                              {completed > 0 && (
                                <span className={`px-1 py-0.2 rounded font-extrabold ${isAlumni ? "text-emerald-700 bg-emerald-100/55" : "text-emerald-700 bg-emerald-50/50"}`} title="Selesai Dinilai">
                                  {completed}⭐
                                </span>
                              )}
                              {pending > 0 && (
                                <span className="text-amber-600 bg-amber-50 px-1 py-0.2 rounded animate-pulse" title="Butuh Penilaian">
                                  {pending}📝
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
    
                {/* Overall Progress Tracker */}
                {(() => {
                  const studentIdToView = selectedStudentId || (currentUser?.studentId || "");
                  const targetStudent = (selectedStudentId ? activeStudents.find(s => s.id === selectedStudentId) : findStudentForUser(activeStudents, currentUser));
                  if (!targetStudent) return null;
                  
                  const studentClass = activeStudentClass || targetStudent.class || "";
                  const maxChapters = getClassChaptersCount(studentClass, assessmentSubject);
                  const totalPossibleChapters = getClassChaptersCount(studentClass, assessmentSubject, true);
                  const studentAsss = (studentAssessmentsMap.get(studentIdToView) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
                  
                  const gradedAsss = studentAsss.filter((c: any) => c.status === "Telah Dinilai");
                  let finishedChaptersCount = gradedAsss.length > 0 
                    ? Math.max(...gradedAsss.map((a: any) => Number(a.chapterNumber) || 0))
                    : 0;
                  
                  finishedChaptersCount = Math.min(finishedChaptersCount, maxChapters);
                  
                  return (
                    <div className="mb-6 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4 animate-fade-in relative">
                      <div className="hidden sm:block absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-50 text-blue-700 text-[9px] font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm whitespace-nowrap z-10">
                        💡 Progress pencapaian selesai bab dihitung dari nilai tertinggi di bab terakhir yang telah dinilai Sensei
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 shadow-3xs">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-black text-sm text-slate-800">Kemajuan {assessmentSubject}</h4>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{targetStudent.name} • {studentClass || "Semua"}</p>
                          <p className="sm:hidden mt-1 text-[9px] text-blue-600 font-bold bg-blue-50 border border-blue-100 rounded px-2 py-0.5">Progress = Bab tertinggi yang telah dinilai</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <span className="text-xs font-black text-slate-700 whitespace-nowrap">{finishedChaptersCount} / {maxChapters} BAB AKTIF</span>
                          <div className="flex-1 sm:w-48 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-1000 shadow-sm" 
                              style={{ width: `${(finishedChaptersCount / (maxChapters || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Silabus: {maxChapters} Aktif / {totalPossibleChapters} Total Bab</span>
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-tighter shadow-3xs">
                            Pencapaian: {((finishedChaptersCount / (maxChapters || 1)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
    
                {/* Split layout: Chapter list vs Chapter detail */}
                <div className="flex flex-col gap-6">
                  
                  {/* Left sidebar: grid of Bab */}
                  <div className={`space-y-3 ${isSidebarCollapsed ? 'hidden' : 'w-full'}`}>
                    {(() => {
                      const studentIdToView = selectedStudentId || (currentUser?.studentId || "");
                      const targetStudent = (selectedStudentId ? activeStudents.find(s => s.id === selectedStudentId) : findStudentForUser(activeStudents, currentUser));
                      const isFukushu = targetStudent ? ((targetStudent.class || "").toUpperCase().includes("FUKUSHU") || (targetStudent.class || "").toUpperCase().includes("FUKUSU")) : false;
                      const studentClass = activeStudentClass || targetStudent?.class || "";
                      const showAll = isSiswaOrAlumni || showAllChapters;
                      const maxChapters = getClassChaptersCount(studentClass, assessmentSubject, showAll);
                      const activeChaptersList = getClassChaptersList(studentClass, assessmentSubject, showAll);
    
                      return (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                            <h4 className="font-display font-bold text-slate-700 text-xs flex items-center gap-1.5">
                              {assessmentSubject === "SSW" ? (
                                <Calculator className={`h-4 w-4 ${isAlumniClass ? "text-emerald-600" : "text-blue-600"}`} />
                              ) : (
                                <BookOpen className={`h-4 w-4 ${isAlumniClass ? "text-emerald-600" : "text-blue-600"}`} />
                              )} 
                              <span>Daftar Pelajaran {assessmentSubject} (Bab 1 s/d {maxChapters})</span>
                            </h4>
                            <div className="flex items-center gap-2">
                              {currentUser?.role !== "Siswa" && (
                                <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-all">
                                  <input
                                    type="checkbox"
                                    checked={showAllChapters}
                                    onChange={(e) => setShowAllChapters(e.target.checked)}
                                    className="h-3 w-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span>Tampilkan Bab Nonaktif</span>
                                </label>
                              )}
                              <span className="text-[10px] text-slate-400 font-bold font-mono whitespace-nowrap">
                                Total: {maxChapters} Bab
                              </span>
                            </div>
                          </div>
    
                          <div className="flex overflow-x-auto scroll-smooth gap-3 pb-3 hide-scrollbar w-full" id="lms-chapters-list-scrollable">
                            {(() => {
                              const studentAsss = (studentAssessmentsMap.get(studentIdToView) || []).filter((c: any) => 
                                (c.subject || "Bahasa Jepang").trim().toLowerCase() === (assessmentSubject || "Bahasa Jepang").trim().toLowerCase()
                              );
                              
                              const classObj = allClasses.find(c => (c.name || "").trim().toLowerCase() === (studentClass || "").trim().toLowerCase());
                              // Find highest graded bab + 1 as recommend next step, overridden by manual activeChapterNum if set
                              const activeChapterNumKey = assessmentSubject === "SSW" ? "activeMathChapterNum" : "activeChapterNum";
                              const rawStudentChapter = targetStudent?.currentChapter;
                              const studentChapter = getResolvedChapterNum(studentClass || "", rawStudentChapter, assessmentSubject);
    
                              const rawClassActiveChapter = classObj?.[activeChapterNumKey];
                              const hasClassActive = rawClassActiveChapter !== undefined && rawClassActiveChapter !== null;
                              const classActiveChapter = getResolvedChapterNum(studentClass || "", rawClassActiveChapter, assessmentSubject);
    
                              let nextTargetChapterNum = 1;
                              if (studentChapter) {
                                nextTargetChapterNum = studentChapter;
                              } else if (hasClassActive) {
                                nextTargetChapterNum = classActiveChapter;
                              } else {
                                nextTargetChapterNum = activeChaptersList[0]?.number || 1;
                                for (const ch of activeChaptersList) {
                                  const asses = studentAsss.find(c => Number(c.chapterNumber) === Number(ch.number));
                                  if (!asses || asses.status !== "Telah Dinilai") {
                                    nextTargetChapterNum = ch.number;
                                    break;
                                  }
                                }
                              }
    
                              const userRoleForScroll = (currentUser?.role || "") as any;
                              const canManageChapterInScroll = !isSiswaOrAlumni ||
                                                               userRoleForScroll === "Pengajar" || 
                                                               userRoleForScroll === "Admin" || 
                                                               userRoleForScroll === "Admin Super" || 
                                                               userRoleForScroll === "Admin Biasa" || 
                                                               userRoleForScroll === "VVIP" || 
                                                               userRoleForScroll === "VIP" ||
                                                               String(userRoleForScroll).toLowerCase().includes("sensei") ||
                                                               String(userRoleForScroll).toLowerCase().includes("pengajar") ||
                                                               String(userRoleForScroll).toLowerCase().includes("guru");

                              return activeChaptersList.map((chapter) => {
                                const assessment = studentAsss.find(c => Number(c.chapterNumber) === Number(chapter.number));
                                const isSelected = Number(selectedBabNumber) === Number(chapter.number);
                                const isCompleted = assessment?.status === "Telah Dinilai";
                                const isPending = assessment?.status === "Selesai Belajar";
                                const isMandiriChapter = isChapterMandiri(chapter);
                                
                                const isFukushuLocked = false;
                                const isChapterUnlocked = isMandiriChapter || chapter?.isMandiri === true || chapter.isActive === true || (chapter.isActive !== false && Number(chapter.number) <= Number(classActiveChapter || 1));
                                const isLockedBySensei = isSiswaOrAlumni && !isChapterUnlocked;
                                const isTarget = Number(chapter.number) === Number(nextTargetChapterNum);
                                const isLocked = false;
                                const classMethod = allClasses.find(c => (c.name || "").trim().toLowerCase() === (studentClass || "").trim().toLowerCase())?.method || "Offline";
                                let statusBadge = (
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-lg whitespace-nowrap">
                                      Belum Mulai
                                    </span>
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Metode: {classMethod}</span>
                                  </div>
                                );
                                if (isLockedBySensei) {
                                  statusBadge = (
                                    <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-150 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-1 whitespace-nowrap">
                                      🔒 Belum Mulai
                                    </span>
                                  );
                                } else if (isFukushuLocked) {
                                  statusBadge = (
                                    <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5 whitespace-nowrap">
                                      🔒 Fukushu
                                    </span>
                                  );
                                } else if (isPending) {
                                  statusBadge = (
                                    <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5 whitespace-nowrap animate-pulse">
                                      📝 Butuh Nilai
                                    </span>
                                  );
                                } else if (isCompleted) {
                                  statusBadge = (
                                    <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-lg font-extrabold flex items-center gap-0.5 whitespace-nowrap">
                                      ⭐ Nilai: {assessment.score} ({assessment.grade})
                                    </span>
                                  );

                                } else if (isLocked) {
                                  statusBadge = (
                                    <span className="text-[9px] text-slate-400 bg-slate-100/50 border border-slate-150 px-1.5 py-0.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1">
                                      🔒 Antrean
                                    </span>
                                  );
                                } else if (chapter.number < nextTargetChapterNum) {
                                  statusBadge = (
                                    <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5 whitespace-nowrap">
                                      ✅ Sudah Dipelajari
                                    </span>
                                  );
                                } else if (isSelected || isTarget) {
                                  statusBadge = <></>;
                                }

                                return (
                                  <div
                                    key={chapter.number}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedBabNumber(chapter.number)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setSelectedBabNumber(chapter.number);
                                      }
                                    }}
                                    className={`flex-shrink-0 min-w-[240px] max-w-[280px] w-fit text-left p-3 rounded-2xl border transition flex flex-col justify-between gap-3 cursor-pointer group/card select-none ${
                                      isLockedBySensei
                                        ? isSelected
                                          ? "bg-slate-700 text-white/90 border-slate-700 opacity-60 font-medium"
                                          : "bg-slate-100 opacity-55 border-slate-200"
                                        : isSelected
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : isTarget
                                        ? isAlumniClass
                                          ? "bg-emerald-50 hover:bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-100/85 shadow-sm"
                                          : "bg-blue-50 hover:bg-blue-100/90 border-blue-400 ring-2 ring-blue-100/85 shadow-sm"
                                        : isFukushuLocked
                                        ? "bg-stone-50/60 opacity-75 hover:opacity-100 border-dashed border-stone-200"
                                        : isLocked
                                        ? "bg-white opacity-60 hover:opacity-100 border-slate-150"
                                        : "bg-white hover:bg-slate-50 border-slate-150"
                                    }`}
                                  >
                                    <div className="w-full space-y-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`font-mono font-bold text-[10px] uppercase ${
                                          isSelected 
                                            ? isAlumniClass ? "text-emerald-400" : "text-blue-400" 
                                            : isAlumniClass ? "text-emerald-600 font-extrabold" : "text-blue-600 font-extrabold"
                                        }`}>
                                          Bab {chapter.number} / {maxChapters}
                                        </span>
                                        <span className={`text-[7px] font-black uppercase px-1 rounded-md ${
                                          isSelected ? 'bg-white/10 text-white/60 border border-white/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                        }`}>
                                          {classMethod}
                                        </span>
                                        {isMandiriChapter && (
                                          <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 ${
                                            isSelected 
                                              ? 'bg-amber-400/20 text-amber-200 border-amber-400/30' 
                                              : 'bg-amber-50 text-amber-700 border-amber-200'
                                          }`}>
                                            ✨ Mandiri
                                          </span>
                                        )}
                                        {isTarget && (
                                          <span className={`text-[8px] px-1 rounded font-black uppercase ${
                                            isAlumniClass ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                          }`}>
                                            LANJUTAN
                                          </span>
                                        )}
                                        {isFukushuLocked && (
                                          <span className="text-[8px] bg-amber-100 text-amber-800 px-1 rounded font-black uppercase">
                                            REVIU
                                          </span>
                                        )}
                                        {canManageChapterInScroll && isMandiriChapter && (
                                          <div className="flex items-center gap-1.5 ml-auto" onClick={(e) => e.stopPropagation()}>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenEditMandiriModal(studentClass || activeStudentClass || "", chapter);
                                              }}
                                              className={`px-2 py-0.5 rounded-lg font-bold text-[9px] flex items-center gap-1 transition shadow-2xs cursor-pointer ${
                                                isSelected ? "bg-amber-400 hover:bg-amber-500 text-slate-950" : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                                              }`}
                                              title={`Edit nama dan silabus Bab Mandiri ${chapter.number}`}
                                            >
                                              <Edit3 className="w-3 h-3" />
                                              <span>Edit</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteMandiriClick(studentClass || activeStudentClass || "", chapter);
                                              }}
                                              className={`px-2 py-0.5 rounded-lg font-bold text-[9px] flex items-center gap-1 transition shadow-2xs cursor-pointer ${
                                                isSelected ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300"
                                              }`}
                                              title={`Hapus Bab Mandiri ${chapter.number}`}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              <span>Hapus</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <p className="font-bold text-xs truncate leading-snug">
                                        {chapter.title}
                                      </p>
                                      <p className={`text-[10px] font-medium truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                                        {chapter.japaneseTitle}
                                      </p>
                                    </div>
                                    <div className="self-start mt-auto">
                                      {statusBadge}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                            {!isSiswaOrAlumni && (
                              <button
                                id="lms-btn-tambah-bab-mandiri"
                                type="button"
                                onClick={() => handleOpenMandiriModal(studentClass || activeStudentClass || "")}
                                className="flex-shrink-0 min-w-[210px] w-fit text-left p-3.5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-500 transition-all flex flex-col justify-center items-center gap-2 cursor-pointer text-emerald-800 shadow-sm hover:shadow-md active:scale-95 group"
                                title="Tambah Bab Mandiri baru untuk kelas ini"
                              >
                                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-md shadow-emerald-200">
                                  <Plus className="h-5 w-5 stroke-[2.5]" />
                                </div>
                                <div className="text-center space-y-0.5">
                                  <span className="font-display font-extrabold text-xs uppercase tracking-wider block text-emerald-950">
                                    Tambah Bab Mandiri
                                  </span>
                                  <span className="text-[10px] text-emerald-700/80 font-semibold block">
                                    Kustom Silabus &amp; Bab
                                  </span>
                                </div>
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
    
                  {/* Right panel: Details and Action form */}
                  <div className="w-full">
                    {(() => {
                      const studentIdToView = selectedStudentId || (currentUser?.studentId || "");
                      const targetStudent = filteredActiveStudents.find(s => s.id === studentIdToView) || filteredActiveStudents[0] || ({ id: "", name: "Siswa LPK", class: "" } as any);
                      const studentClass = activeStudentClass || targetStudent?.class || "";
                      const activeChaptersList = getClassChaptersList(studentClass, assessmentSubject, true);
                      const chapter = activeChaptersList.find((b: any) => Number(b.number) === Number(selectedBabNumber)) || activeChaptersList[0] || {
                        number: Number(selectedBabNumber) || 1,
                        title: `Bab ${selectedBabNumber || 1}`,
                        japaneseTitle: "",
                        description: "",
                        isActive: true
                      };
                      const assessment = (systemState?.chapterAssessments || chapterAssessments || []).find(
                        (c: any) => (c.studentId || "").trim() === (studentIdToView || "").trim() &&
                                    Number(c.chapterNumber) === Number(chapter.number) &&
                                    (!c.subject || (c.subject || "Bahasa Jepang").trim().toLowerCase() === (assessmentSubject || "Bahasa Jepang").trim().toLowerCase())
                      );
    
                      const isFukushu = targetStudent ? ((targetStudent.class || "").toUpperCase().includes("FUKUSHU") || (targetStudent.class || "").toUpperCase().includes("FUKUSU")) : false;
                      const maxChaptersNum = getClassChaptersCount(studentClass, assessmentSubject, true);
    
                      const studentAsss = (studentAssessmentsMap.get(studentIdToView) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
                      const classObj = allClasses.find(c => (c.name || "").trim().toLowerCase() === (studentClass || "").trim().toLowerCase());
                      const trulyActiveChapters = getClassChaptersList(studentClass, assessmentSubject, false);
                      const activeChapterNumKey = assessmentSubject === "SSW" ? "activeMathChapterNum" : "activeChapterNum";
    
                      const rawStudentChapter = targetStudent?.currentChapter;
                      const studentChapter = getResolvedChapterNum(studentClass || "", rawStudentChapter, assessmentSubject);
    
                      const rawClassActiveChapter = classObj?.[activeChapterNumKey];
                      const hasClassActive = rawClassActiveChapter !== undefined && rawClassActiveChapter !== null;
                      const classActiveChapter = getResolvedChapterNum(studentClass || "", rawClassActiveChapter, assessmentSubject);
    
                      let nextTargetChapterNum = 1;
                      if (studentChapter) {
                        nextTargetChapterNum = studentChapter;
                      } else if (hasClassActive) {
                        nextTargetChapterNum = classActiveChapter;
                      } else {
                        nextTargetChapterNum = trulyActiveChapters[0]?.number || 1;
                        for (const ch of trulyActiveChapters) {
                          const asses = studentAsss.find(c => c.chapterNumber === ch.number);
                          if (!asses || asses.status !== "Telah Dinilai") {
                            nextTargetChapterNum = ch.number;
                            break;
                          }
                        }
                      }
    
                      const isMandiriChapter = isChapterMandiri(chapter);
                      const isChapterUnlocked = isMandiriChapter || chapter?.isMandiri === true || chapter?.isActive === true || (chapter?.isActive !== false && Number(chapter?.number) <= Number(classActiveChapter || 1));
                      const isLockedBySensei = isSiswaOrAlumni && !isChapterUnlocked;
                      const isLockedByProgress = false;
    
                      const userRole = (currentUser?.role || "") as any;
                      const canManageChapter = !isSiswaOrAlumni ||
                                               userRole === "Pengajar" || 
                                               userRole === "Admin" || 
                                               userRole === "Admin Super" || 
                                               userRole === "Admin Biasa" || 
                                               userRole === "VVIP" || 
                                               userRole === "VIP" ||
                                               String(userRole).toLowerCase().includes("sensei") ||
                                               String(userRole).toLowerCase().includes("pengajar") ||
                                               String(userRole).toLowerCase().includes("guru");

                      return (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6" id="lms-chapter-detail-widget">
                          {/* Chapter Title block */}
                          <div className="border-b border-slate-100 pb-4 space-y-2 text-left">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors" title={isSidebarCollapsed ? "Tampilkan Daftar Bab" : "Sembunyikan Daftar Bab"}>
                                  <PanelLeftClose className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`} />
                                </button>
                                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-md tracking-wider border inline-block ${
                                  isAlumniClass ? "bg-emerald-50 text-emerald-700 border-emerald-150/70" : "bg-blue-50 text-blue-700 border-blue-100"
                                }`}>
                                  {assessmentSubject.toUpperCase()} • BAB {chapter.number} DARI {maxChaptersNum}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-md tracking-wider border inline-block bg-slate-50 text-slate-600 border-slate-200">
                                  {allClasses.find(c => (c.name || "").trim().toLowerCase() === (studentClass || "").trim().toLowerCase())?.method || "Offline"}
                                </span>
                                {isMandiriChapter && (
                                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-3xs">
                                    ✨ Bab Mandiri Sensei
                                  </span>
                                )}
                              </div>

                              {canManageChapter && isMandiriChapter ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditMandiriModal(studentClass || activeStudentClass || "", chapter)}
                                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                                    title="Ubah nama, nomor, atau silabus Bab Mandiri ini"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit Bab Mandiri</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMandiriClick(studentClass || activeStudentClass || "", chapter)}
                                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-200 flex items-center gap-1.5 cursor-pointer transition active:scale-95 animate-pulse hover:animate-none"
                                    title="Hapus Bab Mandiri ini dari kurikulum kelas"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus Bab Mandiri</span>
                                  </button>
                                </div>
                              ) : canManageChapter ? (
                                <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold border border-slate-200" title="Bab kurikulum standar LPK tidak dapat dihapus">
                                  <span>🔒 Kurikulum Standar LPK (Resmi)</span>
                                </div>
                              ) : null}
                            </div>
                            <h3 className="font-display font-extrabold text-slate-950 text-lg sm:text-xl leading-snug">
                              {chapter.title}
                            </h3>
                            <p className={`text-sm font-extrabold font-display ${isAlumniClass ? "text-emerald-600" : "text-blue-600"}`}>
                              🇯🇵 {chapter.japaneseTitle}
                            </p>
                          </div>
                          
                          {/* Chapter Syllabus Outline */}
                          <div className="space-y-2 text-left">
                            <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Silabus Pembelajaran</h5>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/60 text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                              {chapter.description}
                            </div>
                          </div>
    
    
                          {/* Materi Belajar untuk Bab Ini */}
                          {isLockedBySensei || isLockedByProgress ? (
                            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-3xs">
                                <Lock className="h-8 w-8" />
                              </div>
                              <div className="space-y-2 max-w-md mx-auto">
                                <h4 className="font-display font-extrabold text-slate-800 text-sm sm:text-base">
                                  {isLockedBySensei ? "Akses Bab Belum Dibuka Oleh Sensei 🔒" : "Selesaikan Bab Sebelumnya Terlebih Dahulu 📖"}
                                </h4>
                                <p className="text-xs text-slate-500 font-normal leading-relaxed font-sans">
                                  {isLockedBySensei 
                                    ? `Materi Bab ${chapter.number} belum dibuka aksesnya oleh Sensei. Silakan selesaikan tugas harian Anda dan temui Sensei Utama untuk membuka akses Bab ini.` 
                                    : `Anda perlu menyelesaikan dan mendapatkan penilaian untuk Bab ${nextTargetChapterNum} sebelum dapat mempelajari Bab ${chapter.number}. Silakan fokus pada materi target Anda hari ini.`}
                                </p>
                                {isLockedBySensei && canManageChapter && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await handleActivateChapterInLms(studentClass, chapter.number);
                                    }}
                                    className="mt-6 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[13px] rounded-2xl transition-all shadow-xl shadow-indigo-200/50 active:scale-95 flex items-center gap-2 mx-auto cursor-pointer uppercase"
                                  >
                                    <Unlock className="h-5 w-5" /> Aktifkan Bab {chapter.number}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 pt-2">
                              {/* Active chapter status banner for teachers/admins/VVIP/VIP */}
                              {canManageChapter && (
                                <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-2xs transition ${
                                  isChapterUnlocked
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                                    : "bg-amber-50 border-amber-200 text-amber-950"
                                }`}>
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                      isChapterUnlocked ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                                    }`}>
                                      {isChapterUnlocked ? "🔓" : "🔒"}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                          isChapterUnlocked ? "bg-emerald-200/80 text-emerald-900" : "bg-amber-200/80 text-amber-900"
                                        }`}>
                                          {isChapterUnlocked ? "Akses Bab Terbuka (Aktif)" : "Akses Bab Terkunci (Nonaktif)"}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-600">
                                          Kelas: {studentClass || "Semua"}
                                        </span>
                                      </div>
                                      <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                                        {isChapterUnlocked 
                                          ? `Siswa kelas ${studentClass || "ini"} dapat mengakses seluruh materi & kuis Bab ${chapter.number}.`
                                          : `Materi & kuis Bab ${chapter.number} saat ini terkunci untuk siswa kelas ${studentClass || "ini"}.`}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (isChapterUnlocked) {
                                        await handleDeactivateChapterInLms(studentClass, chapter.number);
                                      } else {
                                        await handleActivateChapterInLms(studentClass, chapter.number);
                                      }
                                    }}
                                    className={`px-4 py-2 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 ${
                                      isChapterUnlocked
                                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                                    }`}
                                  >
                                    {isChapterUnlocked ? (
                                      <>
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>🔒 Nonaktifkan Bab {chapter.number}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Unlock className="w-3.5 h-3.5" />
                                        <span>🔓 Aktifkan / Buka Bab {chapter.number}</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-display font-extrabold text-slate-900">
                                  Materi & Rujukan
                                </h4>
                                <p className="text-[10px] text-slate-500 font-normal">
                                  Pelajaran pendamping untuk bab ini.
                                </p>
                              </div>
                              {(currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Tambah Materi */}
                                  <button 
                                    onClick={() => {
                                      setSelectedLessonToEdit(null);
                                      setLessonSubject(assessmentSubject);
                                      setLessonTitle("");
                                      setLessonJapaneseTitle("");
                                      setLessonDifficulty("Dasar");
                                      setLessonContentType("text_only");
                                      setLessonContent("");
                                      setLessonVideoUrl("");
                                      setLessonSlidesUrl("");
                                      setLessonBookUrl("");
                                      setLessonIsLocked(false);
                                      setLessonError("");
                                      setLessonDeadline("");
                                      setLessonDurationMinutes("");
                                      setLessonTargetClass(activeStudentClass || "Semua");
                                      setIsLessonFormOpen(true);
                                      // Set the new bab number for the form
                                      setSelectedBabNumber(chapter.number);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Materi</span>
                                  </button>
    
                                  {/* Tambah Kuis */}
                                  <button 
                                    onClick={() => {
                                      const chapterQuizzes = (systemState?.lmsQuizzes || []).filter((q: any) => {
                                        const chNum = q.chapterNumber !== undefined ? Number(q.chapterNumber) : (q.chapterId !== undefined ? Number(q.chapterId) : NaN);
                                        return (chNum === chapter.number || String(q.chapterNumber) === String(chapter.number) || String(q.chapterId) === String(chapter.number)) &&
                                          (!q.subject || q.subject === assessmentSubject);
                                      });

                                      if (chapterQuizzes.length > 0) {
                                        const subMap: Record<string, any[]> = {};
                                        chapterQuizzes.forEach((q: any) => {
                                          const k = (q.subTitle || "").trim() || `Kuis Utama Bab ${chapter.number}`;
                                          if (!subMap[k]) subMap[k] = [];
                                          subMap[k].push(q);
                                        });
                                        const existingSubCount = Object.keys(subMap).length;
                                        setNewSubTitleInput(`Sub ${existingSubCount + 1}: Kuis Materi Bab ${chapter.number}`);
                                        setSelectedSubLessonId("");
                                        setQuizChoiceModalChapter(chapter);
                                      } else {
                                        handleStartNewSubQuiz(chapter, `Sub 1: Kuis Materi Bab ${chapter.number}`);
                                      }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Kuis / Soal</span>
                                  </button>
    
                                  {/* Tambah Tugas */}
                                  <button 
                                    onClick={() => {
                                      setSelectedLessonToEdit(null);
                                      setLessonSubject(assessmentSubject);
                                      setLessonTitle(`Tugas Mandiri Bab ${chapter.number}`);
                                      setLessonJapaneseTitle("");
                                      setLessonDifficulty("Tugas");
                                      setLessonContentType("text_only");
                                      setLessonContent("Silakan ketik petunjuk tugas mandiri/PR di sini...");
                                      setLessonVideoUrl("");
                                      setLessonSlidesUrl("");
                                      setLessonBookUrl("");
                                      setLessonIsLocked(false);
                                      setLessonError("");
                                      setLessonDeadline("");
                                      setLessonDurationMinutes("");
                                      setLessonTargetClass(activeStudentClass || "Semua");
                                      setIsLessonFormOpen(true);
                                      setSelectedBabNumber(chapter.number);
                                    }}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Tugas</span>
                                  </button>
                                </div>
                              )}
                            </div>
    
                            {(() => {
                              const lessons = lmsLessons || systemState?.lmsLessons || [];
                              const studentIdToView = selectedStudentId || (currentUser?.studentId || "");
                              const targetStudent = filteredActiveStudents.find(s => s.id === studentIdToView) || filteredActiveStudents[0] || ({ id: "", name: "Siswa LPK", class: "" } as any);
                              const studentClass = activeStudentClass || targetStudent?.class || "";
                              const isStaffViewer = ["Admin", "Admin Super", "Admin Biasa", "Pengajar", "VVIP"].includes(currentUser?.role || "");
                              const targetViewerClass = isStaffViewer && selectedClassFilter !== "Semua" && selectedClassFilter !== "Semua Kelas" 
                                ? selectedClassFilter.trim().toLowerCase() 
                                : (studentClass || "").trim().toLowerCase();
                              
                              // Match subject and chapterNumber and class
                              const normCls = (s: string) => (s || "").trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
                              const filteredLessons = lessons.filter(l => {
                                const normalizedTargetClass = (l.targetClass || "Semua").trim().toLowerCase();
                                const isMandiriMaterial = l.isMandiri === true || isMandiriChapter || Number(l.chapterNumber) > (assessmentSubject === "SSW" ? 25 : 35);
                                const matchClass = (isStaffViewer && (selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas"))
                                  ? true
                                  : (isMandiriMaterial || normalizedTargetClass === "semua" || normCls(normalizedTargetClass) === normCls(targetViewerClass));
                                const matchSubj = !l.subject || (l.subject || "Bahasa Jepang").trim().toLowerCase() === (assessmentSubject || "Bahasa Jepang").trim().toLowerCase();
                                const matchChapter = Number(l.chapterNumber) === Number(chapter.number);
                                return matchSubj && matchChapter && matchClass;
                              });
    
                              // Fetch quizzes for this chapter and subject and class
                              const allChapterQuizzes = (systemState?.lmsQuizzes || []).filter(q => {
                                const chNum = q.chapterNumber !== undefined ? Number(q.chapterNumber) : (q.chapterId !== undefined ? Number(q.chapterId) : NaN);
                                return Number(chNum) === Number(chapter.number);
                              });
                              let filteredQuizzes = allChapterQuizzes.filter(q => {
                                const normalizedTargetClass = (q.targetClass || "Semua").trim().toLowerCase();
                                const isMandiriQuiz = q.isMandiri === true || isMandiriChapter || Number(q.chapterNumber) > (assessmentSubject === "SSW" ? 25 : 35);
                                const matchClass = (isStaffViewer && (selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas"))
                                  ? true
                                  : (isMandiriQuiz || normalizedTargetClass === "semua" || normCls(normalizedTargetClass) === normCls(targetViewerClass));
                                const matchSubj = !q.subject || (q.subject || "Bahasa Jepang").trim().toLowerCase() === (assessmentSubject || "Bahasa Jepang").trim().toLowerCase();
                                return matchSubj && matchClass;
                              });
                              if (filteredQuizzes.length === 0 && allChapterQuizzes.length > 0) {
                                filteredQuizzes = allChapterQuizzes;
                              }

                              const findMatchingAssessmentForStudent = (studentObj: any, chNumber: number, targetSubTitle?: string) => {
                                if (!studentObj) return null;
                                const targetIds = [studentObj.id, studentObj.studentId, studentObj.email, studentObj.username]
                                  .filter(Boolean)
                                  .map((x: any) => String(x).trim().toLowerCase());
                                const sName = (studentObj.name || "").trim().toLowerCase();

                                // Also cross-reference user account for this student to gather email and username
                                const matchedUser = (systemState?.users || []).find((u: any) => {
                                  const uId = (u.studentId || "").trim().toLowerCase();
                                  const uName = (u.name || "").trim().toLowerCase();
                                  const sId = (studentObj.id || "").trim().toLowerCase();
                                  return (uId && uId === sId) || (uName && uName === sName);
                                });
                                if (matchedUser) {
                                  if (matchedUser.id) targetIds.push(String(matchedUser.id).trim().toLowerCase());
                                  if (matchedUser.email) targetIds.push(String(matchedUser.email).trim().toLowerCase());
                                  if (matchedUser.username) targetIds.push(String(matchedUser.username).trim().toLowerCase());
                                }

                                const allAssess = Array.from(
                                  new Map(
                                    [...(chapterAssessments || []), ...(systemState?.chapterAssessments || [])].map((item: any) => [item.id, item])
                                  ).values()
                                );

                                const matches = allAssess.filter((a: any) => {
                                  const chMatch = Number(a.chapterNumber) === Number(chNumber) || String(a.chapterNumber) === String(chNumber);
                                  if (!chMatch) return false;

                                  const aSubj = (a.subject || "Bahasa Jepang").trim();
                                  const effSubj = (assessmentSubject || "Bahasa Jepang").trim();
                                  if (a.subject && !isSameSubject(aSubj, effSubj)) return false;

                                  if (targetSubTitle) {
                                    const aSub = (a.subTitle || "").trim().toLowerCase();
                                    const tSub = targetSubTitle.trim().toLowerCase();
                                    if (aSub && aSub !== tSub) return false;
                                  }

                                  const aId = (a.studentId || "").trim().toLowerCase();
                                  if (aId && targetIds.includes(aId)) return true;

                                  const aEmail = (a.studentEmail || "").trim().toLowerCase();
                                  if (aEmail && targetIds.includes(aEmail)) return true;

                                  const aName = (a.studentName || "").trim().toLowerCase();
                                  if (aName && sName && (aName === sName || sName.includes(aName) || aName.includes(sName))) return true;

                                  if (studentObj.id && (a.id || "").toLowerCase().includes(String(studentObj.id).toLowerCase())) return true;
                                  if (studentObj.name && (a.id || "").toLowerCase().includes(encodeURIComponent(String(studentObj.name).toLowerCase()))) return true;

                                  return false;
                                });

                                if (matches.length === 0) return null;
                                return [...matches].sort((a: any, b: any) => {
                                  const weightA = a.score !== undefined ? 100 : (a.submittedAt ? 50 : 10);
                                  const weightB = b.score !== undefined ? 100 : (b.submittedAt ? 50 : 10);
                                  if (weightA !== weightB) return weightB - weightA;
                                  const timeA = new Date(a.submittedAt || a.assessedDate || a.timestamp || 0).getTime();
                                  const timeB = new Date(b.submittedAt || b.assessedDate || b.timestamp || 0).getTime();
                                  return timeB - timeA;
                                })[0];
                              };

                              const isAssessmentSubmitted = (a: any) => {
                                if (!a) return false;
                                return Boolean(
                                  a.score !== undefined ||
                                  a.status === "Telah Dinilai" ||
                                  a.status === "Sudah Dinilai" ||
                                  a.status === "Selesai Belajar" ||
                                  a.status === "Menunggu Penilaian" ||
                                  Boolean(a.submittedAt) ||
                                  Boolean(a.studentAnswers && Object.keys(a.studentAnswers).length > 0) ||
                                  Boolean(a.essayAnswers && Object.keys(a.essayAnswers).length > 0) ||
                                  Boolean(a.details?.studentQuizAnswers && Object.keys(a.details.studentQuizAnswers).length > 0)
                                );
                              };

                              const submittedStudentsCount = (filteredActiveStudents || []).filter((student: any) => {
                                const matchingAssessment = findMatchingAssessmentForStudent(student, chapter.number);
                                return isAssessmentSubmitted(matchingAssessment);
                              }).length;

                              const renderRekapitulasiTable = () => (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 text-left" id="lms-rekap-evaluasi-siswa">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2.5">
                                      <span className="p-2 rounded-xl bg-purple-50 text-purple-700 font-bold border border-purple-100">
                                        <Award className="w-4 h-4" />
                                      </span>
                                      <div>
                                        <h5 className="font-display font-black text-xs sm:text-sm text-slate-800">
                                          📊 Rekapitulasi Hasil & Jawaban Siswa (Bab {chapter.number})
                                        </h5>
                                        <p className="text-[10px] text-slate-500 font-normal">
                                          Daftar siswa yang telah mengerjakan kuis bab ini beserta skor dan opsi periksa essay.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                                        Total Siswa: {(filteredActiveStudents || []).length}
                                      </span>
                                      {submittedStudentsCount > 0 && (
                                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200">
                                          Selesai: {submittedStudentsCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Table / List Siswa */}
                                  <div className="divide-y divide-slate-100">
                                    {(filteredActiveStudents || []).length === 0 ? (
                                      <div className="text-center py-6 text-xs text-slate-400 font-medium">
                                        Belum ada data siswa aktif terdaftar di kelas ini.
                                      </div>
                                    ) : (
                                      (filteredActiveStudents || []).map((student: any) => {
                                        const sId = student.id || student.studentId;
                                        const matchingAssessment = findMatchingAssessmentForStudent(student, chapter.number);

                                        const isSubmitted = isAssessmentSubmitted(matchingAssessment);
                                        const score = matchingAssessment?.score !== undefined ? Number(matchingAssessment.score) : null;

                                        return (
                                          <div key={sId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                                                {student.name ? student.name.substring(0, 2).toUpperCase() : "SW"}
                                              </div>
                                              <div>
                                                <p className="text-xs font-bold text-slate-900 leading-tight">{student.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                  ID: {sId} • Kelas: {student.class || "-"}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3 self-end sm:self-center">
                                              {/* Status Badge */}
                                              {isSubmitted ? (
                                                <div className="flex items-center gap-2">
                                                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border font-mono ${
                                                    score !== null
                                                      ? ((score || 0) >= 75
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-amber-50 text-amber-700 border-amber-200")
                                                      : "bg-purple-50 text-purple-700 border-purple-200"
                                                  }`}>
                                                    {score !== null ? `⭐ Nilai: ${score}%` : "📝 Menunggu Koreksi / Selesai"}
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg">
                                                  ⚪ Belum Mengerjakan
                                                </span>
                                              )}

                                              {/* Tombol Periksa / Koreksi Jawaban */}
                                              {isSubmitted && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setReviewModalStudent(student);
                                                    setReviewModalChapter(chapter);
                                                    setReviewModalQuizzes(filteredQuizzes.length > 0 ? filteredQuizzes : (allChapterQuizzes || []));
                                                    setReviewModalAssessment(matchingAssessment);
                                                    setIsReviewModalOpen(true);
                                                  }}
                                                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                                                  title="Periksa lembar jawaban dan koreksi essay siswa"
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                  <span>👁️ Periksa & Koreksi Essay</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              );

                              if (filteredLessons.length === 0 && filteredQuizzes.length === 0) {
                                return (
                                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-normal leading-relaxed">
                                    Tidak ada materi khusus maupun kuis untuk Bab ini.
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-6">
                                  {/* Sensei Navigation Switcher for Instant Display Without Scrolling */}
                                  {currentUser?.role !== "Siswa" && (
                                    <div className="space-y-3 pb-1">
                                      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => setSenseiChapterTab("all")}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                              senseiChapterTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                            }`}
                                          >
                                            <span>📑 Semua Konten</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setSenseiChapterTab("materi")}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                              senseiChapterTab === "materi" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                            }`}
                                          >
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span>Materi & Kuis</span>
                                          </button>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => setSenseiChapterTab(senseiChapterTab === "rekap" ? "all" : "rekap")}
                                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                            senseiChapterTab === "rekap" 
                                              ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-300" 
                                              : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                                          }`}
                                          title="Langsung tampilkan rekapitulasi nilai dan koreksi essay siswa di atas tanpa perlu scroll"
                                        >
                                          <Award className="w-3.5 h-3.5" />
                                          <span>⚡ Langsung Tampilkan Rekap & Koreksi Siswa</span>
                                          {submittedStudentsCount > 0 && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                              senseiChapterTab === "rekap" ? "bg-white text-purple-700" : "bg-purple-600 text-white"
                                            }`}>
                                              {submittedStudentsCount} Selesai
                                            </span>
                                          )}
                                        </button>
                                      </div>

                                      {/* If rekap tab is selected, display immediately at top without scrolling */}
                                      {senseiChapterTab === "rekap" && (
                                        <div className="animate-fade-in">
                                          {renderRekapitulasiTable()}
                                        </div>
                                      )}

                                      {/* Quick banner in 'all' view for 1-click jump/toggle */}
                                      {senseiChapterTab === "all" && submittedStudentsCount > 0 && (
                                        <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-2xl flex items-center justify-between gap-3 text-left animate-fade-in">
                                          <div className="flex items-center gap-2.5">
                                            <span className="p-2 rounded-xl bg-purple-600 text-white font-bold shrink-0">
                                              <Award className="w-4 h-4" />
                                            </span>
                                            <div>
                                              <p className="text-xs font-bold text-purple-950">
                                                {submittedStudentsCount} Siswa telah mengerjakan kuis Bab {chapter.number}
                                              </p>
                                              <p className="text-[10px] text-purple-700">
                                                Klik tombol di samping untuk langsung melihat jawaban dan mengoreksi essay di atas tanpa harus scroll ke bawah.
                                              </p>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setSenseiChapterTab("rekap")}
                                            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Tampilkan di Atas</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Lessons Section - only when not in rekap-only mode */}
                                  {senseiChapterTab !== "rekap" && filteredLessons.length > 0 && (
                                    <div className="space-y-4">
                                      {filteredLessons.map((lesson, idx) => {
                                        const isExpanded = expandedLessons.includes(lesson.id);
                                        const isLockedBySensei = lesson.isLocked && currentUser?.role === "Siswa";
                                        const isLessonDeadlinePassed = lesson.deadline ? new Date() > new Date(lesson.deadline) : false;
                                        
                                        return (
                                          <div key={lesson.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden transition-all duration-200">
                                            
                                            <div 
                                              className="p-4 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition" 
                                              onClick={() => toggleLessonExpanded(lesson.id)}
                                            >
                                              <div className="flex-1 space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border bg-slate-50 text-slate-700 border-slate-200">
                                                    {lesson.contentType === "video" ? "🎬 Video" :
                                                    lesson.contentType === "slide" ? "📽️ Slide PPT" :
                                                    lesson.contentType === "buku" ? "📚 Rujukan Buku" :
                                                    lesson.contentType === "audio" ? "🎙️ Rekaman Suara" :
                                                    "📝 Tulis"}
                                                  </span>
                                                  {lesson.difficulty && (
                                                    <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                                                      {lesson.difficulty}
                                                    </span>
                                                  )}
                                                  {lesson.deadline && (
                                                    isLessonDeadlinePassed ? (
                                                      <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-md border border-red-700 flex items-center gap-1 animate-pulse">
                                                        ⏳ Batas Terlewati: {new Date(lesson.deadline).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                                                      </span>
                                                    ) : (
                                                      <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 animate-pulse">
                                                        ⏳ Batas: {new Date(lesson.deadline).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                                                      </span>
                                                    )
                                                  )}
                                                  {lesson.durationMinutes && (
                                                    <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                                                      ⏱️ Durasi: {lesson.durationMinutes} mnt
                                                    </span>
                                                  )}
                                                  {lesson.isLocked && (
                                                    <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md border border-red-200 flex items-center gap-1 uppercase">
                                                      <Lock className="w-3 h-3" /> Dikunci
                                                    </span>
                                                  )}
                                                </div>
                                                <div>
                                                  <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">{lesson.title}</h4>
                                                  {lesson.japaneseTitle && (
                                                    <p className="text-[10px] text-blue-600 font-bold font-display mt-0.5">{lesson.japaneseTitle}</p>
                                                  )}
                                                </div>
                                              </div>
    
                                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
                                                {(currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                      onClick={() => {
                                                        handleOpenEditLesson(lesson);
                                                        setSelectedBabNumber(chapter.number);
                                                      }}
                                                      className="p-1.5 text-blue-600 bg-blue-50 border border-blue-150 hover:bg-blue-100 rounded-lg transition cursor-pointer shadow-3xs flex items-center justify-center"
                                                      title="Edit Materi"
                                                    >
                                                      <Edit3 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                      onClick={() => handleLessonDelete(lesson.id, lesson.title)}
                                                      className="p-1.5 text-rose-600 bg-rose-50 border border-rose-150 hover:bg-rose-100 rounded-lg transition cursor-pointer shadow-3xs flex items-center justify-center"
                                                      title="Hapus Materi"
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                  </div>
                                                )}
                                                
                                                <div className="text-slate-400 bg-slate-100 p-1.5 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition">
                                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </div>
                                              </div>
                                            </div>
    
                                            {/* Body */}
                                            {isExpanded && !isLockedBySensei && (
                                              <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/50 animate-fade-in">
                                                {isLessonDeadlinePassed && currentUser?.role === "Siswa" && (
                                                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs">
                                                    <span>⚠️ Batas waktu mempelajari materi ini telah berakhir ({new Date(lesson.deadline || "").toLocaleString("id-ID")}).</span>
                                                  </div>
                                                )}
                                                {lesson.contentType === "video" && lesson.videoUrl && (() => {
                                                  const embedUrl = formatVideoEmbedUrl(lesson.videoUrl);
                                                  const directUrl = getDirectVideoUrl(lesson.videoUrl) || lesson.videoUrl;
                                                  const isStreaming = isYouTubeOrStreamingUrl(lesson.videoUrl) || lesson.videoUrl.includes("youtube.com") || lesson.videoUrl.includes("youtu.be") || lesson.videoUrl.includes("vimeo.com") || lesson.videoUrl.includes("embed") || (typeof lesson.videoUrl === "string" && lesson.videoUrl.startsWith("http") && !lesson.videoUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i));

                                                  return (
                                                    <div className="space-y-2">
                                                      <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                                        <span className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1.5">
                                                          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                                          Video Pembelajaran {lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be") ? "(YouTube)" : ""}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                          <button
                                                            type="button"
                                                            onClick={() => window.open(directUrl, "_blank", "noopener,noreferrer")}
                                                            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow-2xs shrink-0 cursor-pointer"
                                                            title="Buka video di tab baru atau aplikasi YouTube"
                                                          >
                                                            <ExternalLink className="w-3 h-3" />
                                                            <span>Buka di YouTube / Tab Baru</span>
                                                          </button>
                                                        </div>
                                                      </div>
                                                      <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-3xs bg-black">
                                                        {isStreaming ? (
                                                          <iframe 
                                                            src={embedUrl} 
                                                            className="w-full h-full" 
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                            allowFullScreen 
                                                            referrerPolicy="strict-origin-when-cross-origin" 
                                                            title={lesson.title || "Video Pembelajaran"} 
                                                          />
                                                        ) : (
                                                          <video src={lesson.videoUrl} controls className="w-full h-full" />
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                })()}
    
                                                {lesson.contentType === "slide" && lesson.slidesUrl && (
                                                  <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                                      <span className="text-[10px] text-slate-500 font-semibold truncate">
                                                        Slide Presentasi / PPT & PDF
                                                      </span>
                                                      <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                          type="button"
                                                          onClick={() => downloadFile(lesson.slidesUrl, `${lesson.title || "Slide_Materi"}.pptx`)}
                                                          className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow-2xs shrink-0 cursor-pointer"
                                                          title="Unduh File Slide"
                                                        >
                                                          <Download className="w-3 h-3" />
                                                          <span>Unduh</span>
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => window.open(lesson.slidesUrl, "_blank", "noopener,noreferrer")}
                                                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow-2xs shrink-0 cursor-pointer"
                                                        >
                                                          <ExternalLink className="w-3 h-3" />
                                                          <span>Buka Tab Baru</span>
                                                        </button>
                                                      </div>
                                                    </div>
                                                    <div className="relative aspect-video sm:aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 shadow-3xs bg-slate-50">
                                                      {(() => {
                                                        const rawUrl = lesson.slidesUrl || "";
                                                        let safeSrc = getEmbeddablePdfUrl(rawUrl);
                                                        if (safeSrc.includes("docs.google.com/presentation/d/") && !safeSrc.includes("?")) {
                                                          safeSrc = `${safeSrc}?start=false&loop=false&delayms=3000`;
                                                        } else if (!safeSrc.includes("docs.google.com") && !safeSrc.includes("office.com") && !safeSrc.endsWith(".pdf") && !safeSrc.startsWith("data:") && safeSrc.startsWith("http")) {
                                                          safeSrc = `https://docs.google.com/viewer?url=${encodeURIComponent(safeSrc)}&embedded=true`;
                                                        }
                                                        return (
                                                          <iframe 
                                                            src={safeSrc} 
                                                            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                                                            loading="lazy"
                                                            className="absolute top-0 left-0 w-full h-full animate-fade-in" 
                                                            style={{ objectFit: 'contain' }} 
                                                            allowFullScreen 
                                                            referrerPolicy="no-referrer" 
                                                            title={lesson.title || "Slide Materi"} 
                                                          />
                                                        );
                                                      })()}
                                                    </div>
                                                  </div>
                                                )}
    
                                                {lesson.contentType === "buku" && lesson.bookUrl && (
                                                  <div className="space-y-3">
                                                    <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-200/60 p-4 rounded-xl flex items-center justify-between gap-3 text-left">
                                                      <div className="flex items-center gap-3">
                                                        <span className="h-9 w-9 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-xl font-bold text-base">📚</span>
                                                        <div>
                                                          <p className="font-bold text-[11px] text-slate-800">Dokumen Pendukung</p>
                                                          <p className="text-[9px] text-slate-500">Materi PDF / Docs</p>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                          type="button"
                                                          onClick={() => downloadFile(lesson.bookUrl, `${lesson.title || "Dokumen_Materi"}.pdf`)}
                                                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95 shadow-2xs shrink-0 text-center flex items-center gap-1 cursor-pointer"
                                                          title="Unduh File Dokumen"
                                                        >
                                                          <Download className="w-3 h-3" />
                                                          <span>Unduh</span>
                                                        </button>
                                                        <button onClick={() => window.open(lesson.bookUrl, "_blank", "noopener,noreferrer")} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95 shadow-2xs shrink-0 text-center cursor-pointer">Buka PDF</button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
    
                                                {lesson.contentType === "audio" && lesson.audioData && (
                                                  <div className="bg-gradient-to-r from-indigo-500/5 to-blue-500/5 border border-indigo-200/60 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-left shadow-3xs">
                                                    <div className="flex items-center gap-3">
                                                      <div className="h-10 w-10 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full font-bold shadow-sm">
                                                        🎙️
                                                      </div>
                                                      <div>
                                                        <p className="font-bold text-[11px] text-slate-800">Rekaman Suara / Audio</p>
                                                        <p className="text-[9px] text-slate-500">Dengarkan materi bahasa Jepang</p>
                                                      </div>
                                                    </div>
                                                    <div className="w-full sm:flex-1">
                                                      <audio src={lesson.audioData} controls className="w-full h-10" />
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {lesson.content && (
                                                  <div className="bg-white p-4 rounded-xl whitespace-pre-line text-xs font-normal text-slate-700 leading-relaxed border border-slate-200 shadow-3xs relative group/content">
                                                    <button
                                                      onClick={() => {
                                                        if ('speechSynthesis' in window) {
                                                          const utterance = new SpeechSynthesisUtterance(lesson.content);
                                                          utterance.lang = lesson.subject === "Bahasa Jepang" ? 'ja-JP' : 'id-ID';
                                                          window.speechSynthesis.speak(utterance);
                                                        }
                                                      }}
                                                      className="absolute top-2 right-2 p-1.5 bg-slate-100 text-slate-600 rounded-lg opacity-0 group-hover/content:opacity-100 transition shadow-3xs hover:bg-indigo-100 hover:text-indigo-600 cursor-pointer"
                                                      title="Dengarkan Materi"
                                                    >
                                                      <Volume2 className="h-3 w-3" />
                                                    </button>
                                                    <div className="pr-6">{lesson.content}</div>
                                                  </div>
                                                )}
    
                                                {/* Panel Tugas untuk Siswa / Guru */}
                                                {lesson.difficulty === "Tugas" && (
                                                  <div className="mt-4 p-4 rounded-2xl border border-slate-150 bg-white space-y-4">
                                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                                      <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 font-bold">
                                                        <GraduationCap className="w-4 h-4" />
                                                      </span>
                                                      <div>
                                                        <h5 className="font-display font-extrabold text-xs text-slate-800">Panel Tugas & Pengumpulan</h5>
                                                        <p className="text-[10px] text-slate-400">Semua upload tugas berupa file PDF atau Gambar (PNG/JPEG).</p>
                                                      </div>
                                                    </div>
    
                                                    {currentUser?.role === "Siswa" ? (
                                                      // SISWA INTERFACE
                                                      (() => {
                                                        const studentId = currentUser?.studentId || currentUser?.username || "";
                                                        const assessment = (systemState?.chapterAssessments || []).find(
                                                          (c) => c.lessonId === lesson.id && c.studentId === studentId
                                                        );
    
                                                        return (
                                                          <div className="space-y-4">
                                                            {/* Current Status */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                                              <div className="space-y-1">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status Pengumpulan</span>
                                                                <div className="flex items-center gap-1.5">
                                                                  {assessment ? (
                                                                    assessment.status === "Menunggu Penilaian" ? (
                                                                      <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                        🟡 Menunggu Penilaian
                                                                      </span>
                                                                    ) : (
                                                                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                        🟢 Sudah Dinilai
                                                                      </span>
                                                                    )
                                                                  ) : (
                                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                                                      Belum Mengumpulkan
                                                                    </span>
                                                                  )}
                                                                </div>
                                                              </div>
    
                                                              {assessment && assessment.status !== "Menunggu Penilaian" && (
                                                                <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-3 pt-2 sm:pt-0">
                                                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nilai Dari Sensei</span>
                                                                  <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-lg">
                                                                      {assessment.score ?? 0} / 100
                                                                    </span>
                                                                    {assessment.grade && (
                                                                      <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                                                                        Grade {assessment.grade}
                                                                      </span>
                                                                    )}
                                                                  </div>
                                                                </div>
                                                              )}
                                                            </div>
    
                                                            {/* Teacher Feedback Notes */}
                                                            {assessment && assessment.notes && (
                                                              <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl space-y-1">
                                                                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">Catatan & Koreksi Sensei ({assessment.assessedBy || "Sensei"}):</span>
                                                                <p className="text-xs font-normal text-slate-700 leading-relaxed italic">"{assessment.notes}"</p>
                                                              </div>
                                                            )}
    
                                                            {/* Submitted File Detail */}
                                                            {assessment?.submissionUrl && (
                                                              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                                <div className="flex items-center gap-2.5 truncate">
                                                                  <span className="h-8 w-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg">
                                                                    <FileText className="w-4 h-4" />
                                                                  </span>
                                                                  <div className="truncate">
                                                                    <p className="font-bold text-xs text-slate-800 truncate">Berkas Tugas Anda</p>
                                                                    <p className="text-[9px] text-slate-400">
                                                                      Diserahkan: {assessment.submissionDate ? new Date(assessment.submissionDate).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                                                                    </p>
                                                                  </div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => setPdfViewerUrl(assessment.submissionUrl)}
                                                                    className="p-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition shadow-3xs cursor-pointer flex items-center justify-center gap-1 text-[10px] font-bold"
                                                                    title="Lihat Pratinjau Berkas Tugas"
                                                                  >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    <span>Lihat</span>
                                                                  </button>
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => downloadFile(assessment.submissionUrl, `Tugas_${assessment.studentName || "Siswa"}`)}
                                                                    className="p-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition shadow-3xs cursor-pointer flex items-center justify-center"
                                                                    title="Buka / Unduh Berkas"
                                                                  >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                  </button>
                                                                </div>
                                                              </div>
                                                            )}
    
                                                            {/* File Upload Area */}
                                                            {(!lesson.deadline || new Date() < new Date(lesson.deadline)) && (
                                                              <div className="space-y-2">
                                                                {lesson.durationMinutes && !cbtStartTimes[`tugas_${lesson.id}`] ? (
                                                                  <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                                                                    <p className="text-sm font-bold text-slate-700">Tugas ini memiliki durasi pengerjaan CBT.</p>
                                                                    <p className="text-xs text-slate-500">Durasi: {lesson.durationMinutes} Menit. Waktu akan terus berjalan meskipun aplikasi ditutup.</p>
                                                                    <button onClick={() => handleStartCbt(`tugas_${lesson.id}`)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition">
                                                                      Mulai Mengerjakan Tugas
                                                                    </button>
                                                                  </div>
                                                                ) : (
                                                                  <>
                                                                    {lesson.durationMinutes && cbtStartTimes[`tugas_${lesson.id}`] && (
                                                                      <div className="mb-4 flex justify-center">
                                                                        <CBTTimer 
                                                                          startTime={cbtStartTimes[`tugas_${lesson.id}`]} 
                                                                          durationMinutes={lesson.durationMinutes} 
                                                                          onExpire={() => { setCbtStartTimes(prev => ({...prev})) }} 
                                                                        />
                                                                      </div>
                                                                    )}
                                                                    {(!lesson.durationMinutes || (cbtStartTimes[`tugas_${lesson.id}`] && Date.now() < cbtStartTimes[`tugas_${lesson.id}`] + lesson.durationMinutes * 60 * 1000)) ? (
                                                                  <>
                                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                                  {assessment ? "Kirim Ulang / Perbarui Tugas" : "Unggah Lembar Jawaban"}
                                                                </label>
                                                                <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 transition flex flex-col items-center justify-center text-center bg-slate-50/20 group">
                                                                  <input
                                                                    type="file"
                                                                    accept="application/pdf,image/*"
                                                                    disabled={submittingLessons[lesson.id]}
                                                                    onChange={async (e) => {
                                                                      const file = e.target.files?.[0];
                                                                      if (!file) {
                                                                        setPendingTugasFiles(prev => ({ ...prev, [lesson.id]: null }));
                                                                        return;
                                                                      }
                                                                      const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
                                                                      if (!allowedTypes.includes(file.type)) {
                                                                        alert("Format file tidak didukung. Harap unggah file PDF atau Gambar (PNG/JPEG).");
                                                                        return;
                                                                      }
                                                                      if (file.size > 15 * 1024 * 1024) {
                                                                        alert("Ukuran file terlalu besar. Maksimal 15 MB.");
                                                                        return;
                                                                      }
                                                                      
                                                                      setPendingTugasFiles(prev => ({ ...prev, [lesson.id]: file }));
                                                                    }}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                                  />
                                                                  {submittingLessons[lesson.id] ? (
                                                                    <div className="flex flex-col items-center gap-2">
                                                                      <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                                                                      <p className="text-[11px] font-bold text-slate-600">Sedang mengunggah berkas tugas...</p>
                                                                    </div>
                                                                  ) : pendingTugasFiles[lesson.id] ? (
                                                                    <>
                                                                      <FileText className="w-6 h-6 text-indigo-600 mb-1.5" />
                                                                      <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{pendingTugasFiles[lesson.id]?.name}</p>
                                                                      <p className="text-[9px] text-slate-400 mt-1">Siap untuk dikumpulkan</p>
                                                                    </>
                                                                  ) : (
                                                                    <>
                                                                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition mb-1.5" />
                                                                      <p className="text-xs font-bold text-slate-700">Tarik berkas ke sini atau klik untuk memilih</p>
                                                                      <p className="text-[9px] text-slate-400 mt-1">PDF atau Gambar (Maks. 15MB)</p>
                                                                    </>
                                                                  )}
                                                                </div>
                                                                {pendingTugasFiles[lesson.id] && !submittingLessons[lesson.id] && (
                                                                  <button 
                                                                    type="button" 
                                                                    onClick={async () => {
                                                                      const file = pendingTugasFiles[lesson.id];
                                                                      if (!file) return;
                                                                      setSubmittingLessons(prev => ({ ...prev, [lesson.id]: true }));
                                                                      try {
                                                                        const url = await uploadFileToFirebase(file, "lms_assignments");
                                                                        const payload = {
                                                                          studentId,
                                                                          studentName: currentUser?.name || "Siswa LPK",
                                                                          chapterNumber: Number(lesson.chapterNumber || chapter.number),
                                                                          title: lesson.title,
                                                                          status: "Menunggu Penilaian",
                                                                          subject: lesson.subject,
                                                                          lessonId: lesson.id,
                                                                          submissionUrl: url,
                                                                          submissionDate: new Date().toISOString()
                                                                        };
                                                                        if (onUpdateState) {
                                                                          await onUpdateState("chapterAssessments", "update", payload);
                                                                          alert("Tugas berhasil dikumpulkan dan disimpan!");
                                                                          setPendingTugasFiles(prev => ({ ...prev, [lesson.id]: null }));
                                                                        }
                                                                      } catch (err) {
                                                                        console.error(err);
                                                                        alert("Gagal mengunggah tugas.");
                                                                      } finally {
                                                                        setSubmittingLessons(prev => ({ ...prev, [lesson.id]: false }));
                                                                      }
                                                                    }}
                                                                    className="mt-3 w-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                                                                  >
                                                                    <Upload className="w-4 h-4" /> Simpan Tugas
                                                                  </button>
                                                                )}
                                                                  </>
                                                                    ) : (
                                                                        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-bold text-xs shadow-3xs space-y-2">
                                                                          <p>🚫 Waktu pengerjaan tugas CBT telah habis. Anda tidak dapat mengunggah berkas lagi.</p>
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => handleStartCbt(`tugas_${lesson.id}`)}
                                                                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                                                          >
                                                                            🔄 Kerjakan Ulang Tugas
                                                                          </button>
                                                                        </div>
                                                                    )}
                                                                  </>
                                                                )}
                                                              </div>
                                                            )}
                                                          </div>
                                                        );
                                                      })()
                                                    ) : (
                                                      // STAFF / TEACHER INTERFACE (Redirect to Progress Tab)
                                                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3">
                                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                                          <Award className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                          <h6 className="font-extrabold text-sm text-slate-800">Manajemen Penilaian Tugas</h6>
                                                          <p className="text-xs text-slate-500 mt-1">Penilaian tugas siswa telah dipindahkan ke menu Progress & Nilai untuk mempermudah rekapitulasi.</p>
                                                        </div>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setEvalSelectedLessonId(lesson.id);
                                                            setProgressTabMode("penilaian");
                                                            setActiveSubTab("progress");
                                                          }}
                                                          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition active:scale-95 shadow-sm inline-flex items-center gap-2"
                                                        >
                                                          Buka Panel Penilaian
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            )}
    
                                            {isExpanded && isLockedBySensei && (
                                              <div className="p-8 border-t border-slate-100 text-center flex flex-col items-center justify-center bg-slate-50/50 animate-fade-in">
                                                <div className="bg-red-100 p-3 rounded-full mb-2 shadow-3xs">
                                                  <Lock className="w-5 h-5 text-red-600" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">Materi Dikunci</p>
                                                <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                                                  Silakan ikuti instruksi Sensei di kelas.
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
    
                                  {/* Quizzes Section */}
                                  {filteredQuizzes.length > 0 && (() => {
                                    const subGroupsMap: Record<string, any[]> = {};
                                    filteredQuizzes.forEach((q: any) => {
                                      const key = (q.subTitle || "").trim() || `Kuis Utama Bab ${chapter.number}`;
                                      if (!subGroupsMap[key]) subGroupsMap[key] = [];
                                      subGroupsMap[key].push(q);
                                    });

                                    const subGroups = Object.entries(subGroupsMap).map(([title, qList]) => ({
                                      subTitle: title,
                                      lessonId: qList[0]?.lessonId || "",
                                      quizzes: qList,
                                      durationMinutes: qList[0]?.durationMinutes,
                                      deadline: qList[0]?.deadline,
                                      targetClass: qList[0]?.targetClass,
                                      shuffleQuestions: qList[0]?.shuffleQuestions,
                                    }));

                                    const isStaff = currentUser?.role !== "Siswa";

                                    return (
                                      <div className="space-y-4 pt-4 border-t border-slate-150/60 text-left">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                          <div>
                                            <h4 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                              <span>📋 Soal Latihan &amp; Kuis Bab {chapter.number}</span>
                                              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
                                                {subGroups.length} Sub Kuis
                                              </span>
                                            </h4>
                                            <p className="text-[10px] text-slate-500">
                                              Setiap bab memiliki sub-materi kuis untuk menguji pemahaman materi Anda.
                                            </p>
                                          </div>
                                          {isStaff && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setNewSubTitleInput(`Sub ${subGroups.length + 1}: Kuis Materi Bab ${chapter.number}`);
                                                setSelectedSubLessonId("");
                                                setQuizChoiceModalChapter(chapter);
                                              }}
                                              className="self-start sm:self-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                                            >
                                              <Plus className="w-3.5 h-3.5" />
                                              <span>+ Buat Sub Kuis Baru</span>
                                            </button>
                                          )}
                                        </div>

                                        {/* List of Sub Quizzes */}
                                        <div className="space-y-4">
                                          {subGroups.map((sub, sIdx) => {
                                            const subQuizIds = sub.quizzes.map((q: any) => q.id);
                                            const currentStudentTarget = isSiswaOrAlumni 
                                              ? ((filteredActiveStudents || []).find((s: any) => {
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
                                                }) || currentUser)
                                              : (selectedStudentId ? (filteredActiveStudents || []).find((s: any) => s.id === selectedStudentId) : null);
                                            const studentAssessment = currentStudentTarget ? findMatchingAssessmentForStudent(currentStudentTarget, chapter.number, sub.subTitle) : null;
                                            const isSubCompleted = (sub.quizzes.length > 0 && sub.quizzes.every((q: any) => submittedQuizIds.includes(q.id))) ||
                                              Boolean(studentAssessment && (studentAssessment.score !== undefined || studentAssessment.status === "Telah Dinilai" || studentAssessment.status === "Selesai Belajar"));

                                            return (
                                              <div 
                                                key={sub.subTitle || sIdx} 
                                                className="bg-slate-50/70 border border-slate-200/90 hover:border-purple-300 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all space-y-4 text-left"
                                              >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-3">
                                                  <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <span className="text-[10px] font-black bg-purple-700 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                                                        Sub #{sIdx + 1}
                                                      </span>
                                                      <h5 className="font-display font-extrabold text-sm text-slate-900">
                                                        {sub.subTitle}
                                                      </h5>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 font-medium">
                                                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                                                        {sub.quizzes.length} Soal
                                                      </span>
                                                      {sub.durationMinutes ? (
                                                        <span className="bg-blue-50 border border-blue-150 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                                                          ⏱️ {sub.durationMinutes} Menit
                                                        </span>
                                                      ) : (
                                                        <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                                                          ⏱️ Tanpa Batas Waktu
                                                        </span>
                                                      )}
                                                      {sub.targetClass && sub.targetClass !== "Semua" && (
                                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                                                          Kelas: {sub.targetClass}
                                                        </span>
                                                      )}
                                                      {sub.deadline && (
                                                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                                                          ⏳ Batas: {new Date(sub.deadline).toLocaleDateString("id-ID")}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Status Badge */}
                                                  <div>
                                                    {isSubCompleted ? (
                                                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-3xs">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        <span>Selesai Dikerjakan</span>
                                                      </span>
                                                    ) : (
                                                      <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                                                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                                                        <span>{isStaff ? "Aktif" : "Belum Dikerjakan"}</span>
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    {isStaff ? (
                                                      <>
                                                        <button 
                                                          type="button"
                                                          onClick={() => {
                                                            if (setActiveQuizSubTitle) setActiveQuizSubTitle(sub.subTitle);
                                                            setActiveQuizChapterId(chapter.number);
                                                          }} 
                                                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                                                        >
                                                          <Eye className="w-3.5 h-3.5" />
                                                          <span>Pratinjau Kuis Sub Ini ({sub.quizzes.length} Soal)</span>
                                                        </button>
                                                        <button 
                                                          type="button"
                                                          onClick={() => handleOpenEditSubQuiz(chapter, sub)} 
                                                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                                                        >
                                                          <Edit3 className="w-3.5 h-3.5" />
                                                          <span>Edit / Tambah Soal</span>
                                                        </button>
                                                        <button 
                                                          type="button"
                                                          onClick={() => handleDeleteSubQuiz(sub.subTitle, subQuizIds)} 
                                                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition cursor-pointer"
                                                          title="Hapus sub kuis ini beserta seluruh soalnya"
                                                        >
                                                          <Trash2 className="w-4 h-4" />
                                                        </button>
                                                      </>
                                                    ) : (
                                                      <>
                                                        {isSubCompleted ? (
                                                          <>
                                                            <button 
                                                              type="button"
                                                              onClick={() => {
                                                                if (setActiveQuizSubTitle) setActiveQuizSubTitle(sub.subTitle);
                                                                setActiveQuizChapterId(chapter.number);
                                                              }} 
                                                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                                                            >
                                                              <span>👁️ Lihat Pembahasan &amp; Nilai</span>
                                                            </button>
                                                            <button 
                                                              type="button"
                                                              onClick={() => {
                                                                if (typeof handleRetakeQuiz === 'function') {
                                                                  handleRetakeQuiz(chapter.number, subQuizIds, sub.subTitle);
                                                                }
                                                                if (setActiveQuizSubTitle) setActiveQuizSubTitle(sub.subTitle);
                                                                setActiveQuizChapterId(chapter.number);
                                                              }} 
                                                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                                                            >
                                                              <span>🔄 Kerjakan Ulang Sub Ini</span>
                                                            </button>
                                                          </>
                                                        ) : (
                                                          <button 
                                                            type="button"
                                                            onClick={() => {
                                                              if (typeof handleRetakeQuiz === 'function') {
                                                                handleRetakeQuiz(chapter.number, subQuizIds, sub.subTitle);
                                                              } else {
                                                                if (setActiveQuizSubTitle) setActiveQuizSubTitle(sub.subTitle);
                                                                setActiveQuizChapterId(chapter.number);
                                                              }
                                                            }} 
                                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2 active:scale-95"
                                                          >
                                                            <span>🚀 Mulai Kerjakan Sub Kuis ({sub.quizzes.length} Soal)</span>
                                                          </button>
                                                        )}
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>

                                          {/* Rekapitulasi Hasil Kuis & Jawaban Siswa (Sensei / Admin) */}
                                          {currentUser?.role !== "Siswa" && senseiChapterTab === "all" && filteredQuizzes.length > 0 && (
                                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 text-left mt-4">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                                <div className="flex items-center gap-2.5">
                                                  <span className="p-2 rounded-xl bg-purple-50 text-purple-700 font-bold border border-purple-100">
                                                    <Award className="w-4 h-4" />
                                                  </span>
                                                  <div>
                                                    <h5 className="font-display font-black text-xs sm:text-sm text-slate-800">
                                                      📊 Rekapitulasi Hasil & Jawaban Siswa (Bab {chapter.number})
                                                    </h5>
                                                    <p className="text-[10px] text-slate-500 font-normal">
                                                      Daftar siswa yang telah mengerjakan kuis bab ini beserta skor dan opsi periksa essay.
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                                                    Total Siswa: {(filteredActiveStudents || []).length}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Table / List Siswa */}
                                              <div className="divide-y divide-slate-100">
                                                {(filteredActiveStudents || []).length === 0 ? (
                                                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                                                    Belum ada data siswa aktif terdaftar di kelas ini.
                                                  </div>
                                                ) : (
                                                  (filteredActiveStudents || []).map((student: any) => {
                                                    const sId = student.id || student.studentId;
                                                    const matchingAssessment = findMatchingAssessmentForStudent(student, chapter.number);

                                                    const isSubmitted = isAssessmentSubmitted(matchingAssessment);
                                                    const score = matchingAssessment?.score !== undefined ? Number(matchingAssessment.score) : null;

                                                    return (
                                                      <div key={sId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition">
                                                        <div className="flex items-center gap-3">
                                                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                                                            {student.name ? student.name.substring(0, 2).toUpperCase() : "SW"}
                                                          </div>
                                                          <div>
                                                            <p className="text-xs font-bold text-slate-900 leading-tight">{student.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">
                                                              ID: {sId} • Kelas: {student.class || "-"}
                                                            </p>
                                                          </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                                          {/* Status Badge */}
                                                          {isSubmitted ? (
                                                            <div className="flex items-center gap-2">
                                                              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border font-mono ${
                                                                score !== null
                                                                  ? ((score || 0) >= 75
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : "bg-amber-50 text-amber-700 border-amber-200")
                                                                  : "bg-purple-50 text-purple-700 border-purple-200"
                                                              }`}>
                                                                {score !== null ? `⭐ Nilai: ${score}%` : "📝 Menunggu Koreksi / Selesai"}
                                                              </span>
                                                            </div>
                                                          ) : (
                                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg">
                                                              ⚪ Belum Mengerjakan
                                                            </span>
                                                          )}

                                                          {/* Tombol Periksa / Koreksi Jawaban */}
                                                          {isSubmitted && (
                                                            <button
                                                              type="button"
                                                              onClick={() => {
                                                                setReviewModalStudent(student);
                                                                setReviewModalChapter(chapter);
                                                                setReviewModalQuizzes(filteredQuizzes.length > 0 ? filteredQuizzes : (allChapterQuizzes || []));
                                                                setReviewModalAssessment(matchingAssessment);
                                                                setIsReviewModalOpen(true);
                                                              }}
                                                              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                                                              title="Periksa lembar jawaban dan koreksi essay siswa"
                                                            >
                                                              <Eye className="w-3.5 h-3.5" />
                                                              <span>👁️ Periksa & Koreksi Essay</span>
                                                            </button>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
    
                          {/* Status indicator widget */}
                          <div className="p-4 rounded-2xl border flex items-center justify-between gap-4 text-left bg-radial">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metrik Kemajuan Siswa ({targetStudent.name})</p>
                              <div className="flex items-center gap-1.5 pt-1">
                                {assessment?.status === "Telah Dinilai" ? (
                                  <>
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-xs font-bold text-emerald-800">
                                      {assessmentSubject === "SSW" ? "Telah Dinilai Instruktur SSW" : "Telah Dievaluasi Oleh Instruktur Kelisanan"}
                                    </span>
                                  </>
                                ) : assessment?.status === "Selesai Belajar" ? (
                                  <>
                                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    <span className="text-xs font-bold text-amber-800">
                                      {assessmentSubject === "SSW" ? "Menunggu Verifikasi & Tes Logika SSW" : "Menunggu Verifikasi & Ujian Lisan Instruktur"}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                                    <span className="text-xs font-bold text-slate-700">Belum Mengambil / Belum Lulus Bab Ini</span>
                                  </>
                                )}
                              </div>
                            </div>
    
                            {assessment?.status === "Telah Dinilai" && (
                              <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-4 py-2 rounded-xl text-center shrink-0">
                                <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Nilai Bab</p>
                                <p className="font-display font-black text-2xl leading-none">{assessment.score}</p>
                                <p className="text-[9px] font-extrabold mt-0.5">GRADE {assessment.grade}</p>
                              </div>
                            )}
                          </div>
    
                          {/* User Context Based Form */}
                          {currentUser?.role !== "Siswa" && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3 mt-6">
                              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <Award className="w-6 h-6" />
                              </div>
                              <div>
                                <h6 className="font-extrabold text-sm text-slate-800">Manajemen Penilaian Bab</h6>
                                <p className="text-xs text-slate-500 mt-1">Daftar dan penilaian bab siswa telah dipindahkan ke menu Progress & Nilai untuk mempermudah rekapitulasi.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setProgressTabMode("penilaian_bab");
                                  setActiveSubTab("progress");
                                }}
                                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition active:scale-95 shadow-sm inline-flex items-center gap-2"
                              >
                                Buka Panel Penilaian Bab
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
    
                </div>

      {/* Modal Pilihan Kuis: Buat Sub Kuis Baru atau Edit Sub Kuis yang Ada */}
      {quizChoiceModalChapter && (
        <div className="fixed inset-0 z-[10001] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 text-left">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-150 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  📝
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-slate-900">
                    Kuis &amp; Soal Bab {quizChoiceModalChapter.number}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Setiap bab dapat memiliki beberapa materi &amp; sub kuis terpisah.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setQuizChoiceModalChapter(null)} 
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: Buat Sub Kuis Baru */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <span>✨ Buat Sub Kuis Baru</span>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">Baru</span>
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Buat paket kuis/soal terpisah untuk topik atau materi lain di Bab {quizChoiceModalChapter.number} (misal: Sub Kuis Kosakata, Pola Kalimat, Menyimak).
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider block">
                  Judul / Topik Sub Kuis Baru:
                </label>
                <input 
                  type="text"
                  value={newSubTitleInput}
                  onChange={(e) => setNewSubTitleInput(e.target.value)}
                  placeholder="Contoh: Sub 2: Kosakata Bab 1 / Tata Bahasa Bunpou"
                  className="w-full bg-white border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400"
                />

                {/* Optional lessons list to link */}
                {(() => {
                  const chLessons = (lmsLessons || systemState?.lmsLessons || []).filter(
                    (l: any) => l.chapterNumber === quizChoiceModalChapter.number && (!l.subject || l.subject === assessmentSubject)
                  );
                  if (chLessons.length === 0) return null;
                  return (
                    <div className="pt-1.5 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-900 block">Atau pilih dari materi bab ini:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {chLessons.map((l: any) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setNewSubTitleInput(l.title);
                              setSelectedSubLessonId(l.id);
                            }}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer flex items-center gap-1 ${
                              newSubTitleInput === l.title
                                ? "bg-emerald-700 text-white border-emerald-800 shadow-2xs font-bold"
                                : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            <span>{l.contentType === "video" ? "🎬" : l.contentType === "slide" ? "📽️" : "📝"}</span>
                            <span>{l.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={() => {
                  const title = newSubTitleInput.trim() || `Sub Kuis Materi Bab ${quizChoiceModalChapter.number}`;
                  handleStartNewSubQuiz(quizChoiceModalChapter, title, selectedSubLessonId);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Sub Kuis Ini di Google Form</span>
              </button>
            </div>

            {/* Option 2: Edit Kuis yang Sudah Ada */}
            {(() => {
              const existingQuizzes = (systemState?.lmsQuizzes || []).filter((q: any) => {
                const chNum = q.chapterNumber !== undefined ? Number(q.chapterNumber) : (q.chapterId !== undefined ? Number(q.chapterId) : NaN);
                return (chNum === quizChoiceModalChapter.number || String(q.chapterNumber) === String(quizChoiceModalChapter.number) || String(q.chapterId) === String(quizChoiceModalChapter.number)) &&
                  (!q.subject || q.subject === assessmentSubject);
              });
              const subMap: Record<string, any[]> = {};
              existingQuizzes.forEach((q: any) => {
                const k = (q.subTitle || "").trim() || `Kuis Utama Bab ${quizChoiceModalChapter.number}`;
                if (!subMap[k]) subMap[k] = [];
                subMap[k].push(q);
              });
              const existingList = Object.entries(subMap).map(([k, list]) => ({
                subTitle: k,
                lessonId: list[0]?.lessonId || "",
                quizzes: list,
                durationMinutes: list[0]?.durationMinutes,
                deadline: list[0]?.deadline,
                targetClass: list[0]?.targetClass,
              }));

              if (existingList.length === 0) return null;

              return (
                <div className="space-y-2 pt-1 border-t border-slate-150">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Atau Edit Sub Kuis yang Sudah Ada:
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {existingList.map((subItem: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 rounded-xl flex items-center justify-between gap-3 transition"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{subItem.subTitle}</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {subItem.quizzes.length} Soal • {subItem.durationMinutes ? `${subItem.durationMinutes} Menit` : "Tanpa batas waktu"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenEditSubQuiz(quizChoiceModalChapter, subItem);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 font-bold text-xs rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit / Buka</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Review & Koreksi Essay Siswa */}
      {isReviewModalOpen && (
        <StudentQuizReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewModalStudent(null);
            setReviewModalAssessment(null);
          }}
          student={reviewModalStudent}
          chapterNumber={reviewModalChapter?.number || reviewModalChapter?.chapterNumber || reviewModalChapter?.id || 1}
          chapterTitle={reviewModalChapter?.title || reviewModalChapter?.titleRomaji || `Bab ${reviewModalChapter?.number || 1}`}
          subject={assessmentSubject || "Bahasa Jepang"}
          quizzes={reviewModalQuizzes}
          assessment={reviewModalAssessment}
          onUpdateState={onUpdateState}
          currentUser={currentUser}
        />
      )}

      {/* Pop Up Modal: Tambah & Beri Nama / Edit Bab Mandiri */}
      {isMandiriModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className={`p-5 border-b border-slate-100 flex items-center justify-between ${
              editingMandiriChapter
                ? "bg-gradient-to-r from-amber-50/80 via-emerald-50/40 to-white"
                : "bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0 text-white ${
                  editingMandiriChapter
                    ? "bg-amber-500 shadow-amber-200"
                    : "bg-emerald-600 shadow-emerald-200"
                }`}>
                  {editingMandiriChapter ? <Edit3 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-slate-900 text-base">
                    {editingMandiriChapter ? `Edit & Ubah Bab Mandiri (Bab ${editingMandiriChapter.number})` : "Tambah Bab Mandiri Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    {editingMandiriChapter
                      ? "Perbarui nomor bab, nama judul bab, dan topik pembelajaran."
                      : "Beri nomor, nama bab, dan topik pembelajaran untuk Bab baru ini."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMandiriModalOpen(false);
                  setEditingMandiriChapter(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMandiriModal} className="p-6 space-y-4 text-left">
              {/* Context Badges & Apply to All classes option */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-semibold text-slate-700">
                <span className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-lg text-emerald-700 font-bold">
                  Kelas: {mandiriApplyToAll ? "Semua Kelas" : (mandiriTargetClass || "Semua Kelas")}
                </span>
                <span className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-lg text-blue-700 font-bold">
                  Mata Pelajaran: {assessmentSubject}
                </span>
                {editingMandiriChapter && (
                  <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-bold">
                    Mode Edit Bab
                  </span>
                )}
              </div>

              {/* Toggle Terapkan Ke Semua Kelas */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1.5">
                <label className="flex items-center gap-2.5 text-xs font-extrabold text-emerald-950 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mandiriApplyToAll}
                    onChange={(e) => setMandiriApplyToAll(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>🌐 Terapkan Materi Mandiri Ini Untuk SEMUA KELAS</span>
                </label>
                <p className="text-[10.5px] text-emerald-800 leading-normal pl-6 font-medium">
                  {mandiriApplyToAll 
                    ? "✓ Bab Mandiri ini akan dibuat dan berlaku untuk SELURUH kelas aktif di LPK SCI."
                    : `Bab Mandiri ini hanya berlaku untuk kelas ${mandiriTargetClass || "terpilih"}.`}
                </p>
              </div>

              {/* Nomor Bab & Judul Bab */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nomor Bab</label>
                  <input
                    type="number"
                    min={1}
                    value={mandiriChapterNumber}
                    onChange={(e) => setMandiriChapterNumber(Number(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 focus:bg-white text-center"
                    required
                  />
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Nama / Judul Bab <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Contoh: Bab 34: Persiapan Wawancara Kerja"
                    value={mandiriTitle}
                    onChange={(e) => setMandiriTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400">Judul bab dalam bahasa Indonesia.</p>
                </div>
              </div>

              {/* Judul Bahasa Jepang */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Judul Bahasa Jepang (Kanji / Romaji)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 面接の準備 (Menseki no Junbi)"
                  value={mandiriJapaneseTitle}
                  onChange={(e) => setMandiriJapaneseTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-normal text-slate-900 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              {/* Deskripsi & Silabus Bab */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Deskripsi &amp; Silabus Bab</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan ringkasan materi, tata bahasa, atau target pembelajaran yang akan dipelajari di bab ini..."
                  value={mandiriDescription}
                  onChange={(e) => setMandiriDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-normal text-slate-900 focus:outline-emerald-600 focus:bg-white resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMandiriModalOpen(false);
                    setEditingMandiriChapter(null);
                  }}
                  disabled={isSavingMandiri}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingMandiri || !mandiriTitle.trim()}
                  className={`px-5 py-2 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    editingMandiriChapter
                      ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  }`}
                >
                  {isSavingMandiri ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : editingMandiriChapter ? (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan Bab</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simpan &amp; Buat Bab</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop Up Modal: Konfirmasi Hapus Bab Mandiri */}
      {mandiriChapterToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-150 overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-rose-50 via-white to-amber-50/30 border-b border-rose-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner ring-4 ring-rose-50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                    Konfirmasi Hapus
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    ✨ Bab Mandiri
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Hapus Bab Mandiri Ini?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apakah Anda yakin ingin menghapus bab pembelajaran mandiri berikut dari kurikulum kelas?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMandiriChapterToDelete(null)}
                disabled={isDeletingMandiri}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chapter details preview */}
            <div className="p-6 space-y-4 text-left">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                    BAB {mandiriChapterToDelete.chapter.number}
                  </span>
                  <span className="font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                    Kelas: {mandiriChapterToDelete.targetClass || "Semua"}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 leading-snug">
                  {mandiriChapterToDelete.chapter.title || `Bab ${mandiriChapterToDelete.chapter.number}`}
                </div>
                {mandiriChapterToDelete.chapter.japaneseTitle && (
                  <div className="text-xs text-slate-500 font-japanese">
                    {mandiriChapterToDelete.chapter.japaneseTitle}
                  </div>
                )}
                {mandiriChapterToDelete.chapter.description && (
                  <div className="text-[11px] text-slate-600 line-clamp-2 pt-2 border-t border-slate-200/60">
                    {mandiriChapterToDelete.chapter.description}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  <strong>Perhatian Sensei:</strong> Bab mandiri ini akan dihapus dari daftar kurikulum kelas <strong>{mandiriChapterToDelete.targetClass || "aktif"}</strong>. Bab standar kurikulum LPK lainnya tetap aman dan tidak akan terhapus.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMandiriChapterToDelete(null)}
                disabled={isDeletingMandiri}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMandiri}
                disabled={isDeletingMandiri}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-200 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDeletingMandiri ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Bab Mandiri</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop Up Warning Modal jika bab bukan mandiri */}
      {mandiriDeleteError && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center ring-4 ring-amber-50">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Tidak Dapat Dihapus
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {mandiriDeleteError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMandiriDeleteError(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
