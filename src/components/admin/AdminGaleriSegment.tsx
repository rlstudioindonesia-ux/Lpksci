import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  Loader2, 
  Check, 
  Camera, 
  Edit, 
  X, 
  Search, 
  Upload, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Layers,
  Save
} from "lucide-react";
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
  // Form state for adding a new gallery item (isolated from global state so typing NEVER resets)
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newImage, setNewImage] = useState<string>("");
  const [newTag, setNewTag] = useState<string>("GALERI LPK");
  const [newDesc, setNewDesc] = useState<string>("");
  const [isUploadingNew, setIsUploadingNew] = useState<boolean>(false);
  const [addFormError, setAddFormError] = useState<string>("");

  // Existing items editing state (isolated per-card so keystrokes NEVER reset or lag)
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | number | null>(null);
  const [editingCard, setEditingCard] = useState<{ id: string | number; title: string; tag: string; image: string; description: string } | null>(null);
  const [isSavingCard, setIsSavingCard] = useState<boolean>(false);
  const [cardSaveSuccessId, setCardSaveSuccessId] = useState<string | number | null>(null);
  const [slideSaveSuccess, setSlideSaveSuccess] = useState<boolean>(false);
  const [localUploadStatuses, setLocalUploadStatuses] = useState<Record<string | number, 'idle' | 'loading' | 'success' | 'error' | undefined>>({});

  // Search & Pagination for smooth browsing through 80+ photos
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  const quickTags = ["GALERI LPK", "INTERVIEW KERJA", "PELATIHAN JEPANG", "PELEPASAN SISWA", "KEGIATAN ASRAMA"];

  // Filtered list based on search
  const filteredGallery = useMemo(() => {
    if (!searchQuery.trim()) return custGallery;
    const q = searchQuery.toLowerCase().trim();
    return custGallery.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.tag && item.tag.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [custGallery, searchQuery]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(filteredGallery.length / itemsPerPage));
  const paginatedGallery = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGallery.slice(start, start + itemsPerPage);
  }, [filteredGallery, currentPage, itemsPerPage]);

  // Handle uploading image for new photo form
  const handleUploadNewImage = async (file: File) => {
    try {
      setIsUploadingNew(true);
      setAddFormError("");
      const url = await uploadFileToFirebase(file, "galeri");
      if (url) {
        setNewImage(url);
      } else {
        setAddFormError("Gagal mengupload gambar. Silakan coba lagi.");
      }
    } catch (err: any) {
      console.error("Upload new image error:", err);
      setAddFormError("Terjadi kesalahan saat upload gambar.");
    } finally {
      setIsUploadingNew(false);
    }
  };

  // Submit new photo to gallery
  const handleAddNewPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setAddFormError("Mohon masukkan judul foto galeri terlebih dahulu.");
      return;
    }
    if (!newImage.trim()) {
      setAddFormError("Mohon upload gambar atau masukkan tautan URL foto.");
      return;
    }

    const uniqueId = `gal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newEntry = {
      id: uniqueId,
      title: newTitle.trim(),
      image: newImage.trim(),
      tag: newTag.trim() || "GALERI LPK",
      description: newDesc.trim() || "Dokumentasi kegiatan LPK Source Course Indonesia",
    };

    // Prepend to the very top so the admin immediately sees the new photo
    const updated = [newEntry, ...custGallery];
    setCustGallery(updated);
    
    // Persist to server
    await onUpdateState("galleries", "update", updated);

    // Reset isolated form states
    setNewTitle("");
    setNewImage("");
    setNewTag("GALERI LPK");
    setNewDesc("");
    setAddFormError("");
    setShowAddForm(false);
    setCurrentPage(1);

    setSlideSaveSuccess(true);
    setTimeout(() => setSlideSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 text-left">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Camera className="w-3 h-3 text-indigo-400" />
            ADMIN GALERI CONSOLE
          </span>
          <h3 className="text-xl font-black font-sans tracking-tight">
            Kustomisasi Galeri Foto LPK
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Kelola dan tambah dokumentasi kegiatan siswa, wawancara kerja, dan aktivitas LPK yang langsung tampil di beranda website.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {slideSaveSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-bounce">
              <Check className="h-4 w-4 bg-emerald-500 text-slate-950 rounded-full p-0.5" />
              <span>Tersimpan & Disinkronkan!</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              setAddFormError("");
            }}
            className={`font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition shadow-md ${
              showAddForm
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white"
            }`}
          >
            {showAddForm ? (
              <>
                <X className="h-4 w-4" /> Tutup Form Tambah
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Tambah Foto Galeri Baru
              </>
            )}
          </button>
        </div>
      </div>

      {/* DEDICATED ADD PHOTO FORM (Isolated State: Keystrokes NEVER reset) */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 p-6 rounded-3xl border-2 border-indigo-200/80 shadow-lg space-y-5 animate-fade-in text-left">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Formulir Tambah Foto Galeri Baru
                </h4>
                <p className="text-[11px] text-slate-500">
                  Isi judul dan upload foto, ketikan Anda dijamin aman tanpa risiko kereset.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/80 transition"
              title="Tutup Form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {addFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {addFormError}
            </div>
          )}

          <form onSubmit={handleAddNewPhoto} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Form Input Fields (Left column) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Judul Foto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Judul Foto Kegiatan <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">Tampil sebagai nama foto di website</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (addFormError) setAddFormError("");
                    }}
                    placeholder="Contoh: Lolos Interview Magang Bidang Pengelasan di Osaka"
                    className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition outline-none shadow-xs font-medium text-slate-900"
                    autoFocus
                  />
                </div>

                {/* Kategori / Tag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Kategori / Label Tag</span>
                    <span className="text-[10px] text-slate-400 font-normal">Label kecil di pojok foto</span>
                  </label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Contoh: GALERI LPK / INTERVIEW / DLL"
                    className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3.5 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition outline-none shadow-xs text-slate-800"
                  />
                  {/* Quick Tag Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Pilih Cepat:</span>
                    {quickTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNewTag(tag)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          newTag === tag
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload File Gambar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Upload File Foto Langsung Dari Perangkat <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 px-4 py-2.5 rounded-xl cursor-pointer transition text-xs font-semibold text-indigo-700">
                      {isUploadingNew ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          <span>Mengupload foto ke server...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span>Pilih Foto dari Komputer / HP</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingNew}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadNewImage(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Alternatif URL Gambar */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                    <span>Atau Masukkan Tautan / URL Gambar Online</span>
                    <span className="text-[10px] text-slate-400 font-normal">Opsional jika sudah ada link foto</span>
                  </label>
                  <input
                    type="text"
                    value={newImage}
                    onChange={(e) => {
                      setNewImage(e.target.value);
                      if (addFormError) setAddFormError("");
                    }}
                    placeholder="https://images.unsplash.com/... atau paste link foto"
                    className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3.5 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition outline-none shadow-xs text-slate-800"
                  />
                </div>

                {/* Deskripsi (Opsional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Keterangan / Deskripsi (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Keterangan singkat dokumentasi foto..."
                    className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3.5 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition outline-none shadow-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Live Preview Panel (Right column) */}
              <div className="lg:col-span-4 flex flex-col justify-between bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Live Preview Tampilan Foto
                  </span>
                  <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                    {newImage ? (
                      <img
                        src={newImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50 text-indigo-300" />
                        <span className="text-[11px] font-medium">Foto belum dipilih</span>
                        <span className="text-[9px] text-slate-500">Pilih file foto atau isi URL</span>
                      </div>
                    )}
                    {newTag && (
                      <div className="absolute top-2 left-2 bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-sm">
                        {newTag}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-2.5 text-left">
                      <p className="text-white text-xs font-bold truncate">
                        {newTitle || "Judul foto akan tampil di sini"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <button
                    type="submit"
                    disabled={isUploadingNew}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
                  >
                    {isUploadingNew ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sedang Mengupload...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Simpan Foto ke Galeri
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 px-3 rounded-xl text-xs transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Gallery List Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-left">
            <Camera className="h-5 w-5 text-indigo-600" />
            <div>
              <h4 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                Daftar Foto Galeri
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-black text-[10px] px-2 py-0.5 rounded-full">
                  Total: {custGallery.length} Foto
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Klik foto untuk edit judul atau ganti gambar kapan saja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari foto galeri..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none w-48 sm:w-64"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddForm(true);
                setAddFormError("");
                window.scrollTo({ top: 120, behavior: "smooth" });
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Foto
            </button>
          </div>
        </div>

        {custGallery.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-3">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold">Belum ada foto galeri.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Foto Sekarang
            </button>
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs">
            Tidak ditemukan foto dengan kata kunci "{searchQuery}".
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-indigo-600 font-bold ml-2 underline cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <>
            {/* Gallery Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {paginatedGallery.map((item, gIdx) => {
                const isEditing = selectedGalleryId === item.id && editingCard?.id === item.id;
                const displayImage = isEditing && editingCard?.image ? editingCard.image : item.image;
                const displayTitle = isEditing && editingCard?.title !== undefined ? editingCard.title : item.title;
                const displayTag = isEditing && editingCard?.tag !== undefined ? editingCard.tag : item.tag;

                return (
                  <div
                    key={item.id || `gal_idx_${gIdx}`}
                    className={`rounded-2xl border transition overflow-hidden flex flex-col justify-between ${
                      isEditing
                        ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white shadow-md"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/20"
                    }`}
                  >
                    <div className="relative h-32 w-full bg-slate-950 overflow-hidden group">
                      <img
                        src={displayImage}
                        alt={displayTitle || "Galeri"}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                      
                      {displayTag && (
                        <div className="absolute top-2 left-2 bg-indigo-600/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          {displayTag}
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2 text-left">
                        <span className="text-[11px] text-white font-extrabold truncate block drop-shadow-sm leading-tight">
                          {displayTitle || "No Title"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-3 flex-1 flex flex-col">
                      {isEditing && editingCard ? (
                        <div className="space-y-3 flex-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600 block">
                              Judul Foto <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={editingCard.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingCard((prev) => (prev ? { ...prev, title: val } : null));
                              }}
                              placeholder="Masukkan judul foto..."
                              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition text-slate-900 font-medium"
                              autoFocus
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600 block">
                              Kategori / Label Tag
                            </label>
                            <input
                              type="text"
                              value={editingCard.tag}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingCard((prev) => (prev ? { ...prev, tag: val } : null));
                              }}
                              placeholder="GALERI LPK"
                              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus:border-indigo-500 transition text-slate-800"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600 block">
                              URL Gambar
                            </label>
                            <input
                              type="text"
                              value={editingCard.image}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingCard((prev) => (prev ? { ...prev, image: val } : null));
                              }}
                              placeholder="https://..."
                              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus:border-indigo-500 transition text-slate-800"
                            />
                            
                            <div className="pt-2">
                              <label className="text-[9px] font-bold text-slate-600 block mb-1">
                                Ganti Gambar (Upload File)
                              </label>
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      try {
                                        setLocalUploadStatuses(prev => ({ ...prev, [item.id]: 'loading' }));
                                        const file = e.target.files[0];
                                        const url = await uploadFileToFirebase(file, "galeri");
                                        if (url) {
                                          setEditingCard(prev => prev ? { ...prev, image: url } : null);
                                          setLocalUploadStatuses(prev => ({ ...prev, [item.id]: 'success' }));
                                          setTimeout(() => setLocalUploadStatuses(prev => ({ ...prev, [item.id]: undefined })), 2500);
                                        }
                                      } catch (err) {
                                        console.error("Upload failed", err);
                                        alert("Gagal upload gambar galeri");
                                        setLocalUploadStatuses(prev => ({ ...prev, [item.id]: undefined }));
                                      }
                                    }
                                  }}
                                  className="w-full text-[9px]"
                                />
                                {localUploadStatuses[item.id] === 'loading' && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] text-indigo-600 font-bold bg-white px-1">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                                  </div>
                                )}
                                {localUploadStatuses[item.id] === 'success' && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] text-emerald-600 font-bold bg-white px-1">
                                    <Check className="w-2.5 h-2.5" /> Berhasil
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600 block">
                              Keterangan / Deskripsi
                            </label>
                            <input
                              type="text"
                              value={editingCard.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingCard((prev) => (prev ? { ...prev, description: val } : null));
                              }}
                              placeholder="Keterangan foto kegiatan..."
                              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus:border-indigo-500 transition text-slate-800"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 space-y-1">
                          <p className="text-[10px] text-slate-500 font-medium line-clamp-2">
                            {item.description || item.title || "Dokumentasi kegiatan LPK"}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">
                            ID: {item.id}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between mt-auto">
                      {isEditing && editingCard ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isSavingCard}
                              onClick={async () => {
                                if (!editingCard) return;
                                setIsSavingCard(true);
                                const finalTitle = editingCard.title.trim() || "Dokumentasi Kegiatan LPK";
                                const finalTag = editingCard.tag.trim() || "GALERI LPK";
                                const finalImage = editingCard.image.trim() || item.image;
                                const finalDesc = editingCard.description.trim() || item.description || "";
                                const updatedItem = {
                                  ...item,
                                  title: finalTitle,
                                  tag: finalTag,
                                  image: finalImage,
                                  description: finalDesc
                                };
                                const updatedList = custGallery.map((it) =>
                                  String(it.id) === String(item.id) ? updatedItem : it
                                );
                                setCustGallery(updatedList);
                                const ok = await onUpdateState("galleries", "update", updatedList);
                                setIsSavingCard(false);
                                if (ok) {
                                  setCardSaveSuccessId(item.id);
                                  setTimeout(() => {
                                    setCardSaveSuccessId(null);
                                    setSelectedGalleryId(null);
                                    setEditingCard(null);
                                  }, 1000);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition cursor-pointer"
                            >
                              {isSavingCard ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              <span>{cardSaveSuccessId === item.id ? "Tersimpan!" : "Simpan"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGalleryId(null);
                                setEditingCard(null);
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-xl hover:bg-slate-200 transition cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Hapus foto "${item.title}" dari galeri?`)) {
                                const updated = custGallery.filter((it) => String(it.id) !== String(item.id));
                                setCustGallery(updated);
                                await onUpdateState("galleries", "delete", { id: item.id });
                                setSelectedGalleryId(null);
                                setEditingCard(null);
                              }
                            }}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer"
                            title="Hapus Foto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGalleryId(item.id);
                              setEditingCard({
                                id: item.id,
                                title: item.title || "",
                                tag: item.tag || "GALERI LPK",
                                image: item.image || "",
                                description: item.description || ""
                              });
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition"
                          >
                            <Edit className="h-3 w-3" /> Edit Foto
                          </button>
                          
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Hapus foto "${item.title}" dari galeri?`)) {
                                const updated = custGallery.filter((it) => String(it.id) !== String(item.id));
                                setCustGallery(updated);
                                await onUpdateState("galleries", "delete", { id: item.id });
                                if (selectedGalleryId === item.id) {
                                  setSelectedGalleryId(null);
                                  setEditingCard(null);
                                }
                              }
                            }}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer"
                            title="Hapus Foto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-medium">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredGallery.length)} dari {filteredGallery.length} foto
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-bold text-slate-700">
                    Halaman {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Bottom Simpan Button */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <ConfirmForm
            confirmTitle="Simpan Seluruh Galeri Foto"
            confirmMessage="Menerapkan seluruh data galeri foto ini ke beranda publik secara instan?"
            onSubmit={async (e) => {
              e.preventDefault();
              let listToSave = custGallery;
              if (editingCard) {
                const finalTitle = (editingCard.title || "").trim() || "Dokumentasi Kegiatan LPK";
                const finalTag = (editingCard.tag || "").trim() || "GALERI LPK";
                const finalImage = (editingCard.image || "").trim();
                const finalDesc = (editingCard.description || "").trim();
                listToSave = custGallery.map((it) =>
                  String(it.id) === String(editingCard.id)
                    ? {
                        ...it,
                        title: finalTitle,
                        tag: finalTag,
                        image: finalImage || it.image,
                        description: finalDesc || it.description || ""
                      }
                    : it
                );
                setCustGallery(listToSave);
                setSelectedGalleryId(null);
                setEditingCard(null);
              }
              const ok = await onUpdateState("galleries", "update", listToSave);
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
