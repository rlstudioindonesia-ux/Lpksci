const fs = require('fs');
let code = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf-8');

code = code.replace(
  /<div className="flex items-center gap-1\.5 text-emerald-50 font-bold font-mono text-\[9px\] lowercase bg-black\/20 px-2\.5 py-1\.5 rounded-xl shadow-inner backdrop-blur-[^>]+>\s*<Lock [^>]+> akses khusus staf\s*<\/div>\s*<\/div>\s*\{\/\* Grid of components matching screenshots - SORTED ALPHABETICALLY \*\/\}\s*<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1 text-left">/m,
  `<button 
                    onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                    className="flex items-center justify-center bg-black/10 hover:bg-black/20 p-2 rounded-xl transition cursor-pointer text-white/90 hover:text-white relative z-10 border border-black/5 active:scale-95"
                  >
                    {isAdminPanelOpen ? <ChevronUp className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" /> : <ChevronDown className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />}
                  </button>
                </div>
                {/* Grid of components matching screenshots - SORTED ALPHABETICALLY */}
                {isAdminPanelOpen && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1 text-left animate-fade-in">`
);

code = code.replace(
  /<div className="flex items-center gap-1\.5 text-amber-50 font-bold font-mono text-\[9px\] lowercase bg-black\/20 px-2\.5 py-1\.5 rounded-xl shadow-inner backdrop-blur-[^>]+>\s*<Lock [^>]+> khusus direktur\s*<\/div>\s*<\/div>\s*\{\/\* VVIP Quick KPIs & Features - SORTED ALPHABETICALLY \*\/\}\s*<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-2 text-left">/m,
  `<button 
                  onClick={() => setIsVvipPanelOpen(!isVvipPanelOpen)}
                  className="flex items-center justify-center bg-black/10 hover:bg-black/20 p-2 rounded-xl transition cursor-pointer text-white/90 hover:text-white relative z-10 border border-black/5 active:scale-95"
                >
                  {isVvipPanelOpen ? <ChevronUp className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" /> : <ChevronDown className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />}
                </button>
              </div>
              {/* VVIP Quick KPIs & Features - SORTED ALPHABETICALLY */}
              {isVvipPanelOpen && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-2 text-left animate-fade-in">`
);

fs.writeFileSync('src/components/MobileDashboardView.tsx', code);
