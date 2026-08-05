const fs = require('fs');
let code = fs.readFileSync('src/components/mobile/MobileBottomNav.tsx', 'utf-8');

const target = `                className={\`group relative flex flex-col items-center justify-center min-w-[70px] gap-1.5 p-2 rounded-2xl transition-all duration-300 cursor-pointer \${
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
                
                <span className={\`text-[10px] tracking-tight whitespace-nowrap transition-all duration-300 \${isActive ? \`\${theme.activeText} font-black translate-y-0.5\` : \`\${theme.inactiveText} font-bold opacity-80 \${theme.hoverIcon} group-hover:opacity-100\`}\`}>`;

const replacement = `                className={\`group relative flex flex-col items-center justify-center min-w-[64px] gap-1 p-1.5 rounded-2xl transition-all duration-300 cursor-pointer \${
                  isActive
                    ? theme.activeContainer
                    : "hover:bg-slate-50"
                }\`}
                id={\`mobile-bottom-tab-\${menu.id}\`}
              >
                <div className={\`relative flex items-center justify-center transition-all duration-300 \${
                  isActive 
                    ? \`w-[38px] h-[38px] rounded-full bg-gradient-to-tr \${theme.activeBg} shadow-md -translate-y-0.5\` 
                    : \`w-[34px] h-[34px] rounded-full \${theme.inactiveBg} \${theme.hoverBg}\`
                }\`}>
                  <Icon className={\`transition-all duration-300 \${isActive ? "h-5 w-5 text-white stroke-[2.5]" : \`h-[18px] w-[18px] \${theme.inactiveIcon} stroke-2 \${theme.hoverIcon}\`}\`} />
                </div>
                
                <span className={\`text-[9px] tracking-tight whitespace-nowrap transition-all duration-300 \${isActive ? \`\${theme.activeText} font-black\` : \`\${theme.inactiveText} font-bold opacity-80 \${theme.hoverIcon} group-hover:opacity-100\`}\`}>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/mobile/MobileBottomNav.tsx', code);
