const fs = require('fs');
const code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const alumnivipStart = code.indexOf('activeSegment === "alumnivip"');
const kustomisasiStart = code.indexOf('activeSegment === "kustomisasi"');

const snippet = code.substring(alumnivipStart, kustomisasiStart);
let openTags = [];
let idx = 0;
while (idx < snippet.length) {
    let tagStart = snippet.indexOf('<', idx);
    if (tagStart === -1) break;
    let tagEnd = snippet.indexOf('>', tagStart);
    if (tagEnd === -1) break;
    
    let tag = snippet.substring(tagStart + 1, tagEnd).split(' ')[0];
    if (tag.startsWith('/')) {
        let name = tag.substring(1).trim();
        if (openTags.length > 0 && openTags[openTags.length - 1] === name) {
            openTags.pop();
        } else {
            console.log("Mismatched closing tag:", name, "at", tagStart);
        }
    } else if (snippet[tagEnd - 1] !== '/' && tag !== 'input' && tag !== 'img' && tag !== 'br' && tag !== 'hr') {
        openTags.push(tag.trim());
    }
    idx = tagEnd + 1;
}
console.log("Unclosed tags:", openTags);
