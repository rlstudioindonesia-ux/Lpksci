const fs = require('fs');
const code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');
const lines = code.split('\n');
let start = -1, end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('activeSegment === "kustomisasi" && (')) {
    start = i;
    break;
  }
}
if (start !== -1) {
  let braceCount = 1;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('(')) braceCount += (line.match(/\(/g) || []).length;
    if (line.includes(')')) braceCount -= (line.match(/\)/g) || []).length;
    if (braceCount === 0) { end = i; break; }
  }
}
console.log(start, end);
