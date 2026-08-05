const fs = require('fs');
let code = fs.readFileSync('src/components/mobile/MobileBottomNav.tsx', 'utf-8');

const target = `      {/* Top Row: Contextual Secondary Menus */}
      {topMenus.length > 0 && (
        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-1.5 px-3 py-1.5 min-w-max mx-auto justify-start">
            {topMenus.map((menu, idx) => {
              const Icon = menu.icon;
              const isActive = activeSubpage === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveSubpage(menu.id)}
                  className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold \${
                    isActive
                      ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50 ring-1 ring-black/5"
                      : "text-slate-500 hover:bg-slate-100 active:bg-slate-200"
                  }\`}
                  id={\`mobile-top-tab-\${menu.id}\`}
                >
                  <Icon className={\`h-3.5 w-3.5 \${isActive ? "stroke-[2.5]" : "stroke-2"}\`} style={{ stroke: isActive ? "url(#activeIconGradient)" : \`url(#grad-\${idx % 5})\`, fill: "none" }} />
                  <span className={\`text-[9.5px] whitespace-nowrap \${isActive ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-extrabold" : \`font-bold \${["text-sky-600","text-rose-600","text-emerald-600","text-amber-600","text-violet-600"][idx % 5]}\`}\`}>{menu.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Row: Main Menus */}
      <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-1.5 pb-1.5">
        <div className="flex items-center gap-2 px-2 min-w-max mx-auto justify-start">
          {mainMenus.map((menu, idx) => {
            const Icon = menu.icon;
            let isActive = activeSubpage === menu.id;
            
            if (menu.id === "home" && !activeSubpage) {
              isActive = true;
            }
            if (
              menu.id === "akun" &&
              (activeSubpage?.startsWith("akun") || activeSubpage === "vvip_akun")
            ) {
              isActive = true;
            }
            return (
              <button
                key={menu.id}
                onClick={() => {
                  if (menu.id === "home") {
                    if (setActiveWorkspace) setActiveWorkspace("main");
                    setActiveSubpage(null);
                  } else if (menu.id === "admin_panel") {
                    if (setActiveWorkspace) setActiveWorkspace("admin");
                    setActiveSubpage("admin_siswa");
                  } else if (menu.id === "vvip_panel") {
                    if (setActiveWorkspace) setActiveWorkspace("vvip");
                    setActiveSubpage("vvip_exec");
                  } else {
                    setActiveSubpage(menu.id);
                  }
                }}
                className={\`flex flex-col items-center justify-center min-w-[64px] gap-1 p-2 rounded-2xl transition-all cursor-pointer \${
                  isActive
                    ? "text-indigo-700 font-black bg-indigo-50/80 shadow-inner"
                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800 font-bold"
                }\`}
                id={\`mobile-bottom-tab-\${menu.id}\`}
              >
                <Icon className={\`h-5 w-5 \${isActive ? "stroke-[2.5]" : "stroke-2"}\`} style={{ stroke: isActive ? "url(#activeIconGradient)" : \`url(#grad-\${idx % 5})\`, fill: "none" }} />
                <span className={\`text-[9px] tracking-tight whitespace-nowrap \${isActive ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-extrabold" : \`font-bold \${["text-sky-600","text-rose-600","text-emerald-600","text-amber-600","text-violet-600"][idx % 5]}\`}\`}>{menu.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}`;

const replacement = `      {/* Top Row: Contextual Secondary Menus */}
      {topMenus.length > 0 && (
        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-1.5 px-3 py-1.5 min-w-max mx-auto justify-start">
            {topMenus.map((menu, idx) => {
              const Icon = menu.icon;
              const isActive = activeSubpage === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveSubpage(menu.id)}
                  className={\`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-300 \${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200/50"
                      : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                  }\`}
                  id={\`mobile-top-tab-\${menu.id}\`}
                >
                  <Icon className={\`h-3.5 w-3.5 \${isActive ? "stroke-[2.5]" : "stroke-2 group-hover:text-indigo-600"}\`} />
                  <span className={\`text-[10px] whitespace-nowrap \${isActive ? "font-black" : "font-bold group-hover:text-indigo-600"}\`}>{menu.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Row: Main Menus */}
      <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-2 pb-2">
        <div className="flex items-center gap-1.5 px-2 min-w-max mx-auto justify-start">
          {mainMenus.map((menu, idx) => {
            const Icon = menu.icon;
            let isActive = activeSubpage === menu.id;
            
            if (menu.id === "home" && !activeSubpage) {
              isActive = true;
            }
            if (
              menu.id === "akun" &&
              (activeSubpage?.startsWith("akun") || activeSubpage === "vvip_akun")
            ) {
              isActive = true;
            }
            return (
              <button
                key={menu.id}
                onClick={() => {
                  if (menu.id === "home") {
                    if (setActiveWorkspace) setActiveWorkspace("main");
                    setActiveSubpage(null);
                  } else if (menu.id === "admin_panel") {
                    if (setActiveWorkspace) setActiveWorkspace("admin");
                    setActiveSubpage("admin_siswa");
                  } else if (menu.id === "vvip_panel") {
                    if (setActiveWorkspace) setActiveWorkspace("vvip");
                    setActiveSubpage("vvip_exec");
                  } else {
                    setActiveSubpage(menu.id);
                  }
                }}
                className={\`group relative flex flex-col items-center justify-center min-w-[70px] gap-1 p-2 rounded-2xl transition-all duration-300 cursor-pointer \${
                  isActive
                    ? "bg-indigo-50/60"
                    : "hover:bg-slate-50"
                }\`}
                id={\`mobile-bottom-tab-\${menu.id}\`}
              >
                <div className={\`relative flex items-center justify-center transition-all duration-300 \${
                  isActive 
                    ? "w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-300/50" 
                    : "w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200/80"
                }\`}>
                  <Icon className={\`transition-all duration-300 \${isActive ? "h-[20px] w-[20px] text-white stroke-[2.5]" : "h-4 w-4 text-slate-500 stroke-2 group-hover:text-indigo-600"}\`} />
                </div>
                
                <span className={\`text-[10px] tracking-tight whitespace-nowrap transition-all duration-300 \${isActive ? "text-indigo-700 font-black" : "text-slate-500 font-bold group-hover:text-indigo-600"}\`}>
                  {menu.name}
                </span>
                
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/mobile/MobileBottomNav.tsx', code);
