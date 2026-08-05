const fs = require('fs');
const file = 'src/components/TeacherDashboardPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookStr = `
  React.useEffect(() => {
    if (currentUser) {
      setTeacherBankName(currentUser.bankAccount?.split(' - ')[0] || "");
      setTeacherBankNum(currentUser.bankAccount?.split(' - ')[1] || "");
      setSelectedClassFilter(currentUser.assignedClass || "Semua");
    }
  }, [currentUser]);
`;

content = content.replace(
  '  const [selectedClassFilter, setSelectedClassFilter] = useState(currentUser.assignedClass || "Semua");',
  '  const [selectedClassFilter, setSelectedClassFilter] = useState(currentUser.assignedClass || "Semua");\n' + hookStr
);

fs.writeFileSync(file, content);
