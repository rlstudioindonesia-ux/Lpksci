const fs = require('fs');

let code = fs.readFileSync('/tmp/AdminKelasSegment.tsx.bak', 'utf8');

// The error was that we added `{activeTab === "tambah" && (` followed by `{/* Form Tambah Kelas */}` and a `div`.
// And then `)}` at the end of the div.
// Let's replace the EXACT injected lines from the previous session.

code = code.replace('{activeTab === "tambah" && (\\n                {/* Form Tambah Kelas */}', '{activeTab === "tambah" && (\\n                <div className="tab-pane">\\n                {/* Form Tambah Kelas */}');
// Wait, the previous session injected it like this:
// `                {activeTab === "tambah" && (`
// `                {/* Form Tambah Kelas */}`

code = code.replace('{activeTab === "tambah" && (\\n                {/* Form Tambah Kelas */}', '<div className="tab-pane">\\n{/* Form Tambah Kelas */}'); 
// wait, regular expressions are easier.

