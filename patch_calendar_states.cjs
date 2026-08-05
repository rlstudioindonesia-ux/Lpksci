const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarView.tsx', 'utf8');

const states = `
  const [errorMsg, setErrorMsg] = useState("");
  const [inboxPage, setInboxPage] = useState(1);
  const [showPastInbox, setShowPastInbox] = useState(false);
`;

code = code.replace(
  '  const [errorMsg, setErrorMsg] = useState("");',
  states
);

fs.writeFileSync('src/components/CalendarView.tsx', code);
