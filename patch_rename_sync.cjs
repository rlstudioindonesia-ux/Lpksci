const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

const target = `  const handleRenameClass = async (id: string) => {
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
  };`;

const replacement = `  const handleRenameClass = async (id: string) => {
    if (!renamingValue.trim()) return;
    const baseClasses = systemState?.customization?.lmsClasses || [];
    const updatedClasses = [...baseClasses];
    const targetIdx = updatedClasses.findIndex((item: any) => item.id.toLowerCase() === id.toLowerCase());
    
    let oldName = "";
    const newName = renamingValue.trim();
    if (targetIdx !== -1) {
      oldName = updatedClasses[targetIdx].name;
      updatedClasses[targetIdx] = {
        ...updatedClasses[targetIdx],
        name: newName
      };
    } else {
      return;
    }
    
    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedClasses
    });
    
    // Sync class name to students
    if (oldName && oldName !== newName && systemState?.activeStudents) {
      const affectedStudents = systemState.activeStudents.filter((s: any) => s.class === oldName);
      for (const student of affectedStudents) {
        await onUpdateState("activeStudents", "update_status", {
          id: student.id,
          class: newName
        });
      }
    }
    
    setRenamingClassId(null);
  };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find target");
}
