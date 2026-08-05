const fs = require('fs');
let mobile = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf8');

// The user previously mentioned it was still cut off, let's bump the height up a tiny bit for mobile
// min-h-[190px] -> aspect-[4/3] sm:aspect-[16/9] min-h-[240px]
mobile = mobile.replace(
  `className="relative overflow-hidden rounded-2xl bg-slate-950 text-white min-h-[190px] border border-slate-200/20 shadow-md flex flex-col justify-between transition-all duration-500"`,
  `className="relative overflow-hidden rounded-2xl bg-slate-950 text-white min-h-[260px] aspect-[4/3] sm:aspect-auto border border-slate-200/20 shadow-md flex flex-col justify-between transition-all duration-500"`
);

// We'll also set the background to center 5% to try to hit the top portion precisely 
mobile = mobile.replace(
  `className="absolute inset-0 bg-cover bg-[center_10%] bg-no-repeat transition-all duration-700 transform scale-102"`,
  `className="absolute inset-0 bg-cover bg-[center_15%] bg-no-repeat transition-all duration-700 transform scale-102"`
);
fs.writeFileSync('src/components/MobileDashboardView.tsx', mobile);

let front = fs.readFileSync('src/components/FrontendView.tsx', 'utf8');
front = front.replace(
  `className="absolute inset-0 bg-cover bg-[center_10%] bg-no-repeat"`,
  `className="absolute inset-0 bg-cover bg-[center_15%] bg-no-repeat"`
);
fs.writeFileSync('src/components/FrontendView.tsx', front);

