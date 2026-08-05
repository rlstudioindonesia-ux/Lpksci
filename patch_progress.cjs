const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

const oldLogic = `              const studentAsss = (studentAssessmentsMap.get(studentIdToView) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
              let finishedChaptersCount = studentAsss.filter(c => c.status === "Telah Dinilai").length;
              const classObj = allClasses.find(c => (c.name || "").trim().toLowerCase() === (studentClass || "").trim().toLowerCase());
              const activeChapterNumKey = assessmentSubject === "SSW" ? "activeMathChapterNum" : "activeChapterNum";
              const classActiveNum = classObj?.[activeChapterNumKey] || 1;
              const currentNum = targetStudent?.currentChapter || classActiveNum;
              
              if (currentNum) {
                const activeChaptersList = getClassChaptersList(studentClass, assessmentSubject, false);
                const currentIndex = activeChaptersList.findIndex(c => Number(c.number) === Number(currentNum));
                if (currentIndex > -1) {
                  // The user wants it to NOT exceed active chapter even if graded higher
                  finishedChaptersCount = Math.min(finishedChaptersCount, currentIndex + 1);
                }
              }`;

const newLogic = `              const studentAsss = (studentAssessmentsMap.get(studentIdToView) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
              
              const gradedAsss = studentAsss.filter((c: any) => c.status === "Telah Dinilai");
              let finishedChaptersCount = gradedAsss.length > 0 
                ? Math.max(...gradedAsss.map((a: any) => Number(a.chapterNumber) || 0))
                : 0;
              
              finishedChaptersCount = Math.min(finishedChaptersCount, maxChapters);`;

const oldUI = `                <div className="mb-6 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4 animate-fade-in">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 shadow-3xs">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-sm text-slate-800">Kemajuan {assessmentSubject}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{targetStudent.name} • {studentClass || "Semua"}</p>
                    </div>
                  </div>`;

const newUI = `                <div className="mb-6 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4 animate-fade-in relative">
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
                  </div>`;

code = code.replace(oldLogic, newLogic);
code = code.replace(oldUI, newUI);

fs.writeFileSync('src/components/LmsView.tsx', code);
