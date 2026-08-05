const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const countdownCode = `
const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = React.useState("");
  React.useEffect(() => {
    if (!deadline) return;
    const updateTime = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("Waktu Habis");
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        let timeStr = "";
        if (d > 0) timeStr += \`\${d}h \`;
        timeStr += \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
        setTimeLeft(timeStr);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  if (!deadline) return null;
  return <span className="font-mono">{timeLeft || "Menghitung..."}</span>;
};
`;

// Insert after imports and before LmsView component
if (!code.includes('CountdownTimer')) {
  code = code.replace(/export default function LmsView/, countdownCode + '\nexport default function LmsView');
}

// Update the deadline display in Tugas and Quiz
const targetDeadlineLesson = `{lesson.deadline && (
                                                <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 animate-pulse">
                                                  ⏳ Batas: {new Date(lesson.deadline).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                                                </span>
                                              )}`;

const replaceDeadlineLesson = `{lesson.deadline && (
                                                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1.5 animate-pulse shadow-sm">
                                                  ⏳ Sisa Waktu: <CountdownTimer deadline={lesson.deadline} />
                                                </span>
                                              )}`;

code = code.replace(targetDeadlineLesson, replaceDeadlineLesson);

const targetDeadlineQuiz = `{quiz.deadline && (
                                                  <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                                    ⏳ Batas: {new Date(quiz.deadline).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                                                  </span>
                                                )}`;

const replaceDeadlineQuiz = `{quiz.deadline && (
                                                  <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-150 px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse shadow-sm">
                                                    ⏳ Sisa Waktu: <CountdownTimer deadline={quiz.deadline} />
                                                  </span>
                                                )}`;

code = code.replace(targetDeadlineQuiz, replaceDeadlineQuiz);

fs.writeFileSync(file, code);
console.log('Patched countdown');
