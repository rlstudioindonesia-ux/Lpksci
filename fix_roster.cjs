const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

const target1 = `{false && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs space-y-3">`;
const replace1 = `{true && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs space-y-3">`;

code = code.replace(target1, replace1);

const target2 = `<div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1.5" id="lms-teacher-student-roster">`;
const replace2 = `<div className="flex overflow-x-auto gap-2 pt-1.5 pb-2 scrollbar-thin scrollbar-thumb-slate-200" id="lms-teacher-student-roster">`;

code = code.replace(target2, replace2);

const target3 = `                        className={\`p-2.5 rounded-xl border text-left transition relative cursor-pointer \${
                          isSelected`;
const replace3 = `                        className={\`shrink-0 w-44 sm:w-56 p-3 rounded-xl border text-left transition relative cursor-pointer \${
                          isSelected`;

code = code.replace(target3, replace3);

const target4 = `                        <p className={\`font-bold text-[11px] truncate \${isSelected ? isAlumni ? "text-emerald-900 font-black" : "text-blue-900 font-black" : "text-slate-800"}\`}>
                          {student.name}
                        </p>`;
const replace4 = `                        <p className={\`font-black text-xs uppercase tracking-wide truncate \${isSelected ? isAlumni ? "text-emerald-900" : "text-blue-900" : "text-slate-800"}\`}>
                          {student.name}
                        </p>`;

code = code.replace(target4, replace4);

fs.writeFileSync('src/components/LmsView.tsx', code);
