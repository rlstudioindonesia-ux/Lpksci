const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const targetTugasUpload = `{/* File Upload Area */}
                                                        {(!lesson.deadline || new Date() < new Date(lesson.deadline)) && (
                                                          <div className="space-y-2">`;

const replaceTugasUpload = `{/* File Upload Area */}
                                                        {(!lesson.deadline || new Date() < new Date(lesson.deadline)) && (
                                                          <div className="space-y-2">
                                                            {lesson.durationMinutes && !cbtStartTimes[\`tugas_\${lesson.id}\`] ? (
                                                              <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                                                <p className="text-sm font-bold text-slate-700">Tugas ini memiliki durasi pengerjaan CBT.</p>
                                                                <p className="text-xs text-slate-500">Durasi: {lesson.durationMinutes} Menit. Waktu akan terus berjalan meskipun aplikasi ditutup.</p>
                                                                <button onClick={() => handleStartCbt(\`tugas_\${lesson.id}\`)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition">
                                                                  Mulai Mengerjakan Tugas
                                                                </button>
                                                              </div>
                                                            ) : (
                                                              <>
                                                                {lesson.durationMinutes && cbtStartTimes[\`tugas_\${lesson.id}\`] && (
                                                                  <div className="mb-4 flex justify-center">
                                                                    <CBTTimer 
                                                                      startTime={cbtStartTimes[\`tugas_\${lesson.id}\`]} 
                                                                      durationMinutes={lesson.durationMinutes} 
                                                                      onExpire={() => {
                                                                        // Automatically hide upload on expire by triggering a re-render or state update
                                                                        // We use the start time logic to check if expired
                                                                      }} 
                                                                    />
                                                                  </div>
                                                                )}
                                                                {(!lesson.durationMinutes || (cbtStartTimes[\`tugas_\${lesson.id}\`] && Date.now() < cbtStartTimes[\`tugas_\${lesson.id}\`] + lesson.durationMinutes * 60 * 1000)) ? (`;

const endTugasUpload = `) : (
                                                                    <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-bold text-xs">
                                                                      Waktu pengerjaan tugas telah habis. Anda tidak dapat mengunggah berkas lagi.
                                                                    </div>
                                                                )}
                                                              </>
                                                            )}`;

// We need to find the end of the upload div.
// It ends around `</p>\n                                                              </div>\n                                                            )}` 
// Let's just use string replacement carefully.
