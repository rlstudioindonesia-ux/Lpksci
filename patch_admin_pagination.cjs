const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf-8');

// 1. Add state
code = code.replace(
  /const \[siswaTab, setSiswaTab\] = useState<"aktif" \| "baru" \| "alumni" \| "rekap" \| "sensei">("aktif");/,
  `const [siswaTab, setSiswaTab] = useState<"aktif" | "baru" | "alumni" | "rekap" | "sensei">("aktif");
  const [siswaPage, setSiswaPage] = useState(1);`
);

// 2. Reset page on tab click
code = code.replace(
  /onClick=\{\(\) => setSiswaTab\("aktif"\)\}/,
  `onClick={() => { setSiswaTab("aktif"); setSiswaPage(1); }}`
);
code = code.replace(
  /onClick=\{\(\) => setSiswaTab\("baru"\)\}/,
  `onClick={() => { setSiswaTab("baru"); setSiswaPage(1); }}`
);
code = code.replace(
  /onClick=\{\(\) => setSiswaTab\("alumni"\)\}/,
  `onClick={() => { setSiswaTab("alumni"); setSiswaPage(1); }}`
);
code = code.replace(
  /onClick=\{\(\) => setSiswaTab\("rekap"\)\}/,
  `onClick={() => { setSiswaTab("rekap"); setSiswaPage(1); }}`
);

fs.writeFileSync('src/components/AdminView.tsx', code);
