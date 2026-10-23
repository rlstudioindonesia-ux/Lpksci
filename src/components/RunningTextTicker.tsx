import { todayLocalISO } from "../lib/dateUtils";
import React, { useMemo } from "react";
import { AlertCircle, Megaphone } from "lucide-react";

interface RunningTextTickerProps {
  customization?: any;
  events?: any[];
  variant?: "mobile" | "desktop";
  className?: string;
}

export default function RunningTextTicker({
  customization,
  events = [],
  variant = "mobile",
  className = ""
}: RunningTextTickerProps) {
  const displayText = useMemo(() => {
    try {
      // 1. Primary: Custom running text explicitly configured by Admin in Dashboard
      if (customization?.runningText && typeof customization.runningText === "string" && customization.runningText.trim().length > 0) {
        return customization.runningText.trim();
      }

      // 2. Secondary: Upcoming active events (sorted ascending, max 6 relevant items)
      const todayStr = todayLocalISO();
      const upcomingEvents = (Array.isArray(events) ? events : [])
        .filter((e) => e && typeof e === "object" && typeof e.title === "string" && e.title.trim().length > 0 && (!e.date || String(e.date) >= todayStr))
        .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
        .slice(0, 6);

      if (upcomingEvents.length > 0) {
        const formatDateSimple = (dStr?: any) => {
          if (!dStr) return "";
          try {
            const raw = typeof dStr === "string" ? dStr : (dStr && typeof dStr.toDate === "function" ? dStr.toDate().toISOString() : String(dStr));
            const datePart = raw.split("T")[0];
            const parts = datePart.split("-");
            if (parts.length === 3) {
              const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
              const monthIdx = parseInt(parts[1], 10) - 1;
              if (monthIdx >= 0 && monthIdx < 12) {
                return `${parseInt(parts[2], 10)} ${months[monthIdx]} ${parts[0]}`;
              }
            }
            return datePart;
          } catch {
            return "";
          }
        };

        const eventString = upcomingEvents
          .map((e) => `${e.title}${e.date ? ` (${formatDateSimple(e.date)})` : ""}`)
          .join("  ✦  ");

        return `Selamat datang di LPK SOURCE COURSE INDONESIA (SCI) Pati  ✦  Agenda & Jadwal Terkini: ${eventString}  ✦  Ujian JFT-Basic & Tokutei Ginou Kaigo terdekat segera diselenggarakan.`;
      }
    } catch (err) {
      console.warn("Error calculating ticker text:", err);
    }

    // 3. Fallback: Professional institutional welcome banner
    return "🇯🇵 Selamat Datang di Portal Resmi LPK Source Course Indonesia (SCI) Pati • Lembaga Resmi Pelatihan Kerja & Pengiriman Tenaga Profesional ke Jepang (Program Tokutei Ginou / SSW & Magang) • Bimbingan Bahasa Jepang Intensif N5, N4, JFT-Basic & Skill Kaigo Lansia • Info Pendaftaran & Konsultasi Hubungi Kantor LPK SCI Pati";
  }, [customization?.runningText, events]);

  // Calculate proportional animation speed so text remains readable regardless of length
  const animDuration = useMemo(() => {
    const len = displayText.length;
    return Math.max(20, Math.min(65, Math.round(len * 0.22)));
  }, [displayText]);

  // Segment to repeat identically across both marquee halves
  const renderItem = (keyPrefix: string) => (
    <span key={keyPrefix} className="inline-flex items-center whitespace-nowrap">
      <span>{displayText}</span>
      <span className="text-yellow-400 font-extrabold px-6 select-none opacity-80">✦</span>
    </span>
  );

  if (variant === "desktop") {
    return (
      <div 
        className={`w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-y border-indigo-500/20 shadow-xs flex items-center h-10 select-none overflow-hidden relative ${className}`}
        title="Info Terkini LPK SCI"
      >
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] sm:text-[11px] font-black uppercase px-4 sm:px-6 h-full flex items-center justify-center tracking-wider shrink-0 shadow-md relative z-10 border-r border-red-500/80 gap-2">
          <Megaphone className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
          <span className="whitespace-nowrap">Info Terkini</span>
        </div>

        <div className="flex-1 overflow-hidden relative z-0 flex items-center h-full px-2">
          <div 
            className="animate-marquee inline-flex items-center whitespace-nowrap will-change-transform text-slate-100 text-xs font-semibold tracking-wide cursor-default md:hover:[animation-play-state:paused]"
            style={{ animationDuration: `${animDuration}s` }}
          >
            {/* Track 1 (exactly 50% of the total width) */}
            <div className="inline-flex items-center shrink-0">
              {renderItem("t1_1")}
              {renderItem("t1_2")}
              {renderItem("t1_3")}
            </div>
            {/* Track 2 (identically duplicated to create seamless infinite loop with zero jump) */}
            <div className="inline-flex items-center shrink-0" aria-hidden="true">
              {renderItem("t2_1")}
              {renderItem("t2_2")}
              {renderItem("t2_3")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Variant (compact ribbon)
  return (
    <div 
      className={`bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center h-9 overflow-hidden select-none relative shadow-sm rounded-xl mx-2 my-2 border border-indigo-500/20 ${className}`}
      title="Info Terkini LPK SCI"
    >
      <div className="bg-red-600 text-white text-[9.5px] font-black uppercase px-3 h-full flex items-center justify-center tracking-tight shrink-0 rounded-l-xl shadow-md relative z-10 border-r border-red-500 gap-1.5">
        <AlertCircle className="w-3 h-3 text-yellow-300" />
        <span className="whitespace-nowrap">Info</span>
      </div>

      <div className="flex-1 overflow-hidden relative z-0 flex items-center h-full px-2">
        <div 
          className="animate-marquee inline-flex items-center whitespace-nowrap will-change-transform text-blue-100 text-[11px] font-bold font-sans cursor-default"
          style={{ animationDuration: `${animDuration}s` }}
        >
          {/* Track 1 (exactly 50% of the total width) */}
          <div className="inline-flex items-center shrink-0">
            {renderItem("m1_1")}
            {renderItem("m1_2")}
            {renderItem("m1_3")}
          </div>
          {/* Track 2 (identically duplicated for zero glitch jump) */}
          <div className="inline-flex items-center shrink-0" aria-hidden="true">
            {renderItem("m2_1")}
            {renderItem("m2_2")}
            {renderItem("m2_3")}
          </div>
        </div>
      </div>
    </div>
  );
}
