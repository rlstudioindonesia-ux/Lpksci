const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf-8');

code = code.replace(
  'import { ArrowLeft, Send, User,',
  'import { ArrowLeft, Send, SendHorizontal, User,'
);

code = code.replace(
  '<Send className="h-4 w-4 ml-0.5" />',
  '<SendHorizontal className="h-4 w-4 ml-0.5" />'
);

fs.writeFileSync('src/components/ChatView.tsx', code);
