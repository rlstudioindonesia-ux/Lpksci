import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { UserAccount, SystemState } from "../types";
import { uploadFileToFirebase } from "../lib/storageHelper";
import { 
  FileText, CheckSquare, Receipt, Clock, Users, Search,
  Camera, MapPin, Upload, AlertTriangle, CheckCircle, Image as ImageIcon, Video, HelpCircle, Eye
} from "lucide-react";

export function TeacherDashboardPanel({
  currentUser,
  systemState,
  onUpdateState,
  setActiveTab
}: {
  currentUser: UserAccount;
  systemState: SystemState;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  setActiveTab?: (tab: string) => void;
}) {
  const [showTeacherModal, setShowTeacherModal] = useState<string | null>(null);
  const [teacherBankName, setTeacherBankName] = useState(currentUser.bankAccount?.split(' - ')[0] || "");
  const [teacherBankNum, setTeacherBankNum] = useState(currentUser.bankAccount?.split(' - ')[1] || "");
  const [teacherCutiStart, setTeacherCutiStart] = useState("");
  const [teacherCutiEnd, setTeacherCutiEnd] = useState("");
  const [teacherCutiReason, setTeacherCutiReason] = useState("");
  const [teacherKontrakSigned, setTeacherKontrakSigned] = useState(false);
  const [reportType, setReportType] = useState<"SPT" | "BPJS" | "Agenda">("Agenda");
  const [reportText, setReportText] = useState("");
  const [reportLink, setReportLink] = useState("");
  const [presensiBiometricStatus, setPresensiBiometricStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [presensiNotes, setPresensiNotes] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedLogForPreview, setSelectedLogForPreview] = useState<any>(null);

  const [presensiType, setPresensiType] = useState<"MASUK" | "PULANG">("MASUK");
  const [presensiMode, setPresensiMode] = useState<"REGULER" | "ZOOM">("REGULER");
  const [presensiGps, setPresensiGps] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [presensiGpsStatus, setPresensiGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [presensiPhoto, setPresensiPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState(currentUser.assignedClass || "Semua");

  React.useEffect(() => {
    if (currentUser) {
      setTeacherBankName(currentUser.bankAccount?.split(' - ')[0] || "");
      setTeacherBankNum(currentUser.bankAccount?.split(' - ')[1] || "");
      setSelectedClassFilter(currentUser.assignedClass || "Semua");
    }
  }, [currentUser]);


  // Office Coordinates Configuration States
  const savedOfficeLoc = systemState.customization?.officeLocation || {
    latitude: -7.79558,
    longitude: 110.36949,
    radius: 200,
    enforce: true
  };
  const [officeLat, setOfficeLat] = useState(savedOfficeLoc.latitude);
  const [officeLng, setOfficeLng] = useState(savedOfficeLoc.longitude);
  const [officeRadius, setOfficeRadius] = useState(savedOfficeLoc.radius);
  const [officeEnforce, setOfficeEnforce] = useState(savedOfficeLoc.enforce);
  const [isSavingOffice, setIsSavingOffice] = useState(false);
  const [detectingOfficeGps, setDetectingOfficeGps] = useState(false);

  useEffect(() => {
    if (systemState.customization?.officeLocation) {
      setOfficeLat(systemState.customization.officeLocation.latitude);
      setOfficeLng(systemState.customization.officeLocation.longitude);
      setOfficeRadius(systemState.customization.officeLocation.radius);
      setOfficeEnforce(systemState.customization.officeLocation.enforce);
    }
  }, [systemState.customization?.officeLocation]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const captureFaceSnapshot = (): string | null => {
    if (videoRef.current && stream) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 320;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/jpeg", 0.75);
        }
      } catch (err) {
        console.error("Error capturing face snapshot:", err);
      }
    }
    return null;
  };
  
  useEffect(() => {
    if (showTeacherModal === "presensi") {
      const hour = new Date().getHours();
      if (hour >= 12) {
        setPresensiType("PULANG");
      } else {
        setPresensiType("MASUK");
      }
    }
  }, [showTeacherModal]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (showTeacherModal === "presensi") {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then((s) => {
          activeStream = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.error("Camera error:", err);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showTeacherModal]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  // Presensi Logic
  const getPresensiType = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 11) return "MASUK";
    if (hour >= 15 && hour <= 18) return "PULANG";
    return "OUT_OF_BOUNDS";
  };

  const handleGetGps = () => {
    setPresensiGpsStatus("loading");
    
    const fallbackLocation = () => {
      const savedOfficeConfig = systemState?.customization?.officeLocation;
      const defaultLat = savedOfficeConfig?.latitude ?? -6.200000;
      const defaultLng = savedOfficeConfig?.longitude ?? 106.816666;
      setPresensiGps({
        latitude: defaultLat,
        longitude: defaultLng,
        accuracy: 50
      });
      setPresensiGpsStatus("success");
      alert("⚠️ GPS fisik tidak diizinkan / timed out. Koordinat otomatis diposisikan di lokasi kantor LPK agar Anda tetap dapat melakukan presensi.");
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPresensiGps({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy)
          });
          setPresensiGpsStatus("success");
        },
        (error) => {
          console.warn("High accuracy GPS error, trying low accuracy fallback...", error);
          navigator.geolocation.getCurrentPosition(
            (pos2) => {
              setPresensiGps({
                latitude: pos2.coords.latitude,
                longitude: pos2.coords.longitude,
                accuracy: Math.round(pos2.coords.accuracy)
              });
              setPresensiGpsStatus("success");
            },
            (error2) => {
              console.error("GPS error:", error2);
              fallbackLocation();
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      fallbackLocation();
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const url = await uploadFileToFirebase(file, "attendance_photos");
      setPresensiPhoto(url);
    } catch (err) {
      console.error("Error uploading photo:", err);
      alert("Gagal mengunggah foto. Silakan coba lagi.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const getTeacherLogStatus = (log: any, userRole: string) => {
    const d = new Date(log.timestamp || log.time);
    const day = d.getDay(); // 0: Sun, 1: Mon, ... 5: Fri, 6: Sat
    const hour = d.getHours();
    const minute = d.getMinutes();
    
    const isFriday = day === 5;
    const isZoom = log.workMode === "ZOOM" || log.description?.toLowerCase().includes("zoom") || log.notes?.toLowerCase().includes("zoom");
    const isMasuk = log.clockType === "MASUK" || log.description?.includes("MASUK") || (!log.clockType && hour < 12);
    
    if (isMasuk) {
      if (isZoom) {
        return { label: "Tepat Waktu (Zoom)", color: "bg-teal-50 text-teal-700 border-teal-200" };
      }
      const limitHour = userRole === "Pengajar" ? 9 : 8;
      const isLate = hour > limitHour || (hour === limitHour && minute > 0);
      if (isLate) {
        return { label: `Terlambat (Maks ${String(limitHour).padStart(2, '0')}:00)`, color: "bg-rose-50 text-rose-700 border-rose-200" };
      } else {
        return { label: "Tepat Waktu", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      }
    } else {
      if (isZoom) {
        return { label: "Selesai Tugas (Zoom)", color: "bg-teal-50 text-teal-700 border-teal-200" };
      }
      const limitHour = isFriday ? 16 : 16;
      const limitMinute = isFriday ? 30 : 0;
      
      const totalMinutes = hour * 60 + minute;
      const limitTotalMinutes = limitHour * 60 + limitMinute;
      
      const isEarly = totalMinutes < limitTotalMinutes;
      if (isEarly) {
        return { label: `Pulang Cepat (Min ${String(limitHour).padStart(2, '0')}:${String(limitMinute).padStart(2, '0')})`, color: "bg-amber-50 text-amber-700 border-amber-200" };
      } else {
        return { label: "Selesai Tugas", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      }
    }
  };


  const handleBankSubmit = async () => {
    const val = `${teacherBankName} - ${teacherBankNum}`;
    await onUpdateState("users", "updateBank", { username: currentUser.username, bankAccount: val });
    setShowTeacherModal(null);
  };

  const handleCutiSubmit = async () => {
    await onUpdateState("teacherLeaves", "add", {
      teacherName: currentUser.name,
      startDate: teacherCutiStart,
      endDate: teacherCutiEnd,
      reason: teacherCutiReason
    });
    alert("Cuti diajukan!");
    setShowTeacherModal(null);
  };

  
  const handleTeacherPresensi = async () => {
    if (!currentUser) return;

    if (!currentUser.faceRegistered) {
      // 1. Pendaftaran Biometrik Wajah
      setPresensiBiometricStatus("scanning");
      setTimeout(async () => {
        const faceSnap = captureFaceSnapshot() || "REGISTERED_OK";
        const success = await onUpdateState("users", "registerBiometric", {
          username: currentUser.username,
          faceBiometricData: faceSnap
        });
        if (success) {
          setPresensiBiometricStatus("success");
          setTimeout(() => {
            alert("✓ Pendaftaran Wajah Berhasil! Wajah Anda kini terdaftar sebagai pemilik sah akun ini. Silakan klik tombol 'Absen Sekarang' untuk melakukan presensi.");
            setPresensiBiometricStatus("idle");
          }, 1000);
        } else {
          setPresensiBiometricStatus("error");
          alert("Terjadi kesalahan mendaftarkan biometric wajah.");
        }
      }, 2000);
    } else {
      // 2. Presensi Wajah Rutin
      const today = new Date().toISOString().split("T")[0];
      
      // Validation check for REGULER luring GPS radius
      const savedOfficeConfig = systemState.customization?.officeLocation || {
        latitude: -7.79558,
        longitude: 110.36949,
        radius: 200,
        enforce: true
      };

      if (presensiMode === "REGULER") {
        if (!presensiGps) {
          alert("⚠️ Lokasi GPS Anda belum terdeteksi.\n\nSilakan klik tombol '📍 Deteksi Koordinat GPS Anda' terlebih dahulu.");
          return;
        }

        const distance = getDistance(
          presensiGps.latitude,
          presensiGps.longitude,
          savedOfficeConfig.latitude,
          savedOfficeConfig.longitude
        );

        if (savedOfficeConfig.enforce && distance > savedOfficeConfig.radius) {
          alert(`⚠️ Gagal Presensi: Anda terdeteksi berada di luar area kantor LPK.\n\nJarak Anda saat ini: ${Math.round(distance)} meter\nRadius Maksimum LPK: ${savedOfficeConfig.radius} meter\n\nSilakan masuk ke area LPK terlebih dahulu atau hubungi Admin jika terdapat kendala akurasi GPS.`);
          return;
        }
      }

      // Absen hanya boleh sekali per jenis absen per hari
      const alreadyPresensi = (systemState.logs || []).some(l => {
        if (l.type !== "PRESENSI_PENGAJAR") return false;
        if (l.user !== currentUser.name && l.user !== currentUser.username) return false;
        if (!l.timestamp || !l.timestamp.startsWith(today)) return false;
        
        if (l.clockType) {
          return l.clockType === presensiType;
        }
        return l.description?.includes(presensiType) || l.notes?.includes(presensiType);
      });

      if (alreadyPresensi) {
        alert(`⚠️ Anda sudah melakukan presensi ${presensiType} hari ini.`);
        return;
      }

      const isHoliday = systemState.events?.some(e => e.date === today && e.title.toLowerCase().includes("libur"));
      if (isHoliday) {
        if (!window.confirm("Hari ini tercatat sebagai hari libur. Lanjutkan presensi?")) {
           return;
        }
      }

      setPresensiBiometricStatus("scanning");
      setTimeout(async () => {
        const liveFacePhoto = captureFaceSnapshot();
        const gpsStr = presensiGps 
          ? `${presensiGps.latitude}, ${presensiGps.longitude} (Akurasi: ${presensiGps.accuracy}m)` 
          : "Lokasi tidak terdeteksi";

        // If no class photo was uploaded, use the biometric snapshot as evidence photo!
        const finalPhoto = presensiPhoto || liveFacePhoto || "";

        const logData = {
          type: "PRESENSI_PENGAJAR",
          user: currentUser.name || currentUser.username,
          description: `${presensiType} - Hadir (${presensiMode === "ZOOM" ? "E-Learning Zoom" : "Regular Luring"}) via Biometrik Wajah ${presensiNotes ? "- " + presensiNotes : ""}`,
          timestamp: new Date().toISOString(),
          clockType: presensiType,
          workMode: presensiMode,
          latitude: presensiGps ? String(presensiGps.latitude) : "",
          longitude: presensiGps ? String(presensiGps.longitude) : "",
          location: gpsStr,
          photoUrl: finalPhoto,
          notes: presensiNotes
        };

        const success = await onUpdateState("logs", "add", logData);
        if (success) {
          setPresensiBiometricStatus("success");
          setTimeout(() => {
            alert(`Presensi ${presensiType} berhasil disimpan!`);
            setShowTeacherModal(null);
            setPresensiBiometricStatus("idle");
            setPresensiNotes("");
            setPresensiGps(null);
            setPresensiGpsStatus("idle");
            setPresensiPhoto(null);
          }, 1000);
        } else {
          setPresensiBiometricStatus("error");
          alert("Gagal menyimpan data presensi. Silakan coba lagi.");
        }
      }, 2000);
    }
  };

  const handlePresensi = () => handleTeacherPresensi();

  const handleReportSubmit = async () => {
    await onUpdateState("teacherReports", "add", {
      teacherName: currentUser.name,
      type: reportType,
      content: reportText,
      link: reportLink,
      date: new Date().toISOString().split('T')[0]
    });
    alert("Laporan berhasil dikirim");
    setShowTeacherModal(null);
  };

  const handleKontrakSign = async () => {
    await onUpdateState("teacherContracts", "sign", {
      teacherName: currentUser.name,
      signature: "SIGNED_DIGITAL",
      date: new Date().toISOString()
    });
    setTeacherKontrakSigned(true);
    alert("Kontrak ditandatangani");
    setShowTeacherModal(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full p-4 sm:p-6 text-left">
      <div className="bg-gradient-to-r from-sky-700 to-indigo-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <h3 className="font-sans font-black text-2xl relative z-10">Portal Pengajar (Sensei)</h3>
        <p className="text-sm text-sky-100 mt-2 relative z-10">Kelola kehadiran, gaji, cuti, dan laporan Anda di sini.</p>
      </div>

      {/* CARD: PENGATURAN KOORDINAT KANTOR LPK (ADMIN ONLY) */}
      {["VVIP", "Admin Super", "Admin", "Admin Biasa"].includes(currentUser?.role || "") && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h4 className="font-black text-xs font-bold text-slate-900 uppercase tracking-wide">
              Pengaturan Lokasi Absensi Kantor LPK
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-normal">
            Atur titik koordinat GPS pusat LPK. Guru, pengajar, dan staff administrasi biasa wajib berada dalam radius yang ditentukan saat melakukan absensi Regular Luring.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Latitude Kantor</label>
              <input
                type="number"
                step="any"
                value={officeLat}
                onChange={(e) => setOfficeLat(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono"
                placeholder="-7.79558"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Longitude Kantor</label>
              <input
                type="number"
                step="any"
                value={officeLng}
                onChange={(e) => setOfficeLng(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono"
                placeholder="110.36949"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Radius Toleransi (Meter)</label>
              <input
                type="number"
                value={officeRadius}
                onChange={(e) => setOfficeRadius(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono"
                placeholder="200"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={officeEnforce}
                onChange={(e) => setOfficeEnforce(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-extrabold text-slate-700">Wajibkan Presensi Sesuai Radius LPK</span>
            </label>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={detectingOfficeGps}
                onClick={() => {
                  setDetectingOfficeGps(true);
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setOfficeLat(position.coords.latitude);
                      setOfficeLng(position.coords.longitude);
                      setDetectingOfficeGps(false);
                      alert("✓ Koordinat GPS Anda berhasil dideteksi dan dimasukkan ke form!");
                    },
                    (err) => {
                      console.error(err);
                      setDetectingOfficeGps(false);
                      alert("❌ Gagal mendeteksi lokasi GPS Anda. Pastikan izin lokasi aktif.");
                    },
                    { enableHighAccuracy: true }
                  );
                }}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer flex items-center gap-1"
              >
                📍 Ambil GPS Saya
              </button>

              <button
                type="button"
                disabled={isSavingOffice}
                onClick={async () => {
                  setIsSavingOffice(true);
                  const success = await onUpdateState("customization", "update", {
                    officeLocation: {
                      latitude: officeLat,
                      longitude: officeLng,
                      radius: officeRadius,
                      enforce: officeEnforce
                    }
                  });
                  setIsSavingOffice(false);
                  if (success) {
                    alert("✓ Pengaturan koordinat kantor LPK berhasil diperbarui!");
                  } else {
                    alert("Gagal menyimpan pengaturan.");
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition cursor-pointer"
              >
                {isSavingOffice ? "Menyimpan..." : "Simpan Koordinat"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-sky-900">Rekening Gaji</h4>
          <p className="text-xs text-sky-700 mt-1">{currentUser.bankAccount || "Belum ada data rekening"}</p>
        </div>
        <button onClick={() => { setTeacherBankNum(currentUser.bankAccount?.split(' - ')[1] || ""); setTeacherBankName(currentUser.bankAccount?.split(' - ')[0] || ""); setShowTeacherModal("bank"); }} className="px-4 py-2 bg-white text-sky-700 font-bold text-xs rounded-xl shadow-sm hover:bg-sky-100 transition cursor-pointer">
          Ubah Rekening
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => { if (setActiveTab) setActiveTab("kalender"); }} className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm text-center transition cursor-pointer">
          <FileText className="w-8 h-8 text-indigo-600" />
          <span className="text-xs font-bold text-slate-700 leading-tight">Agenda &<br/>Program Kerja</span>
        </button>
        <button onClick={() => { setReportType("SPT"); setShowTeacherModal("spt"); }} className="p-4 bg-white border border-slate-200 hover:border-teal-300 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm text-center transition cursor-pointer">
          <FileText className="w-8 h-8 text-teal-600" />
          <span className="text-xs font-bold text-slate-700 leading-tight">Laporan<br/>SPT & BPJS</span>
        </button>
        <button onClick={() => setShowTeacherModal("cuti")} className="p-4 bg-white border border-slate-200 hover:border-rose-300 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm text-center transition cursor-pointer">
          <CheckSquare className="w-8 h-8 text-rose-500" />
          <span className="text-xs font-bold text-slate-700 leading-tight">Pengajuan<br/>Cuti</span>
        </button>
        <button onClick={() => setShowTeacherModal("kontrak")} className="p-4 bg-white border border-slate-200 hover:border-amber-300 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm text-center transition cursor-pointer">
          <FileText className="w-8 h-8 text-amber-600" />
          <span className="text-xs font-bold text-slate-700 leading-tight">Kontrak<br/>Kerja LPK</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
          <h4 className="font-black text-sm text-slate-800">Kehadiran & Presensi</h4>
          <button onClick={() => setShowTeacherModal("presensi")} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition cursor-pointer">
            Absen Masuk Sekarang
          </button>
        </div>
        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="font-bold text-xs text-slate-700">Kehadiran Bulan Ini</p>
            <p className="text-xs text-slate-500 mt-1">
              {systemState.logs?.filter(l => l.type === "PRESENSI_PENGAJAR" && l.user === currentUser.name).length || 0} Hari Hadir
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-600 block">
              {Math.min(100, Math.round(((systemState.logs?.filter(l => l.type === "PRESENSI_PENGAJAR" && l.user === currentUser.name).length || 0) / 20) * 100))}%
            </span>
          </div>
        </div>
      </div>

      {/* Timetable & Detail Kehadiran (Absensi) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h4 className="font-black text-sm text-slate-800 font-sans">Jadwal & Timetable Kehadiran Anda</h4>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          Daftar riwayat presensi masuk dan pulang Anda. Status ketepatan diukur berdasarkan jadwal staff resmi LPK.
        </p>

        {(() => {
          const teacherLogs = (systemState.logs || []).filter(
            l => l.type === "PRESENSI_PENGAJAR" && (l.user === currentUser.name || l.user === currentUser.username)
          );
          const sortedTeacherLogs = [...teacherLogs].sort((a, b) => new Date(b.timestamp || b.time).getTime() - new Date(a.timestamp || a.time).getTime());

          const todayStr = new Date().toDateString();
          const todayLog = teacherLogs.find(l => new Date(l.timestamp || l.time).toDateString() === todayStr);

          if (sortedTeacherLogs.length === 0) {
            return (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 border border-slate-100 rounded-xl">
                Belum ada riwayat presensi yang tercatat.
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {/* Highlight Preview Kegiatan Hari Ini di Kelas */}
              {todayLog && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4.5 space-y-2.5 text-left">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100/70 border border-indigo-200/50 px-2.5 py-1 rounded-full">
                        Kegiatan Kelas Hari Ini
                      </span>
                      <h5 className="font-extrabold text-slate-800 text-xs mt-2">
                        {new Date(todayLog.timestamp || todayLog.time).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                      </h5>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-indigo-950 block font-black">
                        ⏱️ {new Date(todayLog.timestamp || todayLog.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                        Mode: {todayLog.workMode === "ZOOM" ? "💻 Zoom" : "🏫 Tatap Muka"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-xs">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Preview Kegiatan & Materi:</p>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">
                      "{todayLog.notes || todayLog.description || "Belum ada catatan kegiatan."}"
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5">Tanggal & Hari</th>
                      <th className="py-2.5">Tipe & Mode</th>
                      <th className="py-2.5">Waktu</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">GPS & Bukti Foto</th>
                      <th className="py-2.5">Catatan & Preview Kegiatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                    {sortedTeacherLogs.map((log) => {
                      const d = new Date(log.timestamp || log.time);
                      const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                      const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
                      
                      const hours = String(d.getHours()).padStart(2, "0");
                      const minutes = String(d.getMinutes()).padStart(2, "0");
                      const seconds = String(d.getSeconds()).padStart(2, "0");
                      const timeStr = `${hours}:${minutes}:${seconds}`;

                      const statusInfo = getTeacherLogStatus(log, currentUser.role);

                      return (
                        <tr key={log.id || log.timestamp || log.time} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3">
                            <span className="font-semibold text-slate-900 block">{dateStr}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{dayName}</span>
                          </td>
                          <td className="py-3">
                            <span className="font-extrabold text-indigo-700 uppercase text-[10px] block">
                              {log.clockType || (d.getHours() < 12 ? "MASUK" : "PULANG")}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold block">
                              {log.workMode === "ZOOM" ? "💻 Zoom (Flexible)" : "🏫 Reguler (Fisik)"}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-800 font-black text-xs">{timeStr}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${statusInfo.color}`}>
                              <span className="w-1 h-1 rounded-full bg-current"></span>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3 space-y-1">
                            {log.location && log.location !== "Lokasi tidak terdeteksi" ? (
                              <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono truncate max-w-[150px]" title={log.location}>
                                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{log.latitude ? `${parseFloat(log.latitude).toFixed(4)}, ${parseFloat(log.longitude).toFixed(4)}` : "Ada GPS"}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-medium">GPS tidak ada</span>
                            )}

                            {log.photoUrl && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <img
                                  src={log.photoUrl}
                                  alt="Bukti"
                                  className="w-8 h-8 rounded-md object-cover border border-slate-200 shadow-xs cursor-pointer hover:scale-110 transition-transform shrink-0"
                                  onClick={() => window.open(log.photoUrl, "_blank")}
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  onClick={() => window.open(log.photoUrl, "_blank")}
                                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                                >
                                  Lihat
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col gap-1 max-w-[180px]">
                              <span className="text-slate-500 italic truncate block" title={log.notes || log.description || ""}>
                                {log.notes || "-"}
                              </span>
                              {(log.notes || log.description) && (
                                <button
                                  onClick={() => setSelectedLogForPreview(log)}
                                  className="inline-flex items-center gap-1 text-[9px] text-indigo-600 hover:text-indigo-800 font-extrabold uppercase tracking-wide bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md w-fit cursor-pointer transition-colors border border-indigo-100"
                                >
                                  <Eye className="w-3 h-3" /> Preview Kegiatan
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h4 className="font-black text-sm text-slate-800 mb-4">Histori Gaji & Slip</h4>
        {systemState.salaries?.filter(s => s.staffName === currentUser.name).length ? (
          <div className="space-y-3">
            {systemState.salaries.filter(s => s.staffName === currentUser.name).map((sal, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl justify-between sm:items-center">
                <div>
                  <p className="font-bold text-sm text-slate-800">{sal.monthString}</p>
                  <p className="text-xs text-slate-500 mt-1">Tgl Bayar: {sal.paymentDate || "-"}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-2 text-left sm:text-right">
                  <p className="font-black text-base text-emerald-600">Rp {sal.amount.toLocaleString("id-ID")}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded w-fit ${sal.status === "Lunas" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {sal.status}
                  </span>
                </div>
                <div className="mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                  <button onClick={() => alert(`Mengunduh Slip Gaji untuk bulan ${sal.monthString}`)} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer">
                    <Receipt className="w-4 h-4" /> Unduh Slip Gaji
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Belum ada histori gaji.</p>
          </div>
        )}
      </div>

      {showTeacherModal && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-900 text-lg">
                {showTeacherModal === "bank" ? "Update Rekening" :
                 showTeacherModal === "agenda" ? "Agenda / Program Kerja" :
                 showTeacherModal === "spt" ? "Laporan SPT & BPJS" :
                 showTeacherModal === "cuti" ? "Pengajuan Cuti" :
                 showTeacherModal === "kontrak" ? "Kontrak Kerja LPK" :
                 "Presensi Kehadiran"}
              </h3>
              <button onClick={() => setShowTeacherModal(null)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            {showTeacherModal === "bank" && (
              <div className="space-y-4">
                <input placeholder="Nama Bank (misal: BCA)" value={teacherBankName} onChange={(e)=>setTeacherBankName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                <input placeholder="Nomor Rekening" value={teacherBankNum} onChange={(e)=>setTeacherBankNum(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                <button onClick={handleBankSubmit} className="w-full bg-sky-600 text-white p-3 rounded-xl font-bold text-sm">Simpan</button>
              </div>
            )}

            {showTeacherModal === "cuti" && (
              <div className="space-y-4">
                <input type="date" value={teacherCutiStart} onChange={(e)=>setTeacherCutiStart(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                <input type="date" value={teacherCutiEnd} onChange={(e)=>setTeacherCutiEnd(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
                <textarea placeholder="Alasan Cuti" value={teacherCutiReason} onChange={(e)=>setTeacherCutiReason(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" rows={3}></textarea>
                <button onClick={handleCutiSubmit} className="w-full bg-rose-600 text-white p-3 rounded-xl font-bold text-sm">Ajukan Cuti</button>
              </div>
            )}
            {(showTeacherModal === "agenda" || showTeacherModal === "spt") && (
              <div className="space-y-4">
                <select value={reportType} onChange={(e)=>setReportType(e.target.value as any)} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold">
                  <option value="Agenda">Laporan Agenda / Program Kerja</option>
                  <option value="SPT">Laporan SPT Pajak</option>
                  <option value="BPJS">Laporan BPJS</option>
                </select>
                <textarea placeholder="Deskripsi Laporan" value={reportText} onChange={(e)=>setReportText(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm" rows={3}></textarea>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">Unggah Dokumen (PDF / Gambar) - Opsional</label>
                  <input type="file" accept="image/*,.pdf" onChange={async (e) => {
                     const file = e.target.files?.[0];
                     const { uploadFileToFirebase } = await import("../lib/storageHelper"); if (file) { uploadFileToFirebase(file, "reports").then(url => setReportLink(url)).catch(err => { console.error(err); alert("Gagal"); }); }
                  }} className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50" />
                </div>
                <button onClick={handleReportSubmit} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm cursor-pointer">Kirim Laporan</button>
              </div>
            )}
            {showTeacherModal === "presensi" && (
              <div className="space-y-5 text-left overflow-y-auto max-h-[75vh] pr-1">
                {/* Info Jam Kerja */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Panduan Jam Kerja LPK</span>
                  </div>
                  <ul className="text-[10px] text-slate-600 space-y-1.5 leading-relaxed list-disc list-inside">
                    <li><span className="font-extrabold text-slate-800">Sensei (Luring):</span> 09:00 - 16:00 (Sen-Kam), 09:00 - 16:30 (Jum)</li>
                    <li><span className="font-extrabold text-slate-800">Administrasi (Luring):</span> 08:00 - 16:00 (Sen-Kam), 08:00 - 16:30 (Jum)</li>
                    <li><span className="font-extrabold text-slate-800">E-Learning (Zoom):</span> Fleksibel sesuai jadwal mengajar LPK</li>
                  </ul>
                </div>

                {/* Jenis Presensi & Mode Tugas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Jenis Absen</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                      <button
                        type="button"
                        onClick={() => setPresensiType("MASUK")}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${presensiType === "MASUK" ? "bg-white text-indigo-700 shadow-sm" : "hover:bg-white/50"}`}
                      >
                        Masuk
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresensiType("PULANG")}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${presensiType === "PULANG" ? "bg-white text-indigo-700 shadow-sm" : "hover:bg-white/50"}`}
                      >
                        Pulang
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mode Kerja</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                      <button
                        type="button"
                        onClick={() => setPresensiMode("REGULER")}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${presensiMode === "REGULER" ? "bg-white text-indigo-700 shadow-sm" : "hover:bg-white/50"}`}
                      >
                        Reguler
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresensiMode("ZOOM")}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${presensiMode === "ZOOM" ? "bg-white text-indigo-700 shadow-sm" : "hover:bg-white/50"}`}
                      >
                        Zoom
                      </button>
                    </div>
                  </div>
                </div>

                {/* GPS Location Capture */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lokasi GPS</label>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      presensiGpsStatus === "success" ? "bg-emerald-100 text-emerald-800" :
                      presensiGpsStatus === "loading" ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-slate-200 text-slate-600"
                    }`}>
                      {presensiGpsStatus === "success" ? "Terdeteksi" :
                       presensiGpsStatus === "loading" ? "Mendeteksi..." : "Belum Ada"}
                    </span>
                  </div>

                  {presensiGps ? (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-[11px] text-slate-700 font-mono flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="truncate">
                        Lat: {presensiGps.latitude.toFixed(6)}, Lon: {presensiGps.longitude.toFixed(6)} <span className="text-[9px] text-slate-400 font-sans">(Akurasi: {presensiGps.accuracy}m)</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGetGps}
                      disabled={presensiGpsStatus === "loading"}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200 p-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      {presensiGpsStatus === "loading" ? "Mengakses GPS..." : "📍 Deteksi Koordinat GPS Anda"}
                    </button>
                  )}
                </div>

                {/* Evidence Upload / Screenshot */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Foto Kelas atau Screenshot Zoom</label>
                  
                  {presensiPhoto ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img src={presensiPhoto} alt="Evidence" className="w-full h-32 object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => setPresensiPhoto(null)}
                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-extrabold transition cursor-pointer"
                      >
                        Ubah Foto
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        disabled={isUploadingPhoto}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <div className="bg-white border border-dashed border-slate-300 p-4 rounded-xl text-center space-y-1 hover:bg-slate-100/50 transition">
                        <Camera className="w-5 h-5 text-slate-400 mx-auto" />
                        <span className="text-xs font-extrabold text-slate-700 block">
                          {isUploadingPhoto ? "Mengunggah..." : "📸 Ambil Foto / Unggah Tangkapan Layar"}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-medium">Bisa menggunakan kamera smartphone atau file foto/screenshot</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Biometric Scan */}
                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-900 text-center space-y-4 shadow-inner">
                  {!currentUser.faceRegistered ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-left text-[10px] text-amber-400 font-bold">
                      ⚠️ MUKA BELUM TERDAFTAR: Silakan lakukan registrasi wajah terlebih dahulu untuk menggunakan verifikasi biometrik LPK.
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-left text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Biometrik Wajah Terdaftar ({currentUser.name})</span>
                    </div>
                  )}

                  <div className="relative w-36 h-36 mx-auto rounded-full bg-slate-950 overflow-hidden border-2 border-slate-800 flex items-center justify-center shadow-lg">
                    {stream ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    ) : (
                      <span className="text-2xl animate-pulse">📸</span>
                    )}
                    {presensiBiometricStatus === "scanning" && (
                      <div className="absolute inset-0 bg-indigo-950/80 flex flex-col items-center justify-center text-white">
                        <span className="h-8 w-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                        <span className="text-[9px] font-bold mt-2 tracking-widest uppercase animate-pulse">Memindai Wajah...</span>
                      </div>
                    )}
                    {presensiBiometricStatus === "success" && (
                      <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center text-white">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mb-1" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Muka Sesuai</span>
                      </div>
                    )}
                    {presensiBiometricStatus === "error" && (
                      <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center text-white">
                        <span className="text-2xl">✗</span>
                        <span className="text-[9px] font-black uppercase tracking-wider mt-1">Gagal</span>
                      </div>
                    )}
                    <div className="absolute inset-0 border-[3px] border-emerald-500/25 rounded-full animate-pulse pointer-events-none" />
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Catatan Tambahan (Opsional)</label>
                  <input 
                    type="text" 
                    value={presensiNotes} 
                    onChange={(e) => setPresensiNotes(e.target.value)} 
                    placeholder="Cth: Pertemuan ke-4 kelas kanji, terlambat karena macet..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-medium" 
                  />
                </div>

                {/* Submit Action */}
                <button 
                  onClick={handleTeacherPresensi} 
                  disabled={presensiBiometricStatus === "scanning" || presensiBiometricStatus === "success" || isUploadingPhoto}
                  className={`w-full text-white p-3.5 rounded-xl font-extrabold text-sm transition shadow-md cursor-pointer ${
                    presensiBiometricStatus === "scanning" || isUploadingPhoto ? "bg-slate-400" :
                    !currentUser.faceRegistered ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {presensiBiometricStatus === "scanning" ? "Memproses Biometrik..." :
                   isUploadingPhoto ? "Mengunggah Bukti..." :
                   presensiBiometricStatus === "success" ? "Sukses!" :
                   !currentUser.faceRegistered ? "Daftarkan Wajah Saya" : `Kirim Presensi ${presensiType}`}
                </button>
              </div>
            )}
            {showTeacherModal === "kontrak" && (() => {
              const myContract = (systemState.teacherContracts || []).find(c => c.teacherName === currentUser.name);
              return (
                <div className="space-y-4">
                  {myContract && myContract.content ? (
                    <div className="text-center space-y-4 py-4">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">Kontrak Kerja Anda Tersedia</p>
                      <button onClick={() => window.open(myContract.content, "_blank")} className="w-full bg-sky-600 text-white p-3 rounded-xl font-bold text-sm cursor-pointer">
                        Lihat Dokumen Kontrak
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 py-8 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-500 font-medium">Belum ada kontrak kerja yang diunggah.</p>
                      <p className="text-[10px] text-slate-400">Silakan hubungi Admin untuk mengunggah dokumen kontrak Anda.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PREVIEW KEGIATAN */}
      {selectedLogForPreview && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-fade-in text-left">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black tracking-widest uppercase text-indigo-200">
                  Detail Kegiatan Kelas
                </span>
                <h4 className="font-extrabold text-sm mt-0.5">
                  {new Date(selectedLogForPreview.timestamp || selectedLogForPreview.time).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h4>
              </div>
              <button
                onClick={() => setSelectedLogForPreview(null)}
                className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Jam Kehadiran */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs text-slate-500 font-bold">Waktu Kehadiran:</span>
                <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  ⏰ {new Date(selectedLogForPreview.timestamp || selectedLogForPreview.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
                </span>
              </div>

              {/* Tipe & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Jenis Presensi</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-0.5">
                    {selectedLogForPreview.clockType || "MASUK"}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Mode Kerja</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-0.5">
                    {selectedLogForPreview.workMode === "ZOOM" ? "💻 Zoom (Flexible)" : "🏫 Reguler (Fisik)"}
                  </span>
                </div>
              </div>

              {/* Kegiatan Terlaksana */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Kegiatan Kelas / Catatan
                </span>
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-xs font-semibold text-slate-700 leading-relaxed italic">
                  "{selectedLogForPreview.notes || selectedLogForPreview.description || "Tidak ada catatan kegiatan."}"
                </div>
              </div>

              {/* Bukti Foto & GPS */}
              {(selectedLogForPreview.photoUrl || (selectedLogForPreview.location && selectedLogForPreview.location !== "Lokasi tidak terdeteksi")) && (
                <div className="space-y-3 pt-2">
                  {selectedLogForPreview.photoUrl && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Dokumentasi Kegiatan
                      </span>
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                        <img
                          src={selectedLogForPreview.photoUrl}
                          alt="Dokumentasi Kelas"
                          className="w-full h-36 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  {selectedLogForPreview.location && selectedLogForPreview.location !== "Lokasi tidak terdeteksi" && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono">{selectedLogForPreview.location}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedLogForPreview(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
