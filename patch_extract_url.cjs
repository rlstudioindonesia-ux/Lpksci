const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

function cleanUrl(val) {
  return `(${val} && ${val}.includes('|') ? ${val}.split('|')[1] : ${val})`;
}

// Line 745
content = content.replace(
  /existingActive\.profilePicture = match\.docFoto \|\| existingActive\.profilePicture;/,
  `existingActive.profilePicture = match.docFoto ? (match.docFoto.includes('|') ? match.docFoto.split('|')[1] : match.docFoto) : existingActive.profilePicture;`
);

// Line 777
content = content.replace(
  /profilePicture: match\.docFoto \|\| "",/,
  `profilePicture: match.docFoto ? (match.docFoto.includes('|') ? match.docFoto.split('|')[1] : match.docFoto) : "",`
);

// Line 806
content = content.replace(
  /existingUser\.profilePicture = match\.docFoto \|\| existingUser\.profilePicture \|\| "";/,
  `existingUser.profilePicture = match.docFoto ? (match.docFoto.includes('|') ? match.docFoto.split('|')[1] : match.docFoto) : (existingUser.profilePicture || "");`
);

// Line 820
content = content.replace(
  /profilePicture: match\.docFoto \|\| ""/,
  `profilePicture: match.docFoto ? (match.docFoto.includes('|') ? match.docFoto.split('|')[1] : match.docFoto) : ""`
);

// Line 900
content = content.replace(
  /state\.activeStudents\[actIndex\]\.profilePicture = student\.docFoto;/,
  `state.activeStudents[actIndex].profilePicture = student.docFoto.includes('|') ? student.docFoto.split('|')[1] : student.docFoto;`
);

// Line 912
content = content.replace(
  /state\.users\[userIndex\]\.profilePicture = student\.docFoto;/,
  `state.users[userIndex].profilePicture = student.docFoto.includes('|') ? student.docFoto.split('|')[1] : student.docFoto;`
);

// Line 1768
content = content.replace(
  /state\.activeStudents\[index\]\.profilePicture = payload\.docFoto;/,
  `state.activeStudents[index].profilePicture = payload.docFoto.includes('|') ? payload.docFoto.split('|')[1] : payload.docFoto;`
);

// Line 1769
content = content.replace(
  /payload\.profilePicture = payload\.docFoto; \/\/ to trigger user sync below/,
  `payload.profilePicture = state.activeStudents[index].profilePicture; // to trigger user sync below`
);

// Line 375 & 401
content = content.replace(
  /profilePicture: docFoto \|\| ""/g,
  `profilePicture: docFoto ? (docFoto.includes('|') ? docFoto.split('|')[1] : docFoto) : ""`
);

fs.writeFileSync(file, content);
