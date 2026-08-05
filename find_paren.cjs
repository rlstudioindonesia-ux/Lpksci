const fs = require('fs');
const code = fs.readFileSync('test_snippet.tsx', 'utf8');
let stack = [];
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines[i].length; j++) {
        const c = lines[i][j];
        if (c === '(') stack.push({line: i + 1, col: j + 1});
        if (c === ')') {
            if (stack.length > 0) stack.pop();
            else console.log(`Unmatched ) at ${i + 1}:${j + 1}`);
        }
    }
}
stack.forEach(s => console.log(`Unmatched ( at ${s.line}:${s.col}`));
