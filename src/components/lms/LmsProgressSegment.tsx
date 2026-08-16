import React from "react";
import { Award, BookOpen, Brain, Check, FileText, Hash, Info, MessageSquare, Percent, RefreshCw, RotateCcw, Save, Scale, Star, User, Users } from "lucide-react";
import { CHAPTERS_LIST, MATH_CHAPTERS_LIST } from "../../chapters";
import { computeAttendanceRate } from "../../lib/attendanceMetrics";
import { computeSubjectAverage } from "../../lib/scoreAveraging";

interface LmsProgressSegmentProps {
  assessmentSubject: any;
  attendanceRecords: any;
  babCurrentPage: any;
  chapterAssessments: any;
  currentUser: any;
  evalSelectedBabId: any;
  evalSelectedLessonId: any;
  filteredActiveStudents: any;
  getClassChaptersCount: any;
  gradingNotes: any;
  handleGradeSubmit: any;
  isAlumniClass: any;
  isGradingSubmitting: any;
  isReadOnlyView: any;
  isVvipOrAdmin: any;
  itemsPerPage: any;
  lmsLessons: any;
  onUpdateState: any;
  paginatedBabStudents: any;
  paginatedTugasStudents: any;
  progressTabMode: any;
  scoreBumpo: any;
  scoreKaiwa: any;
  scoreKanji: any;
  scoreKotoba: any;
  selectedClassFilter: any;
  selectedStudentId: any;
  setAssessmentSubject: any;
  setBabCurrentPage: any;
  setEvalSelectedBabId: any;
  setEvalSelectedLessonId: any;
  setGradingNotes: any;
  setPdfViewerUrl: any;
  setProgressTabMode: any;
  setScoreBumpo: any;
  setScoreKaiwa: any;
  setScoreKanji: any;
  setScoreKotoba: any;
  setSelectedStudentId: any;
  setTugasCurrentPage: any;
  setTugasGrades: any;
  setTugasGradingSubmitting: any;
  setTugasNotes: any;
  setTugasScores: any;
  studentAttendanceMap: any;
  systemState: any;
  totalBabPages: any;
  totalTugasPages: any;
  tugasCurrentPage: any;
  tugasGradingSubmitting: any;
  tugasNotes: any;
  tugasScores: any;
}

