const fs = require('fs');
let code = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf-8');

// close the admin panel grid
code = code.replace(
  `                    })}
                </div>
              </section>
            )}`,
  `                    })}
                </div>
                )}
              </section>
            )}`
);

const vvipTarget = `                <div className="flex items-center gap-1.5 text-amber-50 font-bold font-mono text-[9px] lowercase bg-black/20 px-2.5 py-1.5 rounded-xl shadow-inner backdrop-blur-sm border border-black/10 relative z-10">
                  <Lock className="h-3 w-3 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" /> khusus direktur
                </div>
              </div>
              {/* VVIP Quick KPIs & Features - SORTED ALPHABETICALLY */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-2 text-left">`;

const vvipReplacement = `                <button 
                  onClick={() => setIsVvipPanelOpen(!isVvipPanelOpen)}
                  className="flex items-center justify-center bg-black/10 hover:bg-black/20 p-2 rounded-xl transition cursor-pointer text-white/90 hover:text-white relative z-10 border border-black/5 active:scale-95"
                >
                  {isVvipPanelOpen ? <ChevronUp className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" /> : <ChevronDown className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />}
                </button>
              </div>
              {/* VVIP Quick KPIs & Features - SORTED ALPHABETICALLY */}
              {isVvipPanelOpen && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-2 text-left animate-fade-in">`;

code = code.replace(vvipTarget, vvipReplacement);

code = code.replace(
  `                  })}
              </div>
            </section>`,
  `                  })}
              </div>
              )}
            </section>`
);

fs.writeFileSync('src/components/MobileDashboardView.tsx', code);
