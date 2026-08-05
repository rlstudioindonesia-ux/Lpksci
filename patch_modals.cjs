const fs = require('fs');
let code = fs.readFileSync('src/components/PembayaranSiswaView.tsx', 'utf-8');

code = code.replace(
  /<div className="fixed inset-0 bg-slate-900\/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">/g,
  '<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">'
);

code = code.replace(
  /<div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-left animate-fade-in">/g,
  '<div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col text-left animate-fade-in my-auto">'
);

code = code.replace(
  /<div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-left animate-fade-in max-h-\[90vh\]">/g,
  '<div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col text-left animate-fade-in my-auto">'
);

code = code.replace(
  /<div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-left animate-fade-in my-auto">/g,
  '<div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col text-left animate-fade-in my-auto">'
);

code = code.replace(
  /<div className="p-5 border-b bg-indigo-50 flex justify-between items-center">/g,
  '<div className="p-5 border-b bg-indigo-50 flex justify-between items-center shrink-0">'
);

code = code.replace(
  /<form onSubmit=\{handleAddCustomPayment\} className="p-5 space-y-4">/g,
  '<form onSubmit={handleAddCustomPayment} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">'
);

code = code.replace(
  /<form onSubmit=\{handleEditPaymentSubmit\} className="p-5 space-y-4 overflow-y-auto flex-1">/g,
  '<form onSubmit={handleEditPaymentSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">'
);

code = code.replace(
  /<div className="p-5 border-b bg-\[\#003566\] text-white flex justify-between items-center">/g,
  '<div className="p-5 border-b bg-[#003566] text-white flex justify-between items-center shrink-0">'
);

code = code.replace(
  /<div className="p-5 space-y-4 overflow-y-auto max-h-\[80vh\]">/g,
  '<div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">'
);

code = code.replace(
  /className="max-h-56 object-contain w-full"/g,
  'referrerPolicy="no-referrer"\n                      className="max-h-56 object-contain w-full"'
);

fs.writeFileSync('src/components/PembayaranSiswaView.tsx', code);
console.log("Updated!");
