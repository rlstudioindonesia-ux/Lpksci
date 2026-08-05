const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

// 1. Add Play icon to imports if not there
if (!code.includes('Play,')) {
    code = code.replace(/import \{([^}]+)\} from "lucide-react";/, (match, p1) => {
        return `import { Play, ${p1.trim()} } from "lucide-react";`;
    });
}

// 2. Fix activeQuizChapterId type
code = code.replace(/const \[activeQuizChapterId, setActiveQuizChapterId\] = React\.useState<string \| null>\(null\);/, 
                    'const [activeQuizChapterId, setActiveQuizChapterId] = React.useState<number | null>(null);');

// 3. Fix the quiz modal logic
const oldModalLogic = `    if (activeQuizChapterId) {
    const chapter = currentClassData?.chapters?.find(c => c.id === activeQuizChapterId);
    if (!chapter) {
      setActiveQuizChapterId(null);
      return null;
    }
    const filteredQuizzes = (currentClassData?.quizzes || []).filter(q => q.chapterId === chapter.id);
    const cbtStarted = !!cbtStartTimes[\`kuis_ch_\${chapter.id}\`];`;

const newModalLogic = `    if (activeQuizChapterId !== null) {
    const targetClassForQuiz = activeStudentClass || currentUser?.assignedClass || "";
    const activeChaptersListForQuiz = getClassChaptersList(targetClassForQuiz, assessmentSubject, true);
    const chapter = activeChaptersListForQuiz.find(c => c.number === activeQuizChapterId);
    if (!chapter) {
      setActiveQuizChapterId(null);
      return null;
    }
    const lmsQuizzes = systemState?.lmsQuizzes || [];
    const filteredQuizzes = lmsQuizzes.filter((q: any) => String(q.chapterId) === String(chapter.number) || Number(q.chapterId) === chapter.number);
    const cbtStarted = !!cbtStartTimes[\`kuis_ch_\${chapter.number}\`];`;

code = code.replace(oldModalLogic, newModalLogic);

// 4. Update the handleStartCbt and other chapter.id references inside the quiz modal
// But there might be other chapter.id references inside the modal.
// Wait, in the modal, they were referring to chapter.id for the `cbtStarted` and `handleStartCbt`
code = code.replace(/handleStartCbt\(\`kuis_ch_\$\{chapter\.id\}\`\)/g, "handleStartCbt(`kuis_ch_${chapter.number}`)");
code = code.replace(/cbtStartTimes\[\`kuis_ch_\$\{chapter\.id\}\`\]/g, "cbtStartTimes[`kuis_ch_${chapter.number}`]");

// 5. Update the setActiveQuizChapterId calls in the main LmsView
code = code.replace(/setActiveQuizChapterId\(chapter\.id\)/g, 'setActiveQuizChapterId(chapter.number)');


fs.writeFileSync('src/components/LmsView.tsx', code);
