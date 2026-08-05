const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarView.tsx', 'utf8');

const oldRender = `                })
              )}
            </div>
          </div>
          )}
        </div>`;

const newRender = `                })
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalInboxPages > 1 && (
              <div className="flex items-center justify-between mt-4 border-t pt-3">
                <button
                  onClick={() => setInboxPage(p => Math.max(1, p - 1))}
                  disabled={inboxPage === 1}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 disabled:opacity-50 cursor-pointer hover:bg-slate-200 transition"
                >
                  Sebelumnya
                </button>
                <span className="text-[10px] font-bold text-slate-500">
                  Halaman {inboxPage} dari {totalInboxPages}
                </span>
                <button
                  onClick={() => setInboxPage(p => Math.min(totalInboxPages, p + 1))}
                  disabled={inboxPage === totalInboxPages}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 disabled:opacity-50 cursor-pointer hover:bg-slate-200 transition"
                >
                  Selanjutnya
                </button>
              </div>
            )}
            
          </div>
          )}
        </div>`;

code = code.replace(oldRender, newRender);

fs.writeFileSync('src/components/CalendarView.tsx', code);
