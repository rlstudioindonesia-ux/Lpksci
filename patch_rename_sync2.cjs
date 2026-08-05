const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

const target = `    // Sync class name to students
    if (oldName && oldName !== newName && systemState?.activeStudents) {
      const affectedStudents = systemState.activeStudents.filter((s: any) => s.class === oldName);
      for (const student of affectedStudents) {
        await onUpdateState("activeStudents", "update_status", {
          id: student.id,
          class: newName
        });
      }
    }`;

const replacement = `    // Sync class name to students and users
    if (oldName && oldName !== newName) {
      if (systemState?.activeStudents) {
        const affectedStudents = systemState.activeStudents.filter((s: any) => s.class === oldName);
        for (const student of affectedStudents) {
          await onUpdateState("activeStudents", "update_status", {
            id: student.id,
            class: newName
          });
        }
      }
      if (systemState?.users) {
        const affectedUsers = systemState.users.filter((u: any) => u.assignedClass === oldName);
        for (const user of affectedUsers) {
          // Send an update for the user
          await onUpdateState("users", "edit", {
            id: user.id || user.username,
            assignedClass: newName
          });
        }
      }
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find target");
}
