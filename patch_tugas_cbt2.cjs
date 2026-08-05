const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const uploadTarget = `{(!lesson.deadline || new Date() < new Date(lesson.deadline)) && (
                                                          <div className="space-y-2">`;
                                                          
const uploadReplacement = `{(!lesson.deadline || new Date() < new Date(lesson.deadline)) && (
                                                          <div className="space-y-2">
                                                            {lesson.durationMinutes && !cbtStartTimes[\`tugas_\${lesson.id}\`] ? (
                                                              <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-2xs">
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
                                                                      onExpire={() => { setCbtStartTimes(prev => ({...prev})) }} 
                                                                    />
                                                                  </div>
                                                                )}
                                                                {(!lesson.durationMinutes || (cbtStartTimes[\`tugas_\${lesson.id}\`] && Date.now() < cbtStartTimes[\`tugas_\${lesson.id}\`] + lesson.durationMinutes * 60 * 1000)) ? (
`;

const uploadEndTarget = `</p>
                                                                </div>
                                                              )}
                                                            </div>
                                                          </div>
                                                        )}`;

const uploadEndReplacement = `</p>
                                                                </div>
                                                              )}
                                                            </div>
                                                                ) : (
                                                                    <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-bold text-xs shadow-3xs">
                                                                      🚫 Waktu pengerjaan tugas CBT telah habis. Anda tidak dapat mengunggah berkas lagi.
                                                                    </div>
                                                                )}
                                                              </>
                                                            )}
                                                          </div>
                                                        )}`;

if (code.includes(uploadTarget)) {
  code = code.replace(uploadTarget, uploadReplacement);
  // Need to be careful replacing the end to not match the wrong closing tags
  code = code.replace(uploadEndTarget, uploadEndReplacement);
  fs.writeFileSync(file, code);
  console.log("Patched Tugas CBT");
} else {
  console.log("Target not found");
}

