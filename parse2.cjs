const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('test_snippet.tsx', 'utf8');
const fixedCode = code.replace(/\{$/, '');

let sourceFile = ts.createSourceFile('test_snippet.tsx', fixedCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function visit(node) {
    if (node.kind === ts.SyntaxKind.JsxExpression) {
        // Check if there are any parsing errors
    }
    ts.forEachChild(node, visit);
}
visit(sourceFile);

const diagnostics = sourceFile.parseDiagnostics;
if (diagnostics.length > 0) {
    diagnostics.forEach(d => {
        let { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, d.start);
        console.log(`Error at ${line + 1}:${character + 1}: ${d.messageText}`);
    });
} else {
    console.log("No syntax errors found by TS parser");
}
