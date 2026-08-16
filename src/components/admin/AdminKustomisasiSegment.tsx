import React from "react";
import { AlertCircle, Anchor, Award, BookOpen, Camera, Check, Compass, Globe, GraduationCap, Heart, Landmark, LayoutTemplate, LoaderCircle, MapPin, Palette, Plus, Sparkles, Trash2 } from "lucide-react";
import { ConfirmForm } from "../ConfirmForm";
import { uploadFileToFirebase } from "../../lib/storageHelper";

interface AdminKustomisasiSegmentProps {
  custFaviconDragActive: any;
  custFaviconUrl: any;
  custLandingConfig: any;
  custLogoDragActive: any;
  custLogoIcon: any;
  custLogoText: any;
  custLogoUrl: any;
  custSlides: any;
  custThemeColor: any;
  handleFaviconDrag: any;
  handleFaviconDrop: any;
  handleFaviconFileChange: any;
  handleLogoDrag: any;
  handleLogoDrop: any;
  handleLogoFileChange: any;
  handleSaveCustomization: any;
  landingSaveSuccess: any;
  officeEnforce: any;
  officeLat: any;
  officeLon: any;
  officeRadius: any;
  onUpdateState: any;
  oppUploadStatus: any;
  saveSuccess: any;
  selectedSlideId: any;
  setCustFaviconUrl: any;
  setCustLandingConfig: any;
  setCustLogoIcon: any;
  setCustLogoText: any;
  setCustLogoUrl: any;
  setCustSlides: any;
  setCustThemeColor: any;
  setLandingSaveSuccess: any;
  setOfficeEnforce: any;
  setOfficeLat: any;
  setOfficeLon: any;
  setOfficeRadius: any;
  setOppUploadStatus: any;
  setSelectedSlideId: any;
  setSlideSaveSuccess: any;
  setSliderUploadStatus: any;
  slideSaveSuccess: any;
  sliderUploadStatus: any;
}

