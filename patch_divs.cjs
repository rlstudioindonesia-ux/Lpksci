const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const alumnivipStart = code.indexOf('activeSegment === "alumnivip"');
const kustomisasiStart = code.indexOf('activeSegment === "kustomisasi"');

let snippet = code.substring(alumnivipStart, kustomisasiStart);
const opens = (snippet.match(/<div/g) || []).length;
const closes = (snippet.match(/<\/div>/g) || []).length;
console.log("opens:", opens, "closes:", closes);

if (opens > closes) {
    const diff = opens - closes;
    console.log("Missing", diff, "divs");
    
    // Append the missing divs right before the end of the block
    const replacement = '</ConfirmForm>\n' + Array(diff).fill('              </div>').join('\n') + '\n            </div>\n          </div>\n        )}\n';
    
    code = code.substring(0, alumnivipStart) + snippet.replace(/<\/ConfirmForm>[\s\S]*?}\)/, replacement) + code.substring(kustomisasiStart);
    fs.writeFileSync('src/components/AdminView.tsx', code);
} else if (opens < closes) {
    console.log("Too many divs!");
}
