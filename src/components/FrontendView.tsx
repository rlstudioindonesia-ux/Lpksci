/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ConfirmForm } from "./ConfirmForm";
import {
  Globe,
  MapPin,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Send,
  Building,
  Briefcase,
  Heart,
  HeartHandshake,
  HelpCircle,
  Activity,
  Award,
  Star,
  Sparkles,
  Smartphone,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  ShieldCheck,
  QrCode,
  Upload,
  FileText,
  User,
  Users,
  GraduationCap,
  MonitorPlay,
  FileEdit,
  Calendar,
  Clock,
  Image as ImageIcon,
  Download,
  Maximize2,
  X,
  Eye,
  Camera,
} from "lucide-react";
import { RegisteredStudent, ActiveStudent, ALL_48_PREFECTURES_COORDINATES } from "../types";

export function parsePrice(val: any): number {
  if (val === undefined || val === null) return 0;
  let str = String(val).trim().toLowerCase();
  if (!str) return 0;
  
  if (/juta|jt/i.test(str)) {
    const numPart = str.replace(/juta|jt/gi, "").trim().replace(",", ".");
    const parsed = parseFloat(numPart);
    if (!isNaN(parsed)) {
      return Math.round(parsed * 1000000);
    }
  }
  
  const digits = str.replace(/\D/g, "");
  const num = parseInt(digits, 10);
  return isNaN(num) ? 0 : num;
}

export function formatRupiah(val: any): string {
  if (val === undefined || val === null) return "";
  let str = String(val).trim();
  if (!str) return "";
  
  if (/^Rp\s?\d{1,3}(\.\d{3})+$/i.test(str)) {
    return str.replace(/^rp\s*/i, "Rp ");
  }

  if (/juta|jt/i.test(str)) {
    const numPart = str.toLowerCase().replace(/juta|jt/gi, "").trim().replace(",", ".");
    const parsed = parseFloat(numPart);
    if (!isNaN(parsed)) {
      return `Rp ${Math.round(parsed * 1000000).toLocaleString("id-ID")}`;
    }
  }

  const digits = str.replace(/\D/g, "");
  const num = parseInt(digits, 10);
  if (isNaN(num)) {
    return str;
  }
  
  return `Rp ${num.toLocaleString("id-ID")}`;
}

interface FrontendViewProps {
  activeStudents: ActiveStudent[];
  onRegisterSubmit: (formData: any) => Promise<RegisteredStudent | null>;
  customization?: any;
  costConfig?: any;
  slideshows?: any[];
  galleries?: any[];
  onNavigateToRegistration?: () => void;
}

