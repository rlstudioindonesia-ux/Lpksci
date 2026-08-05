const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

const oldBlock = fs.readFileSync('quiz_block.txt', 'utf8');

const newBlock = `                              {/* Quizzes Section */}
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
                                         <button onClick={() => setActiveQuizChapterId(chapter.id)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                                            Lihat Hasil Kuis
                                         </button>
                                      ) : (
                                         <button onClick={() => {
                                            setActiveQuizChapterId(chapter.id);
                                         }} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                                            {cbtStartTimes[\`kuis_ch_\${chapter.id}\`] ? "Lanjutkan Kuis CBT" : "Mulai Kerjakan Kuis"}
                                         </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-2xs text-center space-y-4">
                                      <p className="text-sm font-bold text-slate-700">Pratinjau Kuis Bab {chapter.number}</p>
                                      <button onClick={() => setActiveQuizChapterId(chapter.id)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                                        Buka Penampil Kuis
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/components/LmsView.tsx', code);
