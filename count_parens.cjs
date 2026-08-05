const fs = require('fs');
const code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const alumnivipStart = code.indexOf('activeSegment === "alumnivip"');
const kustomisasiStart = code.indexOf('activeSegment === "kustomisasi"');

const snippet = code.substring(alumnivipStart, kustomisasiStart);
let open = 0;
let lines = snippet.split('\n');
for (let i = 0; i < lines.length; i++) {
    for (let c of lines[i]) {
        if (c === '(') open++;
        if (c === ')') open--;
    }
    if (open !== 0) console.log("line", i, "open=", open);
}
console.log("final open parens:", open);
