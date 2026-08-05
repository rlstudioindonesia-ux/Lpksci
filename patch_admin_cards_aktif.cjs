const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf-8');

const target = `                ) : (
                  <div className="space-y-3 animate-fade-in">
                    {systemState.activeStudents
                      ?.filter((s) => filterByMonthYear(s.date) && isStudentRoleOnly(s))
                      ?.filter((s) => {
                        const isAlumni = ["Lulus", "Di Jepang"].includes(s.status);
                        if (siswaTab === "alumni") return isAlumni;
                        if (isAlumni) return false;
                        
                        // apply class filter for active students
                        if (siswaTab === "aktif" && filterClass !== "All") {
                          if (filterClass === "Belum Diplot") {
                            return !s.class;
                          }
                          return s.class === filterClass;
                        }
                        return true;
                      })
                      ?.map((s) => (`;

const replacement = `                ) : (
                  <div className="space-y-3 animate-fade-in">
                    {paginatedSiswaItems
                      ?.map((s) => (`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/AdminView.tsx', code);
