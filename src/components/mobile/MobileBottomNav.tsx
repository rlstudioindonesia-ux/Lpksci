import React from "react";
import {
  FileSpreadsheet,
  Wallet,
  Calculator,
  Paintbrush,
  Award,
  Image as LucideImage,
  Map,
  Network,
  UserCog,
  Activity,
  PieChart,
  FileBadge,
  DollarSign,
  Users,
  Share2,
  FileText,
  Receipt,
  Package,
  Briefcase,
  Sliders,
  MapPin,
  BookOpen,
  GraduationCap,
  Calendar,
  BarChart3,
  Building,
  ImageIcon,
  MessageCircle,
  TrendingUp,
  UserPlus,
  Settings,
  User,
  Compass,
  CreditCard,
  Home,
  Info,
  ShieldCheck,
  MessagesSquare,
  Landmark,
  Star,
  Camera,
  Bell,
  FolderOpen
} from "lucide-react";

interface MobileBottomNavProps {
  activeSubpage: string | null;
  activeWorkspace: "main" | "admin" | "vvip";
  currentUser: any;
  isUserSiswa: boolean;
  isUserAlumni: boolean;
  setActiveSubpage: (page: string | null) => void;
  setActiveWorkspace?: (workspace: "main" | "admin" | "vvip") => void;
}

