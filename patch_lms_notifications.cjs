const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const notifHookCode = `
  // Effect to request notification permission and notify about new assignments
  React.useEffect(() => {
    // Request permission if not granted
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Effect to watch for assignments and notify
  const [notifiedLessonIds, setNotifiedLessonIds] = React.useState<Set<string>>(new Set());
  
  React.useEffect(() => {
    if (!lmsLessons || !currentUser || currentUser.role !== "Siswa") return;
    
    // Find active assignments for this student
    const activeAssignments = lmsLessons.filter(l => 
      l.difficulty === "Tugas" && 
      (l.targetClass === "Semua" || l.targetClass === currentUser.classId) &&
      (!l.deadline || new Date(l.deadline).getTime() > Date.now())
    );
    
    activeAssignments.forEach(assignment => {
      if (!notifiedLessonIds.has(assignment.id)) {
        // Trigger notification
        if ("Notification" in window && Notification.permission === "granted") {
           try {
             new Notification("Tugas Baru: " + assignment.title, {
               body: "Tugas baru telah ditambahkan. Silakan cek LMS E-Benkyou.",
               icon: "/logo.png"
             });
           } catch(e) {
             console.error("Notif error", e);
           }
        }
        
        // Also try Android interface if it exists
        // @ts-ignore
        if (window.Android && typeof window.Android.showNotification === 'function') {
           // @ts-ignore
           window.Android.showNotification("Tugas Baru: " + assignment.title, "Silakan cek LMS E-Benkyou.");
        }
        
        setNotifiedLessonIds(prev => new Set(prev).add(assignment.id));
      }
    });
    
  }, [lmsLessons, currentUser, notifiedLessonIds]);
`;

// Insert the hooks inside LmsView function
const insertTarget = `const [selectedChapter, setSelectedChapter] = React.useState<any>(null);`;
if (!code.includes('notifiedLessonIds')) {
  code = code.replace(insertTarget, insertTarget + '\n' + notifHookCode);
  fs.writeFileSync(file, code);
  console.log('Patched notifications');
} else {
  console.log('Already patched');
}