export default function LmsProgressSegment({ assessmentSubject, attendanceRecords, babCurrentPage, chapterAssessments, currentUser, evalSelectedBabId, evalSelectedLessonId, filteredActiveStudents, getClassChaptersCount, gradingNotes, handleGradeSubmit, isAlumniClass, isGradingSubmitting, isReadOnlyView, isVvipOrAdmin, itemsPerPage, lmsLessons, onUpdateState, paginatedBabStudents, paginatedTugasStudents, progressTabMode, scoreBumpo, scoreKaiwa, scoreKanji, scoreKotoba, selectedClassFilter, selectedStudentId, setAssessmentSubject, setBabCurrentPage, setEvalSelectedBabId, setEvalSelectedLessonId, setGradingNotes, setPdfViewerUrl, setProgressTabMode, setScoreBumpo, setScoreKaiwa, setScoreKanji, setScoreKotoba, setSelectedStudentId, setTugasCurrentPage, setTugasGrades, setTugasGradingSubmitting, setTugasNotes, setTugasScores, studentAttendanceMap, systemState, totalBabPages, totalTugasPages, tugasCurrentPage, tugasGradingSubmitting, tugasNotes, tugasScores }: LmsProgressSegmentProps) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-3xs">
                  <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 w-fit">
                    <button 
                      onClick={() => setProgressTabMode("penilaian_bab")} 
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${progressTabMode === "penilaian_bab" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Penilaian Bab
                    </button>
                    <button 
                      onClick={() => setProgressTabMode("penilaian")} 
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${progressTabMode === "penilaian" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      Penilaian Tugas
                    </button>
                    <button 
                      onClick={() => setProgressTabMode("sikap")} 
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${progressTabMode === "sikap" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
                    >
                      <Star className="w-3.5 h-3.5" />
                      Penilaian Kelayakan (5S)
                    </button>
                  </div>
                </div>
    
    
                
                {progressTabMode === "penilaian_bab" && (
                  <div id="lms-bab-section-container" className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
                        <BookOpen className="h-48 w-48" />
                      </div>
                      <div className="max-w-xl space-y-2 relative z-10">
                        <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-1 rounded-full tracking-wider border border-white/20">
                          Penilaian
                        </span>
                        <h3 className="font-display font-extrabold text-lg sm:text-2xl leading-tight">
                          Evaluasi Bab & Pelajaran
                        </h3>
                        <p className="text-xs text-blue-100 leading-relaxed font-normal">
                          Pilih mata pelajaran dan bab untuk memberikan penilaian kepada siswa di kelas ini.
                        </p>
                      </div>
                    </div>
                    
                    {(() => {
                      const chaptersList = assessmentSubject === "SSW" 
                        ? MATH_CHAPTERS_LIST 
                        : CHAPTERS_LIST;
                      const selectedBab = evalSelectedBabId !== "" ? chaptersList.find(c => c.number === evalSelectedBabId) : null;
                      
                      return (
                        <div className="space-y-6">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Pilih Mata Pelajaran</label>
                                <select
                                  value={assessmentSubject}
                                  onChange={(e) => {
                                    setAssessmentSubject(e.target.value);
                                    setEvalSelectedBabId("");
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none cursor-pointer"
                                >
                                  <option value="Bahasa Jepang">🇯🇵 Bahasa Jepang</option>
                                  <option value="SSW">📐 Matematika (SSW)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Pilih Bab</label>
                                <select
                                  value={evalSelectedBabId}
                                  onChange={(e) => setEvalSelectedBabId(e.target.value ? Number(e.target.value) : "")}
                                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none cursor-pointer"
                                >
                                  <option value="">-- Pilih Bab --</option>
                                  {chaptersList.map(c => (
                                    <option key={c.number} value={c.number}>Bab {c.number}: {c.title}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
    
                          {selectedBab ? (
                                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 text-left">
                              <div className="border-b border-slate-100 pb-4">
                                <h4 className="font-display font-black text-slate-850 text-sm tracking-tight">Daftar & Penilaian Siswa ({assessmentSubject})</h4>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Daftar siswa aktif di kelas ini. Pilih siswa di bawah untuk memasukkan nilai Bab {selectedBab.number} secara langsung.</p>
                              </div>
    
                              <div className="space-y-4">
                                {filteredActiveStudents.length === 0 ? (
                                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-normal">
                                    Tidak ada siswa aktif yang terdaftar di kelas ini.
                                  </div>
                                ) : (
                                  paginatedBabStudents.map((student) => {
                                    const isSelected = selectedStudentId === student.id;
                                    const studentAssessment = (chapterAssessments || []).find(
                                      (a: any) => a.studentId === student.id && a.chapterNumber === Number(selectedBab.number) && (a.subject || "Bahasa Jepang") === assessmentSubject
                                    );
    
                                    return (
                                      <div 
                                        key={student.id} 
                                        className={`border rounded-2xl transition overflow-hidden bg-white ${
                                          isSelected 
                                            ? "border-blue-500 shadow-sm ring-2 ring-blue-50/50" 
                                            : "border-slate-200 hover:border-slate-300 shadow-3xs"
                                        }`}
                                      >
                                        {/* Student Card Header */}
                                        <div 
                                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                          onClick={() => {
                                            if (isSelected) {
                                              setSelectedStudentId("");
                                            } else {
                                              setSelectedStudentId(student.id);
                                            }
                                          }}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 select-none">
                                              {student.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="text-left">
                                              <h5 className="font-display font-bold text-sm text-slate-900 leading-tight">
                                                {student.name}
                                              </h5>
                                              <p className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">
                                                ID: {student.id} • Kelas: {student.class || "-"}
                                              </p>
                                            </div>
                                          </div>
    
                                          <div className="flex items-center gap-2 self-start sm:self-center">
                                            {/* Status Badge */}
                                            {studentAssessment?.status === "Telah Dinilai" ? (
                                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1.5 font-mono">
                                                <span>⭐ {studentAssessment.score}</span>
                                                <span className="opacity-55">|</span>
                                                <span>GRADE {studentAssessment.grade}</span>
                                              </span>
                                            ) : studentAssessment?.status === "Selesai Belajar" ? (
                                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border bg-amber-50 text-amber-700 border-amber-100 animate-pulse">
                                                📝 Mandiri
                                              </span>
                                            ) : (
                                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border bg-slate-50 text-slate-500 border-slate-200">
                                                Belum Dinilai
                                              </span>
                                            )}
    
                                            <button
                                              type="button"
                                              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                                                isSelected 
                                                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-3xs"
                                              }`}
                                            >
                                              {isSelected ? "Tutup" : "Beri / Edit Nilai"}
                                            </button>
                                          </div>
                                        </div>
    
                                        {/* Inline Assessment Form (rendered only for the active student) */}
                                        {isSelected && (
                                          <div className="border-t border-slate-100 p-5 sm:p-6 bg-slate-50/30 space-y-6 animate-fade-in text-left">
                                            
                                            {/* Score inputs panel */}
                                            <div className="space-y-5">
                                              {/* Info Box */}
                                              <div className="flex gap-3 bg-blue-50/70 text-blue-800 p-3.5 rounded-xl text-xs font-semibold leading-relaxed border border-blue-100/65">
                                                <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                                                <span>Nilai akan dihitung otomatis berdasarkan rata-rata dari ke-4 poin penilaian di bawah ini.</span>
                                              </div>
    
                                              {/* Evaluation Grid */}
                                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs">
                                                {/* Header */}
                                                <div className="hidden sm:grid grid-cols-[50px_160px_1fr_130px] gap-4 bg-slate-50/70 p-3.5 border-b border-slate-150 text-[10px] font-black text-slate-400 uppercase tracking-wider items-center">
                                                  <div>No.</div>
                                                  <div>Fokus Evaluasi</div>
                                                  <div>Metrik Pengujian & Kelayakan</div>
                                                  <div className="text-right">Nilai Poin</div>
                                                </div>
    
                                                {/* Row 1: Kotoba / Aritmatika */}
                                                <div className="grid grid-cols-1 sm:grid-cols-[50px_160px_1fr_130px] gap-3 sm:gap-4 p-4 border-b border-slate-100 items-center">
                                                  <div className="text-xs font-black text-slate-400 hidden sm:block">1</div>
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xs shrink-0 select-none">
                                                      {assessmentSubject === "SSW" ? <Hash className="h-4 w-4 text-white" /> : "あ"}
                                                    </div>
                                                    <div>
                                                      <h5 className="text-xs font-black text-slate-800 leading-tight">
                                                        {assessmentSubject === "SSW" ? "Aritmatika" : "Kotoba"}
                                                      </h5>
                                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {assessmentSubject === "SSW" ? "(Kalkulasi Desimal)" : "(Kosakata)"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                    {assessmentSubject === "SSW" 
                                                      ? "Keunggulan kalkulasi bilangan bulat, desimal, persen, konversi satuan, dan matematika dasar." 
                                                      : "Penguasaan kosakata dan pemahaman makna kata."}
                                                  </p>
                                                  <div className="flex items-center justify-end sm:justify-center gap-1.5">
                                                    <input
                                                      type="number"
                                                      min={0}
                                                      max={100}
                                                      placeholder="0"
                                                      value={scoreKotoba === 0 ? "" : scoreKotoba}
                                                      onChange={(e) => {
                                                        let val = Number(e.target.value);
                                                        if (val > 100) val = 100;
                                                        if (val < 0) val = 0;
                                                        setScoreKotoba(val);
                                                      }}
                                                      className="w-16 h-8 text-center border border-slate-200 rounded-lg text-xs font-black text-blue-600 focus:outline-none focus:border-blue-500 font-mono bg-white"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                                  </div>
                                                </div>
    
                                                {/* Row 2: Bumpo / Rasio */}
                                                <div className="grid grid-cols-1 sm:grid-cols-[50px_160px_1fr_130px] gap-3 sm:gap-4 p-4 border-b border-slate-100 items-center">
                                                  <div className="text-xs font-black text-slate-400 hidden sm:block">2</div>
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 select-none">
                                                      {assessmentSubject === "SSW" ? <Percent className="h-4 w-4 text-white" /> : <MessageSquare className="h-4 w-4 text-white" />}
                                                    </div>
                                                    <div>
                                                      <h5 className="text-xs font-black text-slate-800 leading-tight">
                                                        {assessmentSubject === "SSW" ? "Rasio & Skala" : "Bumpo"}
                                                      </h5>
                                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {assessmentSubject === "SSW" ? "(Proporsi Campuran)" : "(Pola Kalimat)"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                    {assessmentSubject === "SSW" 
                                                      ? "Kemampuan merangkai rasio pencampuran bahan baku, faktor pengenceran kimia cair ppm, dan yield rate penyusutan." 
                                                      : "Kemampuan memahami dan menggunakan pola kalimat dengan tepat."}
                                                  </p>
                                                  <div className="flex items-center justify-end sm:justify-center gap-1.5">
                                                    <input
                                                      type="number"
                                                      min={0}
                                                      max={100}
                                                      placeholder="0"
                                                      value={scoreBumpo === 0 ? "" : scoreBumpo}
                                                      onChange={(e) => {
                                                        let val = Number(e.target.value);
                                                        if (val > 100) val = 100;
                                                        if (val < 0) val = 0;
                                                        setScoreBumpo(val);
                                                      }}
                                                      className="w-16 h-8 text-center border border-slate-200 rounded-lg text-xs font-black text-blue-600 focus:outline-none focus:border-blue-500 font-mono bg-white"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                                  </div>
                                                </div>
    
                                                {/* Row 3: Kaiwa / Metrik Spasial */}
                                                <div className="grid grid-cols-1 sm:grid-cols-[50px_160px_1fr_130px] gap-3 sm:gap-4 p-4 border-b border-slate-100 items-center">
                                                  <div className="text-xs font-black text-slate-400 hidden sm:block">3</div>
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 select-none">
                                                      {assessmentSubject === "SSW" ? <Scale className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
                                                    </div>
                                                    <div>
                                                      <h5 className="text-xs font-black text-slate-800 leading-tight">
                                                        {assessmentSubject === "SSW" ? "Metrik & Spasial" : "Kaiwa"}
                                                      </h5>
                                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {assessmentSubject === "SSW" ? "(Volume & Geometri)" : "(Percakapan)"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                    {assessmentSubject === "SSW" 
                                                      ? "Kalkulasi volume ruangan kontainer, rencana baki muat, luas pelat penampang, suhu derajat celcius & tekanan psi." 
                                                      : "Kemampuan berkomunikasi dan merespons dalam percakapan."}
                                                  </p>
                                                  <div className="flex items-center justify-end sm:justify-center gap-1.5">
                                                    <input
                                                      type="number"
                                                      min={0}
                                                      max={100}
                                                      placeholder="0"
                                                      value={scoreKaiwa === 0 ? "" : scoreKaiwa}
                                                      onChange={(e) => {
                                                        let val = Number(e.target.value);
                                                        if (val > 100) val = 100;
                                                        if (val < 0) val = 0;
                                                        setScoreKaiwa(val);
                                                      }}
                                                      className="w-16 h-8 text-center border border-slate-200 rounded-lg text-xs font-black text-blue-600 focus:outline-none focus:border-blue-500 font-mono bg-white"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                                  </div>
                                                </div>
    
                                                {/* Row 4: Kanji / Logika Terapan */}
                                                <div className="grid grid-cols-1 sm:grid-cols-[50px_160px_1fr_130px] gap-3 sm:gap-4 p-4 items-center">
                                                  <div className="text-xs font-black text-slate-400 hidden sm:block">4</div>
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-fuchsia-600 text-white flex items-center justify-center font-black text-xs shrink-0 select-none">
                                                      {assessmentSubject === "SSW" ? <Brain className="h-4 w-4 text-white" /> : "字"}
                                                    </div>
                                                    <div>
                                                      <h5 className="text-xs font-black text-slate-800 leading-tight">
                                                        {assessmentSubject === "SSW" ? "Logika Terapan" : "Kanji"}
                                                      </h5>
                                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {assessmentSubject === "SSW" ? "(Optimasi Kerja & QC)" : "(Penulisan)"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                    {assessmentSubject === "SSW" 
                                                      ? "Ketangkasan dlm mengorelasikan waktu operasi mesin, defect rate ppm, kelistrikan AC/DC, shift & Kyukei, dan slip gaji." 
                                                      : "Kemampuan menulis dan mengingat kanji dengan benar."}
                                                  </p>
                                                  <div className="flex items-center justify-end sm:justify-center gap-1.5">
                                                    <input
                                                      type="number"
                                                      min={0}
                                                      max={100}
                                                      placeholder="0"
                                                      value={scoreKanji === 0 ? "" : scoreKanji}
                                                      onChange={(e) => {
                                                        let val = Number(e.target.value);
                                                        if (val > 100) val = 100;
                                                        if (val < 0) val = 0;
                                                        setScoreKanji(val);
                                                      }}
                                                      className={`w-16 h-8 text-center border border-slate-200 rounded-lg text-xs font-black focus:outline-none font-mono bg-white ${
                                                        isAlumniClass ? "text-emerald-600 focus:border-emerald-500" : "text-blue-600 focus:border-blue-500"
                                                      }`}
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                                  </div>
                                                </div>
                                              </div>
    
                                              {/* Real-time calculated score display */}
                                              {(() => {
                                                const computedAverage = Math.round(((Number(scoreKotoba) + Number(scoreBumpo) + Number(scoreKaiwa) + Number(scoreKanji)) / 4) * 10) / 10;
                                                return (
                                                  <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-4 ${
                                                    isAlumniClass 
                                                      ? "bg-emerald-50/40 border-emerald-100" 
                                                      : "bg-blue-50/40 border-blue-100"
                                                  }`}>
                                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                                      <div>
                                                        <h5 className="font-display font-black text-slate-800 text-xs sm:text-sm tracking-tight text-left">Nilai Rata-rata {assessmentSubject}</h5>
                                                        <p className="text-[10px] text-slate-400 font-medium">Dihitung otomatis dari rata-rata ke 4 poin di atas</p>
                                                      </div>
                                                      <span className={`font-mono font-black text-lg sm:text-2xl ${isAlumniClass ? "text-emerald-600" : "text-blue-600"}`}>
                                                        {computedAverage.toFixed(1)} <span className="text-slate-400 text-xs font-bold">/ 100</span>
                                                      </span>
                                                    </div>
    
                                                    <div className="space-y-2">
                                                      {/* Range Track Background */}
                                                      <div className="relative w-full h-1.5 bg-slate-200 rounded-full">
                                                        <div 
                                                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                                                            isAlumniClass ? "bg-emerald-600" : "bg-blue-600"
                                                          }`}
                                                          style={{ width: `${computedAverage}%` }}
                                                        />
                                                        <div 
                                                          className={`absolute w-3 h-3 border-2 border-white rounded-full shadow -top-1 transition-all duration-300 ${
                                                            isAlumniClass ? "bg-emerald-600" : "bg-blue-600"
                                                          }`}
                                                          style={{ left: `calc(${computedAverage}% - 6px)` }}
                                                        />
                                                      </div>
                                                      
                                                      {/* Milestones labels */}
                                                      <div className="flex justify-between text-[9px] text-slate-400 font-black font-mono">
                                                        <span>0 (Kurang)</span>
                                                        <span>60 (Cukup)</span>
                                                        <span>80 (Baik)</span>
                                                        <span>100 (Sangat Baik)</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })()}
                                            </div>
    
                                            {/* Feedback notes */}
                                            <div className="space-y-1.5">
                                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Catatan & Evaluasi Pengajar</label>
                                              <textarea
                                                rows={3}
                                                placeholder={assessmentSubject === "SSW" ? "Tulis catatan evaluasi logika dan ketelitian berhitung matematika (Contoh: Kuat di logika konversi berat, namun perlu latihan ekstra pada estimasi rasio penyusutan...)" : "Tulis catatan evaluasi lisan siswa (Contoh: Pelafalan Jikoshoukai lancar, Ojigi bungkuk badan perlu dilatih lagi...)"}
                                                value={gradingNotes}
                                                onChange={(e) => setGradingNotes(e.target.value)}
                                                className={`w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 font-normal ${
                                                  isAlumniClass ? "focus:outline-emerald-500" : "focus:outline-blue-500"
                                                }`}
                                              />
                                            </div>
    
                                            {/* Bottom section with auto-save hint and submit button */}
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                                              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-600">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                <span>Nilai akan diperbarui secara otomatis saat Anda mengisi setiap poin.</span>
                                              </div>
    
                                              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    if (!isVvipOrAdmin) {
                                                      alert("Hanya Sensei VVIP dan Admin yang memiliki otorisasi untuk mereset nilai.");
                                                      return;
                                                    }
                                                    if (confirm("Apakah Anda yakin ingin menghapus dan mereset nilai penilaian bab ini?")) {
                                                      if (studentAssessment?.id && onUpdateState) {
                                                        const payload = {
                                                          ...studentAssessment,
                                                          status: "Selesai Belajar",
                                                          score: "",
                                                          scoreKotoba: "",
                                                          scoreBumpo: "",
                                                          scoreKaiwa: "",
                                                          scoreKanji: "",
                                                          grade: "",
                                                          notes: ""
                                                        };
                                                        const ok = await onUpdateState("chapterAssessments", "update", payload);
                                                        if (ok) {
                                                          alert("Berhasil mereset nilai bab menjadi belum dinilai.");
                                                        } else {
                                                          alert("Gagal mereset nilai bab.");
                                                          return;
                                                        }
                                                      }
                                                      setScoreKotoba("");
                                                      setScoreBumpo("");
                                                      setScoreKaiwa("");
                                                      setScoreKanji("");
                                                      setGradingNotes("");
                                                    }
                                                  }}
                                                  disabled={isReadOnlyView || !isVvipOrAdmin}
                                                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                                  title={!isVvipOrAdmin ? "Hanya Sensei VVIP dan Admin yang dapat melakukan reset nilai" : "Reset semua nilai bab ini"}
                                                >
                                                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                                                  <span>Reset Nilai</span>
                                                </button>
    
                                                <button
                                                  type="button"
                                                  onClick={() => handleGradeSubmit(new Event('submit'))}
                                                  disabled={isGradingSubmitting || isReadOnlyView}
                                                  className={`w-full sm:w-auto px-6 py-2.5 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 ${
                                                    isReadOnlyView ? "bg-slate-400 cursor-not-allowed" :
                                                    isAlumniClass 
                                                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10" 
                                                      : "bg-blue-600 hover:bg-blue-700"
                                                  } ${isReadOnlyView ? "" : "cursor-pointer"}`}
                                                >
                                                  <Save className="h-3.5 w-3.5" />
                                                  <span>{isReadOnlyView ? "Mode Pantau" : (isGradingSubmitting ? "Sedang Menyimpan..." : "Simpan Nilai")}</span>
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
    
                                {/* Pagination Controls for Penilaian Bab */}
                                {totalBabPages > 1 && (
                                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 mt-6 gap-4">
                                    <span className="text-[11px] font-bold text-slate-500">
                                      Menampilkan {Math.min(filteredActiveStudents.length, (babCurrentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredActiveStudents.length, babCurrentPage * itemsPerPage)} dari {filteredActiveStudents.length} siswa
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={babCurrentPage === 1}
                                        onClick={() => {
                                          setBabCurrentPage(prev => Math.max(1, prev - 1));
                                          const sec = document.getElementById("lms-bab-section-container");
                                          if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-blue-600 hover:border-blue-300"
                                      >
                                        Sebelumnya
                                      </button>
                                      {Array.from({ length: totalBabPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                          key={page}
                                          type="button"
                                          onClick={() => {
                                            setBabCurrentPage(page);
                                            const sec = document.getElementById("lms-bab-section-container");
                                            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          className={`w-7 h-7 rounded-lg text-[11px] font-bold transition ${
                                            babCurrentPage === page
                                              ? "bg-blue-600 text-white shadow-xs"
                                              : "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                                          }`}
                                        >
                                          {page}
                                        </button>
                                      ))}
                                      <button
                                        type="button"
                                        disabled={babCurrentPage === totalBabPages}
                                        onClick={() => {
                                          setBabCurrentPage(prev => Math.min(totalBabPages, prev + 1));
                                          const sec = document.getElementById("lms-bab-section-container");
                                          if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-blue-600 hover:border-blue-300"
                                      >
                                        Berikutnya
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
    
                          ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                                <BookOpen className="w-8 h-8" />
                              </div>
                              <h4 className="font-display font-extrabold text-slate-600">Pilih Bab di Atas</h4>
                              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">Silakan pilih mata pelajaran dan bab yang ingin dinilai dari menu dropdown di atas untuk mulai melihat daftar siswa.</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
    
                {progressTabMode === "sikap" && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs animate-fade-in text-left">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display font-extrabold text-lg text-slate-800">
                          Penilaian Kelayakan Order Job
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Nilai sikap (5S), etika, Bahasa Jepang, matematika, dan kehadiran untuk menentukan kelayakan siswa mengikuti Order Job. Nilai Bahasa Jepang, Matematika, dan Kehadiran (%) dihitung secara otomatis dari progres &amp; presensi siswa.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredActiveStudents.map((student) => {
                        const assessmentsSource = chapterAssessments && chapterAssessments.length > 0 ? chapterAssessments : (systemState?.chapterAssessments || []);

                        // Bahasa Jepang Assessments
                        const jpnAvg = computeSubjectAverage(assessmentsSource, student, "Bahasa Jepang");
                        const hasJpnAssessments = jpnAvg.gradedCount > 0;
                        const computedJpnAvg = jpnAvg.average ?? (student.japaneseScore || 0);

                        // Matematika SSW Assessments
                        const mathAvg = computeSubjectAverage(assessmentsSource, student, "Matematika");
                        const hasMathAssessments = mathAvg.gradedCount > 0;
                        const computedMathAvg = mathAvg.average ?? (student.mathScore || 0);
    
                        // Attendance calculation: % of the student's own attendance records marked Hadir.
                        const { rate: attRate, hadirCount: presentCount, totalRecords: totalAttRecords } = computeAttendanceRate(student, attendanceRecords);
                        const hasAttRecords = totalAttRecords > 0;
                        const computedAttendanceRate = attRate ?? (student.attendanceScore || 0);
    
                        return (
                          <div key={student.id} className="p-4 border border-slate-200 bg-white rounded-2xl flex flex-col gap-3 relative shadow-2xs hover:shadow-xs transition">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                {student.name ? student.name.charAt(0).toUpperCase() : <Users className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-slate-800 truncate">{student.name}</h4>
                                <div className="text-[10px] text-slate-500 font-medium font-mono truncate">{student.id} {student.class ? `• ${student.class}` : ''}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2.5 mt-1">
                              {/* NILAI 5S */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nilai 5S</label>
                                <input 
                                  type="number"
                                  min="0" max="100"
                                  defaultValue={student.fiveSScore || 0}
                                  onBlur={(e) => {
                                    if (onUpdateState) {
                                      onUpdateState("activeStudents", "update", { ...student, fiveSScore: parseInt(e.target.value) || 0 });
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-emerald-500 focus:bg-white"
                                />
                              </div>
    
                              {/* NILAI ETIKA */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nilai Etika</label>
                                <input 
                                  type="number"
                                  min="0" max="100"
                                  defaultValue={student.ethicsScore || 0}
                                  onBlur={(e) => {
                                    if (onUpdateState) {
                                      onUpdateState("activeStudents", "update", { ...student, ethicsScore: parseInt(e.target.value) || 0 });
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-emerald-500 focus:bg-white"
                                />
                              </div>
    
                              {/* BAHASA JEPANG */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">B. Jepang</label>
                                  {hasJpnAssessments && (
                                    <span className="text-[8.5px] font-extrabold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200" title={`Diambil dari rata-rata ${jpnAvg.gradedCount} bab`}>
                                      Auto ({jpnAvg.gradedCount} Bab)
                                    </span>
                                  )}
                                </div>
                                {hasJpnAssessments ? (
                                  <div 
                                    className="w-full bg-amber-50/80 border border-amber-200 rounded-lg px-2 py-1.5 text-xs text-center font-black text-amber-900 shadow-2xs"
                                    title={`Rata-rata dari ${jpnAvg.gradedCount} bab Bahasa Jepang yang telah dinilai`}
                                  >
                                    {computedJpnAvg} <span className="text-[9px] font-semibold text-amber-600">/ 100</span>
                                  </div>
                                ) : (
                                  <input 
                                    type="number"
                                    min="0" max="100"
                                    defaultValue={student.japaneseScore || 0}
                                    onBlur={(e) => {
                                      if (onUpdateState) {
                                        onUpdateState("activeStudents", "update", { ...student, japaneseScore: parseInt(e.target.value) || 0 });
                                      }
                                    }}
                                    placeholder="Manual"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-amber-500 focus:bg-white"
                                  />
                                )}
                              </div>
    
                              {/* MATEMATIKA */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Matematika</label>
                                  {hasMathAssessments && (
                                    <span className="text-[8.5px] font-extrabold text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200" title={`Diambil dari rata-rata ${mathAvg.gradedCount} bab SSW`}>
                                      Auto ({mathAvg.gradedCount} Bab)
                                    </span>
                                  )}
                                </div>
                                {hasMathAssessments ? (
                                  <div 
                                    className="w-full bg-blue-50/80 border border-blue-200 rounded-lg px-2 py-1.5 text-xs text-center font-black text-blue-900 shadow-2xs"
                                    title={`Rata-rata dari ${mathAvg.gradedCount} bab Matematika/SSW yang telah dinilai`}
                                  >
                                    {computedMathAvg} <span className="text-[9px] font-semibold text-blue-600">/ 100</span>
                                  </div>
                                ) : (
                                  <input 
                                    type="number"
                                    min="0" max="100"
                                    defaultValue={student.mathScore || 0}
                                    onBlur={(e) => {
                                      if (onUpdateState) {
                                        onUpdateState("activeStudents", "update", { ...student, mathScore: parseInt(e.target.value) || 0 });
                                      }
                                    }}
                                    placeholder="Manual"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-blue-500 focus:bg-white"
                                  />
                                )}
                              </div>
    
                              {/* KEHADIRAN (%) */}
                              <div className="space-y-1 col-span-2 sm:col-span-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Kehadiran (%)</label>
                                  {hasAttRecords && (
                                    <span className="text-[8.5px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200" title={`Akumulasi ${presentCount} presensi hadir dari ${totalAttRecords} total presensi`}>
                                      Auto ({presentCount}/{totalAttRecords})
                                    </span>
                                  )}
                                </div>
                                {hasAttRecords ? (
                                  <div
                                    className="w-full bg-emerald-50/80 border border-emerald-200 rounded-lg px-2 py-1.5 text-xs text-center font-black text-emerald-900 shadow-2xs"
                                    title={`Persentase kehadiran: ${presentCount} hadir / ${totalAttRecords} total presensi (${computedAttendanceRate}%)`}
                                  >
                                    {computedAttendanceRate}% <span className="text-[9px] font-semibold text-emerald-600">({presentCount}/{totalAttRecords})</span>
                                  </div>
                                ) : (
                                  <input 
                                    type="number"
                                    min="0" max="100"
                                    defaultValue={student.attendanceScore || 0}
                                    onBlur={(e) => {
                                      if (onUpdateState) {
                                        onUpdateState("activeStudents", "update", { ...student, attendanceScore: parseInt(e.target.value) || 0 });
                                      }
                                    }}
                                    placeholder="Manual"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-emerald-500 focus:bg-white"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {filteredActiveStudents.length === 0 && (
                        <div className="col-span-full py-10 text-center text-slate-400 text-sm">
                          Belum ada siswa di kelas ini.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {progressTabMode === "penilaian" && (
                  <div id="lms-tugas-section-container" className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-800 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
                        <Award className="h-48 w-48" />
                      </div>
                      <div className="max-w-xl space-y-2 relative z-10">
                        <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-1 rounded-full tracking-wider border border-white/20">
                          Penilaian
                        </span>
                        <h3 className="font-display font-extrabold text-lg sm:text-2xl leading-tight">
                          Evaluasi Tugas Siswa
                        </h3>
                        <p className="text-xs text-indigo-100 leading-relaxed font-normal">
                          Pilih pelajaran, bab, dan tugas untuk memberikan penilaian kepada siswa.
                        </p>
                      </div>
                    </div>
    
                    {(() => {
                      const allTugasLessons = (lmsLessons || [])
                        .filter(l => l.difficulty === "Tugas")
                        .filter(l => {
                          if (!selectedClassFilter || selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas") return true;
                          const tc = (l.targetClass || "Semua").trim().toLowerCase();
                          if (tc === "semua") return true;
                          return tc === selectedClassFilter.trim().toLowerCase();
                        })
                        .sort((a, b) => Number(a.chapterNumber) - Number(b.chapterNumber));
                      const selectedTugas = allTugasLessons.find(l => l.id === evalSelectedLessonId);
                      
                      return (
                        <div className="space-y-6">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Tugas yang Ingin Dinilai</label>
                            <select
                              value={evalSelectedLessonId}
                              onChange={(e) => setEvalSelectedLessonId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                            >
                              <option value="">-- Pilih Tugas --</option>
                              {allTugasLessons.map(l => (
                                <option key={l.id} value={l.id}>[{l.targetClass || "Semua Kelas"}] [{l.subject}] Bab {l.chapterNumber} - {l.title}</option>
                              ))}
                            </select>
                          </div>
    
                          {selectedTugas ? (
                            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                              <h4 className="font-display font-extrabold text-slate-900 text-lg mb-2">Penilaian: {selectedTugas.title}</h4>
                              <p className="text-xs text-slate-500 mb-6">Bab {selectedTugas.chapterNumber} • {selectedTugas.subject}</p>
                              
                              {filteredActiveStudents.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic py-4 text-center">Tidak ada siswa yang terdaftar di kelas ini.</p>
                              ) : (
                                <div className="divide-y divide-slate-100">
                                  {paginatedTugasStudents.map((student) => {
                                    const assessment = (systemState?.chapterAssessments || []).find(
                                      (c) => c.lessonId === selectedTugas.id && c.studentId === student.id
                                    );
    
                                    const currentScore = tugasScores[`${student.id}-${selectedTugas.id}`] !== undefined 
                                      ? tugasScores[`${student.id}-${selectedTugas.id}`] 
                                      : (assessment?.score !== undefined ? String(assessment.score) : "");
    
                                    const currentNotes = tugasNotes[`${student.id}-${selectedTugas.id}`] !== undefined 
                                      ? tugasNotes[`${student.id}-${selectedTugas.id}`] 
                                      : (assessment?.notes || "");
    
                                    const isSaving = tugasGradingSubmitting[`${student.id}-${selectedTugas.id}`] || false;
    
                                    const calculateGrade = (scoreVal) => {
                                      const s = Number(scoreVal);
                                      if (isNaN(s) || scoreVal === "") return "";
                                      if (s >= 90) return "A";
                                      if (s >= 80) return "B";
                                      if (s >= 70) return "C";
                                      if (s >= 60) return "D";
                                      return "E";
                                    };
    
                                    return (
                                      <div key={student.id} className="py-6 first:pt-0 last:pb-0 space-y-4">
                                        {/* Student row header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div>
                                            <h6 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                              <span>{student.name}</span>
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                                {student.id}
                                              </span>
                                            </h6>
                                            <p className="text-[10px] text-slate-400 mt-1">Kelas: {student.class || "-"}</p>
                                          </div>
    
                                          <div className="flex flex-wrap items-center gap-2">
                                            {assessment ? (
                                              assessment.status === "Menunggu Penilaian" ? (
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg shadow-3xs">
                                                  🟡 Menunggu Penilaian
                                                </span>
                                              ) : (
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg shadow-3xs">
                                                  🟢 Telah Dinilai: {assessment.score}/100
                                                </span>
                                              )
                                            ) : (
                                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg shadow-3xs">
                                                Belum Mengumpulkan
                                              </span>
                                            )}
                                          </div>
                                        </div>
    
                                        {/* File Link (if submitted) */}
                                        {assessment?.submissionUrl && (
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60">
                                            <div className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-500 rounded-lg shrink-0">
                                              <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="truncate flex-1">
                                              <span className="text-xs font-bold text-indigo-700 block truncate">File Jawaban Terlampir</span>
                                              <span className="text-[10px] text-indigo-400 block mt-0.5">{new Date(assessment.submissionDate || "").toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                                              <a
                                                href={assessment.submissionUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full sm:w-auto text-center bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg text-[11px] font-extrabold hover:bg-indigo-50 transition shadow-sm"
                                              >
                                                Unduh
                                              </a>
                                              <button
                                                onClick={() => window.open(assessment.submissionUrl, "_blank", "noopener,noreferrer")}
                                                className="w-full sm:w-auto text-center bg-indigo-600 text-white border border-transparent px-4 py-2 rounded-lg text-[11px] font-extrabold hover:bg-indigo-700 transition shadow-sm"
                                              >
                                                Buka PDF
                                              </button>
                                            </div>
                                          </div>
                                        )}
    
                                        {/* Grading Inputs */}
                                        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            {/* Score & Grade (5 cols on md) */}
                                            <div className="md:col-span-5 flex items-start gap-3">
                                              <div className="flex-1">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Skor (0-100)</label>
                                                <div className="relative rounded-xl shadow-3xs">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    placeholder="0 - 100"
                                                    value={currentScore}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      const key = `${student.id}-${selectedTugas.id}`;
                                                      setTugasScores(prev => ({ ...prev, [key]: val }));
                                                      const gradeLetter = calculateGrade(val);
                                                      setTugasGrades(prev => ({ ...prev, [key]: gradeLetter }));
                                                    }}
                                                    className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-800 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition shadow-3xs"
                                                  />
                                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                    <span className="text-xs font-bold text-slate-400">%</span>
                                                  </div>
                                                </div>
                                              </div>
    
                                              <div className="w-20 shrink-0">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 text-center">Grade</label>
                                                <div className={`h-10 flex items-center justify-center rounded-xl text-xs font-black text-center select-none shadow-3xs border transition-colors ${
                                                  calculateGrade(currentScore) === "A" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                  calculateGrade(currentScore) === "B" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                  calculateGrade(currentScore) === "C" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                  calculateGrade(currentScore) === "D" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                  calculateGrade(currentScore) === "E" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                                  "bg-white text-slate-400 border-slate-200"
                                                }`}>
                                                  {calculateGrade(currentScore) || "-"}
                                                </div>
                                              </div>
                                            </div>
    
                                            {/* Notes & Feedback (7 cols on md) */}
                                            <div className="md:col-span-7">
                                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Catatan Koreksi & Feedback</label>
                                              <textarea
                                                rows={1}
                                                placeholder="Tulis umpan balik untuk siswa (opsional)"
                                                value={currentNotes}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  const key = `${student.id}-${selectedTugas.id}`;
                                                  setTugasNotes(prev => ({ ...prev, [key]: val }));
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition placeholder-slate-400 font-normal min-h-[42px] max-h-32 resize-y shadow-3xs"
                                              />
                                            </div>
                                          </div>
    
                                          {/* Bottom Buttons Row */}
                                          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                if (!isVvipOrAdmin) {
                                                  alert("Hanya Sensei VVIP dan Admin yang memiliki otorisasi untuk mereset nilai.");
                                                  return;
                                                }
                                                if (confirm("Apakah Anda yakin ingin menghapus dan mereset nilai tugas ini?")) {
                                                  if (assessment?.id && onUpdateState) {
                                                    let ok = false;
                                                    if (assessment.submissionUrl) {
                                                      const payload = {
                                                        ...assessment,
                                                        status: "Menunggu Penilaian",
                                                        score: "",
                                                        grade: "",
                                                        notes: ""
                                                      };
                                                      ok = await onUpdateState("chapterAssessments", "update", payload);
                                                    } else {
                                                      ok = await onUpdateState("chapterAssessments", "delete", { id: assessment.id });
                                                    }
    
                                                    if (ok) {
                                                      alert("Berhasil mereset nilai tugas menjadi belum dinilai.");
                                                    } else {
                                                      alert("Gagal mereset nilai tugas.");
                                                      return;
                                                    }
                                                  }
                                                  const key = `${student.id}-${selectedTugas.id}`;
                                                  setTugasScores(prev => ({ ...prev, [key]: "" }));
                                                  setTugasGrades(prev => ({ ...prev, [key]: "" }));
                                                  setTugasNotes(prev => ({ ...prev, [key]: "" }));
                                                }
                                              }}
                                              disabled={!isVvipOrAdmin}
                                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                              title={!isVvipOrAdmin ? "Hanya Sensei VVIP dan Admin yang dapat melakukan reset nilai" : "Reset nilai tugas ini"}
                                            >
                                              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                              <span>Reset Nilai</span>
                                            </button>
                                            <button
                                              type="button"
                                              disabled={isSaving}
                                              onClick={async () => {
                                                if (currentScore === "") {
                                                  alert("Harap masukkan nilai terlebih dahulu.");
                                                  return;
                                                }
                                                const scoreNum = Number(currentScore);
                                                if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
                                                  alert("Nilai harus berupa angka antara 0 - 100.");
                                                  return;
                                                }
    
                                                const key = `${student.id}-${selectedTugas.id}`;
                                                setTugasGradingSubmitting(prev => ({ ...prev, [key]: true }));
    
                                                const payload = {
                                                  studentId: student.id,
                                                  studentName: student.name,
                                                  chapterNumber: Number(selectedTugas.chapterNumber || 1),
                                                  title: selectedTugas.title,
                                                  status: "Telah Dinilai",
                                                  subject: selectedTugas.subject,
                                                  lessonId: selectedTugas.id,
                                                  score: scoreNum,
                                                  grade: calculateGrade(currentScore) || "E",
                                                  notes: currentNotes,
                                                  assessedBy: currentUser?.name || "Sensei",
                                                  submissionUrl: assessment?.submissionUrl || "",
                                                  submissionDate: assessment?.submissionDate || new Date().toISOString()
                                                };
    
                                                try {
                                                  if (onUpdateState) {
                                                    const ok = await onUpdateState("chapterAssessments", "update", payload);
                                                    if (ok) {
                                                      alert(`Berhasil menyimpan nilai untuk ${student.name}!`);
                                                    } else {
                                                      alert("Gagal menyimpan nilai.");
                                                    }
                                                  }
                                                } catch (err) {
                                                  console.error(err);
                                                  alert("Gagal menyimpan nilai.");
                                                } finally {
                                                  setTugasGradingSubmitting(prev => ({ ...prev, [key]: false }));
                                                }
                                              }}
                                              className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-3xs active:scale-95"
                                            >
                                              {isSaving ? (
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                              ) : (
                                                <>
                                                  <Save className="w-3.5 h-3.5" />
                                                  <span>Simpan Nilai</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
    
                                  {/* Pagination Controls for Penilaian Tugas */}
                                  {totalTugasPages > 1 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 mt-6 gap-4">
                                      <span className="text-[11px] font-bold text-slate-500">
                                        Menampilkan {Math.min(filteredActiveStudents.length, (tugasCurrentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredActiveStudents.length, tugasCurrentPage * itemsPerPage)} dari {filteredActiveStudents.length} siswa
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={tugasCurrentPage === 1}
                                          onClick={() => {
                                            setTugasCurrentPage(prev => Math.max(1, prev - 1));
                                            const sec = document.getElementById("lms-tugas-section-container");
                                            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-indigo-600 hover:border-indigo-300"
                                        >
                                          Sebelumnya
                                        </button>
                                        {Array.from({ length: totalTugasPages }, (_, i) => i + 1).map((page) => (
                                          <button
                                            key={page}
                                            type="button"
                                            onClick={() => {
                                              setTugasCurrentPage(page);
                                              const sec = document.getElementById("lms-tugas-section-container");
                                              if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className={`w-7 h-7 rounded-lg text-[11px] font-bold transition ${
                                              tugasCurrentPage === page
                                                ? "bg-indigo-600 text-white shadow-xs"
                                                : "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                                            }`}
                                          >
                                            {page}
                                          </button>
                                        ))}
                                        <button
                                          type="button"
                                          disabled={tugasCurrentPage === totalTugasPages}
                                          onClick={() => {
                                            setTugasCurrentPage(prev => Math.min(totalTugasPages, prev + 1));
                                            const sec = document.getElementById("lms-tugas-section-container");
                                            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-indigo-600 hover:border-indigo-300"
                                        >
                                          Berikutnya
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                                <BookOpen className="w-8 h-8" />
                              </div>
                              <h4 className="font-display font-extrabold text-slate-600">Pilih Tugas di Atas</h4>
                              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">Silakan pilih tugas yang ingin dinilai dari menu dropdown di atas untuk mulai melihat daftar pengumpulan siswa.</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
  );
}
