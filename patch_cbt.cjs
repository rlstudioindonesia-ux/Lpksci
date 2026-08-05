const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const hookCode = `
  const [cbtStartTimes, setCbtStartTimes] = React.useState<Record<string, number>>({});
  
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('cbtStartTimes');
      if (stored) setCbtStartTimes(JSON.parse(stored));
    } catch(e){}
  }, []);

  const handleStartCbt = (id: string) => {
    const newTs = { ...cbtStartTimes, [id]: Date.now() };
    setCbtStartTimes(newTs);
    localStorage.setItem('cbtStartTimes', JSON.stringify(newTs));
  };
`;

const insertHook = `const [notifiedLessonIds, setNotifiedLessonIds] = React.useState<Set<string>>(new Set());`;
if (!code.includes('cbtStartTimes')) {
  code = code.replace(insertHook, insertHook + '\n' + hookCode);
}

const cbtComponentCode = `
const CBTTimer = ({ startTime, durationMinutes, onExpire }: { startTime: number, durationMinutes: number, onExpire: () => void }) => {
  const [timeLeft, setTimeLeft] = React.useState("");
  
  React.useEffect(() => {
    let expired = false;
    const updateTime = () => {
      if (expired) return;
      const now = Date.now();
      const end = startTime + durationMinutes * 60 * 1000;
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Waktu Habis");
        expired = true;
        onExpire();
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        let timeStr = "";
        if (h > 0) timeStr += \`\${h.toString().padStart(2, '0')}:\`;
        timeStr += \`\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
        setTimeLeft(timeStr);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onExpire]);
  
  return (
    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 font-mono font-bold text-sm shadow-sm animate-pulse">
      ⏳ Sisa Waktu CBT: {timeLeft || "Menghitung..."}
    </div>
  );
};
`;

if (!code.includes('CBTTimer')) {
  code = code.replace(/export default function LmsView/, cbtComponentCode + '\nexport default function LmsView');
}

fs.writeFileSync(file, code);
console.log('Hooks added');
