import React, { useState } from "react";
import { SystemState, UserAccount } from "../types";
import {
  PhoneCall,
  ArrowRight,
  ImageIcon,
  Compass,
  Share2,
  Download,
  Maximize2,
  X,
  Eye,
} from "lucide-react";

interface EksplorasiViewProps {
  currentUser: UserAccount | null;
  systemState: SystemState;
  onLoginSuccess?: (user: UserAccount) => void;
  onUpdateState: (
    dataType: string,
    action: string,
    payload: any,
  ) => Promise<boolean>;
}

export default function EksplorasiView({
  currentUser,
  systemState,
}: EksplorasiViewProps) {
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<{ image: string; title?: string; tag?: string; description?: string } | null>(null);

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

  const galleryItems = systemState?.galleries || [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* 1. GALERI FOTO PEMBELAJARAN */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
              <span>📷</span> Galeri Foto Pembelajaran LPK Pati
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Galeri resmi kegiatan bimbingan belajar bahasa, SOP, persiapan tes fisik, dan mensetsu kerja. Klik foto untuk perbesar & unduh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedGalleryImage({
                image: item.image || (item as any).img,
                title: item.title,
                tag: item.tag || "GALERI LPK",
              })}
              className="group bg-slate-50 p-2.5 rounded-2xl border border-slate-200 overflow-hidden space-y-2 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer active:scale-95 flex flex-col justify-between"
            >
              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900">
                <img
                  src={item.image || (item as any).img}
                  alt={item.title}
                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 left-2 bg-indigo-700/90 text-white font-mono font-black text-[7.5px] px-1.5 py-0.5 rounded tracking-wide">
                  {item.tag}
                </span>
                <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-300" />
                </div>
              </div>
              <div className="px-1">
                <p className="text-[10.5px] font-black text-slate-900 truncate leading-tight">
                  {item.title}
                </p>
                <div className="flex items-center justify-between text-[9px] text-indigo-600 font-bold mt-1">
                  <span>Perbesar</span>
                  <Download className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX ENLARGED PHOTO MODAL */}
      {selectedGalleryImage && (
        <div 
          className="fixed inset-0 z-[100000] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <div 
            className="w-full max-w-4xl flex items-center justify-between pb-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {selectedGalleryImage.tag && (
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedGalleryImage.tag}
                </span>
              )}
              <h3 className="text-white font-black text-sm sm:text-base truncate max-w-md">
                {selectedGalleryImage.title || "Foto Galeri LPK"}
              </h3>
            </div>
            <button
              onClick={() => setSelectedGalleryImage(null)}
              className="p-1.5 bg-white/10 text-white rounded-full transition cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div 
            className="relative flex-1 flex items-center justify-center my-3 w-full max-w-4xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedGalleryImage.image}
              alt={selectedGalleryImage.title || "Foto Galeri"}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/15"
              referrerPolicy="no-referrer"
            />
          </div>

          <div 
            className="w-full max-w-4xl flex items-center justify-between gap-3 pt-3 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedGalleryImage(null)}
              className="px-4 py-2 bg-white/10 text-slate-300 text-xs font-bold rounded-xl active:scale-95 transition"
            >
              Tutup
            </button>
            <button
              onClick={() => handleDownloadImage(selectedGalleryImage.image, selectedGalleryImage.title || "foto_galeri_lpk")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Foto</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
