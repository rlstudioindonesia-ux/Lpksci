const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

const target = `// Send an update for the user
          await onUpdateState("users", "edit", {
            id: user.id || user.username,
            assignedClass: newName
          });`;

const replacement = `// Send an update for the user
          await onUpdateState("users", "edit", {
            username: user.username,
            assignedClass: newName
          });`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find target");
}