export default function MobileBottomNav({
  activeSubpage,
  activeWorkspace,
  currentUser,
  isUserSiswa,
  isUserAlumni,
  setActiveSubpage,
  setActiveWorkspace,
}: MobileBottomNavProps) {
  if (!activeSubpage && activeWorkspace !== "main") return null;
  const isAdmin = activeWorkspace === "admin";
  const isVvip = activeWorkspace === "vvip";
  const isAccount = activeSubpage?.startsWith("akun") || activeSubpage === "vvip_akun";

  let topMenus: any[] = [];
  let mainMenus: any[] = [];

  if (isAdmin) {
    mainMenus = [
      { id: "home", name: "Beranda", icon: Home, access: true },
      { id: "admin_siswa", name: "Administrasi Siswa", icon: Users, access: true },
      { id: "admin_kelas", name: "Manajemen Kelas", icon: GraduationCap, access: true },
      { id: "admin_kalender", name: "Jadwal LPK", icon: Calendar, access: true },
      { id: "admin_dataCV", name: "Data CV", icon: FileSpreadsheet, access: true },
      { id: "admin_joborders", name: "Job Order", icon: Briefcase, access: true },
      { id: "admin_pembayaran", name: "Kas & Bayar", icon: DollarSign, access: currentUser?.role !== "Admin Biasa" },
      { id: "admin_inventaris", name: "Inventaris", icon: Package, access: true },
      { id: "admin_pajak", name: "Pajak & Keu", icon: Calculator, access: currentUser?.role !== "Admin Biasa" },
      { id: "admin_gaji", name: "Buku Kas & Gaji", icon: Wallet, access: currentUser?.role !== "Admin Biasa" },
      { id: "admin_kustomisasi", name: "Branding", icon: Paintbrush, access: true },
      { id: "admin_alumnivip", name: "Manajemen Kelas Alumni", icon: Award, access: true },
      { id: "admin_galeri", name: "Galeri Foto", icon: LucideImage, access: true },
      { id: "admin_petasebaran", name: "Peta Alumni", icon: Map, access: true },
      { id: "admin_afiliasi", name: "Data Afiliasi", icon: Network, access: true },
      { id: "admin_informasi", name: "Informasi", icon: Bell, access: true },
      { id: "admin_manajemen", name: "Manajemen Akun & Sensei", icon: UserCog, access: true },
    ].filter(m => m.access);
  } else if (isVvip) {
    mainMenus = [
      { id: "home", name: "Beranda", icon: Home },
      { id: "vvip_security", name: "Keamanan", icon: ShieldCheck },
      { id: "vvip_gaji", name: "Keuangan", icon: Landmark },
      { id: "vvip_eval", name: "Monitor", icon: Activity },
      { id: "vvip_kalender", name: "Jadwal", icon: Calendar },
      { id: "vvip_afiliasi", name: "Afiliasi", icon: Network },
      { id: "vvip_exec", name: "Executive", icon: PieChart },
    ];
  } else {
    mainMenus = [
      { id: "profil", name: "Profil LPK", icon: Building },
      { id: "pendaftaran", name: "Daftar", icon: FileBadge },
      { id: "chat", name: "Chat", icon: MessagesSquare },
    ];

    if (isUserAlumni) {
      mainMenus.unshift({ id: "alumni_dashboard", name: "Dashboard Alumni", icon: GraduationCap });
    }

    if (currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") {
      mainMenus.push(
        { id: "perkembangan", name: "Data Progress", icon: TrendingUp }
      );
    }

    if (currentUser?.role !== "Alumni") {
      mainMenus.push(
        { id: "ebenkyou", name: "E-Benkyou", icon: BookOpen },
        { id: "pembayaran", name: currentUser?.role === "VVIP" ? "Pembayaran Siswa" : (currentUser?.role === "Pengajar" || currentUser?.role?.startsWith("Admin")) ? "HR & Personalia" : "Pembayaran", icon: CreditCard }
      );
    }

    if (currentUser && currentUser.role !== "Admin" && currentUser.role !== "VVIP" && currentUser.role !== "Admin Super" && currentUser.role !== "Admin Biasa") {
      mainMenus.push({ id: "17berkas", name: "17 Berkas", icon: FolderOpen });
    }

    if (currentUser) {
      mainMenus.push({ id: "kalender", name: "Jadwal LPK", icon: Calendar });
    }

    mainMenus.push(
      { id: "peta", name: "Peta", icon: Compass },
      { id: "galeri", name: "Galeri", icon: ImageIcon }
    );

    if (isUserAlumni || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") {
      mainMenus.push({ id: "pilih_kelas", name: "Pilih Kelas", icon: UserPlus });
    }

    if (isUserAlumni) {
      mainMenus.push({ id: "informasi", name: "Informasi", icon: Info });
    }

    if (isUserSiswa || isUserAlumni || currentUser?.role === "Siswa" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") {
      mainMenus.push({ id: "afiliasi", name: "Afiliasi", icon: Share2 });
    }

    if (currentUser && (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa" || currentUser.role === "VVIP")) {
      mainMenus.push({ id: "admin_panel", name: "Admin Panel", icon: Settings });
    }

    if (currentUser && currentUser.role === "VVIP") {
      mainMenus.push({ id: "vvip_panel", name: "VVIP Panel", icon: ShieldCheck });
    }

    if (currentUser) {
      mainMenus.push({ id: "akun", name: "Akun & Sensei", icon: Settings });
    }

    if (isAccount && currentUser) {
      topMenus = [{ id: "akun", name: "Profil Saya", icon: User }];
    }

  }


  return (
    <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200 z-40 pb-safe font-sans overflow-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
      
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="activeIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#4f46e5" offset="0%" />
            <stop stopColor="#9333ea" offset="100%" />
          </linearGradient>
          <linearGradient id="grad-0" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#0ea5e9" offset="0%" />
            <stop stopColor="#2563eb" offset="100%" />
          </linearGradient>
          <linearGradient id="grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#f43f5e" offset="0%" />
            <stop stopColor="#e11d48" offset="100%" />
          </linearGradient>
          <linearGradient id="grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#10b981" offset="0%" />
            <stop stopColor="#059669" offset="100%" />
          </linearGradient>
          <linearGradient id="grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#f59e0b" offset="0%" />
            <stop stopColor="#d97706" offset="100%" />
          </linearGradient>
          <linearGradient id="grad-4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#8b5cf6" offset="0%" />
            <stop stopColor="#6d28d9" offset="100%" />
          </linearGradient>
        </defs>
      </svg>


      {/* Top Row: Contextual Secondary Menus */}
      {topMenus.length > 0 && (
        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-1.5 px-3 py-1.5 min-w-max mx-auto justify-start">
            {topMenus.map((menu, idx) => {
              const Icon = menu.icon;
              const isActive = activeSubpage === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveSubpage(menu.id)}
                  className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200/50"
                      : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                  }`}
                  id={`mobile-top-tab-${menu.id}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "stroke-[2.5]" : "stroke-2 group-hover:text-indigo-600"}`} />
                  <span className={`text-[10px] whitespace-nowrap ${isActive ? "font-black" : "font-bold group-hover:text-indigo-600"}`}>{menu.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Row: Main Menus */}
      <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-2 pb-2">
        <div className="flex items-center gap-1.5 px-2 min-w-max mx-auto justify-start">
          {mainMenus.map((menu, idx) => {
            const Icon = menu.icon;
            let isActive = activeSubpage === menu.id;
            
            if (menu.id === "home" && !activeSubpage) {
              isActive = true;
            }
            if (
              menu.id === "akun" &&
              (activeSubpage?.startsWith("akun") || activeSubpage === "vvip_akun")
            ) {
              isActive = true;
            }

            const theme = [
              { activeBg: "from-sky-500 to-blue-600 shadow-blue-300/50", activeText: "text-blue-700", activeDot: "bg-blue-600", activeContainer: "bg-blue-50/60", inactiveIcon: "text-blue-500", inactiveText: "text-blue-600", inactiveBg: "bg-blue-50", hoverIcon: "group-hover:text-blue-600", hoverBg: "group-hover:bg-blue-100" },
              { activeBg: "from-rose-500 to-rose-600 shadow-rose-300/50", activeText: "text-rose-700", activeDot: "bg-rose-600", activeContainer: "bg-rose-50/60", inactiveIcon: "text-rose-500", inactiveText: "text-rose-600", inactiveBg: "bg-rose-50", hoverIcon: "group-hover:text-rose-600", hoverBg: "group-hover:bg-rose-100" },
              { activeBg: "from-emerald-500 to-emerald-600 shadow-emerald-300/50", activeText: "text-emerald-700", activeDot: "bg-emerald-600", activeContainer: "bg-emerald-50/60", inactiveIcon: "text-emerald-500", inactiveText: "text-emerald-600", inactiveBg: "bg-emerald-50", hoverIcon: "group-hover:text-emerald-600", hoverBg: "group-hover:bg-emerald-100" },
              { activeBg: "from-amber-400 to-amber-500 shadow-amber-300/50", activeText: "text-amber-700", activeDot: "bg-amber-500", activeContainer: "bg-amber-50/60", inactiveIcon: "text-amber-500", inactiveText: "text-amber-600", inactiveBg: "bg-amber-50", hoverIcon: "group-hover:text-amber-600", hoverBg: "group-hover:bg-amber-100" },
              { activeBg: "from-violet-500 to-violet-600 shadow-violet-300/50", activeText: "text-violet-700", activeDot: "bg-violet-600", activeContainer: "bg-violet-50/60", inactiveIcon: "text-violet-500", inactiveText: "text-violet-600", inactiveBg: "bg-violet-50", hoverIcon: "group-hover:text-violet-600", hoverBg: "group-hover:bg-violet-100" },
            ][idx % 5];

            return (
              <button
                key={menu.id}
                onClick={() => {
                  if (menu.id === "home") {
                    if (setActiveWorkspace) setActiveWorkspace("main");
                    setActiveSubpage(null);
                  } else if (menu.id === "admin_panel") {
                    if (setActiveWorkspace) setActiveWorkspace("admin");
                    setActiveSubpage("admin_siswa");
                  } else if (menu.id === "vvip_panel") {
                    if (setActiveWorkspace) setActiveWorkspace("vvip");
                    setActiveSubpage("vvip_exec");
                  } else {
                    setActiveSubpage(menu.id);
                  }
                }}
                className={`group relative flex flex-col items-center justify-center min-w-[64px] gap-1 p-1.5 rounded-2xl transition-all duration-300 cursor-pointer ${
                  isActive
                    ? theme.activeContainer
                    : "hover:bg-slate-50"
                }`}
                id={`mobile-bottom-tab-${menu.id}`}
              >
                <div className={`relative flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? `w-[38px] h-[38px] rounded-full bg-gradient-to-tr ${theme.activeBg} shadow-md -translate-y-0.5` 
                    : `w-[34px] h-[34px] rounded-full ${theme.inactiveBg} ${theme.hoverBg}`
                }`}>
                  <Icon className={`transition-all duration-300 ${isActive ? "h-5 w-5 text-white stroke-[2.5]" : `h-[18px] w-[18px] ${theme.inactiveIcon} stroke-2 ${theme.hoverIcon}`}`} />
                </div>
                
                <span className={`text-[9px] tracking-tight whitespace-nowrap transition-all duration-300 ${isActive ? `${theme.activeText} font-black` : `${theme.inactiveText} font-bold opacity-80 ${theme.hoverIcon} group-hover:opacity-100`}`}>
                  {menu.name}
                </span>
                
                {isActive && (
                  <div className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${theme.activeDot}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

