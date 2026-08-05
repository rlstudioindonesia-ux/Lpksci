const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf-8');

code = code.replace(
  /{ id: "pembayaran", name: "Kas & Bayar", ic: DollarSign },/g,
  `{ id: "pembayaran", name: "Presensi & Personalia", ic: DollarSign },`
);

code = code.replace(
  /{ id: "pembayaran", name: "Kas & Bayar", ic: DollarSign, color: "rose", restricted: true },/g,
  `{ id: "pembayaran", name: "Presensi & Personalia", ic: DollarSign, color: "rose", restricted: true },`
);

fs.writeFileSync('src/components/AdminView.tsx', code);
