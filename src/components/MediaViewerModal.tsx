import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "lucide-react";
import { parseMediaInfo, downloadFile, getEmbeddablePdfUrl } from "../lib/storageHelper";

export interface MediaViewerModalProps {
  url: string | null | undefined;
  title?: string;
  onClose: () => void;
}

export function MediaViewerModal({ url, title = "Foto Bukti / Dokumen", onClose }: MediaViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [useGoogleDocs, setUseGoogleDocs] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const media = parseMediaInfo(url, title);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Reset zoom & states if url changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setImageError(false);
    setImageLoading(true);
  }, [url, retryCount]);

  const displayTitle = media.filename || title || "Foto Bukti / Dokumen";
  const effectiveImageUrl = media.googleDriveThumbnailUrl || media.url;
  const effectivePdfUrl = media.googleDriveEmbedUrl || getEmbeddablePdfUrl(media.url, useGoogleDocs);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-modal-title"
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
              {media.isPdf ? (
                <FileText className="w-4 h-4" />
              ) : media.isBiometricOnly ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </span>
            <div className="min-w-0">
              <h3 id="media-modal-title" className="text-sm sm:text-base font-extrabold text-slate-800 truncate">
                {displayTitle}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {media.isBiometricOnly
                  ? "Verifikasi Biometrik Wajah Otentik"
                  : media.isPdf
                  ? "Dokumen Berkas Digital"
                  : "Foto Dokumentasi / Lampiran Bukti"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {media.url && !media.isBiometricOnly && (
              <>
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-3xs"
                  title="Buka di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={() => downloadFile(media.url, `${displayTitle}`)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition cursor-pointer shadow-3xs"
                  title="Unduh file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-500 hover:text-slate-800"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-auto bg-slate-900/5 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[320px] max-h-[72vh] relative">
          {/* 1. Biometric OK Case */}
          {media.isBiometricOnly ? (
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-lg text-center max-w-md mx-auto space-y-4 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-800">Presensi Terverifikasi Biometrik</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Presensi ini diverifikasi secara otomatis melalui pencocokan wajah langsung (Face Biometric Match) oleh sistem.
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-[11px] font-bold text-emerald-800">
                ✓ Status Wajah & Akun Sah
              </div>
            </div>
          ) : !media.url ? (
            /* 2. Empty / Missing URL */
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md text-center max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800">Foto / Berkas Belum Tersedia</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tidak ditemukan lampiran foto atau berkas dokumen yang terunggah untuk catatan ini.
              </p>
            </div>
          ) : media.isPdf ? (
            /* 3. PDF Document */
            <div className="w-full h-full flex flex-col gap-3 min-h-[55vh]">
              {!media.url.startsWith("data:") && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
                  <span className="font-semibold text-[11.5px]">
                    📄 Format Dokumen PDF &middot; {useGoogleDocs ? "Google Docs Viewer" : "Penampil Langsung"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseGoogleDocs(!useGoogleDocs)}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-xl shadow-3xs transition text-[11px] cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{useGoogleDocs ? "Ganti ke Penampil Langsung" : "Ganti ke Google Docs"}</span>
                  </button>
                </div>
              )}

              <div className="w-full flex-1 min-h-[50vh] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                {useGoogleDocs ? (
                  <iframe
                    src={effectivePdfUrl}
                    title={displayTitle}
                    className="w-full h-[52vh] sm:h-[60vh] border-0 bg-white"
                  />
                ) : (
                  <object
                    data={effectivePdfUrl}
                    type="application/pdf"
                    className="w-full h-[52vh] sm:h-[60vh] bg-white border-0"
                  >
                    <iframe
                      src={effectivePdfUrl}
                      title={displayTitle}
                      className="w-full h-full border-0 bg-white"
                    >
                      <div className="p-8 text-center text-slate-600">
                        <p className="font-bold text-sm">Pratinjau PDF tidak dapat dimuat langsung.</p>
                        <a
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700"
                        >
                          <ExternalLink className="w-4 h-4" /> Buka PDF di Tab Baru
                        </a>
                      </div>
                    </iframe>
                  </object>
                )}
              </div>
            </div>
          ) : (
            /* 4. Image / Photo View */
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              {/* Image Controls Bar */}
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-md">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
                  disabled={zoom <= 0.5}
                  className="p-1.5 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition text-slate-700 cursor-pointer"
                  title="Perkecil (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold select-none min-w-[45px] text-center text-slate-700">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(4, prev + 0.25))}
                  disabled={zoom >= 4}
                  className="p-1.5 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition text-slate-700 cursor-pointer"
                  title="Perbesar (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-700 cursor-pointer"
                  title="Putar 90° (Rotate)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Image Frame */}
              <div className="w-full flex-1 flex items-center justify-center overflow-auto p-2 min-h-[260px] max-h-[58vh]">
                {imageError ? (
                  <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-md text-center max-w-md space-y-3">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Foto Tidak Dapat Ditampilkan Langsung</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Tautan foto mungkin memerlukan autentikasi khusus atau diblokir oleh proteksi peramban. Silakan buka tautan langsung.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka di Tab Baru</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setImageError(false);
                          setImageLoading(true);
                          setRetryCount((prev) => prev + 1);
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Lagi</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="transition-all duration-200 ease-out flex items-center justify-center"
                    style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                  >
                    <img
                      src={effectiveImageUrl}
                      alt={displayTitle}
                      className="max-h-[54vh] w-auto max-w-full rounded-2xl object-contain shadow-md border border-slate-200 bg-white"
                      referrerPolicy="no-referrer"
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            {media.url && !media.isBiometricOnly && (
              <button
                type="button"
                onClick={() => downloadFile(media.url, `${displayTitle}`)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Berkas</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
