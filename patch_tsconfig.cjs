const fs = require('fs');
const file = 'tsconfig.json';
let code = JSON.parse(fs.readFileSync(file, 'utf-8'));
code.compilerOptions.resolveJsonModule = true;
code.compilerOptions.esModuleInterop = true;
fs.writeFileSync(file, JSON.stringify(code, null, 2));
