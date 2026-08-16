/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  GraduationCap, LogIn, LogOut, ShieldAlert, Award, BookOpen, FolderOpen, Globe, User,
  Anchor, Compass, Sparkles, Heart, Landmark, Settings, Calendar, MessagesSquare, CreditCard, Briefcase, TrendingUp,
  Share2, LayoutGrid, Menu, Smartphone, Download, Apple
} from "lucide-react";
import { UserAccount, SystemState } from "../types";
import { getSafePhotoUrl, createSvgAvatar } from "../lib/storageHelper";
import { isStudentAlumni } from "../lib/alumniStatus";
import { hasStaffOversight } from "../lib/permissions";

// Dynamic Icon Lookup
const getLogoIcon = (iconName: string) => {
  switch (iconName) {
    case "GraduationCap": return GraduationCap;
    case "Award": return Award;
    case "BookOpen": return BookOpen;
    case "Globe": return Globe;
    case "Anchor": return Anchor;
    case "Compass": return Compass;
    case "Sparkles": return Sparkles;
    case "Heart": return Heart;
    case "Landmark": return Landmark;
    default: return GraduationCap;
  }
};

interface NavbarProps {
  currentUser: UserAccount | null;
  systemState?: SystemState;
  onOpenLogin: () => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  customization?: {
    logoText: string;
    logoIcon: string;
    themeColor: string;
    logoUrl?: string;
  };
  isOverlay?: boolean;
  onOpenDownloadModal?: () => void;
}

