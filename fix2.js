const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');
code = code.replace('Star,\n, LayoutDashboard', 'Star,\n  LayoutDashboard');
fs.writeFileSync('src/components/AdminView.tsx', code);
