const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf-8');

code = code.replace(
  'import { ArrowLeft, Send, User, Search, Paperclip, File, Image as ImageIcon, Loader2, Users, Clock, Download, Info, AlertTriangle, CheckCircle2, MessageSquare, Trash2 } from "lucide-react";',
  'import { ArrowLeft, Send, User, Search, Paperclip, File, Image as ImageIcon, Loader2, Users, Clock, Download, Info, AlertTriangle, CheckCircle2, MessageSquare, Trash2, Check, CheckCheck } from "lucide-react";'
);

fs.writeFileSync('src/components/ChatView.tsx', code);
