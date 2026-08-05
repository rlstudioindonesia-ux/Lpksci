const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

// Add states
if (!code.includes('renamingClassId')) {
  code = code.replace(
    'const [expandedClassIds, setExpandedClassIds] = React.useState<string[]>([]);',
    `const [expandedClassIds, setExpandedClassIds] = React.useState<string[]>([]);
  const [renamingClassId, setRenamingClassId] = React.useState<string | null>(null);
  const [renamingValue, setRenamingValue] = React.useState<string>("");`
  );
}

// Add handleRenameClass function right after allClasses definition
if (!code.includes('handleRenameClass')) {
  code = code.replace(
    'const allClasses = [',
    `const handleRenameClass = async (id: string) => {
    if (!renamingValue.trim()) return;
    const baseClasses = systemState?.customization?.lmsClasses || [];
    const updatedClasses = [...baseClasses];
    const targetIdx = updatedClasses.findIndex((item: any) => item.id.toLowerCase() === id.toLowerCase());
    if (targetIdx !== -1) {
      updatedClasses[targetIdx] = {
        ...updatedClasses[targetIdx],
        name: renamingValue.trim()
      };
    } else {
      // If it doesn't exist, we can't really rename it, but let's be safe
      return;
    }
    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedClasses
    });
    setRenamingClassId(null);
  };
  
  const allClasses = [`
  );
}

// Replace the name display for Reguler classes (around line 258)
const targetReguler = `<h5 className="font-bold text-slate-800 text-sm mb-1">{c.name}</h5>`;
const replaceReguler = `{renamingClassId === c.id ? (
                                  <div className="flex items-center gap-2 mb-1">
                                    <input 
                                      type="text" 
                                      value={renamingValue} 
                                      onChange={(e) => setRenamingValue(e.target.value)}
                                      className="border border-blue-200 rounded px-2 py-0.5 text-sm font-bold text-slate-800 w-full"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameClass(c.id);
                                        if (e.key === 'Escape') setRenamingClassId(null);
                                      }}
                                    />
                                    <button onClick={() => handleRenameClass(c.id)} className="text-green-600 hover:text-green-800 shrink-0"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setRenamingClassId(null)} className="text-slate-400 hover:text-slate-600 shrink-0"><X className="w-4 h-4" /></button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mb-1 group/title">
                                    <h5 className="font-bold text-slate-800 text-sm">{c.name}</h5>
                                    <button 
                                      onClick={() => {
                                        setRenamingClassId(c.id);
                                        setRenamingValue(c.name);
                                      }}
                                      className="text-slate-300 hover:text-blue-600 transition opacity-0 group-hover/title:opacity-100 p-0.5 cursor-pointer"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}`;

code = code.replace(targetReguler, replaceReguler);

// Replace the name display for Alumni classes
const targetAlumni = `<h5 className="font-bold text-slate-800 text-sm mb-1">{c.name}</h5>`;
// wait, the first replace might replace all or just the first. Let's do it individually if they exist.
code = code.replace(targetAlumni, replaceReguler.replace(/blue/g, 'emerald'));

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
console.log("Patched successfully");
