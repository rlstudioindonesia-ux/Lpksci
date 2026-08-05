const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '        studentId: assignedStudentId,\n        assignedClass: ""\n      };\n      state.users.push(newUserObj);',
  '        studentId: assignedStudentId,\n        assignedClass: "",\n        profilePicture: docFoto || ""\n      };\n      state.users.push(newUserObj);'
);

fs.writeFileSync(file, content);