export default function Navbar({
  currentUser,
  systemState,
  onOpenLogin,
  onLogout,
  activeTab,
  setActiveTab,
  customization,
  isOverlay = false,
  onOpenDownloadModal
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isPortalMenuOpen, setIsPortalMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoText = customization?.logoText || "LPK SCI";
  const logoIconName = customization?.logoIcon || "GraduationCap";
  const LogoIcon = getLogoIcon(logoIconName);
  const themeColor = customization?.themeColor || "blue";
  const logoUrl = customization?.logoUrl || "/logo.png";

  // Role detection variables matched with mobile views
  const me = systemState?.activeStudents?.find(s => s.id === currentUser?.studentId || s.name === currentUser?.name);
  const isAlumni = currentUser?.role === "Alumni" || isStudentAlumni(me);
  const isSiswa = currentUser?.role === "Siswa";
  const isPengajar = currentUser?.role === "Pengajar";
  const isAdmin = currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa";
  const isVvip = currentUser?.role === "VVIP";

  // Dynamic Theme Styling mappings
  const themeGlowStyles = {
    blue: "bg-blue-500 hover:opacity-40",
    indigo: "bg-indigo-500 hover:opacity-40",
    emerald: "bg-emerald-500 hover:opacity-40",
    rose: "bg-rose-500 hover:opacity-40",
    amber: "bg-amber-500 hover:opacity-40",
    slate: "bg-slate-500 hover:opacity-40",
  }[themeColor] || "bg-blue-500 hover:opacity-40";

  const themeIconStyles = {
    blue: "text-blue-400",
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
    slate: "text-slate-400",
  }[themeColor] || "text-blue-400";

  const scrollToSection = (id: string) => {
    // Check if the target is managed by the frontend tabs logic
    if ((window as any).openFrontendTab && ['program', 'biaya', 'map-penyebaran', 'galeri'].includes(id)) {
      (window as any).openFrontendTab(id);
      return;
    }

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      id="app-navbar"
      className={
        isOverlay
          ? `fixed top-0 left-0 right-0 z-40 w-full transition-all duration-500 text-white ${
              scrolled
                ? "bg-slate-950/90 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-2"
                : "bg-gradient-to-b from-slate-950/80 to-transparent border-b border-transparent py-4"
            }`
          : "sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-md shadow-[0_2px_16px_rgba(15,23,42,0.05)] transition-all duration-300 text-slate-900"
      }
    >
      <div className={`mx-auto flex flex-col transition-all duration-300 ${isOverlay ? 'px-4 sm:px-8 max-w-[1400px]' : 'px-3 sm:px-6 lg:px-8 max-w-[1800px]'}`}>
        
        {/* Top bar: Brand & Authentication */}
        <div className={`flex items-center justify-between w-full transition-all duration-300 ${isOverlay && !scrolled ? 'h-20' : 'h-16'}`}>
          
          {/* Logo and Brand - Sleek Modern Craftsmanship */}
          <div 
            onClick={() => setActiveTab("frontend")} 
            className="flex cursor-pointer items-center gap-3 group transition-all"
          >
            <div className="relative">
              <div className={`absolute inset-0 rounded-2xl blur-md opacity-20 transition duration-300 ${themeGlowStyles}`}></div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg transition-transform duration-300 group-hover:scale-105 overflow-hidden">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/logo.png";
                    }}
                    className="h-full w-full object-contain p-1 bg-white rounded-2xl" 
                  />
                ) : (
                  <LogoIcon className={`h-5.5 w-5.5 group-hover:rotate-6 transition-transform duration-300 ${themeIconStyles}`} />
                )}
              </div>
            </div>
            <div>
              <span className={`font-sans text-[13px] sm:text-base font-black tracking-tight leading-none flex items-center gap-1.5 uppercase ${isOverlay ? 'text-white' : 'text-slate-900'}`}>
                {logoText}
              </span>
              <span className={`text-[8px] sm:text-[9px] font-sans font-bold tracking-wide block uppercase pt-0.5 ${isOverlay ? 'text-slate-300' : 'text-slate-400'}`}>
                Diklat Karir & Bahasa Jepang Resmi
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs - Beautiful Compact Pills (public marketing nav only) */}
          {activeTab === "frontend" && (
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-2xl flex-nowrap max-w-[50%] lg:max-w-[65%] xl:max-w-none ${isOverlay ? 'bg-transparent border-none' : 'bg-slate-50 border border-slate-200/60'}`}>
              <>
                <button
                  onClick={() => scrollToSection("hero")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition cursor-pointer shrink-0 ${
                    isOverlay
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Beranda
                </button>
                <button
                  onClick={() => scrollToSection("program")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition cursor-pointer shrink-0 ${
                    isOverlay
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Program
                </button>
                <button
                  onClick={() => scrollToSection("join-us")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition cursor-pointer shrink-0 ${
                    isOverlay
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Join With Us
                </button>
                <button
                  onClick={() => scrollToSection("biaya")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition cursor-pointer shrink-0 ${
                    isOverlay
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  SOP Biaya
                </button>
                <button
                  onClick={() => scrollToSection("map-penyebaran")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition cursor-pointer shrink-0 ${
                    isOverlay
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Peta Alumni
                </button>
                <button
                  onClick={() => scrollToSection("galeri")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition cursor-pointer shrink-0 ${
                    isOverlay
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Galeri
                </button>
                <button
                  onClick={() => scrollToSection("testimoni")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition cursor-pointer shrink-0 ${
                    isOverlay
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Testimoni
                </button>
                <button
                  onClick={() => scrollToSection("faq")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl transition cursor-pointer shrink-0 ${
                    isOverlay
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  FAQ
                </button>
                {currentUser && (
                  <button
                    onClick={() => {
                      if (currentUser?.role === "Siswa" || currentUser?.role === "Alumni" || currentUser?.role === "Pengajar") {
                        setActiveTab("lms");
                      } else if (currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa") {
                        setActiveTab("admin");
                      } else if (currentUser?.role === "VVIP") {
                        setActiveTab("vvip");
                      } else {
                        setActiveTab("eksplorasi");
                      }
                    }}
                    className="px-3.5 py-1.5 text-xs font-extrabold uppercase rounded-xl transition cursor-pointer bg-cyan-500 text-slate-950 hover:bg-cyan-400 shrink-0"
                  >
                    Masuk Portal App
                  </button>
                )}
              </>
          </nav>
          )}

          {/* Right cluster: in-app portal menu + VVIP room + account, grouped together (not floating center) */}
          <div className="flex items-center gap-2.5">
            {activeTab !== "frontend" && currentUser && (
            <div className="hidden md:flex items-center gap-2">
              <>
                {currentUser && (
                  <div
                    className="relative group"
                    onMouseEnter={() => setIsPortalMenuOpen(true)}
                    onMouseLeave={() => setIsPortalMenuOpen(false)}
                  >
                    <button
                      onClick={() => setIsPortalMenuOpen(!isPortalMenuOpen)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wide uppercase rounded-xl transition-all duration-200 cursor-pointer relative z-10 ${
                        isOverlay ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <Menu className="h-4 w-4" /> Menu Portal Aplikasi
                    </button>
                    
                    {/* Portal Menu Dropdown Content */}
                    <div className={`absolute right-0 top-full pt-2 w-56 transition-all duration-200 z-50 ${isPortalMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-col gap-1">
                        <button
                        onClick={() => { setActiveTab("frontend"); setIsPortalMenuOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "frontend" ? "bg-slate-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        <Globe className="h-4 w-4" /> Website Publik
                      </button>

                      <button
                        onClick={() => { setActiveTab("eksplorasi"); setIsPortalMenuOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "eksplorasi" ? "bg-slate-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        <Compass className="h-4 w-4" /> Eksplorasi
                      </button>

                      <button
                        onClick={() => { setActiveTab("lms"); setIsPortalMenuOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "lms" ? "bg-slate-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        <BookOpen className="h-4 w-4" /> LMS Benkyou
                      </button>


                      <button
                        onClick={() => { setActiveTab("17berkas"); setIsPortalMenuOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "17berkas" ? "bg-slate-50 text-amber-600 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        <FolderOpen className="h-4 w-4" /> 17 Berkas
                      </button>
                      <button
                        onClick={() => { setActiveTab("kalender"); setIsPortalMenuOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "kalender" ? "bg-slate-50 text-emerald-600 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        <Calendar className="h-4 w-4" /> Jadwal LPK
                      </button>

                      {hasStaffOversight(currentUser?.role) && (
                        <button
                          onClick={() => { setActiveTab("sensei_dashboard"); setIsPortalMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "sensei_dashboard" ? "bg-slate-50 text-purple-600 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          <TrendingUp className="h-4 w-4" /> Data Progress Siswa
                        </button>
                      )}

                      {isAlumni && (
                        <button
                          onClick={() => { setActiveTab("alumni_dashboard"); setIsPortalMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "alumni_dashboard" ? "bg-slate-50 text-indigo-600 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          <GraduationCap className="h-4 w-4" /> Dashboard Alumni
                        </button>
                      )}

                      {(isAlumni || isSiswa || isPengajar || isAdmin || isVvip) && (
                        <button
                          onClick={() => { setActiveTab("afiliasi"); setIsPortalMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "afiliasi" ? "bg-slate-50 text-rose-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          <Share2 className="h-4 w-4" /> Menu Affiliate
                        </button>
                      )}

                      {currentUser && (
                        <button
                          onClick={() => { setActiveTab("tagihan"); setIsPortalMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "tagihan" ? "bg-slate-50 text-amber-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          <CreditCard className="h-4 w-4" /> {isVvip ? "Pembayaran Siswa" : (isPengajar || isAdmin) ? "HR & Personalia" : (isSiswa && !isAlumni ? "Tagihan" : "Pembayaran")}
                        </button>
                      )}

                      <button
                        onClick={() => { setActiveTab("chat"); setIsPortalMenuOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "chat" ? "bg-slate-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        <MessagesSquare className="h-4 w-4" /> Chat
                        {(() => {
                          const unread = currentUser && systemState?.messages ? systemState.messages.filter(
                            (m) =>
                              m.receiverId ===
                                (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa"
                                  ? "admin_shared"
                                  : currentUser.username) && !m.isRead
                          ).length : 0;
                          return unread > 0 ? (
                            <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                              {unread}
                            </span>
                          ) : null;
                        })()}
                      </button>

                      {(isAdmin || isVvip) && (
                        <button
                          onClick={() => { setActiveTab("admin"); setIsPortalMenuOpen(false); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "admin" ? "bg-slate-50 text-amber-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          <User className="h-4 w-4" /> Admin Desk
                        </button>
                      )}

                      <div className="my-1 border-t border-slate-100"></div>

                      <button
                        onClick={() => { setActiveTab("akun"); setIsPortalMenuOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full ${activeTab === "akun" ? "bg-slate-50 text-violet-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        <Settings className="h-4 w-4" /> Pengaturan Akun
                      </button>

                      <div className="my-1 border-t border-slate-100"></div>

                      <button
                        onClick={() => {
                          setActiveTab("install");
                          setIsPortalMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase rounded-lg transition-colors text-left w-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                      >
                        <Apple className="h-4 w-4 text-indigo-600 fill-current" /> Pasang di iOS (PWA)
                      </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {isVvip && (
                  <button
                    onClick={() => setActiveTab("vvip")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black tracking-wide uppercase rounded-xl transition-all duration-200 cursor-pointer shadow-sm ${
                      activeTab === "vvip"
                        ? "bg-rose-600 text-white animate-pulse"
                        : isOverlay 
                          ? "bg-white/10 text-rose-400 hover:bg-rose-600 hover:text-white"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200"
                    }`}
                  >
                    <Award className="h-4 w-4" />
                    <span className="hidden md:inline">VVIP Room</span>
                  </button>
                )}
              </>
            </div>
            )}

            {/* Pasang di iOS Button (Apple PWA) */}
            <button
              onClick={() => setActiveTab("install")}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                activeTab === "install"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : isOverlay
                    ? "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 shadow-sm"
                    : "bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 border border-indigo-200 shadow-xs"
              }`}
              title="Pasang Aplikasi Web di Apple iOS (iPhone & iPad)"
              id="btn-download-app-nav"
            >
              <Apple className="h-3.5 w-3.5 fill-current shrink-0" />
              <span className="hidden sm:inline">Pasang di iOS</span>
            </button>

            {/* User Account / Auth trigger */}
            {currentUser ? (
              <div className={`flex items-center gap-2 border p-1 rounded-2xl ${isOverlay ? 'bg-black/20 backdrop-blur-sm border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="hidden sm:flex flex-col text-right pl-2">
                  <span className={`text-xs font-extrabold leading-none ${isOverlay ? 'text-white' : 'text-slate-950'}`}>
                    {currentUser.name.split(" ")[0]}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase leading-normal tracking-wide">
                    _{currentUser.role === "Siswa" && isAlumni ? "Alumni" : currentUser.role}
                  </span>
                </div>
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs text-slate-950 uppercase border border-white shadow-xs overflow-hidden shrink-0"
                  style={{
                    backgroundColor: 
                      currentUser.role === "VVIP" ? "#fecdd3" : 
                      (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") ? "#fef3c7" : "#e0e7ff"
                  }}
                >
                  <img 
                    src={getSafePhotoUrl(currentUser.profilePicture || (currentUser as any).docFoto, currentUser.name)} 
                    alt={currentUser.name || "Avatar"} 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = createSvgAvatar(currentUser.name || 'User');
                    }}
                  />
                </div>
                <button
                  onClick={onLogout}
                  title="Keluar"
                  className={`p-1.5 rounded-xl transition cursor-pointer ${isOverlay ? 'text-slate-400 hover:text-rose-400 hover:bg-white/5' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                  id="btn-logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer ${isOverlay ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-900 shadow-slate-950/10'}`}
                id="btn-login-trigger"
              >
                <LogIn className="h-3.5 w-3.5 text-blue-500" />
                <span>Login Portal</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
