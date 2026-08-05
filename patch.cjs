const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

code = code.replace(
  'const [pdfViewerUrl, setPdfViewerUrl] = React.useState<string | null>(null);',
  'const [pdfViewerUrl, setPdfViewerUrl] = React.useState<string | null>(null);\n  const [activeQuizChapterId, setActiveQuizChapterId] = React.useState<string | null>(null);'
);

code = code.replace(
  'if (pdfViewerUrl) {',
  `if (activeQuizChapterId) {
    const chapter = currentClassData?.chapters?.find(c => c.id === activeQuizChapterId);
    if (!chapter) {
      setActiveQuizChapterId(null);
      return null;
    }
    const filteredQuizzes = (currentClassData?.quizzes || []).filter(q => q.chapterId === chapter.id);
    const cbtStarted = !!cbtStartTimes[\`kuis_ch_\${chapter.id}\`];
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
                       startTime={cbtStartTimes[\`kuis_ch_\${chapter.id}\`]} 
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

           {(!filteredQuizzes[0]?.durationMinutes || cbtStarted || isSubmitted) ? (
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
                                className={\`px-4 py-3 rounded-xl text-left text-sm transition flex items-start gap-3 cursor-pointer \${btnStyle}\`}
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
                        <div className={\`mt-4 p-4 rounded-xl text-xs font-bold flex items-center gap-2 \${
                          isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }\`}>
                          <span>{isCorrect ? "🎉 Jawaban Benar!" : \`❌ Kurang Tepat. Jawaban yang benar adalah Opsi \${String.fromCharCode(65 + quiz.correctAnswerIndex)}.\`}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isSubmitted && (
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
                  onClick={() => handleStartCbt(\`kuis_ch_\${chapter.id}\`)} 
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

  if (pdfViewerUrl) {`
);

fs.writeFileSync('src/components/LmsView.tsx', code);
