const fs = require('fs');
const file = 'src/components/LmsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const targetStateAnswers = `const [studentQuizAnswers, setStudentQuizAnswers] = React.useState<Record<string, number>>({});
  const [studentQuizEssayAnswers, setStudentQuizEssayAnswers] = React.useState<Record<string, string>>({});
  const [submittedQuizIds, setSubmittedQuizIds] = React.useState<string[]>([]);`;

const replaceStateAnswers = `const [studentQuizAnswers, _setStudentQuizAnswers] = React.useState<Record<string, number>>({});
  const [studentQuizEssayAnswers, _setStudentQuizEssayAnswers] = React.useState<Record<string, string>>({});
  const [submittedQuizIds, _setSubmittedQuizIds] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    try {
      const p1 = localStorage.getItem('cbtAnswers');
      if (p1) _setStudentQuizAnswers(JSON.parse(p1));
      const p2 = localStorage.getItem('cbtEssayAnswers');
      if (p2) _setStudentQuizEssayAnswers(JSON.parse(p2));
      const p3 = localStorage.getItem('cbtSubmittedIds');
      if (p3) _setSubmittedQuizIds(JSON.parse(p3));
    } catch(e){}
  }, []);

  const setStudentQuizAnswers = (val: any) => {
    const updated = typeof val === 'function' ? val(studentQuizAnswers) : val;
    _setStudentQuizAnswers(updated);
    localStorage.setItem('cbtAnswers', JSON.stringify(updated));
  };
  
  const setStudentQuizEssayAnswers = (val: any) => {
    const updated = typeof val === 'function' ? val(studentQuizEssayAnswers) : val;
    _setStudentQuizEssayAnswers(updated);
    localStorage.setItem('cbtEssayAnswers', JSON.stringify(updated));
  };
  
  const setSubmittedQuizIds = (val: any) => {
    const updated = typeof val === 'function' ? val(submittedQuizIds) : val;
    _setSubmittedQuizIds(updated);
    localStorage.setItem('cbtSubmittedIds', JSON.stringify(updated));
  };`;

if (code.includes(targetStateAnswers)) {
  code = code.replace(targetStateAnswers, replaceStateAnswers);
  fs.writeFileSync(file, code);
  console.log("Patched answers state persistence");
} else {
  console.log("Answers state not found");
}

