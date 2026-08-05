import React, { useRef, useState, useEffect } from "react";
import { Camera, X, Check, RefreshCw, Image, AlertCircle } from "lucide-react";

interface DocumentScannerModalProps {
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function DocumentScannerModal({ onClose, onCapture }: DocumentScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    setLoading(true);
    setCameraError(null);
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setLoading(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setLoading(false);
      setCameraError(
        "Kamera tidak dapat diakses langsung oleh WebView. Silakan gunakan tombol unggah galeri di bawah."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Scale down canvas dimensions to reduce file size and speed up Base64 fallback
    let width = video.videoWidth;
    let height = video.videoHeight;
    const maxDim = 800; // 800px max
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw the image
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Apply "document scan" effect (increase contrast and grayscale slightly)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple high contrast / scan filter
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Convert to grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Apply contrast
      const contrast = 1.3; // adjusted slightly for readability
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const adjusted = factor * (gray - 128) + 128;
      
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, adjusted));
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Get image data URL
    const imageUrl = canvas.toDataURL("image/jpeg", 0.7);
    setCapturedImage(imageUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirm = () => {
    if (!capturedImage) return;
    
    // Convert data URL to Blob/File
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `scanned_document_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      })
      .catch((err) => {
        console.error("Error creating file:", err);
        alert("Gagal memproses gambar.");
      });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <div className="p-4 bg-slate-950/90 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Camera className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">Pemindai Dokumen</h4>
            <p className="text-[10px] text-slate-400">Ambil gambar dokumen atau unggah</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 rounded-full text-slate-300 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Camera Viewport */}
      <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden bg-black">
        {loading && !capturedImage && !cameraError && (
          <div className="text-white flex flex-col items-center justify-center z-10 px-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <p className="text-sm font-bold tracking-wide">Menginisialisasi Kamera...</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[250px]">
              Mohon izinkan akses kamera jika muncul permintaan.
            </p>
          </div>
        )}

        {cameraError && !capturedImage && (
          <div className="text-white flex flex-col items-center justify-center z-10 px-6 text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <h5 className="text-sm font-bold text-amber-400">Akses Kamera Terbatas</h5>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cameraError}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
            >
              <Image className="w-4 h-4" />
              <span>Pilih Dokumen dari Galeri</span>
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${capturedImage || cameraError ? "hidden" : "block"}`}
        />

        <canvas ref={canvasRef} className="hidden" />

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Hasil Pindai"
            className="w-full h-full object-contain bg-black"
          />
        )}

        {/* Floating Scanner Overlay - perfectly centered and neat */}
        {!capturedImage && !loading && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            <div className="relative w-[85%] h-[70%] max-w-sm max-h-[500px] border-2 border-white/10 rounded-3xl overflow-hidden flex items-center justify-center">
              {/* Glowing Corners - Neater and better contrast */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-3xl shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-3xl shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-3xl shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-3xl shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>

              {/* Glowing Horizontal Laser Scan Line */}
              <div 
                className="absolute left-0 right-0 h-[2px] bg-indigo-400 shadow-[0_0_20px_#6366f1] opacity-90"
                style={{
                  top: "10%",
                  animation: "scan-animation 3s ease-in-out infinite"
                }}
              ></div>

              <div className="absolute inset-x-4 bottom-6 text-center">
                <span className="text-[10px] font-black text-white bg-slate-900/80 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 uppercase tracking-[0.15em] shadow-lg">
                  Sejajarkan Dokumen Di Dalam Kotak
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded CSS for custom scanner laser animation */}
      <style>{`
        @keyframes scan-animation {
          0% { top: 10%; opacity: 0.8; }
          50% { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.8; }
        }
      `}</style>

      {/* Hidden File Input for WebView APK Fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Bottom Control Bar */}
      <div className="w-full bg-slate-950 px-6 py-6 border-t border-white/10 flex items-center justify-between">
        {/* Gallery / Fallback button */}
        {!capturedImage ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Image className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Galeri</span>
          </button>
        ) : (
          <div className="w-14"></div> // spacing spacer
        )}

        {/* Shutter Button / Confirm */}
        {!capturedImage ? (
          <button
            onClick={takePhoto}
            disabled={loading || !!cameraError}
            className="w-[76px] h-[76px] rounded-full border-4 border-white flex items-center justify-center cursor-pointer transition-all active:scale-90 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:pointer-events-none"
            title="Ambil Foto"
          >
            <div className="w-[56px] h-[56px] rounded-full bg-white shadow-lg"></div>
          </button>
        ) : (
          <button
            onClick={retake}
            className="flex flex-col items-center gap-1.5 text-rose-400 hover:text-rose-300 transition cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-950/20">
              <RefreshCw className="w-6 h-6 animate-spin-reverse" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Ulangi</span>
          </button>
        )}

        {/* Camera Toggle or OK Button */}
        {!capturedImage ? (
          <button
            onClick={toggleCamera}
            disabled={loading || !!cameraError}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Kamera</span>
          </button>
        ) : (
          <button
            onClick={confirm}
            className="flex flex-col items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition cursor-pointer animate-pulse"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-950/30">
              <Check className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Gunakan</span>
          </button>
        )}
      </div>
    </div>
  );
}
