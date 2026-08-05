const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

code = code.replace(
  `            ...(isSiswaOrAlumni ? [{
              id: "bab",
              name: \`Materi & \${currentClassMaxBab} Bab\`,
              desc: "Kurikulum Terstruktur",
              ic: GraduationCap,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              actColor: "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15"
            }] : []),`,
  `            {
              id: "bab",
              name: \`Materi & \${currentClassMaxBab} Bab\`,
              desc: "Kurikulum Terstruktur",
              ic: GraduationCap,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              actColor: "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15"
            },`
);

fs.writeFileSync('src/components/LmsView.tsx', code);
