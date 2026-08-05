const fs = require('fs');
let mobile = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf8');

// The ultimate fix for "faces getting cut off" is sometimes to change bg-cover to bg-contain 
// or keep bg-cover but ensure the image isn't overly stretched.
// Let's explicitly try removing the transition scaling which might be zooming into the image and cutting it off.
mobile = mobile.replace(
  `className="absolute inset-0 bg-cover bg-[center_20%] bg-no-repeat transition-all duration-700 transform scale-102"`,
  `className="absolute inset-0 bg-cover bg-top bg-no-repeat"`
);
fs.writeFileSync('src/components/MobileDashboardView.tsx', mobile);
