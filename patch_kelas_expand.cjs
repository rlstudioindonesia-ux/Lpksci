const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

if (!code.includes('const [expandedClassIds')) {
  code = code.replace(
    'const [editingClassId, setEditingClassId] = React.useState<string | null>(null);',
    'const [editingClassId, setEditingClassId] = React.useState<string | null>(null);\n  const [expandedClassIds, setExpandedClassIds] = React.useState<string[]>([]);\n  const toggleExpand = (id: string) => setExpandedClassIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);'
  );
}

// We need to replace the content of the class card map functions.
// There are two loops: one for Reguler, one for Alumni.
const replaceCard = (type, colorName) => {
    // We'll search for the `return (` block inside the map.
    // It's a bit complex with regex, let's write a script to just replace the specific sections.
}
