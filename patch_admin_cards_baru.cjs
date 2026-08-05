const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf-8');

const target = `                  <div className="space-y-4 animate-fade-in">
                    {[...(systemState.registeredStudents || [])]
                      ?.filter((s) => s.status !== "Disetujui" && filterByMonthYear(s.date) && isStudentRoleOnly(s))
                      ?.sort(sortStudentsByDateDesc)
                      ?.map((student) => (`;

const replacement = `                  <div className="space-y-4 animate-fade-in">
                    {paginatedSiswaItems
                      ?.map((student) => (`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/AdminView.tsx', code);
