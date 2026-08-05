const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// Salaries add
content = content.replace(
  /state\.salaries\.unshift\(newSalary\);\s*\n\s*return res\.json\(\{ success: true, item: newSalary \}\);/,
  `state.salaries.unshift(newSalary);\n      syncEntityToFirestore("salaries", newSalary.id, newSalary);\n      return res.json({ success: true, item: newSalary });`
);

// Salaries status
content = content.replace(
  /state\.salaries\[index\]\.status = payload\.status;\s*\n\s*return res\.json\(\{ success: true, updated: state\.salaries\[index\] \}\);/,
  `state.salaries[index].status = payload.status;\n        syncEntityToFirestore("salaries", salId, state.salaries[index]);\n        return res.json({ success: true, updated: state.salaries[index] });`
);

// Salaries edit (ADD IT)
const salariesEditCode = `
    if (dataType === "salaries" && action === "edit") {
      const idx = state.salaries.findIndex((s: any) => s.id === payload.id);
      if (idx !== -1) {
        state.salaries[idx] = { ...state.salaries[idx], ...payload };
        syncEntityToFirestore("salaries", payload.id, state.salaries[idx]);
        return res.json({ success: true, updated: state.salaries[idx] });
      }
      return res.status(404).json({ error: "Not found" });
    }
`;
if (!content.includes('action === "edit"' && 'dataType === "salaries"')) {
  content = content.replace(
    /if \(dataType === "salaries" && action === "delete"\) \{/,
    `${salariesEditCode}\n    if (dataType === "salaries" && action === "delete") {`
  );
}


fs.writeFileSync(file, content);
