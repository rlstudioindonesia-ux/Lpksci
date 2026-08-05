const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

const targetSection = `{studentsInClass.map((student) => (`

const replacementSection = `{filteredActiveStudents.map((student) => (`

if (code.includes(targetSection)) {
  code = code.replace(targetSection, replacementSection);
} else {
  console.log("Could not find section target 1");
}

const targetSection2 = `{studentsInClass.length === 0 && (`

const replacementSection2 = `{filteredActiveStudents.length === 0 && (`

if (code.includes(targetSection2)) {
  code = code.replace(targetSection2, replacementSection2);
} else {
  console.log("Could not find section target 2");
}

fs.writeFileSync('src/components/LmsView.tsx', code);
console.log("Patched section 2 successfully");