export default function FrontendView({
  activeStudents,
  onRegisterSubmit,
  customization,
  costConfig,
  slideshows = [],
  galleries = [],
  onNavigateToRegistration,
}: FrontendViewProps) {
  // Quick Access active tab
  const [activeFrontendTab, setActiveFrontendTab] = useState<"program" | "biaya" | "map" | "galeri">("program");

  // Selected image for enlarged view & download lightbox modal
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<{ image: string; title?: string; tag?: string; description?: string } | null>(null);

  // Helper for direct image file downloading
  const handleDownloadImage = async (url: string, title: string) => {
    if (!url) return;
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeTitle = (title || "foto_galeri_lpk").toLowerCase().replace(/[^a-z0-9]/g, "_");
      a.download = `${safeTitle}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const safeTitle = (title || "foto_galeri_lpk").toLowerCase().replace(/[^a-z0-9]/g, "_");
      a.download = `${safeTitle}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Global hook for Navbar scroll links
  useEffect(() => {
    (window as any).openFrontendTab = (id: string) => {
      if (['program', 'biaya', 'map-penyebaran', 'galeri', 'join-us'].includes(id)) {
        if (id === 'galeri') {
          setActiveFrontendTab('galeri');
        } else if (id === 'join-us') {
          setActiveFrontendTab('program');
        } else if (id === 'map-penyebaran') {
          setActiveFrontendTab('map');
        } else {
          setActiveFrontendTab(id as any);
        }
        
        setTimeout(() => {
          if (id === 'galeri') {
            document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (id === 'join-us') {
            document.getElementById('join-us')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };
    return () => {
      delete (window as any).openFrontendTab;
    };
  }, []);

  // SOP Pembayaran pricing tabs and registration choices
  const [priceTab, setPriceTab] = useState<"reguler" | "matching">("reguler");

  // Selected prefecture on Japan Map
  const [selectedPref, setSelectedPref] = useState<string | null>("Tokyo");

  // Filter students who are already placed in Japan
  const expatriates = activeStudents.filter((s) => s.status === "Di Jepang");

  // Ref container for dynamic Leaflet map initialization
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // 4 Seconds Gen-Z Slideshow Data with gorgeous Japanese Scenery
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultSlides: any[] = [];

  const slides =
    slideshows && slideshows.length > 0
      ? slideshows
      : defaultSlides;

  // 4-Seconds Autoplay Slideshow Effect
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // 4000ms = 4 seconds duration
    return () => clearInterval(timer);
  }, [slides.length]);

  // Helpers for 48 Prefectures regional grouping
  const getPrefectureRegion = (pref: string): string => {
    if (["Hokkaido"].includes(pref)) return "Hokkaido";
    if (["Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima"].includes(pref)) return "Tohoku";
    if (["Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa"].includes(pref)) return "Kanto";
    if (["Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu", "Shizuoka", "Aichi"].includes(pref)) return "Chubu";
    if (["Mie", "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara", "Wakayama"].includes(pref)) return "Kansai";
    if (["Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi"].includes(pref)) return "Chugoku";
    if (["Tokushima", "Kagawa", "Ehime", "Kochi"].includes(pref)) return "Shikoku";
    if (["Fukuoka", "Saga", "Nagasaki", "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa"].includes(pref)) return "Kyushu & Okinawa";
    return "Lainnya";
  };

  const getPrefectureDescription = (pref: string): string => {
    const specialDesc: Record<string, string> = {
      Tokyo: "Hub megapolitan dunia. Sektor bervariasi dari industri kuliner, caregiver swasta, serta packaging logistik dengan upah per jam paling tinggi di Jepang.",
      Osaka: "Pusat industri manufaktur baja berat, konstruksi SSW, dan pengemasan produk makanan olahan dengan vibe kota kuliner yang legendaris.",
      Shizuoka: "Kawasan asri berlatar Gunung Fuji. Terkenal sebagai pusat perkebunan teh modern, perakitan kabel komponen elektrik, dan perakitan suku cadang otomotif.",
      Hokkaido: "Kawasan utara bersalju dengan potensi alam berlimpah. Spesialisasi penempatan di sektor perikanan tangkap dan pengolahan produk laut beku.",
      Kyoto: "Pusat seni budaya tradisional Jepang. Menyediakan banyak peluang kerja untuk asisten perawat panti jompo (caregiver) eksklusif dan hospitality.",
      Fukuoka: "Gerbang utama menuju Jepang selatan yang ramah dan dinamis. Terkenal dengan pertanian hidroponik modern, caregiver sosial, dan perakitan mobil.",
      Nagano: "Kawasan pegunungan subur. Agribisnis tanaman buah apel, sayur musiman dataran tinggi, dan industri pengemasan sayur segar organik.",
    };
    if (specialDesc[pref]) return specialDesc[pref];
    return `Kawasan prefektur ${pref} menawarkan prospek kerja menarik di berbagai bidang seperti manufaktur industri, pertanian modern, asisten perawat (caregiver), pengemasan makanan, serta jasa layanan dengan jaminan kesejahteraan tinggi standar kerja Jepang tahun 2026.`;
  };

  const getPrefectureAccent = (pref: string): string => {
    const accents: Record<string, string> = {
      Tokyo: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      Osaka: "text-teal-400 bg-teal-500/10 border-teal-500/20",
      Shizuoka: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      Hokkaido: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      Kyoto: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      Fukuoka: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      Nagano: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    };
    return accents[pref] || "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
  };

  // Prefecture details helper to display beautiful sidebar details
  const prefectureStats = useMemo(() => {
    const stats: Record<string, { name: string; region: string; description: string; inmates: any[]; accent: string }> = {};
    Object.keys(ALL_48_PREFECTURES_COORDINATES).forEach((pref) => {
      stats[pref] = {
        name: pref,
        region: getPrefectureRegion(pref),
        description: getPrefectureDescription(pref),
        inmates: expatriates.filter((s) => s.prefecture === pref),
        accent: getPrefectureAccent(pref),
      };
    });
    return stats;
  }, [expatriates]);

  // OpenStreetMap dynamic loader
  useEffect(() => {
    // 1. Inject Leaflet CDN style sheet
    const linkId = "leaflet-css-pkg";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet CDN script file
    const scriptId = "leaflet-js-pkg";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      document.body.appendChild(script);
    }

    const loadRadarMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      // Ensure no past double allocations
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map, locked default zoom values
      const map = L.map(mapContainerRef.current, {
        center: [36.2048, 138.2529],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;
      setTimeout(() => { try { if (map && map._container) map.invalidateSize(); } catch (e) {} }, 250);

      // Use OpenStreetMap tile layer
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      ).addTo(map);

      // Use our comprehensive 48 prefectures coordinates map
      const coordinates = ALL_48_PREFECTURES_COORDINATES;

      Object.keys(coordinates).forEach((key) => {
        const [lat, lng] = coordinates[key];
        const info = prefectureStats[key as keyof typeof prefectureStats];
        const isCurrent = selectedPref === key;
        const totalAlumni = info ? info.inmates.length : 0;

        // Visual layout optimization: only plot circles if it is currently selected OR has alumni
        if (!isCurrent && totalAlumni === 0) return;

        const pulseColor = isCurrent
          ? "#3b82f6"
          : totalAlumni > 0
            ? "#10b981"
            : "#64748b";

        // Custom circle marker mimicking glowing endpoints
        const marker = L.circleMarker([lat, lng], {
          radius: isCurrent ? 14 : 9,
          fillColor: pulseColor,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map);

        const inmatesList = info ? info.inmates : [];
        const inmatesHtml = inmatesList
          .map(
            (stu) => `
          <div style="margin-top: 5px; padding-top: 5px; border-top: 1px dashed #e2e8f0;">
            <div style="font-weight: 800; color: #1e293b; font-size: 10px;">${stu.name}</div>
            <div style="font-size: 9px; color: #0d9488; font-weight: 700;">🏢 ${stu.company || "Perusahaan Jepang"}</div>
          </div>
        `,
          )
          .slice(0, 3)
          .join("");
        const hasMore =
          inmatesList.length > 3
            ? `<div style="font-size: 8px; color: #64748b; font-style: italic; margin-top: 3.5px; font-weight: 600;">+ ${inmatesList.length - 3} alumni lainnya...</div>`
            : "";

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 11px; padding: 2px; width: 180px;">
            <strong style="color: #0f172a; font-size: 12px; display: block; border-b: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 4px;">🇯🇵 Prefektur ${key}</strong>
            <span style="color: #64748b; font-weight: 500;">Wilayah: ${info?.region || "Jepang"}</span><br/>
            <span style="color: #16a34a; font-weight: 800;">${totalAlumni} Alumni Aktif</span>
            <div style="margin-top: 6px;">
              ${inmatesHtml}
              ${hasMore}
            </div>
          </div>
        `);

        marker.on("click", (e: any) => {
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          setSelectedPref(key);
          map.setView([lat, lng], 10, { animate: false });
        });
      });
    };

    if ((window as any).L) {
      loadRadarMap();
    } else {
      script.addEventListener("load", loadRadarMap);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [expatriates.length, selectedPref, activeFrontendTab]);

  const activeSlide = slides[currentSlide] || slides[0] || { tag: "🗻 LPK SCI JAPAN TRAINING", title: "Raih Karir Profesional Di Jepang", description: "Selamat datang di LPK SCI. Silakan masuk untuk melihat lebih lanjut.", image: "", actionText: "Daftar Sekarang ⚡" };

  return (
    <div className="space-y-24 py-0 bg-[#020617] text-slate-300 relative overflow-hidden">
      {/* Premium ambient backdrop blurs (Replace old borders/backgrounds) */}
      <div className="absolute top-[12%] left-[-15%] w-[450px] h-[450px] rounded-full bg-cyan-400/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[32%] right-[-10%] w-[550px] h-[550px] rounded-full bg-indigo-500/10 blur-[160px] pointer-events-none" />
      <div className="absolute top-[62%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/8 blur-[140px] pointer-events-none" />
      <div className="absolute top-[82%] right-[-15%] w-[520px] h-[520px] rounded-full bg-pink-500/8 blur-[130px] pointer-events-none" />

      {/* 1. DYNAMIC GEN-Z SLIDESHOW LANDING HERO (INTEGRATED MENU) */}
      <section id="hero" className="relative overflow-hidden bg-slate-950 text-white min-h-[580px] md:min-h-[680px] flex items-center transition-all duration-700 shadow-2xl border-b border-slate-900/60 pt-28 md:pt-36">
        {/* Slide backgrounds */}
        {slides.map((s: any, idx: number) => {
          const slideImage = s.image || "";
          return (
            <div
              key={s.id || idx}
              className={`absolute inset-0 transition-all duration-1000 transform ${
                idx === currentSlide ? "opacity-100 scale-100 z-0" : "opacity-0 scale-105 -z-10"
              }`}
            >

              {/* Sharp image covering the section */}
              <div 
                className="absolute inset-0 bg-cover bg-[center_20%] bg-no-repeat"
                style={{ backgroundImage: `url('${slideImage}')` }}
              />
            </div>
          );
        })}

        {/* Ambient Overlay gradient - changed to allow image visibility on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-900/30 z-0"></div>

        {/* Floating slider glowing indicator dots */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2.5 z-25">
          {slides.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "w-8 bg-cyan-400" : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Manual Slideshow Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-slate-900/50 hover:bg-slate-900 text-white flex items-center justify-center transition border border-white/10 z-20 hover:scale-105"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-slate-900/50 hover:bg-slate-900 text-white flex items-center justify-center transition border border-white/10 z-20 hover:scale-105"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Immersive Slide Content Wrapper */}
        <div className="relative w-full mx-auto max-w-6xl px-6 sm:px-12 py-12 flex flex-col md:grid md:grid-cols-12 items-center gap-10 z-10">
          <div className="md:col-span-12 max-w-3xl text-left space-y-3">
            <span className="inline-block text-[9px] sm:text-[10px] font-sans tracking-[0.2em] font-extrabold uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl backdrop-blur-md">
              {activeSlide.tag || "🗻 LPK SCI JAPAN TRAINING"}
            </span>

            <h1 className="font-sans text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-lg">
              {activeSlide.title}
            </h1>

            <p className="text-[11px] sm:text-xs text-slate-200 font-medium max-w-2xl leading-relaxed drop-shadow-md">
              {activeSlide.description}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToRegistration?.();
                }}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-8 py-4 font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-cyan-500/20 cursor-pointer"
              >
                {activeSlide.actionText || "Daftar Sekarang ⚡"}
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  if ((window as any).openFrontendTab) {
                    (window as any).openFrontendTab('biaya');
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/15 text-white px-7 py-4 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Intip SOP Biaya Pelatihan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACCESS DASHBOARD */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-24 mb-16" id="content-area">
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <button 
              onClick={() => {
                 setActiveFrontendTab('program');
              }}
              className={`relative overflow-hidden rounded-[1.5rem] p-5 sm:p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 group ${
                activeFrontendTab === 'program' 
                  ? 'bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50 scale-[1.02] z-10' 
                  : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]'
              }`}
            >
              {activeFrontendTab === 'program' && <div className="absolute inset-0 bg-cyan-400/10 animate-pulse mix-blend-overlay" />}
              <div className={`relative z-10 p-4 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-300 ${activeFrontendTab === 'program' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-500/10 text-cyan-400'}`}>
                <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-lg" />
              </div>
              <span className={`relative z-10 text-[11px] sm:text-[13px] tracking-widest uppercase text-center mt-1 transition-colors ${activeFrontendTab === 'program' ? 'font-black text-white' : 'font-bold text-slate-300 group-hover:text-white'}`}>Program Pelatihan</span>
            </button>
            <button 
              onClick={() => {
                 setActiveFrontendTab('biaya');
              }}
              className={`relative overflow-hidden rounded-[1.5rem] p-5 sm:p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 group ${
                activeFrontendTab === 'biaya' 
                  ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50 scale-[1.02] z-10' 
                  : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              }`}
            >
              {activeFrontendTab === 'biaya' && <div className="absolute inset-0 bg-emerald-400/10 animate-pulse mix-blend-overlay" />}
              <div className={`relative z-10 p-4 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-300 ${activeFrontendTab === 'biaya' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <CreditCard className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-lg" />
              </div>
              <span className={`relative z-10 text-[11px] sm:text-[13px] tracking-widest uppercase text-center mt-1 transition-colors ${activeFrontendTab === 'biaya' ? 'font-black text-white' : 'font-bold text-slate-300 group-hover:text-white'}`}>SOP Biaya Resmi</span>
            </button>
            <button 
              onClick={() => {
                 setActiveFrontendTab('galeri');
                 setTimeout(() => {
                   document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }, 50);
              }}
              className={`relative overflow-hidden rounded-[1.5rem] p-5 sm:p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 group cursor-pointer ${
                activeFrontendTab === 'galeri' 
                  ? 'bg-gradient-to-b from-pink-500/30 to-rose-600/10 border border-pink-400/60 shadow-[0_0_40px_rgba(236,72,153,0.2)] ring-1 ring-pink-500/50 scale-[1.02] z-10' 
                  : 'bg-gradient-to-br from-pink-500/10 to-rose-600/10 border border-pink-400/30 hover:border-pink-400/50 hover:bg-pink-500/20 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]'
              }`}
            >
              {activeFrontendTab === 'galeri' && <div className="absolute inset-0 bg-pink-400/10 animate-pulse mix-blend-overlay" />}
              <div className={`relative z-10 p-4 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-300 ${activeFrontendTab === 'galeri' ? 'bg-pink-500/30 text-pink-300 backdrop-blur-md' : 'bg-pink-500/20 text-pink-400 backdrop-blur-sm'}`}>
                <ImageIcon className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-lg" />
              </div>
              <span className={`relative z-10 text-[11px] sm:text-[13px] tracking-widest uppercase text-center mt-1 transition-colors ${activeFrontendTab === 'galeri' ? 'font-black text-white' : 'font-bold text-pink-100 group-hover:text-white'}`}>Galeri Foto LPK</span>
            </button>
            <button 
              onClick={() => {
                 setActiveFrontendTab('map');
              }}
              className={`relative overflow-hidden rounded-[1.5rem] p-5 sm:p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 group ${
                activeFrontendTab === 'map' 
                  ? 'bg-gradient-to-b from-indigo-500/20 to-indigo-500/5 border border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50 scale-[1.02] z-10' 
                  : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]'
              }`}
            >
              {activeFrontendTab === 'map' && <div className="absolute inset-0 bg-indigo-400/10 animate-pulse mix-blend-overlay" />}
              <div className={`relative z-10 p-4 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-300 ${activeFrontendTab === 'map' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-500/10 text-indigo-400'}`}>
                <Globe className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-lg" />
              </div>
              <span className={`relative z-10 text-[11px] sm:text-[13px] tracking-widest uppercase text-center mt-1 transition-colors ${activeFrontendTab === 'map' ? 'font-black text-white' : 'font-bold text-slate-300 group-hover:text-white'}`}>Peta Alumni Jepang</span>
            </button>
            <button 
              onClick={() => {
                 setActiveFrontendTab('alumni' as any);
                 setTimeout(() => {
                   document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }, 100);
              }}
              className={`relative overflow-hidden rounded-[1.5rem] p-5 sm:p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 group cursor-pointer ${
                activeFrontendTab === ('alumni' as any)
                  ? 'bg-gradient-to-b from-amber-500/30 to-amber-600/10 border border-amber-400/60 shadow-[0_0_40px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/50 scale-[1.02] z-10'
                  : 'bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-400/30 hover:border-amber-400/50 hover:bg-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]'
              }`}
            >
              {activeFrontendTab === ('alumni' as any) && <div className="absolute inset-0 bg-amber-400/10 animate-pulse mix-blend-overlay" />}
              <div className={`relative z-10 p-4 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-300 ${activeFrontendTab === ('alumni' as any) ? 'bg-amber-500/30 text-amber-300 backdrop-blur-md' : 'bg-amber-500/20 text-amber-400 backdrop-blur-sm'}`}>
                <Star className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-lg" />
              </div>
              <span className={`relative z-10 text-[11px] sm:text-[13px] tracking-widest uppercase text-center mt-1 transition-colors ${activeFrontendTab === ('alumni' as any) ? 'font-black text-white' : 'font-bold text-amber-100 group-hover:text-white'}`}>Kelas Alumni (VIP)</span>
            </button>
          </div>
        </div>
      </section>

      <div className="pb-16">
        {activeFrontendTab === 'program' && (
          <div className="animate-fade-in space-y-12">

      {/* 2. WELCOME TO LPK SCI HOMEPAGE */}
      <section id="program" className="space-y-10 py-12 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100 shadow-sm animate-pulse">
            <ShieldCheck className="h-4 w-4" />
            <span>Lembaga Resmi & Terakreditasi</span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            {customization?.landingConfig?.heroTitle || "Akselerasi Karir Global Bersama LPK SCI"}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto whitespace-pre-line opacity-90">
            {customization?.landingConfig?.heroSubtitle || "LPK SCI (Source Course Indonesia) adalah pusat inkubasi talenta profesional untuk pasar kerja Jepang. Berlisensi resmi Kemnaker RI, kami mengintegrasikan pelatihan bahasa, budaya, dan skill teknis dalam ekosistem asrama modern di Pati."}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {customization?.landingConfig?.programs && customization.landingConfig.programs.slice(0, 3).map((program: any, idx: number) => {
            const styles = [
              {
                bgHover: "hover:shadow-cyan-500/20 hover:border-cyan-500/30",
                iconBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]",
                icon: <HeartHandshake className="h-7 w-7 animate-pulse" />,
                btnBg: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30",
                btnText: program.tag || "DANA TALANGAN KAIGO 💸"
              },
              {
                bgHover: "hover:shadow-indigo-500/20 hover:border-indigo-500/30",
                iconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
                icon: <Sparkles className="h-7 w-7" />,
                btnBg: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30",
                btnText: program.tag || "BEASISWA KHUSUS ⚡"
              },
              {
                bgHover: "hover:shadow-blue-500/20 hover:border-blue-500/30",
                iconBg: "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
                icon: <GraduationCap className="h-7 w-7" />,
                btnBg: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30",
                btnText: program.tag || "KELAS INTENSIF 🇯🇵"
              }
            ][idx % 3];

            return (
              <div key={program.id || idx} className={`relative flex flex-col justify-between rounded-[2.5rem] bg-slate-900/95 text-white p-10 border border-white/10 shadow-2xl min-h-[460px] transition duration-500 hover:translate-y-[-8px] group ${styles.bgHover}`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-white/10 transition-colors" />
                <div className="flex flex-col items-start space-y-6 text-left relative z-10">
                  <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${styles.iconBg}`}>
                    {styles.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight uppercase group-hover:text-blue-400 transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                      {program.desc}
                    </p>
                  </div>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => {
                      onNavigateToRegistration?.();
                    }}
                    className={`w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.03] shadow-lg cursor-pointer ${styles.btnBg}`}
                  >
                    {styles.btnText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2B. OPPORTUNITIES ARE STILL OPEN */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-12 border border-white/5 shadow-2xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="relative z-10 grid md:grid-cols-5 gap-10 items-center">
          {/* Left Texts & Action */}
          <div className="md:col-span-2 space-y-6 text-left">
            <h2 className="font-sans text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Kesempatan masih terbuka untuk Kamu
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              Daftarkan diri kamu segera, dapatkan manfaat dan jenjang karir yang lebih baik!
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                onNavigateToRegistration?.();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-3.5 font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-md shadow-cyan-500/10 cursor-pointer"
            >
              DAFTAR SEKARANG !
            </button>
          </div>

          {/* Right Gallery: Overlapping Cards styled from Screenshot 1 */}
          <div className="md:col-span-3 grid grid-cols-3 gap-3 relative items-center">
            {customization?.landingConfig?.opportunityImages && customization.landingConfig.opportunityImages.length >= 3 ? (
              <>
                <div className="transform hover:scale-105 transition duration-300 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-slate-950 flex flex-col">
                  <div className="relative w-full h-32 md:h-44 flex items-center justify-center overflow-hidden">
                    
                    <img
                      src={customization.landingConfig.opportunityImages[0].url}
                      alt={customization.landingConfig.opportunityImages[0].label}
                      className="w-full h-full object-cover relative z-10"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-2 text-center text-[10px] font-sans font-bold text-slate-300 bg-slate-900/90 border-t border-white/5">
                    {customization.landingConfig.opportunityImages[0].label}
                  </div>
                </div>
                <div className="transform hover:scale-105 transition duration-300 -translate-y-4 rounded-xl overflow-hidden shadow-2xl border-2 border-cyan-400 bg-slate-950 z-10 flex flex-col">
                  <div className="relative w-full h-36 md:h-52 flex items-center justify-center overflow-hidden">
                    
                    <img
                      src={customization.landingConfig.opportunityImages[1].url}
                      alt={customization.landingConfig.opportunityImages[1].label}
                      className="w-full h-full object-cover relative z-10"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-2.5 text-center text-[10px] sm:text-xs font-sans font-black text-cyan-300 bg-slate-900/95 border-t border-white/10">
                    {customization.landingConfig.opportunityImages[1].label}
                  </div>
                </div>
                <div className="transform hover:scale-105 transition duration-300 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-slate-950 flex flex-col">
                  <div className="relative w-full h-32 md:h-44 flex items-center justify-center overflow-hidden">
                    
                    <img
                      src={customization.landingConfig.opportunityImages[2].url}
                      alt={customization.landingConfig.opportunityImages[2].label}
                      className="w-full h-full object-cover relative z-10"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-2 text-center text-[10px] font-sans font-bold text-slate-300 bg-slate-900/90 border-t border-white/5">
                    {customization.landingConfig.opportunityImages[2].label}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="transform hover:scale-105 transition duration-300 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80"
                    alt="Pelatihan Teori"
                    className="w-full h-32 md:h-44 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-2 text-center text-[10px] font-sans font-bold text-slate-300 bg-slate-900/90 border-t border-white/5">
                    Pelatihan Teori
                  </div>
                </div>
                <div className="transform hover:scale-105 transition duration-300 -translate-y-4 rounded-xl overflow-hidden shadow-2xl border-2 border-cyan-400 bg-slate-900 z-10">
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&q=80"
                    alt="Pemberian Sertifikat"
                    className="w-full h-36 md:h-52 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-2.5 text-center text-[10px] sm:text-xs font-sans font-black text-cyan-300 bg-slate-900/95 border-t border-white/10">
                    Penyerahan Sertifikat
                  </div>
                </div>
                <div className="transform hover:scale-105 transition duration-300 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80"
                    alt="Foto Bersama"
                    className="w-full h-32 md:h-44 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-2 text-center text-[10px] font-sans font-bold text-slate-300 bg-slate-900/90 border-t border-white/5">
                    Foto Bersama Alumni
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Consultation Bar from Screenshot 1 */}
        <div className="mt-8 bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300">
              <HelpCircle className="h-5 w-5" />
            </div>
            <p className="text-sm sm:text-base font-bold text-white tracking-tight">
              Anda ingin berkonsultasi lebih detail ?
            </p>
          </div>
          <a
            href="https://wa.me/6281395090885?text=Halo%20LPK%20SCI,%20saya%20ingin%20tanya%20program%20pelatihan%20kerja%20Jepang"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-center py-3.5 px-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-widest transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            HUBUNGI KAMI 💬
          </a>
        </div>
      </section>
          </div>
        )}

      {/* 3. NEON CYBER INTERACTIVE MAP (INTEGRATED OPEN STREET MAP) */}
      {activeFrontendTab === 'map' && (
        <div className="animate-fade-in space-y-8">
          <button onClick={() => { setActiveFrontendTab('program'); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-slate-500 hover:text-slate-900 text-xs font-bold uppercase flex items-center gap-1 mx-auto mt-4 px-4 py-2 bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /> Kembali ke Program</button>
      <section id="map-penyebaran" className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 md:p-10 space-y-6 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute -right-16 -top-16 h-40 w-40 bg-indigo-500/15 rounded-full blur-2xl animate-pulse"></div>
        <div className="space-y-3 relative z-10">
          <span className="text-[9px] font-mono bg-blue-500/20 text-blue-300 px-3 py-1 rounded-md uppercase tracking-wider font-extrabold border border-blue-500/30">
            📍 INTERACTIVE WEB MAP PLATFORM
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
            Sebaran Alumni Sukses di Peta Jepang
          </h2>
          <p className="text-xs text-slate-300 max-w-xl font-light">
            Sistem database alumni kami tersinkronisasi instan melalui
            OpenStreetMap. Klik salah satu simpul prefektur pada peta interaktif
            untuk menyaring daftar roster penempatan kerja.
          </p>
        </div>

        <div className="bg-slate-900/40 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative z-10 flex flex-col lg:flex-row min-h-[500px]">
          {/* OpenStreetMap Map Node Container - Left Side */}
          <div className="flex-1 lg:w-3/5 relative flex flex-col p-1 sm:p-2 border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-950/50">
            <div className="absolute top-4 left-4 z-[999] space-y-1 bg-slate-900/95 py-1.5 px-3 rounded-lg border border-slate-800 backdrop-blur-md pointer-events-none">
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest block">
                OPENSTREETMAP INTERACTIVE
              </span>
              <p className="text-[9px] text-slate-400 font-sans">
                Geser & zoom peta bebas, klik lingkaran pin
              </p>
            </div>

            {/* Container where Leaflet elements mount */}
            <div
              className="flex-1 w-full min-h-[350px] lg:min-h-full relative z-10 rounded-2xl overflow-hidden bg-slate-900"
              ref={mapContainerRef}
            >
              {/* Map loads inside here */}
            </div>

            {/* Bottom HUD bar */}
            <div className="absolute bottom-4 left-4 right-4 z-[999] bg-slate-900/95 py-2 px-3 rounded-lg border border-slate-800 backdrop-blur-md flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono pointer-events-none">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                SINKRON: {expatriates.length} ALUMNI
              </span>
              <span>OSM Engine</span>
            </div>
          </div>

          {/* Pref Filter Detail Panel - Right Side */}
          <div className="flex-1 lg:w-2/5 flex flex-col p-6 sm:p-8 space-y-6">
            {selectedPref &&
            prefectureStats[selectedPref as keyof typeof prefectureStats] ? (
              (() => {
                const info =
                  prefectureStats[selectedPref as keyof typeof prefectureStats];
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 bg-indigo-500 rounded-full animate-pulse"></span>
                      <h4 className="font-display text-xl font-extrabold text-white font-sans tracking-tight">
                        Prefektur {info.name}
                      </h4>
                    </div>

                    <div
                      className={`text-xs py-1 px-2.5 rounded-lg border inline-block font-mono font-bold uppercase bg-slate-800 text-cyan-300 border-slate-700`}
                    >
                      Kawasan Regional: {info.region}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                      {info.description}
                    </p>

                    <div className="border-t border-slate-800/80 pt-4 space-y-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block font-sans">
                        DAFTAR ALUMNI DI AREA ({info.inmates.length})
                      </span>

                      {info.inmates.length > 0 ? (
                        <div className="space-y-2 max-h-[180px] overflow-y-auto no-scrollbar pr-1">
                          {info.inmates.map((stu, sIdx) => (
                            <div key={sIdx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/55 flex flex-col hover:border-indigo-500/30 transition">
                              {/* <span className="text-xs font-black text-slate-100">{stu.name}</span> */}
                              <span className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                                🏢 {stu.company || "Perusahaan Jepang"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-950/20 rounded-2xl p-4 text-center text-xs text-slate-400 border border-dashed border-slate-800">
                          Belum ada siswa angkatan aktif di {info.name} saat
                          ini. Setujui kelolosan pendaftar di Admin Panel untuk
                          mengaturnya!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col justify-center text-center py-12 text-slate-400 bg-slate-950/20 rounded-2xl border border-slate-800/60 shadow-inner">
                <MapPin className="h-8 w-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-bold leading-normal text-slate-200">
                  Radar Prefektur Kosong
                </p>
                <p className="text-[10px] text-slate-400">
                  Pencet lingkaran node di peta Jepang untuk memfilter siswa.
                </p>
              </div>
            )}

            {/* Notification sync help */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/10 flex gap-2.5 text-xs text-indigo-200 leading-normal mt-auto">
              <HelpCircle className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200">Real-time Map Sync</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Menyala otomatis. Setiap kali pendaftar baru diterima Admin
                  dan diterbangkan ke Jepang, pin peta termutakhirkan secara
                  instan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
        </div>
      )}

      {/* SECTION EKOSISTEM & PERKS */}
      {activeFrontendTab === 'program' && (
      <section className="space-y-8 max-w-7xl mx-auto pt-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 px-4">
          <h2 className="font-display text-3xl font-black text-slate-100 tracking-tight sm:text-4xl text-sans">
            {customization?.landingConfig?.ecosystemTitle || "Ekosistem Inkubasi Karir Modern"}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-light">
            {customization?.landingConfig?.ecosystemSubtitle || "Selamat bergabung di ekosistem digital LPK Source Course Indonesia. Kami menghadirkan platform belajar terpadu untuk mendampingi langkah sukses Anda menuju Jepang."}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 px-4 sm:px-0">
          {(customization?.landingConfig?.perks || []).map((perk: any, i: number) => {
            const colors: Record<string, string> = {
              blue: "bg-blue-50 text-blue-600 border-blue-100",
              pink: "bg-pink-50 text-pink-600 border-pink-100",
              emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
            };
            const colorClass = colors[perk.color || 'blue'] || colors.blue;
            return (
              <div key={perk.id || i} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 space-y-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${colorClass}`}>
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{perk.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">{perk.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* SECTION PROGRAM PEMAGANGAN & TOKUTEI GINOU */}
      {activeFrontendTab === 'program' && (
      <section className="space-y-8 max-w-7xl mx-auto pt-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 px-4">
          <span className="text-[10px] font-mono font-black text-rose-600 bg-rose-500/10 px-3 py-1 rounded-full uppercase">
            🚀 PROGRAM UNGGULAN
          </span>
          <h2 className="font-display text-3xl font-black text-slate-100 tracking-tight sm:text-4xl text-sans">
            {customization?.landingConfig?.programsTitle || "Katalog Program Inkubasi Premium"}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-light">
            {customization?.landingConfig?.programsSubtitle || "Jalur tercepat kamu ke Jepang. Kita cuma main di bidang yang demand dan offering-nya tinggi. Pilih sesuai passion dan hardskill kamu."}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 px-4 sm:px-0">
          {(customization?.landingConfig?.programs || []).map((prog: any, i: number) => {
            const hasTag = prog.tag && prog.tag.trim() !== "" && !prog.tag.toLowerCase().includes("sultan") && !prog.tag.toLowerCase().includes("entry") && !prog.tag.toLowerCase().includes("quick");
            return (
            <div key={prog.id || i} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-2xl hover:scale-[1.02] hover:bg-white/15 transition-all duration-300 space-y-4">
              {hasTag && (
                <span className="bg-rose-500/20 text-rose-200 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg">
                  {prog.tag}
                </span>
              )}
              <h3 className="text-lg font-black text-white font-sans tracking-tight">
                {prog.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {prog.desc}
              </p>
            </div>
            );
          })}
        </div>
      </section>
      )}

      {/* SECTION JOIN WITH US (PEREKRUTAN SENSEI & STAF) */}
      {activeFrontendTab === 'program' && (
      <section id="join-us" className="space-y-12 max-w-7xl mx-auto pt-16 px-4 sm:px-6 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/30 shadow-xs">
            <Users className="h-4 w-4 animate-pulse" />
            <span>Kembangkan Karir Bersama Kami</span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            Join With Us (Perekrutan Sensei & Staf)
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto">
            LPK Source Course Indonesia (SCI) membuka kesempatan bagi profesional yang dedikatif, kompeten, dan berorientasi masa depan untuk bergabung sebagai pilar pendidikan kami di Pati, Jawa Tengah.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card 1: Sensei / Instruktur Bahasa Jepang */}
          <div className="relative flex flex-col justify-between rounded-[2.5rem] bg-gradient-to-b from-slate-900 to-slate-950 text-white p-8 md:p-10 border border-emerald-500/10 shadow-2xl transition duration-500 hover:translate-y-[-4px] hover:shadow-emerald-500/10 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
            <div className="space-y-6 relative z-10 text-left">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">POSISI AKADEMIK</span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
                    Instruktur / Sensei Bahasa Jepang
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                Bertanggung jawab dalam mendidik, membimbing, serta mempersiapkan fisik dan mental para siswa agar siap kerja profesional di Jepang dengan standar disiplin tinggi.
              </p>

              {/* Requirements & Benefits */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Kualifikasi Utama:</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Sertifikat Kemampuan Bahasa Jepang minimal JLPT N3 atau N2.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Alumni program magang / kerja Jepang (Ex-Kenshusei) sangat diutamakan.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Memiliki passion mengajar, komunikatif, sabar, dan memiliki jiwa kepemimpinan.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Bersedia ditempatkan penuh waktu di asrama LPK SCI (Pati, Jawa Tengah).</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Fasilitas & Benefit:</h4>
                  <p className="text-xs text-slate-400">
                    Gaji pokok kompetitif, tempat tinggal/asrama full-fasilitas gratis, makan harian disediakan lengkap, bonus kelulusan/keberangkatan siswa, serta lingkungan kerja modern berbasis teknologi cloud.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 relative z-10">
              <a
                href="https://wa.me/6281395090885?text=Halo%20HRD%20LPK%20SCI,%20saya%20tertarik%20untuk%20melamar%20pekerjaan%20sebagai%20Sensei%20Bahasa%20Jepang.%20Berikut%20profil%20singkat%20saya..."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Lamar Posisi Sensei</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Card 2: Admin & Marketing / Staff Operational */}
          <div className="relative flex flex-col justify-between rounded-[2.5rem] bg-gradient-to-b from-slate-900 to-slate-950 text-white p-8 md:p-10 border border-blue-500/10 shadow-2xl transition duration-500 hover:translate-y-[-4px] hover:shadow-blue-500/10 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
            <div className="space-y-6 relative z-10 text-left">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  <Briefcase className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-widest block">POSISI MANAJEMEN</span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
                    Staf Administrasi & Operasional
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                Mengelola berkas pendaftaran, administrasi dokumen visa, COE, koordinasi dengan mitra Sending Organization (SO), database asrama, serta pelayanan pendaftar baru.
              </p>

              {/* Requirements & Benefits */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Kualifikasi Utama:</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>Pendidikan minimal SMA/SMK/D3/S1 semua jurusan (jurusan Adm/IT disukai).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>Menguasai Microsoft Office (Word, Excel) & familiar dengan sistem manajemen cloud.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>Disiplin tinggi, teliti, jujur, komunikatif, dan mampu bekerja dalam tim.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>Sanggup tinggal di asrama Pati atau domisili sekitar Pati sangat disukai.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Fasilitas & Benefit:</h4>
                  <p className="text-xs text-slate-400">
                    Gaji bulanan menarik, makan harian terjamin penuh, disediakan asrama/mess karyawan modern, asuransi BPJS, serta jenjang promosi karir menjadi kepala asrama atau koordinator dokumen.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 relative z-10">
              <a
                href="https://wa.me/6281395090885?text=Halo%20HRD%20LPK%20SCI,%20saya%20tertarik%20untuk%20melamar%20pekerjaan%20sebagai%20Staf%20Administrasi%20dan%20Operasional.%20Berikut%20profil%20singkat%20saya..."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Lamar Posisi Staf Adm</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* SECTION TESTIMONIALS */}
      {activeFrontendTab === 'program' && (
      <section className="space-y-8 max-w-7xl mx-auto pt-16 pb-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 px-4">
          <span className="text-[10px] font-mono font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase border border-amber-100">
            💬 APA KATA MEREKA
          </span>
          <h2 className="font-display text-3xl font-black text-slate-100 tracking-tight sm:text-4xl text-sans">
            {customization?.landingConfig?.alumniTitle || "Testimoni & Story Alumni Hub"}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-light">
            {customization?.landingConfig?.alumniSubtitle || "Jangan cuma dengerin dari kita. Dengerin langsung dari real-alumni LPK Source Course Indonesia yang udah ngerasain landing & living di Jepang."}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 px-4 sm:px-0 mt-8">
          {(customization?.landingConfig?.testimonials || []).map((testi: any, i: number) => (
            <div key={testi.id || i} className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-10px] text-slate-800/50 text-[100px] font-serif leading-none opacity-20">"</div>
              <p className="text-sm text-slate-300 leading-relaxed relative z-10 italic">
                "{testi.content}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800 relative z-10">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold uppercase">
                  {testi.name?.charAt(0) || "A"}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">{testi.name}</h4>
                  <p className="text-[10px] text-slate-400">{testi.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* SECTION BIAYA PENDIDIKAN & PROGRAM */}
      {activeFrontendTab === 'biaya' && (
        <div className="animate-fade-in space-y-8">
          <button onClick={() => { setActiveFrontendTab('program'); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-slate-500 hover:text-slate-900 text-xs font-bold uppercase flex items-center gap-1 mx-auto mt-4 px-4 py-2 bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /> Kembali ke Program</button>
      <section id="biaya" className="space-y-8 max-w-7xl mx-auto scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto space-y-3 px-4">
          <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
            💵 INVESTASI BIAYA & PROGRAM LPK
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-100 tracking-tight text-sans">
            {customization?.landingConfig?.biayaTitle || "Skema SOP Pembayaran LPK SCI Resmi & Transparan"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light whitespace-pre-line">
            {customization?.landingConfig?.biayaSubtitle || "Sesuai Standar Operasional Prosedur (SOP) pendaftaran resmi LPK\nSource Course Indonesia (SCI). Kami menjamin transparansi biaya\npenuh *tanpa pungutan liar tersembunyi* demi kenyamanan masa depan\nbelajar Anda."}
          </p>

          {/* Interactive Tab Selector */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-sm mt-3 self-center">
            <button
              onClick={() => setPriceTab("reguler")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                priceTab === "reguler"
                  ? "bg-slate-900 text-yellow-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 font-bold"
              }`}
            >
              🇯🇵 Jalur Kelas Regular ( Magang/Ikusei shuro/Tokuteiginou)
            </button>
            <button
              onClick={() => setPriceTab("matching")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                priceTab === "matching"
                  ? "bg-slate-900 text-yellow-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 font-bold"
              }`}
            >
              ⚡ Jalur Matching Job Cepat (Ex-LPK/Otodidak)
            </button>
          </div>
        </div>

        {priceTab === "reguler" ? (
          /* JALUR KELAS REGULER ATTACHED SCHEME */
          <div className="space-y-6 px-4">
            <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-sans">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg">
                  PAKET BELAJAR INTENSIF SAMPAI LULUS
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2 font-sans">
                  Program Pemagangan / Tokutei Ginou (Minna No Nihongo Bab 35 /
                  N4)
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-1 max-w-3xl">
                  Bagi pendaftar pemula dari nol mutlak. Sudah termasuk asrama
                  gratis di Pati, materi belajar intensif, seragam, modul
                  mandiri, garansi kelas Fukushu gratis, serta bimbingan
                  interview user oleh tim profesional LPK SCI.
                </p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shrink-0 text-left md:text-right w-full md:w-auto shadow-sm">
                <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase font-sans">
                  TOTAL INVESTASI PENDIDIKAN
                </span>
                <span className="text-2xl font-black text-indigo-600 font-mono leading-none block mt-1">
                  {costConfig ? `Rp ${(costConfig.registration + costConfig.dp + costConfig.fullPayment + costConfig.managementFee).toLocaleString('id-ID')}` : 'Rp 11.000.000'}
                </span>
                
                <span className="text-[9px] text-slate-500 font-light block mt-0.5 font-sans">
                  {costConfig ? `(Adms Rp${(costConfig.registration / 1000).toLocaleString('id-ID')}k + Belajar Rp${((costConfig.dp + costConfig.fullPayment)/1000000).toLocaleString('id-ID')}jt + Management Rp${(costConfig.managementFee/1000000).toLocaleString('id-ID')}jt)` : "(Adms Rp500rb + Belajar Rp5.5jt + Management Rp5jt)"}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-sans">
              {/* Card 1 */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex flex-col justify-between hover:scale-[1.02] hover:bg-white hover:shadow-md transition-all duration-300 font-sans">
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center font-sans">
                    <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs font-mono">
                      01
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-sans">
                      Pendaftaran
                    </span>
                  </div>
                  <div className="font-sans">
                    <h4 className="text-xs font-black text-slate-950 uppercase font-sans">
                      Administrasi
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">
                      SEKALI DI AWAL
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-light font-sans">
                    Digunakan untuk pemrosesan berkas fisik, pendaftaran siswa
                    di database pusat Pati luar kota, orisinalitas berkas, dan
                    pra-seleksi awal.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <span className="text-slate-400 text-[9px] block font-mono">
                    NOMINAL ADMINISTRASI
                  </span>
                  <span className="text-md font-black text-slate-900 font-mono">
                    {costConfig?.registration ? `Rp ${costConfig.registration.toLocaleString('id-ID')}` : 'Rp 500.000'}
                  </span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex flex-col justify-between hover:scale-[1.02] hover:bg-white hover:shadow-md transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs font-mono">
                      02
                    </span>
                    <span className="bg-amber-100 text-amber-850 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-sans">
                      DP Pembelajaran
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-950 uppercase">
                      Pembayaran Awal / DP
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">
                      START KELAS
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-light">
                    Pembayaran awal saat pembelajaran dimulai. Siswa langsung berhak tinggal di asrama eksklusif gratis LPK SCI di Pati maksimal selama 4 bulan.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <span className="text-slate-400 text-[9px] block font-mono">
                    CICILAN-1 / DP AWAL
                  </span>
                  <span className="text-md font-black text-slate-900 font-mono">
                    {costConfig?.dp ? `Rp ${costConfig.dp.toLocaleString('id-ID')}` : 'Rp 3.500.000'}
                  </span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex flex-col justify-between hover:scale-[1.02] hover:bg-white hover:shadow-md transition-all duration-300 font-sans">
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center">
                    <span className="h-7 w-7 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center font-bold text-xs font-mono">
                      03
                    </span>
                    <span className="bg-orange-100 text-orange-850 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                      Sisa Tahap 1
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-950 uppercase">
                      Pelunasan Belajar
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">
                      TEMPO 1 BULAN
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-light font-sans">
                    Pembayaran pelunasan biaya belajar bahasa Jepang. Jatuh
                    tempo pelunasan adalah maksimal 1 bulan setelah masa
                    pembelajaran di LPK SCI resmi dimulai.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <span className="text-slate-400 text-[9px] block font-mono">
                    PELUNASAN SPP KELAS
                  </span>
                  <span className="text-md font-black text-slate-900 font-mono">
                    {costConfig?.fullPayment ? `Rp ${costConfig.fullPayment.toLocaleString('id-ID')}` : 'Rp 2.000.000'}
                  </span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 h-28 w-28 bg-yellow-500/10 rounded-full blur-xl"></div>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center font-sans">
                    <span className="h-7 w-7 rounded-lg bg-yellow-400/20 text-yellow-300 flex items-center justify-center font-bold text-xs font-mono">
                      04
                    </span>
                    <span className="bg-yellow-400 text-slate-950 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono animate-pulse font-sans">
                      Lolos Interview
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-yellow-400 uppercase">
                      Management Fee
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider font-mono font-sans">
                      PASCA SELEKSI USER
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed font-light font-sans">
                    Hanya ditagihkan setelah siswa dinyatakan Lulus / Keluar
                    Pengumuman Interview Kerja dengan perwakilan Jepang. Jika
                    kontrak hanya 1 tahun, mendapatkan CASHBACK Rp 3.000.000!
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 mt-4 relative z-10 font-mono">
                  <span className="text-yellow-400/90 text-[9px] block font-mono">
                    MANAGEMENT FEE PASCA-LOLOS
                  </span>
                  <span className="text-md font-black text-white font-mono">
                    {costConfig?.managementFee ? `Rp ${costConfig.managementFee.toLocaleString('id-ID')}` : 'Rp 5.000.000'}
                  </span>
                </div>
              </div>
            </div>

            {/* Program regular details info box (Asrama, books, moduls) */}
            <div className="grid gap-4 sm:grid-cols-2 text-xs font-sans">
              <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.02)] space-y-2">
                <h5 className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  🏠 Ketentuan Tinggal Di Asrama LPK SCI:
                </h5>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>Khusus siswa aktif LPK SCI Source Course Indonesia.</li>
                  <li>
                    Diutamakan bagi siswa yang rumahnya jauh / luar kota Pati.
                  </li>
                  <li>
                    Wajib mematuhi seluruh tata tertib & etika asrama LPK SCI.
                  </li>
                  <li>
                    Batas jam keluar asrama malam maksimal adalah pukul **21.00
                    WIB**.
                  </li>
                  <li>
                    Diberikan fasilitas tinggal gratis maksimal **4 bulan**
                    berturut-turut.
                  </li>
                </ul>
              </div>

              <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.02)] space-y-2">
                <h5 className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  📚 Fasilitas Pembelajaran Termasuk (Tahap 1):
                </h5>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>
                    Mendapatkan **Seragam Resmi LPK SCI sebanyak 2 pcs /
                    seteleh**.
                  </li>
                  <li>
                    Mendapatkan Buku Modul lengkap (**Minna No Nihongo 1 & 2**).
                  </li>
                  <li>
                    Materi bimbingan kurikulum profesional dari awal hingga Bab
                    35.
                  </li>
                  <li>
                    **Free Kelas Fukushu**: Belum dapat job / lulus JFT? Boleh
                    ikut bimbingan mengulang gratis.
                  </li>
                  <li>
                    Siswa yang belum melunasi biaya belajar setelah jatuh tempo
                    not diikutkan match job.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* JALUR SISWA MATCHING JOB (EX-LPK / OTODIDAK) */
          <div className="space-y-6 px-4">
            <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-sans">
              <div>
                <span className="bg-indigo-100 text-indigo-850 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50">
                  JALUR COCOK KERJA CEPAT
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2 font-sans">
                  Siswa Matching Job (Ex-LPK / Belajar Otodidak)
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-1 max-w-3xl">
                  Bagi calon tenaga kerja yang sudah memiliki kecakapan Bahasa
                  Jepang N4 atau setidaknya telah menguasai materi setara Bab 35
                  Minna No Nihongo. Anda langsung kami salurkan dan match-kan ke
                  agenda interview dengan Kumiai Jepang.
                </p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shrink-0 text-left md:text-right w-full md:w-auto shadow-sm">
                <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase font-sans">
                  TOTAL INVESTASI MATCHING
                </span>
                <span className="text-2xl font-black text-indigo-600 font-mono leading-none block mt-1">
                  {costConfig ? `Rp ${(costConfig.registration + costConfig.managementFee).toLocaleString('id-ID')}` : 'Rp 5.500.000'}
                </span>
                <span className="text-[9px] text-slate-500 font-light block mt-0.5 font-sans">
                  (Administrasi {costConfig?.registration ? `Rp ${costConfig.registration.toLocaleString('id-ID')}` : 'Rp 500.000'} + Management Fee {costConfig?.managementFee ? `Rp ${costConfig.managementFee.toLocaleString('id-ID')}` : 'Rp 5.000.000'})
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 font-sans">
              {/* Card 1: Registrasi Pendaftaran */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex flex-col justify-between hover:scale-[1.02] hover:bg-white hover:shadow-md transition-all duration-300 font-sans">
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center font-sans">
                    <span className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm font-mono">
                      01
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase font-sans">
                      Registrasi Fisik
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-950 uppercase font-sans">
                      Administrasi Pendaftaran
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">
                      SEKALI DI AWAL
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-light font-sans">
                    Biaya administrasi seleksi kelengkapan berkas fisik, audit
                    rekam jejak sertifkat bahasa Jepang, dan pencocokan CV awal
                    ke mitra Kumiai / Agen Penyalur Jepang di LPK SCI.
                  </p>
                </div>
                <div className="pt-5 border-t border-slate-100 mt-5">
                  <span className="text-slate-400 text-[10px] block font-mono">
                    NOMINAL PENDAFTARAN AWAL
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {costConfig?.registration ? `Rp ${costConfig.registration.toLocaleString('id-ID')}` : 'Rp 500.000'}
                  </span>
                </div>
              </div>

              {/* Card 2: Management Fee */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 rounded-full blur-2xl font-sans"></div>
                <div className="space-y-3 relative z-10 select-none">
                  <div className="flex justify-between items-center font-sans">
                    <span className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm font-mono">
                      02
                    </span>
                    <span className="bg-yellow-400 text-slate-950 text-[9px] font-extrabold px-2.5 py-0.5 rounded uppercase font-mono animate-pulse font-sans">
                      Lolos Interview User
                    </span>
                  </div>
                  <div className="font-sans">
                    <h4 className="text-sm font-black text-yellow-400 uppercase font-sans">
                      Management Fee Matching
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider font-mono font-sans">
                      PASCA KELULUSAN SELEKSI UMUM
                    </p>
                  </div>
                  <p className="text-xs text-slate-250 leading-relaxed font-light font-sans">
                    Hanya ditagihkan setelah siswa dinyatakan Lulus / Keluar
                    Pengumuman Interview Kerja dengan perwakilan Jepang
                    (Kumiai). Wajib diselesaikan pembayarannya maksimal 1 minggu
                    setelah pengumuman kelulusan interview kerja.
                  </p>
                </div>
                <div className="pt-5 border-t border-slate-800 mt-5 relative z-10">
                  <span className="text-yellow-400 text-[10px] font-mono block">
                    MANAGEMENT FEE PASCA LOLOS
                  </span>
                  <span className="text-xl font-black text-white font-mono">
                    {costConfig?.managementFee ? `Rp ${costConfig.managementFee.toLocaleString('id-ID')}` : 'Rp 5.000.000'}
                  </span>
                </div>
              </div>
            </div>

            {/* Matching Job requirements block */}
            <div className="bg-indigo-50/40 p-6 rounded-3xl border border-indigo-100/30 text-slate-800 space-y-3 text-xs leading-relaxed font-sans">
              <h5 className="font-sans font-black text-indigo-950 text-sm uppercase flex items-center gap-1.5 font-bold">
                📝 Syarat & Berkas Wajib Pendaftar Jalur Matching Job:
              </h5>
              <div className="grid gap-3 sm:grid-cols-3 font-normal text-slate-700">
                <div className="bg-white/90 p-4 rounded-2xl border border-indigo-150/20 font-sans shadow-sm">
                  <strong className="block text-indigo-900 font-black mb-1 font-sans">
                    1. Gender & Usia
                  </strong>
                  Calon Pendaftar (Cowok maupun Cewek) wajib berusia antara
                  minimal 18 tahun s.d maksimal 30 tahun.
                </div>
                <div className="bg-white/90 p-4 rounded-2xl border border-indigo-150/20 font-sans shadow-sm">
                  <strong className="block text-indigo-900 font-black mb-1 font-sans">
                    2. Pra-MCU Kesehatan
                  </strong>
                  Wajib mengikuti Pra-MCU (Medical Check-Up) awal di klinik
                  rujukan LPK SCI Semarang, yaitu **Klinik Ultra Medika**.
                </div>
                <div className="bg-white/90 p-4 rounded-2xl border border-indigo-150/20 font-sans shadow-sm">
                  <strong className="block text-indigo-900 font-black mb-1 font-sans">
                    3. Kompetensi Dasar
                  </strong>
                  Sudah menguasai minimal Bab 35 Minna No Nihongo. Diutamakan
                  yang sudah mengantongi sertifikat resmi JFT-A2 atau JLPT N4.
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      {/* GALERI FOTO SECTION IN PROGRAM TAB */}
      <section id="galeri" className="space-y-8 max-w-7xl mx-auto scroll-mt-24 px-4 pb-16">
        <div className="text-center max-w-2xl mx-auto space-y-3 px-4">
          <span className="text-[10px] font-mono font-black text-pink-400 bg-pink-500/10 px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-pink-500/20 inline-flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            <span>📸 GALERI & DOKUMENTASI LPK PATI</span>
          </span>
          <h2 className="font-display text-3xl font-black text-slate-100 tracking-tight sm:text-4xl text-sans">
            Dokumentasi Momen LPK SCI
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Klik foto untuk memperbesar tampilan dan mengunduh dokumentasi kegiatan.
          </p>
        </div>
        
        {(() => {
          const defaultGalleryList = [
            {
              id: 1,
              title: "Kegiatan LPK SCI",
              image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
              tag: "PELATIHAN",
              description: "Kegiatan belajar mengajar bahasa Jepang intensif di ruang kelas LPK SCI Pati."
            },
            {
              id: 2,
              title: "PRA - MCU",
              image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
              tag: "KESEHATAN",
              description: "Pemeriksaan kesehatan awal Medical Check Up di klinik rujukan untuk memastikan calon siswa prima."
            },
            {
              id: 3,
              title: "GIAT BIMTEK - DISNAKER KAB.PATI",
              image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
              tag: "BIMTEK",
              description: "Bimbingan teknis akreditasi LPKS tahun 2026 bersama jajaran Disnaker Kab. Pati."
            },
            {
              id: 4,
              title: "PEMBERANGKATAN SISWA MAGANG",
              image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
              tag: "KEBERANGKATAN",
              description: "Acara resmi pelepasan & keberangkatan siswa LPK SCI di Bandara Internasional Soekarno-Hatta."
            },
            {
              id: 5,
              title: "TEST BAHASA JEPANG",
              image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
              tag: "UJIAN",
              description: "Simulasi dan ujian evaluasi kelulusan sertifikasi JFT-Basic A2 & JLPT N4."
            },
            {
              id: 6,
              title: "LATIHAN MENSETSU & FISIK",
              image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
              tag: "SIMULASI",
              description: "Persiapan dan latihan wawancara kerja (Mensetsu) langsung dengan user perusahaan Jepang."
            }
          ];

          const activeItems = (customization?.gallery && customization.gallery.length > 0)
            ? customization.gallery
            : ((galleries && galleries.length > 0) ? galleries : defaultGalleryList);

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {activeItems.map((item: any, i: number) => (
                <div
                  key={item.id || i}
                  onClick={() => setSelectedGalleryImage({
                    image: item.image || item.img,
                    title: item.title,
                    tag: item.tag || "GALERI LPK",
                    description: item.description || ""
                  })}
                  className="group relative rounded-3xl overflow-hidden shadow-xl border border-white/10 bg-slate-900/90 cursor-pointer flex flex-col justify-end transition-all duration-500 hover:-translate-y-2 hover:border-pink-500/50 hover:shadow-pink-500/15"
                >
                  <div className="relative h-60 w-full overflow-hidden bg-slate-950">
                    <img
                      src={item.image || item.img}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                    
                    {item.tag && (
                      <span className="absolute top-3 left-3 bg-pink-600/90 text-white font-mono font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md backdrop-blur-sm border border-white/20">
                        {item.tag}
                      </span>
                    )}

                    <div className="absolute top-3 right-3 bg-slate-950/70 text-pink-300 p-2 rounded-xl backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-5 space-y-2 relative z-10 bg-slate-950/95 border-t border-white/5">
                    <h3 className="text-white font-bold text-sm sm:text-base tracking-wide group-hover:text-pink-300 transition-colors">
                      {item.title}
                    </h3>
                    <div className="pt-1 flex items-center justify-between text-xs text-pink-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-pink-400" /> Perbesar & Unduh
                      </span>
                      <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </section>
        </div>
      )}

      {/* STANDALONE ACTIVE TAB GALERI FOTO */}
      {activeFrontendTab === 'galeri' && (
        <div className="animate-fade-in space-y-10 pb-16">
          <section className="space-y-8 max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto space-y-4 px-4">
              <span className="text-[10px] font-mono font-black text-pink-400 bg-pink-500/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-pink-500/20 shadow-sm inline-flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>📸 GALERI FOTO RESMI LPK PATI</span>
              </span>
              <h2 className="font-display text-3xl font-black text-white tracking-tight sm:text-4xl md:text-5xl">
                Dokumentasi & Galeri LPK SCI
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
                Dokumentasi lengkap fasilitas asrama Pati, bimbingan bahasa Jepang, ujian sertifikasi, kegiatan Disnaker, hingga pelepasan penerbangan siswa ke Jepang. Klik foto untuk memperbesar & mengunduh.
              </p>
            </div>

            {(() => {
              const defaultGalleryList = [
                {
                  id: 1,
                  title: "Kegiatan LPK SCI",
                  image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
                  tag: "PELATIHAN",
                  description: "Kegiatan belajar mengajar bahasa Jepang intensif di ruang kelas LPK SCI Pati."
                },
                {
                  id: 2,
                  title: "PRA - MCU",
                  image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
                  tag: "KESEHATAN",
                  description: "Pemeriksaan kesehatan awal Medical Check Up di klinik rujukan untuk memastikan calon siswa prima."
                },
                {
                  id: 3,
                  title: "GIAT BIMTEK - DISNAKER KAB.PATI",
                  image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
                  tag: "BIMTEK",
                  description: "Bimbingan teknis akreditasi LPKS tahun 2026 bersama jajaran Disnaker Kab. Pati."
                },
                {
                  id: 4,
                  title: "PEMBERANGKATAN SISWA MAGANG",
                  image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
                  tag: "KEBERANGKATAN",
                  description: "Acara resmi pelepasan & keberangkatan siswa LPK SCI di Bandara Internasional Soekarno-Hatta."
                },
                {
                  id: 5,
                  title: "TEST BAHASA JEPANG",
                  image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
                  tag: "UJIAN",
                  description: "Simulasi dan ujian evaluasi kelulusan sertifikasi JFT-Basic A2 & JLPT N4."
                },
                {
                  id: 6,
                  title: "LATIHAN MENSETSU & FISIK",
                  image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
                  tag: "SIMULASI",
                  description: "Persiapan dan latihan wawancara kerja (Mensetsu) langsung dengan user perusahaan Jepang."
                }
              ];

              const activeItems = (customization?.gallery && customization.gallery.length > 0)
                ? customization.gallery
                : ((galleries && galleries.length > 0) ? galleries : defaultGalleryList);

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                  {activeItems.map((item: any, i: number) => (
                    <div
                      key={item.id || i}
                      onClick={() => setSelectedGalleryImage({
                        image: item.image || item.img,
                        title: item.title,
                        tag: item.tag || "GALERI LPK",
                        description: item.description || ""
                      })}
                      className="group relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-slate-900 cursor-pointer flex flex-col justify-end transition-all duration-500 hover:-translate-y-2 hover:border-pink-500/60 hover:shadow-[0_10px_30px_rgba(236,72,153,0.2)]"
                    >
                      <div className="relative h-64 w-full overflow-hidden bg-slate-950">
                        <img
                          src={item.image || item.img}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                        
                        {item.tag && (
                          <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-mono font-black text-[9.5px] px-3 py-1 rounded-xl uppercase tracking-wider shadow-lg border border-white/20">
                            {item.tag}
                          </span>
                        )}

                        <div className="absolute top-3 right-3 bg-slate-950/80 text-pink-300 p-2.5 rounded-2xl backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="p-6 space-y-2 relative z-10 bg-slate-950/95 border-t border-white/10">
                        <h3 className="text-white font-black text-base sm:text-lg tracking-wide group-hover:text-pink-300 transition-colors">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium">
                            {item.description}
                          </p>
                        )}
                        <div className="pt-2 flex items-center justify-between text-xs text-pink-400 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-pink-400" /> Perbesar Tampilan
                          </span>
                          <span className="inline-flex items-center gap-1 bg-pink-500/20 text-pink-300 px-3 py-1 rounded-xl border border-pink-500/30 text-[11px] font-black uppercase tracking-wider group-hover:bg-pink-500 group-hover:text-white transition-colors">
                            <Download className="w-3.5 h-3.5" /> Unduh
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        </div>
      )}

      {/* 4. ALUMNI PACKAGE */}
      {activeFrontendTab === ('alumni' as any) && (
        <div className="animate-fade-in space-y-8 pb-16">
          <button onClick={() => { setActiveFrontendTab('program'); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-slate-500 hover:text-slate-900 text-xs font-bold uppercase flex items-center gap-1 mx-auto mt-4 px-4 py-2 bg-slate-100 rounded-lg transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /> Kembali ke Program</button>
          <section id="alumni" className="space-y-12 max-w-7xl mx-auto scroll-mt-24 px-4">
            
            {/* Header Section */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center">{customization?.landingConfig?.alumniPackageTagline || "Home / Pilih Kelas"}</h2>
              <h1 className="text-3xl md:text-4xl font-black text-slate-100 text-center tracking-tight font-sans">
                {customization?.landingConfig?.alumniPackageTitle || "Pilih Kelas Bahasa Jepang"}
              </h1>

              {/* Banner Banner */}
              <div className="bg-[#1c2e4a] rounded-[2rem] p-8 md:p-12 relative overflow-hidden text-white flex flex-col md:flex-row items-center md:items-start justify-between">
                <div className="relative z-10 space-y-6 max-w-2xl">
                  <h3 className="text-3xl md:text-4xl font-bold text-amber-500 leading-tight font-sans tracking-tight">
                    {customization?.landingConfig?.alumniPackageBannerTitle || "Belajar Langsung dengan Ahlinya!"}
                  </h3>
                  <p className="text-lg text-blue-100 max-w-md">
                    {customization?.landingConfig?.alumniPackageBannerSubtitle || "Didukung oleh Sensei Bersertifikasi N1 dan Native Speaker Jepang"}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 pt-4">
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/20 backdrop-blur-sm">
                      <BookOpen className="w-6 h-6 text-blue-300" />
                      <span className="text-xs font-bold leading-tight">Kurikulum<br/>Berstandar Jepang</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/20 backdrop-blur-sm">
                      <Award className="w-6 h-6 text-blue-300" />
                      <span className="text-xs font-bold leading-tight">Pengajar Bersertifikasi<br/>N1 & Native Speaker</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/20 backdrop-blur-sm">
                      <MonitorPlay className="w-6 h-6 text-blue-300" />
                      <span className="text-xs font-bold leading-tight">Metode<br/>Interaktif & Praktis</span>
                    </div>
                  </div>
                </div>
                {/* Decorative Badge */}
                <div className="absolute top-6 right-6 lg:top-10 lg:right-10 bg-white text-[#1c2e4a] p-4 rounded-3xl flex flex-col items-center justify-center shadow-xl rotate-12 scale-90 lg:scale-100">
                  <div className="flex gap-1 mb-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <span className="text-3xl font-black font-serif">N1</span>
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full mt-1">CERTIFIED</span>
                </div>
              </div>
            </div>
             
            {/* Grid Classes */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6">
              {(customization?.landingConfig?.alumniClasses && customization.landingConfig.alumniClasses.length > 0 ? customization.landingConfig.alumniClasses : [
                {
                  method: "ONLINE",
                  level: "N3",
                  emoji: "⛩️",
                  title: "Level N3",
                  description: "Membangun dasar yang kuat untuk komunikasi sehari-hari & persiapan kerja di Jepang.",
                  features: ['Kosakata & Tata Bahasa Dasar', 'Percakapan Sehari-hari', 'Persiapan ujian JLPT N3'],
                  openClass: "19 Agustus 2026",
                  duration: "3-4 Bulan",
                  discount: "20%",
                  discountText: "Diskon Hemat Rp 200.000",
                  originalPrice: "Rp 1.200.000",
                  finalPrice: "Rp 1.000.000",
                  colorScheme: "emerald",
                  registered: 8,
                  quota: 10
                },
                {
                  method: "ONLINE",
                  level: "N2",
                  emoji: "🗻",
                  title: "Level N2",
                  description: "Tingkatkan kemampuan bahasa untuk komunikasi lebih luas & dunia kerja.",
                  features: ['Kosakata & Tata Bahasa Menengah', 'Pemahaman Bacaan & Listening', 'Persiapan JLPT N2'],
                  openClass: "26 Agustus 2026",
                  duration: "4-6 Bulan",
                  discount: "15%",
                  discountText: "Diskon Hemat Rp 195.000",
                  originalPrice: "Rp 1.495.000",
                  finalPrice: "Rp 1.300.000",
                  colorScheme: "blue",
                  registered: 7,
                  quota: 15
                },
                {
                  method: "ONLINE",
                  level: "N1",
                  emoji: "🏯",
                  title: "Level N1",
                  description: "Kuasai bahasa Jepang tingkat lanjut untuk keperluan akademik, bisnis, & profesional.",
                  features: ['Kosakata & Tata Bahasa Lanjutan', 'Kemampuan Diskusi & Presentasi', 'Persiapan JLPT N1'],
                  openClass: "1 September 2026",
                  duration: "6-8 Bulan",
                  discount: "10%",
                  discountText: "Diskon Hemat Rp 150.000",
                  originalPrice: "Rp 1.650.000",
                  finalPrice: "Rp 1.500.000",
                  colorScheme: "purple",
                  registered: 3,
                  quota: 8
                },
                {
                  method: "ONLINE",
                  level: "NATIVE",
                  emoji: "🪭",
                  title: "Level Native",
                  description: "Belajar seperti orang Jepang! Fasih, natural, dan percaya diri dalam segala situasi.",
                  features: ['Ekspresi Natural & Idiom', 'Komunikasi Bisnis & Budaya Jepang', 'Praktik Langsung dengan Native Speaker'],
                  openClass: "Setiap Senin",
                  duration: "Fleksibel",
                  discount: "5%",
                  discountText: "Diskon Hemat Rp 100.000",
                  originalPrice: "Rp 1.900.000",
                  finalPrice: "Rp 1.800.000",
                  colorScheme: "orange",
                  registered: 4,
                  quota: 10
                }
              ]).map((cls: any, idx: number) => {
                const colorTheme = cls.colorScheme || "blue";
                
                // Tailwind map for dynamic colors
                const themeMap: Record<string, any> = {
                  emerald: {
                    textTop: 'text-emerald-500',
                    textMain: 'text-emerald-600',
                    check: 'text-emerald-500',
                    bgBadge: 'bg-emerald-50',
                    textBadge: 'text-emerald-700',
                    borderBadge: 'border-emerald-100',
                    bgBtn: 'bg-[#059669]',
                    hoverBtn: 'hover:bg-[#047857]'
                  },
                  blue: {
                    textTop: 'text-blue-500',
                    textMain: 'text-blue-600',
                    check: 'text-blue-500',
                    bgBadge: 'bg-blue-50',
                    textBadge: 'text-blue-700',
                    borderBadge: 'border-blue-100',
                    bgBtn: 'bg-blue-600',
                    hoverBtn: 'hover:bg-blue-700'
                  },
                  purple: {
                    textTop: 'text-purple-500',
                    textMain: 'text-purple-600',
                    check: 'text-purple-500',
                    bgBadge: 'bg-purple-50',
                    textBadge: 'text-purple-700',
                    borderBadge: 'border-purple-100',
                    bgBtn: 'bg-purple-600',
                    hoverBtn: 'hover:bg-purple-700'
                  },
                  orange: {
                    textTop: 'text-orange-500',
                    textMain: 'text-orange-600',
                    check: 'text-orange-500',
                    bgBadge: 'bg-orange-50',
                    textBadge: 'text-orange-700',
                    borderBadge: 'border-orange-100',
                    bgBtn: 'bg-orange-500',
                    hoverBtn: 'hover:bg-orange-600'
                  },
                  rose: {
                    textTop: 'text-rose-500',
                    textMain: 'text-rose-600',
                    check: 'text-rose-500',
                    bgBadge: 'bg-rose-50',
                    textBadge: 'text-rose-700',
                    borderBadge: 'border-rose-100',
                    bgBtn: 'bg-rose-600',
                    hoverBtn: 'hover:bg-rose-700'
                  }
                };

                const t = themeMap[colorTheme] || themeMap.blue;
                const isLongLevel = cls.level?.length > 3;
                const registeredCount = cls.registered !== undefined ? cls.registered : 8;
                const quotaLimit = cls.quota !== undefined ? cls.quota : 10;
                const remaining = Math.max(0, quotaLimit - registeredCount);

                return (
                  <div key={idx} className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2 md:mb-4">
                      <div>
                        <span className={`${t.textTop} text-[8px] md:text-xs font-black tracking-widest block uppercase`}>{cls.method || "ONLINE"}</span>
                        <h3 className={`${isLongLevel ? 'text-xl md:text-5xl leading-none' : 'text-3xl md:text-6xl'} font-black ${t.textMain} mt-1 tracking-tight`}>{cls.level}</h3>
                        {isLongLevel && <h4 className={`text-[10px] md:text-lg font-bold ${t.textMain} tracking-tight uppercase`}>JPN</h4>}
                      </div>
                      <div className="text-2xl md:text-5xl opacity-85 select-none">{cls.emoji}</div>
                    </div>
                    
                    <h4 className="text-sm md:text-xl font-bold text-slate-800 mb-1 md:mb-2">{cls.title}</h4>
                    <p className="text-[10px] md:text-sm text-slate-500 mb-3 md:mb-6 leading-relaxed line-clamp-2 md:line-clamp-none">{cls.description}</p>
                    
                    <ul className="space-y-1.5 md:space-y-3 mb-3 md:mb-6 flex-1">
                      {(cls.features || []).slice(0, 3).map((pt: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 md:gap-2.5 text-[10px] md:text-sm text-slate-700 font-medium">
                          <CheckCircle className={`w-3 h-3 md:w-5 md:h-5 ${t.check} mt-0.5 shrink-0`} />
                          <span className="leading-tight">{pt}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mb-3 md:mb-6 space-y-1.5 md:space-y-3">
                      {cls.openClass && (
                        <div className={`flex items-center justify-between ${t.bgBadge} px-2 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl border ${t.borderBadge}`}>
                          <div className={`flex items-center gap-1.5 md:gap-2 ${t.textMain} font-bold text-[9px] md:text-sm`}>
                            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden xs:inline">Open Class</span>
                            <span className="xs:hidden">Open</span>
                          </div>
                          <span className={`${t.textMain} font-bold text-[9px] md:text-sm`}>{cls.openClass}</span>
                        </div>
                      )}
                      {cls.duration && (
                        <div className={`flex items-center justify-between ${t.bgBadge} px-2 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl border ${t.borderBadge}`}>
                          <div className={`flex items-center gap-1.5 md:gap-2 ${t.textMain} font-bold text-[9px] md:text-sm`}>
                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                            <span>Durasi</span>
                          </div>
                          <span className={`${t.textMain} font-bold text-[9px] md:text-sm`}>{cls.duration}</span>
                        </div>
                      )}

                      {(cls.originalPrice || cls.finalPrice) && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl p-2 md:p-4 mt-2 md:mt-5 relative overflow-hidden shadow-xs">
                          <div className="flex flex-col gap-0.5 md:gap-1 text-left">
                            {cls.originalPrice && (
                              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                <span className="text-[8px] md:text-xs font-bold text-slate-400 line-through">
                                  {formatRupiah(cls.originalPrice)}
                                </span>

                                {/* Popup Coretan Diskon Badge next to original price */}
                                {(() => {
                                  const origNum = parsePrice(cls.originalPrice);
                                  const finalNum = parsePrice(cls.finalPrice);
                                  const savedAmount = origNum - finalNum;
                                  
                                  let badgeText = "";
                                  if (savedAmount > 0) {
                                    badgeText = `Diskon ${formatRupiah(savedAmount)}`;
                                  } else if (cls.discountText) {
                                    badgeText = formatRupiah(cls.discountText);
                                    if (!/diskon|hemat/i.test(badgeText)) {
                                      badgeText = `Diskon ${badgeText}`;
                                    }
                                  } else if (cls.discount) {
                                    badgeText = `Diskon ${cls.discount.includes('%') ? cls.discount : `${cls.discount}%`}`;
                                  }

                                  if (!badgeText) return null;

                                  return (
                                    <span className="bg-rose-500 text-white text-[9px] font-black tracking-wide px-2 py-0.5 rounded-md uppercase animate-pulse shadow-xs inline-flex items-center">
                                      {badgeText}
                                    </span>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Final Price */}
                            {cls.finalPrice && (
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className={`text-[10px] md:text-2xl font-black tracking-tight ${t.textMain}`}>
                                  {formatRupiah(cls.finalPrice)}
                                </span>
                                <span className="text-[8px] md:text-[10px] text-slate-400 font-bold">/ program</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Registration status panel matching mockup */}
                    <div className="bg-slate-50/60 border border-slate-100 rounded-xl md:rounded-3xl p-2.5 md:p-5 space-y-2 md:space-y-3 mb-3 md:mb-6">
                      <div className="flex items-center justify-between text-[9px] md:text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Users className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                          <span>Pendaftar</span>
                        </div>
                        <span className={`${t.textMain} font-black`}>
                          {registeredCount}/{quotaLimit}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full h-2 md:h-3.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${t.bgBtn}`}
                          style={{ width: `${Math.min(100, Math.round((registeredCount / quotaLimit) * 100))}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[8px] md:text-[11px] font-bold">
                        <span className={t.textMain}>
                          Sisa: {remaining}
                        </span>
                      </div>
                    </div>

                    {/* Full-width Mendaftar button redirecting to WhatsApp Admin */}
                    <button 
                      onClick={() => {
                        const message = `Halo Admin LPK SCI, saya tertarik untuk mendaftar Kelas Alumni ${cls.level}. Mohon informasi pendaftaran selengkapnya.`;
                        window.open(`https://wa.me/6281395090885?text=${encodeURIComponent(message)}`, "_blank");
                      }}
                      className={`w-full ${t.bgBtn} ${t.hoverBtn} text-white font-bold py-2 md:py-3.5 px-3 md:px-6 rounded-lg md:rounded-2xl flex items-center justify-center gap-1.5 md:gap-2 transition duration-300 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer text-[10px] md:text-base`}
                    >
                      <FileEdit className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Daftar</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Why Choose Us Footer Section */}
            <div className="bg-white/10 rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col lg:flex-row gap-8 items-center justify-between">
              <div className="lg:w-2/3">
                <h3 className="text-xl font-black text-white mb-6 font-sans">Kenapa Belajar di LPK SCI?</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">Pengajar N1 &<br/>Native Jepang</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                      <MonitorPlay className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">Kelas Online &<br/>Offline</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">Materi Lengkap &<br/>Terupdate</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">Sertifikat Resmi<br/>LPK SCI</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                      <MonitorPlay className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">Pembelajaran<br/>Interaktif</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/3 bg-[#1c2e4a] p-8 rounded-3xl text-white w-full">
                <h3 className="text-xl font-bold mb-2 font-sans tracking-tight">Daftar Sekarang!</h3>
                <p className="text-xs text-blue-200 mb-6">Raih kesempatan terbaikmu untuk masa depan di Jepang.</p>
                <button onClick={onNavigateToRegistration} className="w-full bg-white text-[#1c2e4a] font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition cursor-pointer">
                  Hubungi Kami
                  <span className="bg-green-500 rounded-full p-1"><CheckCircle className="w-4 h-4 text-white" /></span>
                </button>
              </div>
            </div>

          </section>
        </div>
      )}

      {/* 5. LIGHTBOX ENLARGED PHOTO MODAL WITH DOWNLOAD */}
      {selectedGalleryImage && (
        <div 
          className="fixed inset-0 z-[100000] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setSelectedGalleryImage(null)}
        >
          {/* Top Header */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between pt-2 pb-4 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              {selectedGalleryImage.tag && (
                <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {selectedGalleryImage.tag}
                </span>
              )}
              <h3 className="text-white font-black text-sm sm:text-base tracking-wide truncate max-w-md">
                {selectedGalleryImage.title || "Foto Galeri LPK"}
              </h3>
            </div>
            <button
              onClick={() => setSelectedGalleryImage(null)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer active:scale-95 border border-white/10"
              title="Tutup (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center High-Res Image Display */}
          <div 
            className="relative flex-1 flex items-center justify-center my-4 w-full max-w-5xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedGalleryImage.image}
              alt={selectedGalleryImage.title || "Foto Galeri"}
              className="max-h-[70vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/15"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Bottom Bar with Download Button */}
          <div 
            className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 pt-4 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-slate-400 font-medium text-center sm:text-left truncate max-w-md">
              {selectedGalleryImage.description || selectedGalleryImage.title || "Galeri Foto LPK Pati"}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownloadImage(selectedGalleryImage.image, selectedGalleryImage.title || "foto_galeri_lpk")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-pink-500/25 active:scale-95 transition cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Unduh Foto (Download)</span>
              </button>

              <button
                onClick={() => setSelectedGalleryImage(null)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
