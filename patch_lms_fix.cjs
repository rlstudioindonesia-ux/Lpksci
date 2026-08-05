const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Fix duplicate X import
code = code.replace(', Bell, X } from "lucide-react";', ', Bell } from "lucide-react";');

// Inject the state and hooks
const notifHookCode = `
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [notifiedLessonIds, setNotifiedLessonIds] = React.useState<Set<string>>(new Set());
  
  React.useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  React.useEffect(() => {
    if (!lmsLessons || !currentUser || currentUser.role !== "Siswa") return;
    const activeAssignments = lmsLessons.filter(l => 
      l.difficulty === "Tugas" && 
      (l.targetClass === "Semua" || l.targetClass === currentUser.classId) &&
      (!l.deadline || new Date(l.deadline).getTime() > Date.now())
    );
    activeAssignments.forEach(assignment => {
      if (!notifiedLessonIds.has(assignment.id)) {
        const msg = "Tugas Baru: " + assignment.title;
        setToastMessage(msg);
        if ("Notification" in window && Notification.permission === "granted") {
           try { new Notification(msg, { body: "Silakan cek LMS E-Benkyou.", icon: "/logo.png" }); } catch(e) {}
        }
        // @ts-ignore
        if (window.Android && typeof window.Android.showNotification === 'function') {
           // @ts-ignore
           window.Android.showNotification(msg, "Silakan cek LMS E-Benkyou.");
        }
        // @ts-ignore
        if (window.JSBridge && typeof window.JSBridge.showNotification === 'function') {
           // @ts-ignore
           window.JSBridge.showNotification(msg, "Silakan cek LMS E-Benkyou.");
        }
        setNotifiedLessonIds(prev => new Set(prev).add(assignment.id));
      }
    });
  }, [lmsLessons, currentUser, notifiedLessonIds]);
`;

const insertTarget = `const [activeTab, setActiveTab] = React.useState<"dashboard" | "materi" | "tugas" | "progress" | "laporan">("dashboard");`;
if (!code.includes('notifiedLessonIds')) {
  code = code.replace(insertTarget, insertTarget + '\\n' + notifHookCode);
}

fs.writeFileSync(file, code);
console.log('Fixed');
