const fs = require('fs');
let code = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf-8');

// Replace averageScore default from 85 to 0
code = code.replace(/:\s*85;/g, ': 0;');

// Replace rateAtt default from 95 to 0
code = code.replace(/totalAtt > 0\s*\?\s*Math\.round\(\(hadirAtt \/ totalAtt\) \* 100\)\s*:\s*95/g, 'totalAtt > 0\n                        ? Math.round((hadirAtt / totalAtt) * 100)\n                        : 0');
code = code.replace(/totalAtt > 0 \? Math\.round\(\(hadirAtt \/ totalAtt\) \* 100\) : 95/g, 'totalAtt > 0 ? Math.round((hadirAtt / totalAtt) * 100) : 0');

code = code.replace(/mathScore \?\? 80/g, 'mathScore ?? 0');
code = code.replace(/fiveSScore \?\? 88/g, 'fiveSScore ?? 0');
code = code.replace(/ethicsScore \?\? 90/g, 'ethicsScore ?? 0');
code = code.replace(/fiveSScore \?\? 88/g, 'fiveSScore ?? 0');

// specifically for line 1609:
code = code.replace(/\n\s*: 95;/g, '\n                                                  : 0;');

fs.writeFileSync('src/components/MobileDashboardView.tsx', code);
