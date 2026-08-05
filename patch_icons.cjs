const fs = require('fs');
let code = fs.readFileSync('src/components/mobile/MobileBottomNav.tsx', 'utf8');

// Remove fill from inline styles for Lucide icons
code = code.replace(
  /fill: isActive \? "url\(#activeIconGradient\)" : `url\(#grad-\$\{idx % 5\}\)`/g,
  'fill: "none"'
);

// Better icons imports
code = code.replace(
  'import {',
  'import {\n  FileSpreadsheet,\n  Wallet,\n  Calculator,\n  Paintbrush,\n  Award,\n  Image as LucideImage,\n  Map,\n  Network,\n  UserCog,\n  Activity,\n  Library,\n  PieChart,\n  FileBadge,'
);

// Replace icons in menus
// Data CV: BookOpen -> FileSpreadsheet
code = code.replace('{ id: "admin_dataCV", name: "Data CV", icon: BookOpen, access: true }', '{ id: "admin_dataCV", name: "Data CV", icon: FileSpreadsheet, access: true }');
// Job Order: Landmark -> Briefcase
code = code.replace('{ id: "admin_joborders", name: "Job Order", icon: Landmark, access: true }', '{ id: "admin_joborders", name: "Job Order", icon: Briefcase, access: true }');
// Pajak & Keu: FileText -> Calculator
code = code.replace('{ id: "admin_pajak", name: "Pajak & Keu", icon: FileText, access: currentUser?.role !== "Admin Biasa" }', '{ id: "admin_pajak", name: "Pajak & Keu", icon: Calculator, access: currentUser?.role !== "Admin Biasa" }');
// Buku Kas & Gaji: Receipt -> Wallet
code = code.replace('{ id: "admin_gaji", name: "Buku Kas & Gaji", icon: Receipt, access: currentUser?.role !== "Admin Biasa" }', '{ id: "admin_gaji", name: "Buku Kas & Gaji", icon: Wallet, access: currentUser?.role !== "Admin Biasa" }');
// Branding: Sliders -> Paintbrush
code = code.replace('{ id: "admin_kustomisasi", name: "Branding", icon: Sliders, access: true }', '{ id: "admin_kustomisasi", name: "Branding", icon: Paintbrush, access: true }');
// Kelas Alumni VIP: Star -> Award
code = code.replace('{ id: "admin_alumnivip", name: "Kelas Alumni VIP", icon: Star, access: true }', '{ id: "admin_alumnivip", name: "Kelas Alumni VIP", icon: Award, access: true }');
// Galeri Foto: ImageIcon -> LucideImage
code = code.replace('{ id: "admin_galeri", name: "Galeri Foto", icon: ImageIcon, access: true }', '{ id: "admin_galeri", name: "Galeri Foto", icon: LucideImage, access: true }');
// Peta Alumni: MapPin -> Map
code = code.replace('{ id: "admin_petasebaran", name: "Peta Alumni", icon: MapPin, access: true }', '{ id: "admin_petasebaran", name: "Peta Alumni", icon: Map, access: true }');
// Afiliasi: Share2 -> Network
code = code.replace('{ id: "admin_afiliasi", name: "Data Afiliasi", icon: Share2, access: true }', '{ id: "admin_afiliasi", name: "Data Afiliasi", icon: Network, access: true }');
// Manajemen Akun & Sensei: Users -> UserCog
code = code.replace('{ id: "admin_manajemen", name: "Manajemen Akun & Sensei", icon: Users, access: true }', '{ id: "admin_manajemen", name: "Manajemen Akun & Sensei", icon: UserCog, access: true }');

// VVIP
// Keuangan: DollarSign -> Landmark
code = code.replace('{ id: "vvip_gaji", name: "Keuangan", icon: DollarSign }', '{ id: "vvip_gaji", name: "Keuangan", icon: Landmark }');
// Monitor: Users -> Activity
code = code.replace('{ id: "vvip_eval", name: "Monitor", icon: Users }', '{ id: "vvip_eval", name: "Monitor", icon: Activity }');
// E-Benkyou: BookOpen -> Library
code = code.replace('{ id: "vvip_lms", name: "E-Benkyou", icon: BookOpen }', '{ id: "vvip_lms", name: "E-Benkyou", icon: Library }');
// Afiliasi: Share2 -> Network
code = code.replace('{ id: "vvip_afiliasi", name: "Afiliasi", icon: Share2 }', '{ id: "vvip_afiliasi", name: "Afiliasi", icon: Network }');
// Executive: BarChart3 -> PieChart
code = code.replace('{ id: "vvip_exec", name: "Executive", icon: BarChart3 }', '{ id: "vvip_exec", name: "Executive", icon: PieChart }');

// Pendaftaran -> FileBadge
code = code.replace('{ id: "pendaftaran", name: "Daftar", icon: FileText }', '{ id: "pendaftaran", name: "Daftar", icon: FileBadge }');

fs.writeFileSync('src/components/mobile/MobileBottomNav.tsx', code);
