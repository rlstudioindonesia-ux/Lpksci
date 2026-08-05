const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');
const parser = acorn.Parser.extend(jsx());

const code = fs.readFileSync('test_snippet.tsx', 'utf8');
// remove the trailing { from the snippet
const fixedCode = code.replace(/\{$/, '');

try {
    parser.parse(fixedCode, { ecmaVersion: 2020, sourceType: 'module' });
    console.log("No syntax error in snippet");
} catch (e) {
    console.log("Syntax error:", e.message, "at line", e.loc.line, "col", e.loc.column);
    const lines = fixedCode.split('\n');
    console.log("Context:");
    for (let i = Math.max(0, e.loc.line - 3); i < Math.min(lines.length, e.loc.line + 3); i++) {
        console.log(i + 1, lines[i]);
    }
}
