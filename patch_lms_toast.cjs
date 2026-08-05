const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const toastCode = `
const ToastNotification = ({ message, onClose }: { message: string, onClose: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
      <div className="bg-white/20 p-1.5 rounded-lg">
        <Bell className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-xs">Pemberitahuan Baru</span>
        <span className="text-[10px] opacity-90">{message}</span>
      </div>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-md transition">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
`;

if (!code.includes('ToastNotification')) {
  code = code.replace(/export default function LmsView/, toastCode + '\nexport default function LmsView');
}

const toastStateCode = `
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
`;

const insertTarget = `const [notifiedLessonIds, setNotifiedLessonIds] = React.useState<Set<string>>(new Set());`;
if (!code.includes('toastMessage')) {
  code = code.replace(insertTarget, insertTarget + '\n' + toastStateCode);
}

// Modify notification triggering
const notifTriggerOriginal = `        // Trigger notification
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
        }`;

const notifTriggerNew = `        // Trigger notification
        const msg = "Tugas Baru: " + assignment.title;
        setToastMessage(msg);
        
        if ("Notification" in window && Notification.permission === "granted") {
           try {
             new Notification(msg, {
               body: "Silakan cek LMS E-Benkyou.",
               icon: "/logo.png"
             });
           } catch(e) {
             console.error("Notif error", e);
           }
        }
        
        // Android interfaces
        // @ts-ignore
        if (window.Android && typeof window.Android.showNotification === 'function') {
           // @ts-ignore
           window.Android.showNotification(msg, "Silakan cek LMS E-Benkyou.");
        }
        // @ts-ignore
        if (window.JSBridge && typeof window.JSBridge.showNotification === 'function') {
           // @ts-ignore
           window.JSBridge.showNotification(msg, "Silakan cek LMS E-Benkyou.");
        }`;

code = code.replace(notifTriggerOriginal, notifTriggerNew);

const renderTarget = `return (
    <div className="space-y-6 py-6">`;
    
const renderNew = `return (
    <div className="space-y-6 py-6 relative">
      {toastMessage && (
        <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      )}`;

if (!code.includes('<ToastNotification')) {
  code = code.replace(renderTarget, renderNew);
}

fs.writeFileSync(file, code);
console.log('Patched toast');
