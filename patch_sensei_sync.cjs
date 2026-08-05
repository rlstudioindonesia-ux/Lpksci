const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Proactive Sensei class alignment: Sync Sensei's assignedClass to the class of the students they are assigned to\s*let senseiAlignmentCount = 0;\s*if \(state\.users && state\.activeStudents\) \{[\s\S]*?\}\s*\}/;

content = content.replace(regex, `// Proactive Sensei class alignment removed as per user request to prevent manual plotting overrides\n        let senseiAlignmentCount = 0;`);

fs.writeFileSync(file, content);
