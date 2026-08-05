const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf-8');
  let originalCode = code;
  
  code = code.replace(/bg-\[#001533\]/g, 'bg-indigo-950');
  code = code.replace(/bg-\[#001735\]/g, 'bg-indigo-950');
  code = code.replace(/bg-\[#00204a\]/g, 'bg-indigo-900');
  code = code.replace(/bg-\[#002b5c\]/g, 'bg-indigo-800');
  code = code.replace(/bg-\[#003566\]/g, 'bg-indigo-700');
  code = code.replace(/bg-\[#0c4a9e\]/g, 'bg-blue-600');
  
  code = code.replace(/text-\[#001533\]/g, 'text-indigo-950');
  code = code.replace(/text-\[#001735\]/g, 'text-indigo-950');
  code = code.replace(/text-\[#00204a\]/g, 'text-indigo-900');
  code = code.replace(/text-\[#002b5c\]/g, 'text-indigo-800');
  code = code.replace(/text-\[#003566\]/g, 'text-indigo-700');
  
  code = code.replace(/border-\[#001533\]/g, 'border-indigo-950');
  code = code.replace(/border-\[#001735\]/g, 'border-indigo-950');
  code = code.replace(/border-\[#00204a\]/g, 'border-indigo-900');
  code = code.replace(/border-\[#002b5c\]/g, 'border-indigo-800');
  code = code.replace(/border-\[#003566\]/g, 'border-indigo-700');
  
  code = code.replace(/ring-\[#001533\]/g, 'ring-indigo-950');
  code = code.replace(/ring-\[#001735\]/g, 'ring-indigo-950');
  code = code.replace(/ring-\[#00204a\]/g, 'ring-indigo-900');
  code = code.replace(/ring-\[#002b5c\]/g, 'ring-indigo-800');
  code = code.replace(/ring-\[#003566\]/g, 'ring-indigo-700');
  
  code = code.replace(/from-\[#001533\]/g, 'from-indigo-950');
  code = code.replace(/from-\[#001735\]/g, 'from-indigo-950');
  code = code.replace(/from-\[#00204a\]/g, 'from-indigo-900');
  code = code.replace(/from-\[#002b5c\]/g, 'from-indigo-800');
  code = code.replace(/from-\[#003566\]/g, 'from-indigo-700');
  
  code = code.replace(/to-\[#001533\]/g, 'to-indigo-950');
  code = code.replace(/to-\[#001735\]/g, 'to-indigo-950');
  code = code.replace(/to-\[#00204a\]/g, 'to-indigo-900');
  code = code.replace(/to-\[#002b5c\]/g, 'to-indigo-800');
  code = code.replace(/to-\[#003566\]/g, 'to-indigo-700');
  
  code = code.replace(/via-\[#001533\]/g, 'via-indigo-950');
  code = code.replace(/via-\[#001735\]/g, 'via-indigo-950');
  code = code.replace(/via-\[#00204a\]/g, 'via-indigo-900');
  code = code.replace(/via-\[#002b5c\]/g, 'via-indigo-800');
  code = code.replace(/via-\[#003566\]/g, 'via-indigo-700');
  
  // also replace any fill-
  code = code.replace(/fill-\[#003566\]/g, 'fill-indigo-700');
  
  if (code !== originalCode) {
    fs.writeFileSync(filePath, code);
    console.log('Updated', filePath);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

traverseDir('src');
