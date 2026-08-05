const fs = require('fs');
let mobile = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf8');

mobile = mobile.replace(
  `className="absolute inset-0 bg-cover bg-[center_25%] bg-no-repeat transition-all duration-700 transform scale-102"`,
  `className="absolute inset-0 bg-cover bg-[center_20%] bg-no-repeat transition-all duration-700 transform scale-102"`
);
fs.writeFileSync('src/components/MobileDashboardView.tsx', mobile);

let front = fs.readFileSync('src/components/FrontendView.tsx', 'utf8');
front = front.replace(
  `className="absolute inset-0 bg-cover bg-[center_25%] bg-no-repeat"`,
  `className="absolute inset-0 bg-cover bg-[center_20%] bg-no-repeat"`
);
fs.writeFileSync('src/components/FrontendView.tsx', front);

