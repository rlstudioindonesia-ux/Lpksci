const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const userIndex = state\.users\.findIndex\(u => \s*\n\s*\!\["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"\]\.includes\(u\.role\) && \(\s*\n\s*\(u\.studentId && u\.studentId === id\) \|\|\s*\n\s*\(u\.name && student\.name && u\.name\.trim\(\)\.toLowerCase\(\) === student\.name\.trim\(\)\.toLowerCase\(\)\) \|\|\s*\n\s*\(u\.email && student\.email && u\.email\.trim\(\)\.toLowerCase\(\) === student\.email\.trim\(\)\.toLowerCase\(\)\) \|\|\s*\n\s*\(u\.username && student\.email && u\.username\.trim\(\)\.toLowerCase\(\) === student\.email\.trim\(\)\.toLowerCase\(\)\)\s*\n\s*\)\s*\n\s*\);/,
  `const userIndex = state.users.findIndex(u => 
            !["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"].includes(u.role) && (
              (u.studentId === id) || 
              (student.email && u.email && u.email.trim().toLowerCase() === student.email.trim().toLowerCase()) ||
              (student.email && u.username && u.username.trim().toLowerCase() === student.email.trim().toLowerCase()) ||
              (!student.email && u.name && student.name && u.name.trim().toLowerCase() === student.name.trim().toLowerCase())
            )
          );`
);

fs.writeFileSync(file, content);
