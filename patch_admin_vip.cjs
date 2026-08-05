const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

code = code.replace(
  'const className = `Kelas Alumni ${cls.level || cls.title || "VIP"}`;',
  'const className = `Kelas Alumni ${cls.title || "VIP"}`;'
);

fs.writeFileSync('src/components/AdminView.tsx', code);
