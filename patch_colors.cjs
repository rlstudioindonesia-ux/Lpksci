const fs = require('fs');
let code = fs.readFileSync('src/components/mobile/MobileBottomNav.tsx', 'utf-8');

const target = `            if (
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
            );`;

const replacement = `            if (
              menu.id === "akun" &&
              (activeSubpage?.startsWith("akun") || activeSubpage === "vvip_akun")
            ) {
              isActive = true;
            }

            const theme = [
              { activeBg: "from-sky-500 to-blue-600 shadow-blue-300/50", activeText: "text-blue-700", activeDot: "bg-blue-600", activeContainer: "bg-blue-50/60", inactiveIcon: "text-blue-500", inactiveText: "text-blue-600", inactiveBg: "bg-blue-50", hoverIcon: "group-hover:text-blue-600", hoverBg: "group-hover:bg-blue-100" },
              { activeBg: "from-rose-500 to-rose-600 shadow-rose-300/50", activeText: "text-rose-700", activeDot: "bg-rose-600", activeContainer: "bg-rose-50/60", inactiveIcon: "text-rose-500", inactiveText: "text-rose-600", inactiveBg: "bg-rose-50", hoverIcon: "group-hover:text-rose-600", hoverBg: "group-hover:bg-rose-100" },
              { activeBg: "from-emerald-500 to-emerald-600 shadow-emerald-300/50", activeText: "text-emerald-700", activeDot: "bg-emerald-600", activeContainer: "bg-emerald-50/60", inactiveIcon: "text-emerald-500", inactiveText: "text-emerald-600", inactiveBg: "bg-emerald-50", hoverIcon: "group-hover:text-emerald-600", hoverBg: "group-hover:bg-emerald-100" },
              { activeBg: "from-amber-400 to-amber-500 shadow-amber-300/50", activeText: "text-amber-700", activeDot: "bg-amber-500", activeContainer: "bg-amber-50/60", inactiveIcon: "text-amber-500", inactiveText: "text-amber-600", inactiveBg: "bg-amber-50", hoverIcon: "group-hover:text-amber-600", hoverBg: "group-hover:bg-amber-100" },
              { activeBg: "from-violet-500 to-violet-600 shadow-violet-300/50", activeText: "text-violet-700", activeDot: "bg-violet-600", activeContainer: "bg-violet-50/60", inactiveIcon: "text-violet-500", inactiveText: "text-violet-600", inactiveBg: "bg-violet-50", hoverIcon: "group-hover:text-violet-600", hoverBg: "group-hover:bg-violet-100" },
            ][idx % 5];

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
                className={\`group relative flex flex-col items-center justify-center min-w-[70px] gap-1.5 p-2 rounded-2xl transition-all duration-300 cursor-pointer \${
                  isActive
                    ? theme.activeContainer
                    : "hover:bg-slate-50"
                }\`}
                id={\`mobile-bottom-tab-\${menu.id}\`}
              >
                <div className={\`relative flex items-center justify-center transition-all duration-300 \${
                  isActive 
                    ? \`w-12 h-12 rounded-full bg-gradient-to-tr \${theme.activeBg} shadow-lg scale-110 -translate-y-1\` 
                    : \`w-10 h-10 rounded-full \${theme.inactiveBg} \${theme.hoverBg}\`
                }\`}>
                  <Icon className={\`transition-all duration-300 \${isActive ? "h-6 w-6 text-white stroke-[2.5]" : \`h-[20px] w-[20px] \${theme.inactiveIcon} stroke-2 \${theme.hoverIcon}\`}\`} />
                </div>
                
                <span className={\`text-[10px] tracking-tight whitespace-nowrap transition-all duration-300 \${isActive ? \`\${theme.activeText} font-black translate-y-0.5\` : \`\${theme.inactiveText} font-bold opacity-80 \${theme.hoverIcon} group-hover:opacity-100\`}\`}>
                  {menu.name}
                </span>
                
                {isActive && (
                  <div className={\`absolute bottom-0.5 w-1.5 h-1.5 rounded-full \${theme.activeDot}\`} />
                )}
              </button>
            );`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/mobile/MobileBottomNav.tsx', code);
