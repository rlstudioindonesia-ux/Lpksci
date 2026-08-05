const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

const targetSection = `{progressTabMode === "penilaian" && (`;

const replacementSection = `{progressTabMode === "sikap" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs animate-fade-in text-left">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-800">
                      Penilaian Kelayakan Order Job
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Nilai sikap (5S), etika, dan kemampuan khusus untuk menentukan kelayakan siswa mengikuti Order Job.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentsInClass.map((student) => (
                    <div key={student.id} className="p-4 border rounded-2xl flex flex-col gap-3 relative">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate">{student.name}</h4>
                          <div className="text-[10px] text-slate-500 font-medium font-mono truncate">{student.id}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nilai 5S</label>
                          <input 
                            type="number"
                            min="0" max="100"
                            defaultValue={student.fiveSScore || 0}
                            onBlur={(e) => {
                              onUpdateState("activeStudents", "update", { ...student, fiveSScore: parseInt(e.target.value) || 0 });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nilai Etika</label>
                          <input 
                            type="number"
                            min="0" max="100"
                            defaultValue={student.ethicsScore || 0}
                            onBlur={(e) => {
                              onUpdateState("activeStudents", "update", { ...student, ethicsScore: parseInt(e.target.value) || 0 });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Matematika</label>
                          <input 
                            type="number"
                            min="0" max="100"
                            defaultValue={student.mathScore || 0}
                            onBlur={(e) => {
                              onUpdateState("activeStudents", "update", { ...student, mathScore: parseInt(e.target.value) || 0 });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Kehadiran (%)</label>
                          <input 
                            type="number"
                            min="0" max="100"
                            defaultValue={student.attendanceScore || 0}
                            onBlur={(e) => {
                              onUpdateState("activeStudents", "update", { ...student, attendanceScore: parseInt(e.target.value) || 0 });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {studentsInClass.length === 0 && (
                    <div className="col-span-full py-10 text-center text-slate-400 text-sm">
                      Belum ada siswa di kelas ini.
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {progressTabMode === "penilaian" && (`;

if (code.includes(targetSection)) {
  code = code.replace(targetSection, replacementSection);
  fs.writeFileSync('src/components/LmsView.tsx', code);
  console.log("Patched section successfully");
} else {
  console.log("Could not find section target");
}
