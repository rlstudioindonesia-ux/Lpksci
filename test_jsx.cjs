const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const alumnivipStart = code.indexOf('activeSegment === "alumnivip"');
const kustomisasiStart = code.indexOf('activeSegment === "kustomisasi"');

const snippet = "import React from 'react';\n" + 
    "export default function Test() {\n" + 
    "return (\n" + 
    "<>{" +
    code.substring(alumnivipStart, kustomisasiStart) + 
    "}</>\n);\n}";
fs.writeFileSync('test_snippet.tsx', snippet);
