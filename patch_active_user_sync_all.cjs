const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix 1781 (update)
content = content.replace(
  /const userIndex = state\.users\.findIndex\(u => \s*\n\s*\(u\.studentId === id\) \|\| \s*\n\s*\(\!u\.studentId && \!\["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"\]\.includes\(u\.role\) && u\.name === oldStudent\.name\)\s*\n\s*\);/,
  `const userIndex = state.users.findIndex(u => 
                !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && (
                  (u.studentId === id) || 
                  (u.name === oldStudent.name)
                )
              );`
);

// Fix 1864 (update_status sync back user role)
content = content.replace(
  /const userIndex = state\.users\.findIndex\(u => \(u\.studentId && u\.studentId === id\) \|\| \(\!\["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"\]\.includes\(u\.role\) && u\.name === state\.activeStudents\[index\]\.name\)\);/,
  `const userIndex = state.users.findIndex(u => !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && ((u.studentId && u.studentId === id) || u.name === state.activeStudents[index].name));`
);

// Fix 1652 (syncActiveStudentToAlumniUser)
content = content.replace(
  /const userIndex = state\.users\.findIndex\(u => \(u\.studentId && u\.studentId === studentId\) \|\| \(\!protectedRoles\.includes\(u\.role\) && u\.name === studentName\)\);/,
  `const userIndex = state.users.findIndex(u => !protectedRoles.includes(u.role) && ((u.studentId && u.studentId === studentId) || u.name === studentName));`
);

// Fix 2616 (system startup sync)
content = content.replace(
  /const userIndex = state\.users\.findIndex\(u => u\.studentId === student\.id \|\| u\.name === student\.name\);/,
  `const userIndex = state.users.findIndex(u => !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && (u.studentId === student.id || u.name === student.name));`
);

fs.writeFileSync(file, content);
