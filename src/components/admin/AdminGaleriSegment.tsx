import React, { useState } from "react";
import { Plus, Image as ImageIcon, Trash2, Loader2, ArrowUp, ArrowDown, Check, Camera, Edit } from "lucide-react";
import { uploadFileToFirebase } from "../../lib/storageHelper";
import { ConfirmForm } from "../ConfirmForm";

interface AdminGaleriSegmentProps {
  custGallery: any[];
  setCustGallery: React.Dispatch<React.SetStateAction<any[]>>;
  galleryUploadStatus: any;
  setGalleryUploadStatus: any;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
}

export default function AdminGaleriSegment({
  custGallery,
  setCustGallery,
  galleryUploadStatus,
  setGalleryUploadStatus,
  onUpdateState
}: AdminGaleriSegmentProps) {
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  const [slideSaveSuccess, setSlideSaveSuccess] = useState<boolean>(false);
  const [localUploadStatuses, setLocalUploadStatuses] = useState<Record<number, 'idle' | 'loading' | 'success' | 'error' | undefined>>({});

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 text-left">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            ADMIN GALERI CONSOLE
          </span>
          <h3 className="text-xl font-black font-sans tracking-tight">
            Kustomisasi Galeri Foto
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Sesuaikan galeri gambar yang akan ditampilkan pada halaman profil LPK.
          </p>
        </div>
        {slideSaveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-bounce">
            <Check className="h-4 w-4 bg-emerald-500 text-slate-950 rounded-full p-0.5" />
            <span>Berhasil Disinkronkan!</span>
          </div>
        )}
      </div>
      
      {/* Gallery Editor Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-indigo-600" />
            <h4 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide">
              Daftar Foto Galeri
            </h4>
          </div>
          <button
            type="button"
            onClick={() => {
              const newId =
                custGallery.length > 0
                  ? Math.max(...custGallery.map((s) => s.id || 0)) + 1
                  : 1;
              const newGallery = {
                id: newId,
                title: "Foto Galeri Baru",
                image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=400&q=80",
              };
              const updated = [...custGallery, newGallery];
              setCustGallery(updated);
              onUpdateState("galleries", "update", updated);
              setSelectedGalleryId(newId);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Foto Galeri
          </button>
        </div>
        
        {custGallery.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            Tidak ada foto galeri. Silakan klik "Tambah Foto Galeri".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {custGallery.map((item, gIdx) => {
              const isEditing = selectedGalleryId === (item.id || gIdx);
              return (
                <div
                  key={item.id || gIdx}
                  className={`rounded-2xl border transition overflow-hidden flex flex-col justify-between ${
                    isEditing
                      ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/20"
                  }`}
                >
                  <div className="relative h-28 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title || "Galeri"}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-left">
                      <span className="text-[10px] text-white font-extrabold truncate block mt-1 drop-shadow-sm leading-tight">
                        {item.title || "No Title"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 flex-1 flex flex-col">
                    {isEditing ? (
                      <div className="space-y-3 flex-1">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 block">
                            Judul Foto
                          </label>
                          <input
                            type="text"
                            value={item.title || ""}
                            onChange={(e) => {
                              const updated = [...custGallery];
                              updated[gIdx].title = e.target.value;
                              setCustGallery(updated);
                              onUpdateState("galleries", "update", updated);
                            }}
                            className="w-full text-[10px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 focus:border-indigo-500 focus:bg-white transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 block flex items-center justify-between">
                            URL Gambar Galeri
                          </label>
                          <input
                            type="text"
                            value={item.image || ""}
                            onChange={(e) => {
                              const updated = [...custGallery];
                              updated[gIdx].image = e.target.value;
                              setCustGallery(updated);
                              onUpdateState("galleries", "update", updated);
                            }}
                            className="w-full text-[10px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 focus:border-indigo-500 focus:bg-white transition"
                          />
                          <div className="pt-2">
                            <label className="text-[9px] font-bold text-slate-600 block mb-1">
                              Atau Upload Gambar Galeri (Opsional)
                            </label>
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    try {
                                      setLocalUploadStatuses(prev => ({ ...prev, [gIdx]: 'loading' }));
                                      const file = e.target.files[0];
                                      const url = await uploadFileToFirebase(file, "galeri");
                                      if (url) {
                                        const updated = [...custGallery];
                                        updated[gIdx].image = url;
                                        setCustGallery(updated);
                                        onUpdateState("galleries", "update", updated);
                                        setLocalUploadStatuses(prev => ({ ...prev, [gIdx]: 'success' }));
                                        setTimeout(() => setLocalUploadStatuses(prev => ({ ...prev, [gIdx]: undefined })), 3000);
                                      }
                                    } catch (err) {
                                      console.error("Upload failed", err);
                                      alert("Gagal upload gambar galeri");
                                      setLocalUploadStatuses(prev => ({ ...prev, [gIdx]: undefined }));
                                    }
                                  }
                                }}
                                className="w-full text-[9px]"
                              />
                              {localUploadStatuses[gIdx] === 'loading' && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] text-indigo-600 font-bold bg-white px-1">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                                </div>
                              )}
                              {localUploadStatuses[gIdx] === 'success' && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] text-emerald-600 font-bold bg-white px-1">
                                  <Check className="w-2.5 h-2.5" /> Berhasil
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-[9px] text-slate-400 mt-2 truncate">
                          {item.image || "No Image URL"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between mt-auto">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGalleryId(isEditing ? null : (item.id || gIdx))
                      }
                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition"
                    >
                      {isEditing ? (
                        <>
                          <Check className="h-3 w-3" /> Selesai
                        </>
                      ) : (
                        <>
                          <Edit className="h-3 w-3" /> Edit Foto
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const updated = custGallery.filter(
                          (_, idx) => idx !== gIdx
                        );
                        setCustGallery(updated);
                        onUpdateState("galleries", "update", updated);
                        if (selectedGalleryId === (item.id || gIdx)) {
                          setSelectedGalleryId(null);
                        }
                      }}
                      className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition"
                      title="Hapus Foto"
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
            confirmTitle="Simpan Galeri Foto"
            confirmMessage="Menerapkan galeri foto ini ke beranda publik secara instan?"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await onUpdateState("galleries", "update", custGallery);
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
              {slideSaveSuccess ? "Berhasil Disimpan!" : "Simpan Galeri Foto"}
            </button>
          </ConfirmForm>
        </div>
      </div>
    </div>
  );
}
