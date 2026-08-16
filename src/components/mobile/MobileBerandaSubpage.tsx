import React from "react";
import { AlertCircle, Apple, ArrowRight, BarChart3, BookOpen, Briefcase, Building, Calendar, ChevronDown, ChevronUp, Compass, CreditCard, Crown, DollarSign, Eye, EyeOff, Facebook, FileText, FolderOpen, GraduationCap, Image as ImageIcon, Info, Instagram, Key, Landmark, LogIn, MapPin, Menu, MessagesSquare, Package, Receipt, Share2, Shield, ShieldAlert, ShieldCheck, Sliders, Star, TrendingUp, User, UserPlus, Users, X, Youtube } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebaseClient";
import { createSvgAvatar, getSafePhotoUrl } from "../../lib/storageHelper";
import { resolveGoogleSignupRole } from "../../lib/googleAuthProvisioning";
import { isAndroidWebView } from "../MobileDashboardView.tsx";

interface MobileBerandaSubpageProps {
  currentMobileSlide: any;
  currentUser: any;
  handleAdminAction: any;
  handleCategoryAction: any;
  handleManualLogin: any;
  handleResetPasswordSubmit: any;
  handleVvipAction: any;
  isAdminPanelOpen: any;
  isMobileGoogleLoading: any;
  isProfileMenuOpen: any;
  isResettingPassword: any;
  isUserAlumni: any;
  isUserSiswa: any;
  isVvipPanelOpen: any;
  loginErrorMsg: any;
  loginPassword: any;
  loginUsername: any;
  mobileSlides: any;
  mockCalendarEvents: any;
  myActiveStudent: any;
  onLoginSuccess: any;
  resetMessage: any;
  resetStatus: any;
  resetUsername: any;
  setActiveSubpage: any;
  setCurrentMobileSlide: any;
  setIsAdminPanelOpen: any;
  setIsMobileGoogleLoading: any;
  setIsProfileMenuOpen: any;
  setIsResettingPassword: any;
  setIsVvipPanelOpen: any;
  setLoginPassword: any;
  setLoginUsername: any;
  setResetMessage: any;
  setResetStatus: any;
  setResetUsername: any;
  setShowLoginAsModal: any;
  setShowPassword: any;
  showPassword: any;
  systemState: any;
  triggerAccessAlert: any;
  triggerLogoutConfirm: any;
}

