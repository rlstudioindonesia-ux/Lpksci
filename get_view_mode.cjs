const fs = require('fs');
let code = fs.readFileSync('src/components/AccountSettingsView.tsx', 'utf-8');

const startIdx = code.indexOf('/* Mode View */');
const endIdx = code.indexOf('{/* Form Tambah Account Baru */}');
fs.writeFileSync('view_mode_snippet.txt', code.substring(startIdx, endIdx));
