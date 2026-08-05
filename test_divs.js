const fs = require('fs');
const code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const alumnivipStart = code.indexOf('activeSegment === "alumnivip"');
const kustomisasiStart = code.indexOf('activeSegment === "kustomisasi"');

const snippet = code.substring(alumnivipStart, kustomisasiStart);
console.log("divs opened:", (snippet.match(/<div/g) || []).length);
console.log("divs closed:", (snippet.match(/<\/div>/g) || []).length);
