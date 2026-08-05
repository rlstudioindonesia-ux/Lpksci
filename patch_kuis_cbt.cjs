const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. We replace the Verify button for Essay:
const essayVerifyBtn = `) : !isSubmitted ? (
                                                <button
                                                  onClick={() => {
                                                    if (!essayAns.trim()) return;
                                                    setSubmittedQuizIds([...submittedQuizIds, quiz.id]);
                                                  }}
                                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition active:scale-95 shadow-sm cursor-pointer"
                                                >
                                                  Simpan Jawaban Essay
                                                </button>
                                              ) : (`;

const essayVerifyReplace = `) : !isSubmitted ? null : (`;
code = code.split(essayVerifyBtn).join(essayVerifyReplace);

// 2. We replace the Verify button for Multiple Choice:
const mcqVerifyBtn = `) : !isSubmitted ? (
                                                <button
                                                  disabled={selectedAns === undefined}
                                                  onClick={() => {
                                                    setSubmittedQuizIds([...submittedQuizIds, quiz.id]);
                                                  }}
                                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-4 py-2 rounded-lg transition active:scale-95 disabled:opacity-40 disabled:scale-100 shadow-sm cursor-pointer"
                                                >
                                                  Verifikasi Pilihan Jawaban
                                                </button>
                                              ) : (`;

const mcqVerifyReplace = `) : !isSubmitted ? null : (`;
code = code.split(mcqVerifyBtn).join(mcqVerifyReplace);

// 3. Add the Submit CBT button at the end of the quizzes list.
const quizzesEnd = `                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}`;

const quizzesEndReplace = `                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* CBT Submit Button / Start CBT logic */}
                                  {filteredQuizzes.length > 0 && currentUser?.role === "Siswa" && (
                                    <div className="mt-6 border-t border-slate-200 pt-6">
                                      {filteredQuizzes[0].durationMinutes && !cbtStartTimes[\`kuis_ch_\${chapter.id}\`] ? (
                                        <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                                          <p className="text-sm font-bold text-slate-700">Kuis ini merupakan Computer Based Test (CBT).</p>
                                          <p className="text-xs text-slate-500">Durasi CBT: {filteredQuizzes[0].durationMinutes} Menit. Waktu akan terus berjalan meskipun aplikasi ditutup.</p>
                                          <button onClick={() => handleStartCbt(\`kuis_ch_\${chapter.id}\`)} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition">
                                            Mulai Kerjakan Kuis CBT
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                                          <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-slate-700">Aksi Kuis:</span>
                                            {filteredQuizzes[0].durationMinutes && cbtStartTimes[\`kuis_ch_\${chapter.id}\`] && (
                                              <CBTTimer 
                                                startTime={cbtStartTimes[\`kuis_ch_\${chapter.id}\`]} 
                                                durationMinutes={filteredQuizzes[0].durationMinutes} 
                                                onExpire={() => {
                                                  // Auto submit if expired
                                                  const allQuizIds = filteredQuizzes.map(q => q.id);
                                                  const newSubmitted = [...submittedQuizIds];
                                                  allQuizIds.forEach(id => {
                                                    if (!newSubmitted.includes(id)) newSubmitted.push(id);
                                                  });
                                                  setSubmittedQuizIds(newSubmitted);
                                                  setCbtStartTimes(prev => ({...prev}));
                                                }} 
                                              />
                                            )}
                                          </div>
                                          
                                          {(!filteredQuizzes[0].durationMinutes || (cbtStartTimes[\`kuis_ch_\${chapter.id}\`] && Date.now() < cbtStartTimes[\`kuis_ch_\${chapter.id}\`] + filteredQuizzes[0].durationMinutes * 60 * 1000)) ? (
                                            <button
                                              onClick={() => {
                                                const allQuizIds = filteredQuizzes.map(q => q.id);
                                                const newSubmitted = [...submittedQuizIds];
                                                allQuizIds.forEach(id => {
                                                  if (!newSubmitted.includes(id)) newSubmitted.push(id);
                                                });
                                                setSubmittedQuizIds(newSubmitted);
                                              }}
                                              disabled={filteredQuizzes.every(q => submittedQuizIds.includes(q.id))}
                                              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition shadow-sm cursor-pointer"
                                            >
                                              {filteredQuizzes.every(q => submittedQuizIds.includes(q.id)) ? "Kuis Sudah Disubmit" : "Submit Semua Jawaban Kuis"}
                                            </button>
                                          ) : (
                                            <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                                              🚫 Waktu CBT Habis
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}`;

code = code.split(quizzesEnd).join(quizzesEndReplace);

// 4. Also we must hide the quizzes themselves if it's CBT and not started yet!
const quizMapStart = `{filteredQuizzes.map((quiz, idx) => {`;
const quizMapReplace = `{(!filteredQuizzes[0].durationMinutes || cbtStartTimes[\`kuis_ch_\${chapter.id}\`] || currentUser?.role !== "Siswa") && filteredQuizzes.map((quiz, idx) => {`;

code = code.split(quizMapStart).join(quizMapReplace);

fs.writeFileSync(file, code);
console.log("Patched Kuis CBT");
