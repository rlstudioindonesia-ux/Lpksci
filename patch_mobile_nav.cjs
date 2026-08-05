const fs = require('fs');
let code = fs.readFileSync('src/components/mobile/MobileBottomNav.tsx', 'utf-8');

const target = `        { id: "pembayaran", name: "Pembayaran", icon: CreditCard }`;

const replacement = `        { id: "pembayaran", name: (currentUser?.role === "Pengajar" || currentUser?.role?.startsWith("Admin") || currentUser?.role === "VVIP") ? "Presensi & Personalia" : "Pembayaran", icon: CreditCard }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/mobile/MobileBottomNav.tsx', code);
