const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');
code = code.replace('Star,, LayoutDashboard, Wallet}', 'Star, LayoutDashboard, Wallet}');
fs.writeFileSync('src/components/AdminView.tsx', code);