export default function MobileBerandaSubpage({ currentMobileSlide, currentUser, handleAdminAction, handleCategoryAction, handleManualLogin, handleResetPasswordSubmit, handleVvipAction, isAdminPanelOpen, isMobileGoogleLoading, isProfileMenuOpen, isResettingPassword, isUserAlumni, isUserSiswa, isVvipPanelOpen, loginErrorMsg, loginPassword, loginUsername, mobileSlides, mockCalendarEvents, myActiveStudent, onLoginSuccess, resetMessage, resetStatus, resetUsername, setActiveSubpage, setCurrentMobileSlide, setIsAdminPanelOpen, setIsMobileGoogleLoading, setIsProfileMenuOpen, setIsResettingPassword, setIsVvipPanelOpen, setLoginPassword, setLoginUsername, setResetMessage, setResetStatus, setResetUsername, setShowLoginAsModal, setShowPassword, showPassword, systemState, triggerAccessAlert, triggerLogoutConfirm }: MobileBerandaSubpageProps) {
  return (
    <div className="flex-1 space-y-4 animate-fade-in p-3 pt-4">
              {/* 1. DYNAMIC GEN-Z SLIDESHOW BANNER (AUTOPLAY 4 SECONDS WITH HIGH RES JAPANESE SCENERY) */}
              {(() => {
                const activeSlide =
                  mobileSlides[currentMobileSlide] ||
                  mobileSlides[0] ||
                  { tag: "🗻 LPK SCI JAPAN TRAINING", title: "Raih Karir Profesional Di Jepang", description: "Selamat datang di LPK SCI.", image: "", actionText: "Daftar Sekarang ⚡" };
    
                // Ensure image fallback if the URL is empty or broken
                const slideImage = activeSlide?.image || "";
                
                return (
                  <div key={activeSlide?.id || currentMobileSlide} className="relative overflow-hidden rounded-[24px] bg-slate-950 text-white min-h-[260px] aspect-[4/3] sm:aspect-auto border border-slate-100/80/20 shadow-md flex flex-col justify-between transition-all duration-500">
                    {/* Sharp HD Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-top bg-no-repeat"
                      style={{ backgroundImage: `url('${slideImage}')` }}
                    />
    
                    {/* Shading Layers */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/35 z-0" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent z-0" />
    
                    {/* Top/Body Content */}
                    <div className="relative z-10 p-3.5 space-y-2 flex-grow">
                      {/* Top line with Tag and Ad space badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[6.5px] sm:text-[7.5px] font-mono bg-white/10 text-yellow-400 font-black px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-widest whitespace-nowrap">
                          🎌 {activeSlide.tag || "PROGRAM SCI"}
                        </span>
                        <span className="text-[6.5px] font-mono bg-red-600/95 text-white font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight animate-pulse shrink-0">
                          LIVE RADAR 📡
                        </span>
                      </div>
    
                      {/* Title and Description */}
                      <div className="text-left space-y-1 max-w-[90%]">
                        <h3 className="text-[12px] sm:text-xs font-sans font-black tracking-tight leading-snug text-white uppercase drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] line-clamp-2">
                          {activeSlide.title || "WUJUDKAN MIMPI KERJA DI JEPANG"}
                        </h3>
                        <p className="text-[8.5px] sm:text-[9.5px] text-slate-300 leading-snug line-clamp-2 font-medium">
                          {activeSlide.description ||
                            "Dapatkan bimbingan intensif dari Nol sampai sukses terbang."}
                        </p>
                      </div>
    
                      {/* Stats and Action details row */}
                      <div className="flex items-center gap-3 pt-1 border-t border-white/15 max-w-[85%]">
                        <div>
                          <span className="text-[9.5px] sm:text-[10px] font-mono font-black text-emerald-400 block leading-none">
                            {activeSlide.statValue}
                          </span>
                          <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                            {activeSlide.statText}
                          </span>
                        </div>
                        <div className="h-5 w-px bg-white/15" />
                        <div>
                          <span className="text-[7.5px] font-sans text-sky-400 font-bold flex items-center gap-1 leading-none">
                            <span className="h-1 w-1 bg-sky-400 rounded-full inline-block animate-pulse"></span>
                            LPK Resmi RI
                          </span>
                          <span className="text-[6.5px] text-slate-400 block font-light mt-0.5">
                            L.A: 403-B/25
                          </span>
                        </div>
                      </div>
                    </div>
    
                    {/* Bottom line: Action button and indicators dot */}
                    <div className="relative z-10 px-3.5 pb-3 flex items-center justify-between gap-4 mt-auto">
                      <button
                        onClick={() => {
                          setActiveSubpage("pendaftaran");
                        }}
                        className={`bg-gradient-to-r ${activeSlide.accent || "from-sky-500 to-blue-600"} hover:scale-105 active:scale-95 transition-all text-slate-950 font-black px-5 py-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md`}
                      >
                        <span>Pendaftaran Siswa Baru</span>
                        <ArrowRight className="h-4 w-4 stroke-[3]" />
                      </button>
    
                      {/* Pagination Dots */}
                      <div className="flex items-center gap-1.5">
                        {mobileSlides.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentMobileSlide(idx)}
                            className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                              currentMobileSlide === idx
                                ? "w-4 bg-white"
                                : "w-1.5 bg-white/30 hover:bg-white/50"
                            }`}
                            title={`Slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
    
              {/* 2. TICKER RIBBON - "INFO TERKINI" and marquee announcements scroll list */}
              <div className="bg-gradient-to-r from-indigo-700 via-blue-900 to-indigo-800 flex items-center h-9 overflow-hidden select-none relative shadow-inner rounded-xl mx-2 my-2 border border-blue-800/50">
                <div className="bg-red-600 text-white text-[9.5px] font-black uppercase px-4 h-full flex items-center justify-center tracking-tight shrink-0 rounded-r-xl shadow-lg relative z-10 border-r border-red-500">
                  <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Info Terkini</span>
                </div>
                {/* Standard marquee emulator */}
                <div className="flex-1 text-blue-50 text-[10.5px] font-bold font-sans overflow-hidden whitespace-nowrap px-4 relative z-0 flex items-center gap-2">
                  <div className="animate-marquee inline-block whitespace-nowrap">
                    {(() => {
                      if (systemState.customization?.runningText) {
                        return systemState.customization.runningText;
                      }
                      
                      const activeEvents = systemState.events && systemState.events.length > 0 
                        ? systemState.events 
                        : mockCalendarEvents;
                        
                      const formatDateSimple = (dStr: string) => {
                        if (!dStr) return "";
                        const parts = dStr.split("-");
                        if (parts.length === 3) {
                          const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                          const monthIdx = parseInt(parts[1], 10) - 1;
                          if (monthIdx >= 0 && monthIdx < 12) {
                            return `${parseInt(parts[2], 10)} ${months[monthIdx]} ${parts[0]}`;
                          }
                        }
                        return dStr;
                      };
    
                      const eventTickerString = activeEvents
                        .map((e: any) => `${e.title} (${formatDateSimple(e.date)})`)
                        .join(" • ");
                        
                      return `Selamat datang di aplikasi LPK SOURCE COURSE INDONESIA | Jadwal LPK Terbaru: ${eventTickerString} | Ujian JFT-Basic & Tokutei Ginou Kaigo terdekat segera diselenggarakan...`;
                    })()}
                  </div>
                </div>
              </div>
    
              {/* Quick-Access Mobile Auth Gateway / Portal Masuk di Depan */}
              {!currentUser ? (
                <div className="relative overflow-hidden bg-slate-900 text-white rounded-[28px] border border-slate-800 p-6 sm:p-7 space-y-5 shadow-2xl text-left transition-all duration-300">
                  <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-inner shrink-0 ring-1 ring-white/20">
                      <LogIn className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white tracking-tight">
                        Portal Masuk
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">
                        Silakan masuk untuk mengakses fitur lengkap layanan.
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative z-10 pt-1 space-y-4">
                  {isResettingPassword ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-display font-extrabold text-xl text-white">
                          Reset Password
                        </h3>
                        <p className="text-xs text-slate-400">
                          Masukkan Username atau Email akun Anda.
                        </p>
                      </div>
                      
                      {resetMessage && (
                        <div className={`p-3 border rounded-xl text-xs flex gap-2 ${resetStatus === "success" ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-300" : "bg-rose-900/30 border-rose-500/30 text-rose-300"}`}>
                          <ShieldAlert className={`h-4.5 w-4.5 flex-shrink-0 ${resetStatus === "success" ? "text-emerald-400" : "text-rose-400"}`} />
                          <div className="flex flex-col gap-1 justify-center">
                            <span>{resetMessage}</span>
                          </div>
                        </div>
                      )}
                      
                      <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-300">Username / Email</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              autoCapitalize="none"
                              autoComplete="username"
                              autoCorrect="off"
                              spellCheck={false}
                              value={resetUsername}
                              onChange={(e) => setResetUsername(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                              placeholder="Masukkan username/email"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsResettingPassword(false);
                              setResetMessage("");
                              setResetStatus("idle");
                            }}
                            className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 text-sm rounded-xl transition shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer border border-slate-700"
                          >
                            Kembali
                          </button>
                          <button
                            type="submit"
                            disabled={resetStatus === "success"}
                            className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm rounded-xl transition shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer disabled:opacity-50"
                          >
                            Kirim Link Reset
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <>
                      {loginErrorMsg && (
                        <div className="bg-red-50 text-red-600 p-3 text-xs rounded-xl border border-red-100 font-bold">
                          {loginErrorMsg}
                        </div>
                      )}
    
                    <form onSubmit={handleManualLogin} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">
                          Username
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            autoCapitalize="none"
                            autoComplete="username"
                            autoCorrect="off"
                            spellCheck={false}
                            value={loginUsername}
                            onChange={(e) => setLoginUsername(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Masukkan username"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">
                          Password
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            autoCapitalize="none"
                            autoComplete="current-password"
                            autoCorrect="off"
                            spellCheck={false}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Masukkan password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="flex justify-end mt-1">
                          <button 
                            type="button" 
                            onClick={() => setIsResettingPassword(true)}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                          >
                            Lupa Password?
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm rounded-xl transition shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
                      >
                        Masuk
                      </button>
                    </form>
    
                  {!isResettingPassword && (
                    <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-700/50" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold">
                        <span className="bg-indigo-800 px-3 text-slate-400">
                          Atau masuk dengan
                        </span>
                      </div>
                    </div>
    
                    <button
                      type="button"
                      disabled={isMobileGoogleLoading}
                      onClick={async () => {
                        if (isAndroidWebView()) {
                          alert("PENTING: Google melarang login langsung (OAuth) dari dalam WebView Android demi keamanan (Error 403: disallowed_useragent). Silakan masuk secara manual dengan form Username/Email & Password, atau buka situs ini di browser biasa HP Anda.");
                          return;
                        }
                        if (isMobileGoogleLoading) return;
                        setIsMobileGoogleLoading(true);
                        if (onLoginSuccess) {
                          try {
                             
                              
                            
                            const provider = new GoogleAuthProvider();
                            const result = await signInWithPopup(auth, provider);
                            const user = result.user;
                            const email = (user.email || "").trim().toLowerCase();
                            
                            let existingUser = (systemState.unfilteredUsers || systemState.users || [])?.find(
                              (u) => (u.email || "").trim().toLowerCase() === email || (u.username || "").trim().toLowerCase() === email,
                            );
    
                            if (!existingUser && email) {
                              const name = user.displayName || email.split("@")[0];

                              const activeMatch = systemState.activeStudents?.find(s => (s.email || "").trim().toLowerCase() === email);
                              const regMatch = systemState.registeredStudents?.find(r => (r.email || "").trim().toLowerCase() === email);
                              const { role, studentId, assignedClass } = resolveGoogleSignupRole(email, activeMatch, regMatch);
    
                              existingUser = {
                                username: email,
                                name: activeMatch?.name || regMatch?.name || name,
                                email: email,
                                role: role,
                                status: "Active",
                                studentId: studentId,
                                assignedClass: assignedClass,
                                profilePicture: user.photoURL || activeMatch?.profilePicture || regMatch?.docFoto || undefined,
                                password: "google-auth-user",
                                lastActive: new Date().toISOString()
                              } as any;
    
                              // PERSIST to database
                              await fetch("/api/state/update", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  dataType: "users",
                                  action: "add",
                                  payload: existingUser
                                })
                              }).catch(() => {});
                            }
    
                            if (existingUser) {
                              if (existingUser.status === "Suspended") {
                                alert("Akses Ditolak: Akun Anda disuspend.");
                                return;
                              }
                              onLoginSuccess(existingUser);
                            } else {
                              alert("Akun Google belum terdaftar di sistem.");
                            }
                          } catch (error: any) {
                            console.error("Google Sign-In Error:", error);
                            const isIframe = typeof window !== "undefined" && window.self !== window.top;
                            const iframeTip = isIframe ? " \n\n💡 TIPS: Karena Anda di iFrame AI Studio, beberapa browser memblokir popup Google Auth. Silakan klik tombol 'Buka di Tab Baru' (Open in new tab) di kanan atas preview, lalu coba login kembali." : "";
                            
                            if (error.code === 'auth/unauthorized-domain') {
                              alert(`Domain '${window.location.hostname}' belum diotorisasi Firebase. Tambahkan hostname ini ke Authentication > Settings > Authorized Domains di Firebase Console.${iframeTip}`);
                            } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                              alert(`Popup login ditutup atau dibatalkan.${iframeTip}`);
                            } else {
                              alert((error.message || "Gagal masuk menggunakan Google.") + iframeTip);
                            }
                          } finally {
                            setIsMobileGoogleLoading(false);
                          }
                        }
                      }}
                      className={`w-full inline-flex justify-center items-center gap-3 rounded-xl bg-white text-slate-700 font-bold py-3 text-sm transition shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
                        isMobileGoogleLoading ? "opacity-60 cursor-not-allowed bg-slate-100" : "hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      {isMobileGoogleLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Menghubungkan...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          Lanjutkan dengan Google
                        </>
                      )}
                    </button>
    
                    {isAndroidWebView() && (
                      <div className="p-3.5 bg-amber-50/20 border border-amber-500/30 text-amber-200 rounded-[24px] text-[10.5px] leading-relaxed mt-2.5">
                        <p className="font-extrabold flex items-center gap-1.5 mb-1 text-amber-300">
                          ⚠️ Deteksi WebView Android (APK)
                        </p>
                        Google memblokir login langsung (OAuth) di dalam WebView demi keamanan (Error 403: disallowed_useragent). Silakan masuk secara manual dengan form di atas, atau buka web ini menggunakan browser biasa HP Anda (seperti Chrome).
                      </div>
                    )}
                    </>
                  )}
                  </>
                  )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`relative overflow-hidden p-5 rounded-[24px] border flex flex-col justify-between text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer transition-all active:scale-[0.98] ${
                    currentUser.role === "Siswa"
                      ? "bg-white text-slate-800 border-indigo-100"
                      : currentUser.role === "Pengajar"
                        ? "bg-white text-slate-800 border-emerald-100"
                        : currentUser.role === "Admin"
                          ? "bg-white text-slate-800 border-rose-100"
                          : "bg-white text-slate-800 border-amber-100"
                  }`}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 opacity-50 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-50 opacity-50 rounded-full blur-xl"></div>
                  
                  <div className="flex items-center justify-between w-full relative z-10">
                    <div className={`flex gap-3 min-w-0 ${
                      currentUser.role === "Siswa" || currentUser.role === "Alumni" || myActiveStudent
                        ? "items-start"
                        : "items-center"
                    }`}>
                    <div
                      className={`h-11 w-11 mt-0.5 rounded-full flex items-center justify-center font-black text-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-2 ring-slate-50 bg-slate-100 shrink-0 overflow-hidden text-slate-600`}
                    >
                      <img
                        src={getSafePhotoUrl(currentUser.profilePicture, currentUser.name)}
                        className="h-full w-full object-cover"
                        alt={currentUser.name || "Avatar"}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = createSvgAvatar(currentUser.name || 'User');
                        }}
                      />
                    </div>
                                    <div className="min-w-0">
                      <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100">
                        Sesi Aktif:{" "}
                        {currentUser.role === "Pengajar"
                          ? "SENSEI"
                          : currentUser.role === "Siswa" &&
                              systemState.activeStudents?.find(
                                (s) =>
                                  s.id === currentUser.studentId ||
                                  s.name === currentUser.name,
                              )?.kategoriPendaftaran === "Alumni"
                            ? "ALUMNI"
                            : currentUser.role}
                      </span>
                      <p className="text-[15px] font-extrabold text-slate-800 mt-1.5 truncate max-w-[170px] leading-tight">
                        {currentUser.name}
                      </p>
                      {(currentUser.role === "Siswa" || currentUser.role === "Alumni" || myActiveStudent) ? (
                        <div className="mt-2 space-y-0.5 text-[9px] leading-tight font-medium text-slate-600">
                          <div className="flex items-center gap-1.5 flex-wrap drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <span className="opacity-75">No Induk:</span>
                            <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-700 shrink-0">
                              {myActiveStudent?.id || currentUser.studentId || "-"}
                            </span>
                          </div>
                          {(!isUserAlumni && myActiveStudent?.kategoriPendaftaran !== "Alumni") && (
                            <>
                              <div className="flex items-center gap-1 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <span className="opacity-75">Kelas:</span>
                                <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                  {myActiveStudent?.class || currentUser.assignedClass || "Belum ada kelas"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <span className="opacity-75">Sensei:</span>
                                <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                  {myActiveStudent?.sensei || "Belum ditentukan"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      ) : currentUser.role === "Pengajar" ? (() => {
                        const myClass = systemState.customization?.lmsClasses?.find(c => c.name === currentUser.assignedClass);
                        const studentCount = systemState.activeStudents?.filter(s => s.class === currentUser.assignedClass && s.status !== "Di Jepang").length || 0;
                        const activeChapters = myClass?.chapters?.filter(c => c.isActive !== false).length || 50;
                        return (
                          <div className="mt-1.5 space-y-0.5 text-[9px] leading-tight font-medium text-slate-500">
                            <div className="flex items-center gap-1">
                              <span>Kelas Diampu:</span>
                              <span className="font-bold text-slate-800">{currentUser.assignedClass || "Belum ada kelas"}</span>
                            </div>
                            {currentUser.assignedClass && (
                              <>
                                <div className="flex items-center gap-1">
                                  <span>Jumlah Siswa:</span>
                                  <span className="font-bold text-slate-800">{studentCount} Orang</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>Update BAB:</span>
                                  <span className="font-bold text-slate-800">{myClass?.chapters?.length || activeChapters || 0} Bab Terbuka</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>Target Kelas:</span>
                                  <span className="font-bold text-slate-800">{myClass?.period || "Lulus N4 / JFT Basic"}</span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })() : null}
                    </div>
                    </div>
                    
                    {/* Visual indicator that it's clickable */}
                    <div className="flex flex-col justify-center pl-3 border-l border-slate-200/50 shrink-0 ml-2">
                       <div className="flex flex-col items-center justify-center gap-1">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-colors ${isProfileMenuOpen ? 'bg-slate-100 border-slate-300' : 'bg-indigo-50 border-indigo-200'}`}>
                           {isProfileMenuOpen ? (
                             <X className="h-5 w-5 text-slate-600" />
                           ) : (
                             <Menu className="h-5 w-5 text-indigo-600" />
                           )}
                         </div>
                         <span className={`text-[9px] font-extrabold text-center leading-none ${isProfileMenuOpen ? 'text-slate-500' : 'text-indigo-600 animate-pulse'}`}>
                           {isProfileMenuOpen ? "Tutup" : "Menu"}
                         </span>
                       </div>
                    </div>
                  </div>
                  
                  {isProfileMenuOpen && (
                    <div className="relative z-10 mt-4 pt-4 border-t border-slate-200/50 flex flex-col gap-2 w-full animate-fade-in">
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveSubpage("akun"); }}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-[10px] uppercase py-2.5 px-3 rounded-xl transition border border-blue-100 active:scale-95 cursor-pointer flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                        >
                          Profil Saya 👤
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); triggerLogoutConfirm(); }}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-black text-[10px] uppercase py-2.5 px-3 rounded-xl transition border border-red-100 active:scale-95 cursor-pointer flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                        >
                          Logout 🚪
                        </button>
                      </div>
                      {currentUser?.role === "VVIP" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowLoginAsModal(true); }}
                          className="w-full mt-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[10px] uppercase py-2.5 px-3 rounded-xl transition border border-indigo-100 active:scale-95 cursor-pointer flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                        >
                          🔑 Login Sebagai Akun Lain
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
    
              {/* 2b. Layanan Publik (Guest Menu) */}
              {!currentUser && (
                <section className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 opacity-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  
                  <div className="flex flex-col text-left relative z-10">
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                      Layanan Publik
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 ml-3.5">
                      Akses menu untuk pengunjung tanpa harus masuk.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-3 pt-1 font-sans relative z-10">
                    <button
                      onClick={() => setActiveSubpage("pendaftaran")}
                      className="flex flex-col items-start justify-center p-3.5 rounded-[20px] bg-slate-50/80 border border-slate-100/80 hover:bg-white hover:border-indigo-100 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-[24px] bg-white text-indigo-600 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-3 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5 text-left w-full">
                        <span className="text-[11px] font-bold text-slate-800 block truncate">
                          Pendaftaran
                        </span>
                        <p className="text-[9px] text-slate-500 block truncate">
                          Siswa & Alumni
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveSubpage("profil")}
                      className="flex flex-col items-start justify-center p-3.5 rounded-[20px] bg-slate-50/80 border border-slate-100/80 hover:bg-white hover:border-blue-100 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-[24px] bg-white text-blue-600 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-3 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100">
                        <Building className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5 text-left w-full">
                        <span className="text-[11px] font-bold text-slate-800 block truncate">
                          Profil LPK
                        </span>
                        <p className="text-[9px] text-slate-500 block truncate">
                          Fasilitas & Info
                        </p>
                      </div>
                    </button>
                  </div>
                </section>
              )}
    
              {/* 3. CATEGORIES GRID - "KATEGORI" dark blue tag heading and 9 buttons exactly matching screenshot */}
              {currentUser && (
                <section className="bg-slate-50/80 rounded-[28px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 space-y-5">
                  {/* KATEGORI Tag Heading Header */}
                  <div className="flex text-left">
                    <div className="bg-white text-slate-800 text-[10.5px] font-black uppercase px-4 py-1.5 rounded-xl tracking-widest shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80">
                      MENU UTAMA
                    </div>
                  </div>
    
                  {/* Nine circular icons matching screenshots precisely */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-y-4 gap-x-2 pt-1 font-sans">
                    {/* Category 1: PROFIL LPK */}
                    <button
                      onClick={() => handleCategoryAction("profil")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                        <Building className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          PROFIL LPK
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Latar Belakang & Detail
                        </p>
                      </div>
                    </button>
    
                    {/* Category: DASHBOARD ALUMNI */}
                    {isUserAlumni && (
                      <button
                        onClick={() => handleCategoryAction("alumni_dashboard")}
                        className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                          <GraduationCap className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                        </div>
                        <div className="space-y-1 text-center w-full px-1">
                          <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                            DASHBOARD ALUMNI
                          </span>
                          <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                            Portal Eksklusif Alumni
                          </p>
                        </div>
                      </button>
                    )}
    
                    {/* Category: 17 BERKAS */}
                    <button
                      onClick={() => handleCategoryAction("17berkas")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                        <FolderOpen className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          17 BERKAS
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Dokumen Siswa
                        </p>
                      </div>
                    </button>
    
                    {/* Category: JADWAL LPK */}
                    <button
                      onClick={() => setActiveSubpage("kalender")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                        <Calendar className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          JADWAL LPK
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Kalender & Kegiatan
                        </p>
                      </div>
                    </button>
    
                    {/* Category 3: CHAT */}
                    <button
                      onClick={() => handleCategoryAction("chat")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                        <MessagesSquare className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                        {(() => {
                          const unread = currentUser && systemState.messages ? systemState.messages.filter(
                            (m) =>
                              m.receiverId ===
                                (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa"
                                  ? "admin_shared"
                                  : currentUser.username) && !m.isRead
                          ).length : 0;
                          return unread > 0 ? (
                            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center px-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                              {unread}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          CHAT
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Pesan Instan Terintegrasi
                        </p>
                      </div>
                    </button>
    
                    {(currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                      <button
                        onClick={() => handleCategoryAction("perkembangan")}
                        className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                          <TrendingUp className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                        </div>
                        <div className="space-y-1 text-center w-full px-1">
                          <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                            DATA PROGRESS
                          </span>
                          <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                            Progress Belajar
                          </p>
                        </div>
                      </button>
                    )}
    
                    {currentUser?.role !== "Alumni" && (
                      <button
                        onClick={() => handleCategoryAction("ebenkyou")}
                        className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                          <BookOpen className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                        </div>
                        <div className="space-y-1 text-center w-full px-1">
                          <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                            LMS E-BENKYOU
                          </span>
                          <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                            Akses Materi & Quiz
                          </p>
                        </div>
                      </button>
                    )}
                    
                    {currentUser?.role !== "Alumni" && (
                      <button
                        onClick={() => handleCategoryAction("pembayaran")}
                        className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                          <CreditCard className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                        </div>
                        <div className="space-y-1 text-center w-full px-1">
                          <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                            {currentUser?.role === "VVIP" ? "PEMBAYARAN SISWA" : (currentUser?.role === "Pengajar" || currentUser?.role?.startsWith("Admin")) ? "HR & PERSONALIA" : "PEMBAYARAN"}
                          </span>
                          <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                            {currentUser?.role === "VVIP" ? "Monitoring Pembayaran Siswa" : (currentUser?.role === "Pengajar" || currentUser?.role?.startsWith("Admin")) ? "Data Kehadiran & Staf" : "Dashboard & Tagihan"}
                          </p>
                        </div>
                      </button>
                    )}
    
                    {/* Category: ORDER JOB */}
                    {true && (
                      <button
                      onClick={() => handleCategoryAction("jobs")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                        <Briefcase className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          ORDER JOB
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Tokutei Ginou & Magang
                        </p>
                      </div>
                    </button>
                    )}
    
                    {/* Category: CV & BIODATA */}
                    {currentUser?.role !== "Alumni" && (
                      <button
                        onClick={() => handleCategoryAction("cv")}
                        className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                          <FileText className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                        </div>
                        <div className="space-y-1 text-center w-full px-1">
                          <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                            CV & BIODATA
                          </span>
                          <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                            Profil Format Jepang
                          </p>
                        </div>
                      </button>
                    )}
    
                    {/* Category 7: PETA PENYEBARAN */}
                    <button
                      onClick={() => handleCategoryAction("peta")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                        <Compass className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          PETA PENYEBARAN
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Alumni di Jepang
                        </p>
                      </div>
                    </button>
    
                    {/* Category 8: GALERI */}
                    <button
                      onClick={() => handleCategoryAction("galeri")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-pink-400 to-pink-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                        <ImageIcon className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          GALERI
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Pelajaran & Wisuda
                        </p>
                      </div>
                    </button>
    
                    {/* Category ALUMNI 7: PILIH KELAS */}
                    {(isUserAlumni || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                      <button
                      onClick={() => setActiveSubpage("pilih_kelas")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                        <UserPlus className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          PILIH KELAS
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Lihat & Pilih Kelas
                        </p>
                      </div>
                    </button>
                    )}
    
                    {/* Category ALUMNI 8: INFORMASI */}
                    {isUserAlumni && (
                      <button
                      onClick={() => alert("Informasi: Segera Hadir")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                        <Info className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          INFORMASI
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Pengumuman & Berita
                        </p>
                      </div>
                    </button>
                    )}
    
    
    
                    {/* Category 11: AKUN SAYA */}
                    <button
                      onClick={() => setActiveSubpage("akun")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                        <User className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          AKUN SAYA
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Pengaturan Profil
                        </p>
                      </div>
                    </button>
    
                    {/* Category ALUMNI 11: AFILIASI SCI */}
                    {(isUserSiswa || isUserAlumni || currentUser?.role === "Pengajar" || currentUser?.role === "Siswa" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                      <>
                        <button
                          onClick={() => setActiveSubpage("afiliasi")}
                          className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                        >
                          <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                            <Share2 className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                          </div>
                          <div className="space-y-1 text-center w-full px-1">
                            <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                              MENU AFILIATE
                            </span>
                            <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                              Pendaftaran Siswa
                            </p>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </section>
              )}
    
              {/* 5. ADMINISTRASI - Green bar and 9 custom styled buttons to look extremely colorful & professional */}
              {currentUser &&
                (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa" || currentUser.role === "VVIP") && (
                  <section className="bg-white rounded-[24px] border border-slate-100/80 shadow-xs p-3 space-y-3">
                    {/* Header Labeled Bar */}
                    <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-3 rounded-[16px] flex items-center justify-between text-[10px] shadow-md border border-emerald-500/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      <div className="flex items-center gap-2.5 font-black leading-none uppercase tracking-wider relative z-10">
                        <div className="bg-white/20 p-1.5 rounded-lg shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
                          <Shield className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-emerald-50" />
                        </div>
                        <span className="drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-xs">PANEL ADMINISTRASI</span>
                      </div>
                      <button 
                        onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                        className="flex items-center justify-center bg-black/10 hover:bg-black/20 p-2 rounded-xl transition cursor-pointer text-white/90 hover:text-white relative z-10 border border-black/5 active:scale-95"
                      >
                        {isAdminPanelOpen ? <ChevronUp className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" /> : <ChevronDown className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />}
                      </button>
                    </div>
                    {/* Grid of components matching screenshots - SORTED ALPHABETICALLY */}
                    {isAdminPanelOpen && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1 text-left animate-fade-in">
                      {[
                        { id: "pembayaran", name: "Admin Keuangan Siswa", icon: CreditCard, color: "emerald", colorClass: "from-emerald-500 to-emerald-700", access: currentUser?.role !== "Admin Biasa" },
                        { id: "siswa", name: "Administrasi Siswa", icon: Users, color: "blue", colorClass: "from-blue-500 to-blue-700", access: true },
                        { id: "afiliasi", name: "Afiliasi SCI", icon: Share2, color: "rose", colorClass: "from-rose-500 to-rose-700", access: true, isSubpage: true },
                        { id: "gaji", name: "Buku Kas & Gaji", icon: Receipt, color: "cyan", colorClass: "from-cyan-500 to-cyan-700", access: currentUser?.role !== "Admin Biasa" },
                        { id: "kustomisasi", name: "Branding & Slider", icon: Sliders, color: "teal", colorClass: "from-teal-500 to-teal-700", access: true },
                        { id: "informasi", name: "Informasi LPK", icon: Info, color: "slate", colorClass: "from-slate-500 to-slate-700", access: true },
                        { id: "inventaris", name: "Inventaris Barang", icon: Package, color: "purple", colorClass: "from-purple-500 to-purple-700", access: true },
                        { id: "kalender", name: "Jadwal LPK", icon: Calendar, color: "indigo", colorClass: "from-indigo-500 to-indigo-700", access: true, isSubpage: true },
                        { id: "manajemen", name: "Manajemen Akun & Sensei", icon: Users, color: "sky", colorClass: "from-sky-500 to-sky-700", access: true },
                        { id: "kelas", name: "Manajemen Kelas", icon: GraduationCap, color: "violet", colorClass: "from-violet-500 to-violet-700", access: true },
                        { id: "pajak", name: "Pajak LPK", icon: FileText, color: "rose", colorClass: "from-rose-500 to-rose-700", access: currentUser?.role !== "Admin Biasa" },
                        { id: "petasebaran", name: "Peta Alumni JP", icon: MapPin, color: "red", colorClass: "from-red-500 to-red-700", access: true },
                        { id: "joborders", name: "Proses Job Siswa", icon: Landmark, color: "amber", colorClass: "from-amber-500 to-amber-700", access: true },
                        { id: "dataCV", name: "Database CV", icon: BookOpen, color: "sky", colorClass: "from-sky-500 to-sky-700", access: true },
                        { id: "alumnivip", name: "Manajemen Kelas Alumni", icon: Star, color: "yellow", colorClass: "from-yellow-500 to-yellow-600", access: true },
                        { id: "galeri", name: "Galeri Foto", icon: ImageIcon, color: "cyan", colorClass: "from-cyan-500 to-cyan-700", access: true },
                      ]
                        .filter(item => item.access)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => item.isSubpage ? setActiveSubpage(`admin_${item.id}`) : handleAdminAction(item.id as any)}
                              className={`flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-slate-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer`}
                            >
                              <div className={`h-12 w-12 rounded-[14px] bg-gradient-to-br ${item.colorClass || ""} text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white `}>
                                <Icon className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                              </div>
                              <span className="text-[8.5px] font-black text-slate-800 leading-tight uppercase">
                                {item.name}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                    )}
                  </section>
                )}
    
              {/* 6. VVIP - Mustard/Gold bar labeled "VVIP" with beautiful colored circular/rounded monitors */}
              {currentUser && currentUser.role === "VVIP" && (
                <section className="bg-white rounded-[24px] border border-slate-100/80 shadow-xs p-3 space-y-3">
                  {/* Header Labeled Bar */}
                  <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white p-3 rounded-[16px] flex items-center justify-between text-[10px] shadow-md border border-amber-500/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="flex items-center gap-2.5 font-black leading-none uppercase tracking-wider relative z-10">
                      <div className="bg-white/20 p-1.5 rounded-lg shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
                        <Crown className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-amber-50" />
                      </div>
                      <span className="drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-xs">PANEL EKSEKUTIF VVIP</span>
                    </div>
                    <button 
                      onClick={() => setIsVvipPanelOpen(!isVvipPanelOpen)}
                      className="flex items-center justify-center bg-black/10 hover:bg-black/20 p-2 rounded-xl transition cursor-pointer text-white/90 hover:text-white relative z-10 border border-black/5 active:scale-95"
                    >
                      {isVvipPanelOpen ? <ChevronUp className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" /> : <ChevronDown className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />}
                    </button>
                  </div>
                  {/* VVIP Quick KPIs & Features - SORTED ALPHABETICALLY */}
                  {isVvipPanelOpen && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-2 text-left animate-fade-in">
                    {[
                      { id: "security", name: "Keamanan Akun", icon: ShieldCheck, color: "slate", colorClass: "from-slate-500 to-slate-700", access: true, isVvipOnly: true },
                      { id: "gaji", name: "Keuangan LPK", icon: DollarSign, color: "purple", colorClass: "from-purple-500 to-purple-700", access: true },
                      { id: "eval", name: "Monitoring Kelas", icon: Users, color: "sky", colorClass: "from-sky-500 to-sky-700", access: true },
                      { id: "kalender", name: "Jadwal LPK", icon: Calendar, color: "indigo", colorClass: "from-indigo-500 to-indigo-700", access: true, isSubpage: true },
                      { id: "afiliasi", name: "Afiliasi SCI", icon: Share2, color: "rose", colorClass: "from-rose-500 to-rose-700", access: true, isSubpage: true },
                      { id: "exec", name: "Overview Executive", icon: BarChart3, color: "amber", colorClass: "from-amber-500 to-amber-700", access: true },
                      { id: "loginas", name: "Login Sebagai...", icon: Key, color: "indigo", colorClass: "from-indigo-500 to-indigo-700", access: true, isVvipOnly: true },
                    ]
                      .filter(item => item.access)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (item.id === "loginas") {
                                setShowLoginAsModal(true);
                                return;
                              }
                              if (item.isVvipOnly && (!currentUser || currentUser.role !== "VVIP")) {
                                triggerAccessAlert("Direktur Utama LPK (VVIP)");
                              } else if (item.isSubpage) {
                                setActiveSubpage(`vvip_${item.id}`);
                              } else {
                                handleVvipAction(item.id as any);
                              }
                            }}
                            className={`flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-slate-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer`}
                          >
                            <div className={`h-12 w-12 rounded-[14px] bg-gradient-to-br ${item.colorClass || ""} text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white`}>
                              <Icon className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                            </div>
                            <span className="text-[8.5px] font-black text-slate-800 leading-tight uppercase">
                              {item.name}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                  )}
                </section>
              )}
    
              {/* Clean Mobile Footer with Privacy Policy, Panduan PWA iOS & Social Media */}
              <footer className="pt-6 pb-6 border-t border-slate-200/60 mt-8 text-center space-y-3 block">
                <div className="flex items-center justify-center gap-4 text-slate-400">
                  <a
                    href="https://instagram.com/lpk.sourcecourse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-600 transition p-2"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-600 transition p-2"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-600 transition p-2"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                    LPK Source Course Indonesia
                  </p>
                  <p className="text-[9px] text-slate-500 leading-relaxed max-w-[280px] mx-auto font-mono">
                    &copy; 2026 LPK SCI. Semua database terenkripsi & diawasi secara
                    resmi.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 text-[9px]">
                  <button
                    onClick={() => setActiveSubpage("privacy")}
                    className="font-bold text-indigo-600 hover:text-indigo-800 transition active:scale-95 cursor-pointer underline"
                    id="mobile-footer-privacy-btn"
                  >
                    Kebijakan Privasi
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => setActiveSubpage("install")}
                    className="font-bold text-indigo-600 hover:text-indigo-800 transition active:scale-95 cursor-pointer underline flex items-center gap-1"
                    id="mobile-footer-pwa-btn"
                  >
                    <Apple className="h-3 w-3 inline fill-current" /> Panduan iOS PWA
                  </button>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400">Pati, Jateng</span>
                </div>
              </footer>
            </div>
  );
}
