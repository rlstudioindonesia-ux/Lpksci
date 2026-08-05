const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix add
content = content.replace(
  /state\.cashLedger\.push\(newLedger\);\s*\n\s*return res\.json\(\{ success: true, item: newLedger \}\);/,
  `state.cashLedger.push(newLedger);\n      syncEntityToFirestore("cashLedger", newLedger.id, newLedger);\n      return res.json({ success: true, item: newLedger });`
);

// Fix edit
content = content.replace(
  /outAmount: Number\(outAmount\) \|\| 0\s*\n\s*};\s*\n\s*return res\.json\(\{ success: true \}\);/,
  `outAmount: Number(outAmount) || 0\n        };\n        syncEntityToFirestore("cashLedger", id, state.cashLedger[idx]);\n        return res.json({ success: true });`
);

fs.writeFileSync(file, content);
