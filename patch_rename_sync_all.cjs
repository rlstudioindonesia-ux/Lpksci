const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

const target = `    // Sync class name to students and users
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
            username: user.username,
            assignedClass: newName
          });
        }
      }
    }`;

const replacement = `    // Sync class name to students, users, events, lessons, quizzes, registeredStudents
    if (oldName && oldName !== newName) {
      const updatePromises = [];
      
      if (systemState?.activeStudents) {
        const affectedStudents = systemState.activeStudents.filter((s: any) => s.class === oldName);
        for (const student of affectedStudents) {
          updatePromises.push(onUpdateState("activeStudents", "update_status", {
            id: student.id,
            class: newName
          }));
        }
      }
      if (systemState?.users) {
        const affectedUsers = systemState.users.filter((u: any) => u.assignedClass === oldName);
        for (const user of affectedUsers) {
          updatePromises.push(onUpdateState("users", "edit", {
            username: user.username,
            assignedClass: newName
          }));
        }
      }
      if (systemState?.events) {
        const affectedEvents = systemState.events.filter((e: any) => e.targetClass === oldName);
        for (const e of affectedEvents) {
          updatePromises.push(onUpdateState("events", "update", {
            id: e.id,
            targetClass: newName
          }));
        }
      }
      if (systemState?.lmsLessons) {
        const affectedLessons = systemState.lmsLessons.filter((l: any) => l.targetClass === oldName);
        for (const l of affectedLessons) {
          updatePromises.push(onUpdateState("lmsLessons", "update", {
            id: l.id,
            targetClass: newName
          }));
        }
      }
      if (systemState?.lmsQuizzes) {
        const affectedQuizzes = systemState.lmsQuizzes.filter((q: any) => q.targetClass === oldName);
        for (const q of affectedQuizzes) {
          updatePromises.push(onUpdateState("lmsQuizzes", "update", {
            id: q.id,
            targetClass: newName
          }));
        }
      }
      if (systemState?.registeredStudents) {
        const affectedRegStudents = systemState.registeredStudents.filter((s: any) => s.class === oldName);
        for (const rs of affectedRegStudents) {
          updatePromises.push(onUpdateState("registeredStudents", "update", {
            id: rs.id,
            class: newName
          }));
        }
      }
      
      await Promise.all(updatePromises);
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find target");
}
