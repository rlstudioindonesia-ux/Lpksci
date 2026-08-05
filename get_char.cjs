const fs = require('fs');
const code = fs.readFileSync('test_snippet.tsx', 'utf8');

// Find the line number of index 3699
let line = 1;
let col = 1;
for (let i = 0; i < 3699; i++) {
    if (code[i] === '\n') {
        line++;
        col = 1;
    } else {
        col++;
    }
}
console.log(`Index 3699 is at line ${line}, col ${col}`);

const lines = code.split('\n');
for (let i = Math.max(0, line - 5); i < Math.min(lines.length, line + 5); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