export default function AdminKustomisasiSegment({ custFaviconDragActive, custFaviconUrl, custLandingConfig, custLogoDragActive, custLogoIcon, custLogoText, custLogoUrl, custSlides, custThemeColor, handleFaviconDrag, handleFaviconDrop, handleFaviconFileChange, handleLogoDrag, handleLogoDrop, handleLogoFileChange, handleSaveCustomization, landingSaveSuccess, officeEnforce, officeLat, officeLon, officeRadius, onUpdateState, oppUploadStatus, saveSuccess, selectedSlideId, setCustFaviconUrl, setCustLandingConfig, setCustLogoIcon, setCustLogoText, setCustLogoUrl, setCustSlides, setCustThemeColor, setLandingSaveSuccess, setOfficeEnforce, setOfficeLat, setOfficeLon, setOfficeRadius, setOppUploadStatus, setSelectedSlideId, setSlideSaveSuccess, setSliderUploadStatus, slideSaveSuccess, sliderUploadStatus }: AdminKustomisasiSegmentProps) {
  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
                <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2 text-left">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      ADMIN BRANDING CONSOLE
                    </span>
                    <h3 className="text-xl font-black font-sans tracking-tight">
                      Kustomisasi Identitas & Slide Landing Page
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Sesuaikan nama institusi LPK, lambang lencana, palet rona
                      tema, serta galeri gambar slideshow secara waktu nyata tanpa
                      melakukan kompilasi ulang (re-build).
                    </p>
                  </div>
                  {saveSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-bounce">
                      <Check className="h-4 w-4 bg-emerald-500 text-slate-950 rounded-full p-0.5" />
                      <span>Berhasil Disinkronkan!</span>
                    </div>
                  )}
                </div>
    
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                  {/* Left side: Customize logo, icons and themes */}
                  <div className="lg:col-span-7 bg-white p-4.5 sm:p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-xs space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Palette className="h-5 w-5 text-indigo-600" />
                      <h4 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide">
                        Logo & Tema Dasar
                      </h4>
                    </div>
    
                    <ConfirmForm
                      confirmTitle="Simpan Pengaturan Visual"
                      confirmMessage="Menerapkan kustomisasi ini secara publik (semua pendaftar langsung dapat melihatnya)?"
                      onSubmit={handleSaveCustomization}
                      className="space-y-6"
                    >
                      {/* 1. Logo Text input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Nama LPK (Logo Utama)
                        </label>
                        <input
                          type="text"
                          required
                          value={custLogoText || ""}
                          onChange={(e) => setCustLogoText(e.target.value)}
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-indigo-500 focus:bg-white transition"
                          placeholder="Contoh: LPK Source Course"
                        />
                        <p className="text-[10px] text-slate-400 block pt-1">
                          Direkomendasikan menggunakan nama resmi LPK agar tampak
                          kredibel.
                        </p>
                      </div>
    
                      {/* 1.5. Logo Image Upload input */}
                      <div className="space-y-2.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>File Gambar Logo LPK (Upload Baru)</span>
                          {custLogoUrl && (
                            <button
                              type="button"
                              onClick={() => setCustLogoUrl("")}
                              className="text-[10px] text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-1 hover:underline transition cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" /> Hapus Logo Upload
                            </button>
                          )}
                        </label>
    
                        {/* Current Active Logo Status Banner */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="h-12 w-12 bg-white rounded-xl border border-slate-150 flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0">
                            {custLogoUrl ? (
                              <img
                                src={custLogoUrl}
                                alt="Custom Logo Preview"
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="text-slate-400 flex flex-col items-center">
                                <Plus className="h-4 w-4" />
                                <span className="text-[7px] font-bold">
                                  ICON MODE
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-[11px] font-bold text-slate-800 leading-snug">
                              {custLogoUrl
                                ? "Menggunakan Logo Unggahan"
                                : "Menggunakan Icon Lencana Vektor"}
                            </p>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              {custLogoUrl
                                ? "Logo unggahan berformat gambar akan menggantikan lencana ikon di atas pada seluruh bagian aplikasi."
                                : "Pilih file gambar Anda di area drag-drop di bawah ini untuk mengganti ikon."}
                            </p>
                          </div>
                        </div>
    
                        {/* Drag-Drop Zone container */}
                        <div
                          onDragEnter={handleLogoDrag}
                          onDragLeave={handleLogoDrag}
                          onDragOver={handleLogoDrag}
                          onDrop={handleLogoDrop}
                          className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            custLogoDragActive
                              ? "border-indigo-600 bg-indigo-50/40 text-indigo-950"
                              : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 text-slate-500"
                          }`}
                        >
                          <input
                            type="file"
                            id="input-file-logo"
                            accept="image/*"
                            onChange={handleLogoFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          <div className="space-y-1.5 pointer-events-none flex flex-col items-center">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                              <Plus className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="text-[11px] font-bold text-slate-700">
                              Seret & Letakkan gambar di sini, atau{" "}
                              <span className="text-indigo-600 font-extrabold underline">
                                Cari File
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400">
                              Direkomendasikan format PNG transparan atau JPEG
                              (Maks. 2MB)
                            </p>
                          </div>
                        </div>
                      </div>
    
                      {/* 1.75. Favicon Upload input */}
                      <div className="space-y-2.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>File Gambar Favicon (Icon Tab Browser)</span>
                          {custFaviconUrl && (
                            <button
                              type="button"
                              onClick={() => setCustFaviconUrl("")}
                              className="text-[10px] text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-1 hover:underline transition cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" /> Hapus Favicon Upload
                            </button>
                          )}
                        </label>
    
                        {/* Current Active Favicon Status Banner */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="h-10 w-10 bg-white rounded-xl border border-slate-150 flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0">
                            {custFaviconUrl ? (
                              <img
                                src={custFaviconUrl}
                                alt="Custom Favicon Preview"
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="text-slate-400 flex flex-col items-center">
                                <Plus className="h-4 w-4" />
                                <span className="text-[7px] font-bold">
                                  DEF MODE
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-[11px] font-bold text-slate-800 leading-snug">
                              {custFaviconUrl
                                ? "Menggunakan Favicon Unggahan"
                                : "Menggunakan Favicon Default LPK SCI"}
                            </p>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              {custFaviconUrl
                                ? "Favicon kustom akan ditampilkan di tab browser pengguna Anda."
                                : "Pilih file gambar Anda (disarankan format square/PNG) untuk mengganti icon tab browser."}
                            </p>
                          </div>
                        </div>
    
                        {/* Drag-Drop Zone container for Favicon */}
                        <div
                          onDragEnter={handleFaviconDrag}
                          onDragLeave={handleFaviconDrag}
                          onDragOver={handleFaviconDrag}
                          onDrop={handleFaviconDrop}
                          className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            custFaviconDragActive
                              ? "border-indigo-600 bg-indigo-50/40 text-indigo-950"
                              : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 text-slate-500"
                          }`}
                        >
                          <input
                            type="file"
                            id="input-file-favicon"
                            accept="image/*"
                            onChange={handleFaviconFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          <div className="space-y-1.5 pointer-events-none flex flex-col items-center">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                              <Plus className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="text-[11px] font-bold text-slate-700">
                              Seret & Letakkan favicon di sini, atau{" "}
                              <span className="text-indigo-600 font-extrabold underline">
                                Cari File
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400">
                              Disarankan format PNG/ICO square, rasio 1:1 (Maks. 500KB)
                            </p>
                          </div>
                        </div>
                      </div>
    
                      {/* 2. Logo Icon Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 block">
                          Lencana Lambang (Icon)
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {[
                            { name: "GraduationCap", ic: GraduationCap },
                            { name: "Award", ic: Award },
                            { name: "BookOpen", ic: BookOpen },
                            { name: "Globe", ic: Globe },
                            { name: "Anchor", ic: Anchor },
                            { name: "Compass", ic: Compass },
                            { name: "Sparkles", ic: Sparkles },
                            { name: "Heart", ic: Heart },
                            { name: "Landmark", ic: Landmark },
                          ].map((item) => {
                            const IconComponent = item.ic;
                            const isSelected = custLogoIcon === item.name;
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => setCustLogoIcon(item.name)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer text-[10px] gap-1.5 ${
                                  isSelected
                                    ? "bg-slate-950 text-white border-slate-950 shadow-sm font-bold"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                <IconComponent className="h-4 w-4" />
                                <span className="truncate max-w-full text-[8px]">
                                  {item.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
    
                      {/* 3. Theme Color Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 block">
                          Palet Rona Tema Utama
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            {
                              id: "blue",
                              label: "Midnight Blue",
                              bg: "bg-blue-600",
                            },
                            {
                              id: "indigo",
                              label: "Kyoto Indigo",
                              bg: "bg-indigo-600",
                            },
                            {
                              id: "rose",
                              label: "Osaka",
                              bg: "bg-rose-500",
                            },
                            {
                              id: "emerald",
                              label: "Teal Shizuoka",
                              bg: "bg-emerald-600",
                            },
                            {
                              id: "amber",
                              label: "Golden Fuji",
                              bg: "bg-amber-500",
                            },
                            {
                              id: "slate",
                              label: "Slate Washitsu",
                              bg: "bg-slate-600",
                            },
                          ].map((col) => {
                            const isSelected = custThemeColor === col.id;
                            return (
                              <button
                                key={col.id}
                                type="button"
                                onClick={() => setCustThemeColor(col.id)}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition text-left cursor-pointer text-xs ${
                                  isSelected
                                    ? "bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <span
                                  className={`h-4 w-4 rounded-full shadow-inner ${col.bg}`}
                                ></span>
                                <span>{col.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
    
                      <button
                        type="submit"
                        className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white font-black py-3 rounded-2xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Check className="h-4 w-4 stroke-[3]" /> Simpan Kustomisasi
                        Identitas
                      </button>
                    </ConfirmForm>
                  </div>
    
                  {/* Right side: Realtime Preview Mockup Box */}
                  <div className="lg:col-span-5 bg-slate-50 border border-slate-200/60 rounded-3xl p-4.5 sm:p-6 md:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-widest">
                        LIVE LAYOUT PREVIEW
                      </span>
                      <h4 className="font-sans font-bold text-slate-800 text-sm">
                        Pratinjau Hasil Desain Navbar
                      </h4>
                    </div>
    
                    {/* Mock Navbar Item Representation */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-xl blur-xs opacity-40 bg-indigo-500 animate-pulse"></div>
                          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white shadow-md">
                            {/* Dynamically render matching icon preview */}
                            {(() => {
                              const iconMap: {
                                [key: string]: React.ComponentType<any>;
                              } = {
                                GraduationCap,
                                Award,
                                BookOpen,
                                Globe,
                                Anchor,
                                Compass,
                                Sparkles,
                                Heart,
                                Landmark,
                              };
                              const IconToRender =
                                iconMap[custLogoIcon || "GraduationCap"] ||
                                GraduationCap;
                              return (
                                <IconToRender className="h-4.5 w-4.5 text-blue-400" />
                              );
                            })()}
                          </div>
                        </div>
                        <div>
                          <span className="font-sans text-xs font-black tracking-tight text-slate-900 block leading-none uppercase text-left">
                            {custLogoText || "LPK Source Course"}
                          </span>
                          <span className="text-[7.5px] font-sans font-bold text-slate-400 block tracking-wide uppercase pt-0.5 text-left">
                            DKP & Bahasa Jepang Resmi
                          </span>
                        </div>
                      </div>
    
                      <div className="flex gap-1.5 text-[8px] font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          FRONTEND
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-white ${
                            {
                              blue: "bg-blue-600",
                              indigo: "bg-indigo-600",
                              rose: "bg-rose-500",
                              emerald: "bg-emerald-600",
                              amber: "bg-amber-500",
                              slate: "bg-slate-600",
                            }[custThemeColor || "blue"]
                          }`}
                        >
                          ACTIVE
                        </span>
                      </div>
                    </div>
    
                    <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 text-[11px] leading-relaxed font-normal text-left">
                      <h5 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> Cara Kerja
                        Sinkronisasi
                      </h5>
                      Instalasi penyesuaian ini dijalankan secara instan. Ketika
                      Anda mengklik tombol "Simpan Kustomisasi", sistem akan
                      menyimpan status barunya ke memori server utama,
                      mendistribusikannya ke seluruh komponen situs web pendaftar
                      secara otomatis tanpa perlu mematikan container.
                    </div>
                  </div>
                </div>
    
                {/* KOORDINAT & RADIUS ABSENSI */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                      <div>
                        <h4 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide">
                          Pengaturan Lokasi Kantor & Radius Presensi (Admin / VVIP)
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Konfigurasi titik pusat GPS LPK dan jarak maksimum kehadiran fisik (default: 200 meter).
                        </p>
                      </div>
                    </div>
                    {/* Save button for coordinates only */}
                    <button
                      type="button"
                      onClick={async () => {
                        const latVal = parseFloat(officeLat);
                        const lonVal = parseFloat(officeLon);
                        const radVal = parseInt(officeRadius, 10);
                        if (isNaN(latVal) || isNaN(lonVal) || isNaN(radVal)) {
                          alert("⚠️ Koordinat atau radius yang diisi tidak valid.");
                          return;
                        }
                        const ok = await onUpdateState("customization", "update", {
                          officeLocation: {
                            latitude: latVal,
                            longitude: lonVal,
                            radius: radVal,
                            enforce: officeEnforce !== null ? officeEnforce : true
                          }
                        });
                        if (ok) {
                          alert("✅ Berhasil menyimpan pengaturan koordinat & radius presensi!");
                        } else {
                          alert("⚠️ Gagal menyimpan pengaturan.");
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Simpan Lokasi Presensi
                    </button>
                  </div>
    
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Latitude */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Garis Lintang (Latitude)
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={officeLat || ""}
                            onChange={(e) => setOfficeLat(e.target.value)}
                            className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition"
                            placeholder="Gunakan tombol Deteksi Koordinat di bawah"
                          />
                        </div>
    
                        {/* Longitude */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Garis Bujur (Longitude)
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={officeLon || ""}
                            onChange={(e) => setOfficeLon(e.target.value)}
                            className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition"
                            placeholder="Gunakan tombol Deteksi Koordinat di bawah"
                          />
                        </div>
                      </div>
    
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Radius */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Radius Toleransi (Meter)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              required
                              value={officeRadius || ""}
                              onChange={(e) => setOfficeRadius(e.target.value)}
                              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-10 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition"
                              placeholder="200"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                              meter
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 block">
                            Jarak aman standar adalah 200 meter dari titik koordinat.
                          </p>
                        </div>
    
                        {/* Enforce */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Validasi Lokasi Aktif
                          </label>
                          <div className="flex items-center gap-2 py-2">
                            <input
                              type="checkbox"
                              checked={!!officeEnforce}
                              onChange={(e) => setOfficeEnforce(e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-750">
                              Wajibkan presensi dari dalam radius kantor (Luring)
                            </span>
                          </div>
                        </div>
                      </div>
    
                      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  setOfficeLat(String(position.coords.latitude));
                                  setOfficeLon(String(position.coords.longitude));
                                  alert("📍 Koordinat lokasi Anda saat ini berhasil dideteksi dan diisi!");
                                },
                                (error) => {
                                  alert(`⚠️ Gagal mendeteksi lokasi: ${error.message}`);
                                }
                              );
                            } else {
                              alert("⚠️ Browser Anda tidak mendukung pendeteksian lokasi GPS.");
                            }
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
                        >
                          📍 Deteksi Koordinat Saya Saat Ini
                        </button>
                      </div>
                    </div>
    
                    <div className="md:col-span-4 bg-slate-50 p-4 border border-slate-200/60 rounded-2xl flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">
                          📍 Status Koordinat Saat Ini
                        </span>
                        <div className="space-y-1 font-mono text-xs text-slate-700 font-bold">
                          <div>Lat: <span className="text-indigo-700">{officeLat || "Belum diatur"}</span></div>
                          <div>Lon: <span className="text-indigo-700">{officeLon || "Belum diatur"}</span></div>
                          <div>Radius: <span className="text-indigo-700">{officeRadius || "200"} m</span></div>
                          <div>Enforce: <span className="text-indigo-700">{officeEnforce ? "Aktif (Wajib)" : "Nonaktif"}</span></div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        Sistem akan menghitung jarak koordinat GPS smartphone pengajar ketika melakukan presensi secara real-time dan membandingkannya dengan koordinat ini. Jika jarak melebihi <strong>{officeRadius || "200"} meter</strong>, presensi akan otomatis ditolak oleh sistem.
                      </p>
                    </div>
                  </div>
                </div>
    
                {/* BELOW: Slideshow Editor Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-indigo-600" />
                      <h4 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide">
                        Galeri & Slideshow Foto Utama
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const existingIds = custSlides.filter(s => typeof s.id === 'number').map(s => s.id);
                        const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
                        const newSlide = {
                          id: newId,
                          tag: "🌟 PROGRAM UNGGULAN BARU",
                          title:
                            "Daftar Sekarang Juga Untuk Angkatan Musim Panas 2026/2027",
                          description:
                            "Bimbingan terstruktur dan komprehensif bersama Sensei & Senpai berpengalaman di LPK kami.",
                          image:
                            "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80",
                          accent: "from-blue-500 through-indigo-500 to-purple-500",
                          glowColor: "shadow-indigo-500/25",
                          statValue: "100% Kontrak Kerja",
                          statText: "Siswa Terdaftar Berangkat",
                          actionText: "Daftar Sekarang 🚀",
                        };
                        setCustSlides(prev => [...(prev || []), newSlide]);
                        setSelectedSlideId(newId);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tambah Slide Baru
                    </button>
                  </div>
    
                  {custSlides.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      Tidak ada slide konfigurasional. Silakan klik "Tambah Slide
                      Baru".
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                      {custSlides.map((slide, sIdx) => {
                        const isEditing = selectedSlideId === slide.id;
                        return (
                          <div
                            key={slide.id}
                            className={`rounded-2xl border transition overflow-hidden flex flex-col justify-between ${
                              isEditing
                                ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white"
                                : "border-slate-200 hover:border-slate-300 bg-slate-50/20"
                            }`}
                          >
                            {/* Image Preview Thumbnail */}
                            <div
                              className="relative h-28 w-full bg-slate-950 bg-cover bg-center"
                              style={{ backgroundImage: `url('${slide.image || "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80"}')` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                              <div className="absolute bottom-2 left-2 right-2 text-left">
                                <span className="text-[8px] bg-slate-900/60 font-bold px-1.5 py-0.5 rounded-md text-slate-200 border border-slate-700/60 uppercase select-none inline-block w-max truncate max-w-full">
                                  {slide.tag || "SLIDE"}
                                </span>
                                <span className="text-[10px] text-white font-extrabold truncate block mt-1 drop-shadow-sm leading-tight">
                                  {slide.title || "No Title"}
                                </span>
                              </div>
                            </div>
    
                            {/* Info & Editing forms */}
                            <div className="p-3 text-xs text-left text-slate-600 flex-1 space-y-2">
                              {isEditing ? (
                                <div className="space-y-2 pt-1.5 text-left">
                                  <div>
                                    <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                      Tag Badge
                                    </label>
                                    <input
                                      type="text"
                                      value={slide.tag || ""}
                                      onChange={(e) => {
                                        const updated = [...custSlides];
                                        updated[sIdx] = {
                                          ...updated[sIdx],
                                          tag: e.target.value,
                                        };
                                        setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                      }}
                                      className="w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                      Judul Slide
                                    </label>
                                    <input
                                      type="text"
                                      value={slide.title || ""}
                                      onChange={(e) => {
                                        const updated = [...custSlides];
                                        updated[sIdx] = {
                                          ...updated[sIdx],
                                          title: e.target.value,
                                        };
                                        setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                      }}
                                      className="w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                      Deskripsi Ringkas
                                    </label>
                                    <textarea
                                      value={slide.description || ""}
                                      onChange={(e) => {
                                        const updated = [...custSlides];
                                        updated[sIdx] = {
                                          ...updated[sIdx],
                                          description: e.target.value,
                                        };
                                        setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                      }}
                                      className="w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500 min-h-[45px] leading-snug"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                      Tautan Gambar (URL/Unsplash) atau Upload Gambar
                                    </label>
                                    <div className="flex flex-col gap-1">
                                      <input
                                        type="text"
                                        value={slide.image || ""}
                                        placeholder="Tempel URL gambar di sini"
                                        onChange={(e) => {
                                          const updated = [...custSlides];
                                          updated[sIdx] = {
                                            ...updated[sIdx],
                                            image: e.target.value,
                                          };
                                          setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                        }}
                                        className="w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500 font-mono"
                                      />
                                      <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-bold text-slate-400">ATAU</span>
                                        <label className="relative text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer transition">
                                          Upload File
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                setSliderUploadStatus(prev => ({ ...prev, [sIdx]: 'loading' }));
                                                uploadFileToFirebase(file, "customization").then(url => {
                                                  const updated = [...custSlides];
                                                  updated[sIdx] = {
                                                    ...updated[sIdx],
                                                    image: url,
                                                  };
                                                  setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                                  onUpdateState("slideshows", "update", updated);
                                                  setSliderUploadStatus(prev => ({ ...prev, [sIdx]: 'success' }));
                                                  setTimeout(() => setSliderUploadStatus(prev => ({ ...prev, [sIdx]: undefined as any })), 3000);
                                                }).catch(err => { 
                                                  console.error(err); 
                                                  alert("Gagal upload slide"); 
                                                  setSliderUploadStatus(prev => ({ ...prev, [sIdx]: undefined as any }));
                                                });
                                              }
                                            }}
                                          />
                                          {sliderUploadStatus[sIdx] === 'loading' && (
                                            <div className="absolute right-0 top-0 flex items-center gap-1 text-[8px] text-indigo-600 font-bold bg-white px-1 rounded-sm shadow-xs border border-indigo-200">
                                              <LoaderCircle className="w-2.5 h-2.5 animate-spin" /> Uploading...
                                            </div>
                                          )}
                                          {sliderUploadStatus[sIdx] === 'success' && (
                                            <div className="absolute right-0 top-0 flex items-center gap-1 text-[8px] text-emerald-600 font-bold bg-white px-1 rounded-sm shadow-xs border border-emerald-200">
                                              <Check className="w-2.5 h-2.5" /> OK
                                            </div>
                                          )}
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                      <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                        Nilai Stat
                                      </label>
                                      <input
                                        type="text"
                                        value={slide.statValue || ""}
                                        onChange={(e) => {
                                          const updated = [...custSlides];
                                          updated[sIdx] = {
                                            ...updated[sIdx],
                                            statValue: e.target.value,
                                          };
                                          setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                          onUpdateState("slideshows", "update", updated);
                                        }}
                                        className="w-full text-[10px] p-1 border rounded-md bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                        Keterangan Stat
                                      </label>
                                      <input
                                        type="text"
                                        value={slide.statText || ""}
                                        onChange={(e) => {
                                          const updated = [...custSlides];
                                          updated[sIdx] = {
                                            ...updated[sIdx],
                                            statText: e.target.value,
                                          };
                                          setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                          onUpdateState("slideshows", "update", updated);
                                        }}
                                        className="w-full text-[10px] p-1 border rounded-md bg-white"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                      <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                        Teks Tombol
                                      </label>
                                      <input
                                        type="text"
                                        value={slide.actionText || ""}
                                        onChange={(e) => {
                                          const updated = [...custSlides];
                                          updated[sIdx] = {
                                            ...updated[sIdx],
                                            actionText: e.target.value,
                                          };
                                          setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                          onUpdateState("slideshows", "update", updated);
                                        }}
                                        className="w-full text-[10px] p-1 border rounded-md bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                        Gradien Aksen
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="from-blue-500 through-indigo-500 to-purple-500"
                                        value={slide.accent || ""}
                                        onChange={(e) => {
                                          const updated = [...custSlides];
                                          updated[sIdx] = {
                                            ...updated[sIdx],
                                            accent: e.target.value,
                                          };
                                          setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                          onUpdateState("slideshows", "update", updated);
                                        }}
                                        className="w-full text-[10px] p-1 border rounded-md bg-white font-mono"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5 pt-1 text-left">
                                  <p className="line-clamp-3 text-[11px] leading-snug">
                                    {slide.description}
                                  </p>
                                  <div className="border-t border-slate-100 py-1 flex items-center justify-between text-[10px] font-mono select-none">
                                    <span className="text-slate-400">Stat:</span>
                                    <span className="text-slate-800 font-bold">
                                      {slide.statValue} / {slide.statText}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
    
                            {/* Actions footer */}
                            <div className="bg-slate-100 px-3 py-2 flex items-center justify-between border-t border-slate-200">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    setSelectedSlideId(null);
                                  } else {
                                    setSelectedSlideId(slide.id);
                                  }
                                }}
                                className={`font-black text-[9px] px-2.5 py-1 rounded-md transition uppercase cursor-pointer ${
                                  isEditing
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                }`}
                              >
                                {isEditing ? "Selesai" : "Sunting"}
                              </button>
    
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = custSlides.filter(
                                    (s) => s.id !== slide.id,
                                  );
                                  setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                  onUpdateState("slideshows", "update", updated);
                                  if (selectedSlideId === slide.id) {
                                    setSelectedSlideId(null);
                                  }
                                }}
                                className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition"
                                title="Hapus Slide"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
    
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <ConfirmForm
                      confirmTitle="Simpan Slideshow"
                      confirmMessage="Menerapkan gambar dan teks slideshow ini ke beranda publik secara instan?"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const ok = await onUpdateState("slideshows", "update", custSlides);
                        if (ok) {
                          setSlideSaveSuccess(true);
                          setTimeout(() => setSlideSaveSuccess(false), 3000);
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="h-4 w-4" /> 
                        {slideSaveSuccess ? "Berhasil Disimpan!" : "Simpan Masukan Slideshow & Branding"}
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
                        <LayoutTemplate className="h-6 w-6 text-indigo-600" />
                        Kustomisasi Konten Halaman Depan
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Sesuaikan teks dan konten untuk bagian Ekosistem, Alumni, dan Program di halaman depan.
                      </p>
                    </div>
                  </div>
                  
                  {custLandingConfig && (
                    <div className="space-y-8">
                      {/* Hero Section */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Ucapan Selamat Datang (Hero)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Judul Utama</label>
                            <input type="text" value={custLandingConfig.heroTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, heroTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Subjudul Utama</label>
                            <textarea value={custLandingConfig.heroSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, heroSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                          </div>
                        </div>
                      </div>
    
                      {/* Ekosistem Section */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Ekosistem (Gen-Z Perks)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Judul Ekosistem</label>
                            <input type="text" value={custLandingConfig.ecosystemTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, ecosystemTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Subjudul Ekosistem</label>
                            <textarea value={custLandingConfig.ecosystemSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, ecosystemSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                          </div>
                        </div>
                        
                        {/* Perks Items Editor */}
                        <div className="space-y-2 mt-4">
                          <label className="text-xs font-bold text-slate-700 block">Daftar Fitur Ekosistem</label>
                          <div className="space-y-3">
                            {custLandingConfig.perks?.map((perk: any, idx: number) => (
                              <div key={perk.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 relative">
                                <div className="md:col-span-3 space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Judul Fitur</label>
                                  <input type="text" value={perk.title || ""} onChange={(e) => {
                                    const newPerks = [...custLandingConfig.perks];
                                    newPerks[idx] = { ...perk, title: e.target.value };
                                    setCustLandingConfig({ ...custLandingConfig, perks: newPerks });
                                  }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" />
                                </div>
                                <div className="md:col-span-8 space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Deskripsi Fitur</label>
                                  <textarea value={perk.desc || ""} onChange={(e) => {
                                    const newPerks = [...custLandingConfig.perks];
                                    newPerks[idx] = { ...perk, desc: e.target.value };
                                    setCustLandingConfig({ ...custLandingConfig, perks: newPerks });
                                  }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" rows={2} />
                                </div>
                                <div className="md:col-span-1 flex items-end pb-1 justify-end">
                                  <button type="button" onClick={() => {
                                    const newPerks = custLandingConfig.perks.filter((_: any, i: number) => i !== idx);
                                    setCustLandingConfig({ ...custLandingConfig, perks: newPerks });
                                  }} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => {
                              const newId = custLandingConfig.perks?.length > 0 ? Math.max(...custLandingConfig.perks.map((p: any) => p.id || 0)) + 1 : 1;
                              const newPerk = { id: newId, title: "Fitur Baru", desc: "Deskripsi", color: "blue" };
                              setCustLandingConfig({ ...custLandingConfig, perks: [...(custLandingConfig.perks || []), newPerk] });
                            }} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                              <Plus className="h-3.5 w-3.5" /> Tambah Fitur
                            </button>
                          </div>
                        </div>
                      </div>
    
                      {/* Alumni Section */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Apa Kata Alumni</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Judul Testimoni</label>
                            <input type="text" value={custLandingConfig.alumniTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, alumniTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Subjudul Testimoni</label>
                            <textarea value={custLandingConfig.alumniSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, alumniSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                          </div>
                        </div>
    
                        {/* Testimonials Items Editor */}
                        <div className="space-y-2 mt-4">
                          <label className="text-xs font-bold text-slate-700 block">Daftar Testimoni</label>
                          <div className="space-y-3">
                            {custLandingConfig.testimonials?.map((testimonial: any, idx: number) => (
                              <div key={testimonial.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 relative">
                                <div className="md:col-span-3 space-y-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">Nama Alumni</label>
                                    <input type="text" value={testimonial.name} onChange={(e) => {
                                      const newItems = [...custLandingConfig.testimonials];
                                      newItems[idx] = { ...testimonial, name: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                                    }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">Peran / Pekerjaan</label>
                                    <input type="text" value={testimonial.role || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.testimonials];
                                      newItems[idx] = { ...testimonial, role: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                                    }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" />
                                  </div>
                                </div>
                                <div className="md:col-span-8 space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Isi Testimoni</label>
                                  <textarea value={testimonial.content || ""} onChange={(e) => {
                                    const newItems = [...custLandingConfig.testimonials];
                                    newItems[idx] = { ...testimonial, content: e.target.value };
                                    setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                                  }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden h-full min-h-[4rem]" />
                                </div>
                                <div className="md:col-span-1 flex items-end pb-1 justify-end">
                                  <button type="button" onClick={() => {
                                    const newItems = custLandingConfig.testimonials.filter((_: any, i: number) => i !== idx);
                                    setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                                  }} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => {
                              const newId = custLandingConfig.testimonials?.length > 0 ? Math.max(...custLandingConfig.testimonials.map((p: any) => p.id || 0)) + 1 : 1;
                              const newItem = { id: newId, name: "Nama Baru", role: "Peran Baru", content: "Isi testimoni" };
                              setCustLandingConfig({ ...custLandingConfig, testimonials: [...(custLandingConfig.testimonials || []), newItem] });
                            }} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                              <Plus className="h-3.5 w-3.5" /> Tambah Testimoni
                            </button>
                          </div>
                        </div>
                      </div>
    
                      {/* Programs Section */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Program Pemagangan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Judul Program</label>
                            <input type="text" value={custLandingConfig.programsTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, programsTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Subjudul Program</label>
                            <textarea value={custLandingConfig.programsSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, programsSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                          </div>
                        </div>
    
                        {/* Programs Items Editor */}
                        <div className="space-y-2 mt-4">
                          <label className="text-xs font-bold text-slate-700 block">Daftar Program</label>
                          <div className="space-y-3">
                            {custLandingConfig.programs?.map((program: any, idx: number) => (
                              <div key={program.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 relative">
                                <div className="md:col-span-3 space-y-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">Tag (Pita)</label>
                                    <input type="text" value={program.tag || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.programs];
                                      newItems[idx] = { ...program, tag: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                                    }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden uppercase" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">Judul Program</label>
                                    <input type="text" value={program.title || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.programs];
                                      newItems[idx] = { ...program, title: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                                    }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" />
                                  </div>
                                </div>
                                <div className="md:col-span-8 space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Deskripsi Program</label>
                                  <textarea value={program.desc || ""} onChange={(e) => {
                                    const newItems = [...custLandingConfig.programs];
                                    newItems[idx] = { ...program, desc: e.target.value };
                                    setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                                  }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden h-full min-h-[4rem]" />
                                </div>
                                <div className="md:col-span-1 flex items-end pb-1 justify-end">
                                  <button type="button" onClick={() => {
                                    const newItems = custLandingConfig.programs.filter((_: any, i: number) => i !== idx);
                                    setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                                  }} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => {
                              const newId = custLandingConfig.programs?.length > 0 ? Math.max(...custLandingConfig.programs.map((p: any) => p.id || 0)) + 1 : 1;
                              const newItem = { id: newId, title: "Program Baru", desc: "Deskripsi", tag: "INFO" };
                              setCustLandingConfig({ ...custLandingConfig, programs: [...(custLandingConfig.programs || []), newItem] });
                            }} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                              <Plus className="h-3.5 w-3.5" /> Tambah Program
                            </button>
                          </div>
                        </div>
                      </div>
    
                      {/* Biaya Section */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Biaya & Transparansi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Judul Biaya</label>
                            <input type="text" value={custLandingConfig.biayaTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, biayaTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Subjudul Biaya</label>
                            <textarea value={custLandingConfig.biayaSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, biayaSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                          </div>
                        </div>
                      </div>
    
    
    
                      {/* Opportunity Images Section */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Gambar Kesempatan (3 Foto Utama)</h4>
                        {custLandingConfig.opportunityImages && custLandingConfig.opportunityImages.length >= 3 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[0, 1, 2].map((idx) => (
                              <div key={idx} className="space-y-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-slate-700 block">Label Gambar {idx + 1}</label>
                                  <input
                                    type="text"
                                    value={custLandingConfig.opportunityImages![idx].label || ""}
                                    onChange={(e) => {
                                      const newImages = [...custLandingConfig.opportunityImages!];
                                      newImages[idx] = { ...newImages[idx], label: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, opportunityImages: newImages });
                                    }}
                                    className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-hidden focus:border-indigo-500 transition"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-slate-700 block">Link Gambar (URL) atau Upload {idx + 1}</label>
                                  <input
                                    type="text"
                                    placeholder="https://images.unsplash.com/..."
                                    value={custLandingConfig.opportunityImages![idx].url || ""}
                                    onChange={(e) => {
                                      const newImages = [...custLandingConfig.opportunityImages!];
                                      newImages[idx] = { ...newImages[idx], url: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, opportunityImages: newImages });
                                    }}
                                    className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-hidden focus:border-indigo-500 transition mb-2"
                                  />
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setOppUploadStatus(prev => ({ ...prev, [idx]: 'loading' }));
                                          uploadFileToFirebase(file, "customization").then(url => {
                                            const newImages = [...custLandingConfig.opportunityImages!];
                                            newImages[idx] = { ...newImages[idx], url: url };
                                            const updatedConfig = { ...custLandingConfig, opportunityImages: newImages };
                                            setCustLandingConfig(updatedConfig);
                                            // Auto-save when an image is successfully uploaded
                                            onUpdateState("customization", "update", { landingConfig: updatedConfig });
                                            setOppUploadStatus(prev => ({ ...prev, [idx]: 'success' }));
                                            setTimeout(() => setOppUploadStatus(prev => ({ ...prev, [idx]: undefined as any })), 3000);
                                          }).catch(err => { 
                                            console.error(err); 
                                            alert("Gagal upload gambar"); 
                                            setOppUploadStatus(prev => ({ ...prev, [idx]: undefined as any }));
                                          });
                                        }
                                      }}
                                      className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-hidden focus:border-indigo-500 transition"
                                    />
                                    {oppUploadStatus[idx] === 'loading' && (
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-white px-1">
                                        <LoaderCircle className="w-3 h-3 animate-spin" /> Uploading...
                                      </div>
                                    )}
                                    {oppUploadStatus[idx] === 'success' && (
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-white px-1">
                                        <Check className="w-3 h-3" /> Berhasil
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {custLandingConfig.opportunityImages![idx].url && (
                                  <div className="h-20 rounded border border-slate-200 bg-slate-100 overflow-hidden relative mt-2">
                                    <img src={custLandingConfig.opportunityImages![idx].url} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
    
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <ConfirmForm
                      confirmTitle="Simpan Halaman Depan"
                      confirmMessage="Menerapkan teks ini ke beranda publik secara instan?"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const ok = await onUpdateState("customization", "update", {
                          landingConfig: custLandingConfig,
                        });
                        if (ok) {
                          setLandingSaveSuccess(true);
                          setTimeout(() => setLandingSaveSuccess(false), 3000);
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="h-4 w-4" /> 
                        {landingSaveSuccess ? "Berhasil Disimpan!" : "Simpan Halaman Depan"}
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
              </div>
  );
}
