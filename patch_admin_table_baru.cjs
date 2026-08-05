const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf-8');

const target = `                    <tbody className="divide-y divide-slate-100">
                      {(systemState.registeredStudents || [])
                        .filter((s) => s.status !== "Disetujui" && filterByMonthYear(s.date) && isStudentRoleOnly(s))
                        .sort(sortStudentsByDateDesc)
                        .map((student) => (`;

const replacement = `                    <tbody className="divide-y divide-slate-100">
                      {paginatedSiswaItems
                        .map((student) => (`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/AdminView.tsx', code);
