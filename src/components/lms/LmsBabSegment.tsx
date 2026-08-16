import React from "react";
import { Award, BookOpen, Calculator, ChevronDown, ChevronUp, Download, Edit3, FileText, GraduationCap, Lock, PanelLeftClose, Plus, RefreshCw, Trash2, Unlock, Upload, Volume2 } from "lucide-react";
import { downloadFile, uploadFileToFirebase } from "../../lib/storageHelper";
import { CBTTimer } from "../LmsView.tsx";

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
  handleDeactivateChapterInLms: any;
  handleLessonDelete: any;
  handleOpenEditLesson: any;
  handleStartCbt: any;
  isAlumniClass: any;
  isSidebarCollapsed: any;
  isSiswaOrAlumni: any;
  lmsLessons: any;
  onUpdateState: any;
  selectedBabNumber: any;
  selectedClassFilter: any;
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

export default function LmsBabSegment({ activeStudentClass, activeStudents, allClasses, assessmentSubject, cbtStartTimes, chapterAssessments, currentUser, expandedLessons, filteredActiveStudents, getClassChaptersCount, getClassChaptersList, getResolvedChapterNum, handleActivateChapterInLms, handleDeactivateChapterInLms, handleLessonDelete, handleOpenEditLesson, handleStartCbt, isAlumniClass, isSidebarCollapsed, isSiswaOrAlumni, lmsLessons, onUpdateState, selectedBabNumber, selectedClassFilter, selectedStudentId, setActiveQuizChapterId, setActiveSubTab, setBatchDeadline, setBatchDurationMinutes, setBatchTargetClass, setCbtStartTimes, setEvalSelectedLessonId, setIsLessonFormOpen, setIsQuizFormOpen, setIsSidebarCollapsed, setLessonBookUrl, setLessonContent, setLessonContentType, setLessonDeadline, setLessonDifficulty, setLessonDurationMinutes, setLessonError, setLessonIsLocked, setLessonJapaneseTitle, setLessonSlidesUrl, setLessonSubject, setLessonTargetClass, setLessonTitle, setLessonVideoUrl, setNewQuiz, setPdfViewerUrl, setProgressTabMode, setQuizBatch, setSelectedBabNumber, setSelectedBatchIndex, setSelectedLessonToEdit, setSelectedStudentId, setShowAllChapters, setSubmittingLessons, showAllChapters, studentAssessmentsMap, submittedQuizIds, submittingLessons, systemState, toggleLessonExpanded }: LmsBabSegmentProps) {
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
                        const isAlumni = (student.class || "").toLowerCase().includes("alumni");
    
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
                  const studentIdToView = selectedStudentId || (currentUser?.studentId || "SIS-001");
                  const targetStudent = activeStudents.find(s => s.id === studentIdToView || s.name === currentUser?.name);
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
                      const studentIdToView = selectedStudentId || (currentUser?.studentId || "SIS-001");
                      const targetStudent = activeStudents.find(s => s.id === studentIdToView || s.name === currentUser?.name);
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
                              const studentAsss = (studentAssessmentsMap.get(studentIdToView) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
                              
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
                                  const asses = studentAsss.find(c => c.chapterNumber === ch.number);
                                  if (!asses || asses.status !== "Telah Dinilai") {
                                    nextTargetChapterNum = ch.number;
                                    break;
                                  }
                                }
                              }
    
                              return activeChaptersList.map((chapter) => {
                                const assessment = studentAsss.find(c => c.chapterNumber === chapter.number);
                                const isSelected = selectedBabNumber === chapter.number;
                                const isCompleted = assessment?.status === "Telah Dinilai";
                                const isPending = assessment?.status === "Selesai Belajar";
                                
                                const isFukushuLocked = false;
                                const isLockedBySensei = chapter.isActive === false || Number(chapter.number) > Number(nextTargetChapterNum);
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
                                  <button
                                    key={chapter.number}
                                    type="button"
                                    onClick={() => setSelectedBabNumber(chapter.number)}
                                    className={`flex-shrink-0 min-w-[240px] max-w-[280px] w-fit text-left p-3 rounded-2xl border transition flex flex-col justify-between gap-3 cursor-pointer ${
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
                                      <div className="flex items-center gap-1.5">
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
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </>
                      );
                    })()}
                  </div>
    
                  {/* Right panel: Details and Action form */}
                  <div className="w-full">
                    {(() => {
                      const studentIdToView = selectedStudentId || (currentUser?.studentId || "SIS-001");
                      const targetStudent = filteredActiveStudents.find(s => s.id === studentIdToView) || filteredActiveStudents[0] || ({ id: "SIS-001", name: "Siswa LPK", class: "" } as any);
                      const studentClass = activeStudentClass || targetStudent?.class || "";
                      const activeChaptersList = getClassChaptersList(studentClass, assessmentSubject, true);
                      const chapter = activeChaptersList.find(b => b.number === selectedBabNumber) || activeChaptersList[0];
                      const assessment = chapterAssessments.find(
                        c => c.studentId === studentIdToView && c.chapterNumber === chapter.number && (c.subject || "Bahasa Jepang") === assessmentSubject
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
    
                      const isLockedBySensei = chapter?.isActive === false || Number(chapter?.number) > Number(nextTargetChapterNum);
                      const isLockedByProgress = false;
    
                      const userRole = currentUser?.role as any;
                      const canManageChapter = userRole === "Pengajar" || 
                                               userRole === "Admin" || 
                                               userRole === "Admin Super" || 
                                               userRole === "Admin Biasa" || 
                                               userRole === "VVIP" || 
                                               userRole === "VIP";
    
                      return (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6" id="lms-chapter-detail-widget">
                          {/* Chapter Title block */}
                          <div className="border-b border-slate-100 pb-4 space-y-1.5 text-left">
                            <div className="flex items-center gap-2 mb-2">
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
                              {canManageChapter && chapter.number === classActiveChapter && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-600 text-sm animate-pulse">🟢</span>
                                    <span className="text-xs font-bold text-slate-700">Bab {chapter.number} Aktif & Sedang Dipelajari</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await handleDeactivateChapterInLms(studentClass, chapter.number);
                                    }}
                                    className="px-2.5 py-1 text-[9px] font-black text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all uppercase cursor-pointer"
                                  >
                                    🔒 Nonaktifkan Bab
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
                                      const defaultQ = {
                                        subject: assessmentSubject,
                                        questionType: "pilihan_ganda",
                                        question: "",
                                        options: ["", "", "", ""],
                                        correctAnswerIndex: 0,
                                        chapterNumber: chapter.number,
                                        deadline: "",
                                        durationMinutes: "",
                                        imageUrl: "",
                                        videoUrl: "",
                                        audioUrl: ""
                                      };
                                      setNewQuiz(defaultQ);
                                      setQuizBatch([defaultQ]);
                                      setSelectedBatchIndex(0);
                                      setBatchDeadline("");
                                      setBatchDurationMinutes("");
                                      setBatchTargetClass(activeStudentClass || "Semua");
                                      setIsQuizFormOpen(true);
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
                              const studentIdToView = selectedStudentId || (currentUser?.studentId || "SIS-001");
                              const targetStudent = filteredActiveStudents.find(s => s.id === studentIdToView) || filteredActiveStudents[0] || ({ id: "SIS-001", name: "Siswa LPK", class: "" } as any);
                              const studentClass = activeStudentClass || targetStudent?.class || "";
                              const isStaffViewer = ["Admin", "Admin Super", "Admin Biasa", "Pengajar", "VVIP"].includes(currentUser?.role || "");
                              const targetViewerClass = isStaffViewer && selectedClassFilter !== "Semua" && selectedClassFilter !== "Semua Kelas" 
                                ? selectedClassFilter.trim().toLowerCase() 
                                : (studentClass || "").trim().toLowerCase();
                              
                              // Match subject and chapterNumber and class
                              const filteredLessons = lessons.filter(l => {
                                const normalizedTargetClass = (l.targetClass || "Semua").trim().toLowerCase();
                                const matchClass = isStaffViewer && (selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas")
                                  ? true
                                  : (normalizedTargetClass === "semua" || normalizedTargetClass === targetViewerClass);
                                return l.subject === assessmentSubject && l.chapterNumber === chapter.number && matchClass;
                              });
    
                              // Fetch quizzes for this chapter and subject and class
                              const filteredQuizzes = (systemState?.lmsQuizzes || []).filter(q => {
                                const normalizedTargetClass = (q.targetClass || "Semua").trim().toLowerCase();
                                const matchClass = isStaffViewer && (selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas")
                                  ? true
                                  : (normalizedTargetClass === "semua" || normalizedTargetClass === targetViewerClass);
                                return q.chapterNumber === chapter.number && q.subject === assessmentSubject && matchClass;
                              });
    
                              if (filteredLessons.length === 0 && filteredQuizzes.length === 0) {
                                return (
                                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-normal leading-relaxed">
                                    Tidak ada materi khusus maupun kuis untuk Bab ini.
                                  </div>
                                );
                              }
    
                              return (
                                <div className="space-y-6">
                                  {/* Lessons Section */}
                                  {filteredLessons.length > 0 && (
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
                                                {lesson.contentType === "video" && lesson.videoUrl && (
                                                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-3xs bg-black">
                                                    {lesson.videoUrl.includes("youtube.com") || lesson.videoUrl.includes("youtu.be") || lesson.videoUrl.includes("vimeo.com") || lesson.videoUrl.includes("embed") ? (
                                                      <iframe src={lesson.videoUrl} className="w-full h-full" allowFullScreen referrerPolicy="no-referrer" title={lesson.title} />
                                                    ) : (
                                                      <video src={lesson.videoUrl} controls className="w-full h-full" />
                                                    )}
                                                  </div>
                                                )}
    
                                                {lesson.contentType === "slide" && lesson.slidesUrl && (
                                                  <div className="relative aspect-video sm:aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 shadow-3xs bg-slate-50">
                                                    <iframe src={lesson.slidesUrl} className="absolute top-0 left-0 w-full h-full animate-fade-in" style={{ objectFit: 'contain' }} allowFullScreen referrerPolicy="no-referrer" title={lesson.title} />
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
                                                        <button onClick={() => setPdfViewerUrl(lesson.bookUrl)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95 shadow-2xs shrink-0 text-center cursor-pointer">Buka PDF</button>
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
                                                        const studentId = currentUser?.studentId || currentUser?.username || "SIS-001";
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
                                                                      if (!file) return;
                                                                      const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
                                                                      if (!allowedTypes.includes(file.type)) {
                                                                        alert("Format file tidak didukung. Harap unggah file PDF atau Gambar (PNG/JPEG).");
                                                                        return;
                                                                      }
                                                                      if (file.size > 15 * 1024 * 1024) {
                                                                        alert("Ukuran file terlalu besar. Maksimal 15 MB.");
                                                                        return;
                                                                      }
    
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
                                                                          alert("Tugas berhasil diunggah!");
                                                                        }
                                                                      } catch (err) {
                                                                        console.error(err);
                                                                        alert("Gagal mengunggah tugas.");
                                                                      } finally {
                                                                        setSubmittingLessons(prev => ({ ...prev, [lesson.id]: false }));
                                                                      }
                                                                    }}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                                  />
                                                                  {submittingLessons[lesson.id] ? (
                                                                    <div className="flex flex-col items-center gap-2">
                                                                      <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                                                                      <p className="text-[11px] font-bold text-slate-600">Sedang mengunggah berkas tugas...</p>
                                                                    </div>
                                                                  ) : (
                                                                    <>
                                                                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition mb-1.5" />
                                                                      <p className="text-xs font-bold text-slate-700">Tarik berkas ke sini atau klik untuk memilih</p>
                                                                      <p className="text-[9px] text-slate-400 mt-1">PDF atau Gambar (Maks. 15MB)</p>
                                                                    </>
                                                                  )}
                                                                </div>
                                                                  </>
                                                                    ) : (
                                                                        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-bold text-xs shadow-3xs">
                                                                          🚫 Waktu pengerjaan tugas CBT telah habis. Anda tidak dapat mengunggah berkas lagi.
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
                                  {filteredQuizzes.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-slate-150/60 text-left">
                                      <div className="mb-2">
                                        <h4 className="font-display font-extrabold text-slate-900 text-sm">📋 Soal Latihan & Kuis Bab {chapter.number}</h4>
                                        <p className="text-[10px] text-slate-500">Kerjakan kuis interaktif di bawah untuk menguji pemahaman materi Anda.</p>
                                      </div>
    
                                      {currentUser?.role === "Siswa" ? (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-2xs text-center space-y-4">
                                          <p className="text-sm font-bold text-slate-700">Kuis Bab {chapter.number}</p>
                                          {filteredQuizzes[0].durationMinutes && (
                                             <p className="text-xs text-slate-500">Durasi CBT: {filteredQuizzes[0].durationMinutes} Menit.</p>
                                          )}
                                          
                                          {filteredQuizzes.every(q => submittedQuizIds.includes(q.id)) ? (
                                             <button onClick={() => setActiveQuizChapterId(chapter.number)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                                                Lihat Hasil Kuis
                                             </button>
                                          ) : (
                                             <button onClick={() => {
                                                setActiveQuizChapterId(chapter.number);
                                             }} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                                                {cbtStartTimes[`kuis_ch_${chapter.number}`] ? "Lanjutkan Kuis CBT" : "Mulai Kerjakan Kuis"}
                                             </button>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-2xs text-center space-y-4">
                                          <p className="text-sm font-bold text-slate-700">Pratinjau Kuis Bab {chapter.number}</p>
                                          <button onClick={() => setActiveQuizChapterId(chapter.number)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                                            Buka Penampil Kuis
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          )}
    
                          {/* Status indicator widget */}
                          <div className="p-4 rounded-2xl border flex items-center justify-between gap-4 text-left bg-radial" style={{ contentVisibility: "auto" }}>
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
              </div>
  );
}
