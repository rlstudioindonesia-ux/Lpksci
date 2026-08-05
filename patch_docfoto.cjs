const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// For activeStudents update
content = content.replace(
  'const oldStudent = state.activeStudents[index];\n            state.activeStudents[index] = { ...state.activeStudents[index], ...payload };',
  `const oldStudent = state.activeStudents[index];
            state.activeStudents[index] = { ...state.activeStudents[index], ...payload };
            if (payload.docFoto && payload.docFoto !== oldStudent.docFoto) {
              state.activeStudents[index].profilePicture = payload.docFoto;
              payload.profilePicture = payload.docFoto; // to trigger user sync below
            }`
);

fs.writeFileSync(file, content);
