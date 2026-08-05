const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    if (dataType === "attendance" && action === "add") {
      const newAtt = {
        id: \`ATT-\${Date.now().toString().slice(-4)}\`,
        studentId: payload.studentId,
        studentName: payload.studentName,
        date: payload.date || new Date().toISOString().split("T")[0],
        status: payload.status,
        subject: payload.subject,
        notes: payload.notes || ""
      };
      state.attendance.unshift(newAtt);`;

const replacement = `    if (dataType === "attendance" && action === "add") {
      const newAtt = {
        id: \`ATT-\${Date.now().toString().slice(-4)}\`,
        studentId: payload.studentId,
        studentName: payload.studentName,
        date: payload.date || new Date().toISOString().split("T")[0],
        status: payload.status,
        subject: payload.subject,
        notes: payload.notes || ""
      };
      state.attendance.unshift(newAtt);
      
      // Update student's attendanceScore dynamically
      if (payload.studentId) {
        const student = state.activeStudents.find(s => s.id === payload.studentId);
        if (student) {
          const stRecords = state.attendance.filter(a => a.studentId === payload.studentId);
          const presentCount = stRecords.filter(a => a.status === "Hadir").length;
          const totalRecords = stRecords.length;
          student.attendanceScore = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
          
          // Also sync to firestore if using firebase
          if (typeof syncEntityToFirestore !== "undefined") {
            syncEntityToFirestore("activeStudents", student.id, student);
          }
        }
      }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts successfully");
} else {
  console.log("Could not find target in server.ts");
}
