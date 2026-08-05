const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const userIndex = state\.users\.findIndex\(u => \s*\n\s*\(u\.studentId && u\.studentId === id\) \|\| \s*\n\s*\(\!\["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"\]\.includes\(u\.role\) && u\.name === oldStudent\.name\)\s*\n\s*\);/,
  `const userIndex = state.users.findIndex(u => 
                (u.studentId === id) || 
                (!u.studentId && !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && u.name === oldStudent.name)
              );`
);

fs.writeFileSync(file, content);
