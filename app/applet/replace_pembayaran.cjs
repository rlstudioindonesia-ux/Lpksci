const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/AdminView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startPattern = 'activeSegment === "pembayaran" && currentUser?.role !== "Admin Biasa" &&';
const startIndex = content.indexOf(startPattern);

if (startIndex === -1) {
  console.error("Start pattern not found");
  process.exit(1);
}

const nextSegmentPattern = '/* 4. INVENTARIS */';
const nextSegmentIndex = content.indexOf(nextSegmentPattern);

if (nextSegmentIndex === -1) {
  console.error("Next segment pattern not found");
  process.exit(1);
}

const endPattern = '})()}';
let endIndex = content.lastIndexOf(endPattern, nextSegmentIndex);

if (endIndex === -1 || endIndex < startIndex) {
  console.error("Matching end pattern not found");
  process.exit(1);
}

endIndex += endPattern.length;

const before = content.slice(0, startIndex);
const after = content.slice(endIndex);

const newReplacement = `activeSegment === "pembayaran" && currentUser?.role !== "Admin Biasa" && (
          <PembayaranSiswaView
            currentUser={currentUser}
            systemState={systemState}
            onUpdateState={onUpdateState}
            onOpenLogin={() => {}}
          />
        )`;

const updatedContent = before + newReplacement + after;
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log("Successfully replaced the legacy pembayaran segment!");
