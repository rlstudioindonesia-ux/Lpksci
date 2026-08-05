const fs = require('fs');
let code = fs.readFileSync('/tmp/AdminKelasSegment.tsx.bak', 'utf8');

const listStartStr = '                  <div className="overflow-x-auto">\n                    <table';
const listEndStr = '                    </table>\n                  </div>';

const startIndex = code.indexOf(listStartStr);
const endIndex = code.indexOf(listEndStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find list", startIndex, endIndex);
} else {
  console.log("Found boundaries!");
}
