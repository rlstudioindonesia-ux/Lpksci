const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

// The start replacement left a dangling `? (` and `<>`
const fix1Target = `{(!lesson.durationMinutes || (cbtStartTimes[\`tugas_\${lesson.id}\`] && Date.now() < cbtStartTimes[\`tugas_\${lesson.id}\`] + lesson.durationMinutes * 60 * 1000)) ? (

                                                            <label`;

const fix1Replace = `{(!lesson.durationMinutes || (cbtStartTimes[\`tugas_\${lesson.id}\`] && Date.now() < cbtStartTimes[\`tugas_\${lesson.id}\`] + lesson.durationMinutes * 60 * 1000)) ? (
                                                              <>
                                                            <label`;

if (code.includes(fix1Target)) {
  code = code.replace(fix1Target, fix1Replace);
}

const fix2Target = `                                                                </>
                                                              )}
                                                            </div>
                                                          </div>
                                                        )}`;

const fix2Replace = `                                                                </>
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

if (code.includes(fix2Target)) {
  code = code.replace(fix2Target, fix2Replace);
}

fs.writeFileSync(file, code);
console.log('Fixed syntax');
