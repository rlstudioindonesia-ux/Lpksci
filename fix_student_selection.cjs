const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

const target1 = `  React.useEffect(() => {
    if (currentUser?.role !== "Siswa" && currentUser?.role !== "Alumni") {
      if (filteredActiveStudents.length > 0) {
        if (!hasInitializedDefaultStudent.current) {
          setSelectedStudentId(filteredActiveStudents[0].id);
          hasInitializedDefaultStudent.current = true;
        } else {
          if (selectedStudentId) {
            const stillExists = filteredActiveStudents.some(s => s.id === selectedStudentId);
            if (!stillExists) {
              setSelectedStudentId(filteredActiveStudents[0].id);
            }
          }
        }
      } else {
        setSelectedStudentId("");
      }
    }
  }, [filteredActiveStudents, selectedStudentId, currentUser]);`;

const replace1 = `  React.useEffect(() => {
    if (filteredActiveStudents.length > 0) {
      if (!hasInitializedDefaultStudent.current) {
        if (currentUser?.role === "Siswa" || currentUser?.role === "Alumni") {
          setSelectedStudentId(currentUser.studentId || filteredActiveStudents[0].id);
        } else {
          setSelectedStudentId(filteredActiveStudents[0].id);
        }
        hasInitializedDefaultStudent.current = true;
      } else {
        if (selectedStudentId) {
          const stillExists = filteredActiveStudents.some(s => s.id === selectedStudentId);
          if (!stillExists) {
            if (currentUser?.role === "Siswa" || currentUser?.role === "Alumni") {
              const myId = currentUser.studentId || "";
              if (filteredActiveStudents.some(s => s.id === myId)) {
                setSelectedStudentId(myId);
              } else {
                setSelectedStudentId(filteredActiveStudents[0].id);
              }
            } else {
              setSelectedStudentId(filteredActiveStudents[0].id);
            }
          }
        }
      }
    } else {
      setSelectedStudentId("");
    }
  }, [filteredActiveStudents, selectedStudentId, currentUser]);`;

code = code.replace(target1, replace1);

// Now replace all the overrides
code = code.replace(/const studentIdToView = currentUser\?\.role === "Siswa" \? \(currentUser\.studentId \|\| "SIS-001"\) : selectedStudentId;/g, 'const studentIdToView = selectedStudentId || (currentUser?.studentId || "SIS-001");');
code = code.replace(/const viewStudentId = isSiswaOrAlumni \? \(currentUser\?\.studentId \|\| "SIS-001"\) : selectedStudentId;/g, 'const viewStudentId = selectedStudentId || (currentUser?.studentId || "SIS-001");');

fs.writeFileSync('src/components/LmsView.tsx', code);
console.log("Fixes applied");
