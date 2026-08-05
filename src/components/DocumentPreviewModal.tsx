import React, { useState } from "react";
import { X, FileText, Download, ExternalLink, RefreshCw, Layers } from "lucide-react";
import { downloadFile, getEmbeddablePdfUrl } from "../lib/storageHelper";

interface DocumentPreviewModalProps {
  url: string;
  name: string;
  onClose: () => void;
}

export function DocumentPreviewModal({ url, name, onClose }: DocumentPreviewModalProps) {
  const [useGoogleDocs, setUseGoogleDocs] = useState(true);
  const isPdf = url.includes('.pdf') || name.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
  const isImage = url.startsWith('data:image') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp');

  const pdfUrl = getEmbeddablePdfUrl(url, useGoogleDocs);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex flex-col items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200/80 flex flex-wrap sm:flex-nowrap justify-between items-center bg-slate-50 gap-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 truncate min-w-0">
            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">{name}</span>
          </h3>
          
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Buka di Tab Baru</span>
            </a>
            <button 
              type="button"
              onClick={() => downloadFile(url, name)}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Unduh</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" /> <span className="hidden sm:inline">Tutup</span>
            </button>
          </div>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-auto bg-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 min-h-[55vh]">
          {isImage ? (
            <img src={url} alt={name} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-md bg-white p-1" />
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col gap-2.5 flex-1">
              {/* Toolbar Mode Switcher */}
              {!url.startsWith('data:') && !url.startsWith('blob:') ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-950 w-full">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">💡</span>
                      <span className="truncate font-semibold">
                        {useGoogleDocs ? "Menggunakan Penampil Google Docs." : "Menggunakan Penampil Langsung Browser."}
                      </span>
                    </div>
                    {useGoogleDocs && (window.location.hostname.includes("run.app") || window.location.hostname.includes("localhost")) && (
                      <span className="text-[10px] text-amber-700 font-semibold leading-tight mt-0.5 ml-6">
                        ⚠️ Di lingkungan preview/dev, Google Docs tidak dapat mengakses file ini secara langsung. Jika kosong, ganti ke <strong>Penampil Langsung</strong> atau klik <strong>Tab Baru</strong>.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => setUseGoogleDocs(!useGoogleDocs)}
                      className="flex items-center gap-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-lg shadow-2xs transition-all text-[11px] cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{useGoogleDocs ? "Ganti ke Penampil Langsung" : "Ganti ke Google Docs"}</span>
                    </button>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-bold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg shadow-2xs transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Tab Baru
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs text-indigo-950">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">🛡️</span>
                    <span className="truncate font-bold">
                      Dokumen Aman Terenkripsi (Base64) - Ditampilkan langsung dengan aman di penampil browser.
                    </span>
                  </div>
                </div>
              )}

              {/* PDF Container using native object + iframe fallback */}
              <div className="w-full flex-1 min-h-[60vh] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                {useGoogleDocs ? (
                  <iframe 
                    src={pdfUrl} 
                    title={name} 
                    className="w-full h-[62vh] sm:h-[68vh] border-0 bg-white"
                  />
                ) : (
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-[62vh] sm:h-[68vh] bg-white border-0"
                  >
                    <iframe 
                      src={pdfUrl} 
                      title={name} 
                      className="w-full h-full border-0 bg-white" 
                    >
                      <div className="p-8 text-center text-slate-600">
                        <p className="font-bold text-sm">Pratinjau PDF tidak dapat dimuat langsung oleh browser.</p>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700"
                        >
                          <ExternalLink className="w-4 h-4" /> Buka File PDF di Tab Baru
                        </a>
                      </div>
                    </iframe>
                  </object>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md my-auto">
              <FileText className="w-16 h-16 text-indigo-300 mb-3" />
              <p className="font-bold text-slate-800 text-sm">Pratinjau langsung tidak didukung untuk format ini.</p>
              <p className="text-xs text-slate-500 mt-1">Silakan buka file secara langsung atau unduh untuk melihat isinya.</p>
              <div className="flex gap-2 mt-5">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" /> Buka di Tab Baru
                </a>
                <button
                  type="button"
                  onClick={() => downloadFile(url, name)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Unduh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
