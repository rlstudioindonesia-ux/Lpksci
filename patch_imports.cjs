const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

code = code.replace(
  '  Star,\n} from "lucide-react";',
  '  Star,\n  LayoutDashboard,\n  Wallet,\n} from "lucide-react";'
);

fs.writeFileSync('src/components/AdminView.tsx', code);
