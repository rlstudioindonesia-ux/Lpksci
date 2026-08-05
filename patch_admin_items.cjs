const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf-8');

const targetReturn = `  return (
    <div className="flex flex-row gap-3 sm:gap-6 py-4 sm:py-6 relative items-start">`;

const replacementReturn = `  const filteredSiswaItems = siswaTab === "baru"
    ? [...(systemState.registeredStudents || [])]
        .filter((s) => s.status !== "Disetujui" && filterByMonthYear(s.date) && isStudentRoleOnly(s))
        .sort(sortStudentsByDateDesc)
    : systemState.activeStudents
        ?.filter((s) => filterByMonthYear(s.date) && isStudentRoleOnly(s))
        ?.filter((s) => {
          const isAlumni = ["Lulus", "Di Jepang"].includes(s.status);
          if (siswaTab === "alumni") return isAlumni;
          if (isAlumni) return false;
          
          if (siswaTab === "aktif" && filterClass !== "All") {
            if (filterClass === "Belum Diplot") return !s.class;
            return s.class === filterClass;
          }
          return true;
        }) || [];

  const siswaItemsPerPage = 10;
  const siswaTotalPages = Math.max(1, Math.ceil(filteredSiswaItems.length / siswaItemsPerPage));
  const paginatedSiswaItems = filteredSiswaItems.slice((siswaPage - 1) * siswaItemsPerPage, siswaPage * siswaItemsPerPage);

  return (
    <div className="flex flex-row gap-3 sm:gap-6 py-4 sm:py-6 relative items-start">`;

code = code.replace(targetReturn, replacementReturn);
fs.writeFileSync('src/components/AdminView.tsx', code);
