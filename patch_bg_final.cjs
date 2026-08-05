const fs = require('fs');
let mobile = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf8');

// Use top again for mobile to completely guarantee the top is not cut off
// Actually bg-top is a valid tailwind class, but let's try explicitly bg-[center_10%] since we tried center_top
mobile = mobile.replace(
  `className="absolute inset-0 bg-cover bg-[center_top] bg-no-repeat transition-all duration-700 transform scale-102"`,
  `className="absolute inset-0 bg-cover bg-top bg-no-repeat transition-all duration-700 transform scale-102"`
);
fs.writeFileSync('src/components/MobileDashboardView.tsx', mobile);

let front = fs.readFileSync('src/components/FrontendView.tsx', 'utf8');
front = front.replace(
  `className="absolute inset-0 bg-cover bg-[center_top] bg-no-repeat"`,
  `className="absolute inset-0 bg-cover bg-top bg-no-repeat"`
);
fs.writeFileSync('src/components/FrontendView.tsx', front);

