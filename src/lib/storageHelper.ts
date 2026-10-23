import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseClient';

/**
 * Converts a file/blob to a Base64 data URL.
 */
function fileToBase64(file: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Automatically compresses image files to a lightweight format
 * with customizable maximum dimension and quality.
 */
export async function compressImageIfNeeded(file: File, maxDim = 1200): Promise<File | Blob> {
  if (!file.type.startsWith('image/')) {
    return file; // Only compress images
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension limits to maxDim
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
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const lastDotIdx = file.name.lastIndexOf('.');
                const nameWithoutExt = lastDotIdx !== -1 ? file.name.substring(0, lastDotIdx) : file.name;
                const newName = `${nameWithoutExt || 'image'}.jpg`;
                const compressedFile = new File([blob], newName, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                const pct = Math.round((1 - (compressedFile.size / (file.size || 1))) * 100);
                console.log(`[Auto-Compress] Image ${file.name} (${Math.round(file.size/1024)} KB) -> (${Math.round(compressedFile.size/1024)} KB) [-${pct}%].`);
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.75 // 75% high quality compression
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Compresses an image to a lightweight size suitable for Base64 storage.
 */
export async function compressForBase64(file: File, folder: string): Promise<Blob | File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }
  const maxDim = folder === "profile_pictures" ? 300 : 700;
  return compressImageIfNeeded(file, maxDim);
}

/**
 * Universal file compressor that optimizes images and documents before upload.
 */
export async function autoCompressFile(file: File, folder = "uploads"): Promise<{ file: File | Blob; originalSize: number; finalSize: number; compressed: boolean; message: string }> {
  const originalSize = file.size;
  if (file.type.startsWith('image/')) {
    const maxDim = folder === "profile_pictures" ? 400 : folder.includes("lms") ? 1400 : 1200;
    const compressed = await compressImageIfNeeded(file, maxDim);
    const finalSize = compressed.size;
    const isSmaller = finalSize < originalSize;
    return {
      file: isSmaller ? compressed : file,
      originalSize,
      finalSize: isSmaller ? finalSize : originalSize,
      compressed: isSmaller,
      message: isSmaller ? `Foto berhasil dikompres (${Math.round(originalSize/1024)}KB → ${Math.round(finalSize/1024)}KB)` : `Ukuran foto optimal (${Math.round(originalSize/1024)}KB)`
    };
  }
  
  // For PDFs, PPTs, Slides, etc.
  return {
    file,
    originalSize,
    finalSize: originalSize,
    compressed: false,
    message: `Dokumen siap (${Math.round(originalSize/1024)}KB)`
  };
}

/**
 * Uploads a file/image to Firebase Storage with automatic compression.
 * If Firebase Storage is not active, fails fast (with a timeout) and
 * falls back to uploading to the local Express server (/api/upload).
 * 
 * @param file File object to upload
 * @param folder Target folder inside storage (e.g., 'lms_materials', 'registrations', 'payments', 'profile_pictures')
 * @param onProgress Optional callback for progress status text
 * @returns Promise<string> Public download URL or local file path URL
 */
async function uploadFileToLocalServer(file: File, base64Data: string, folder: string): Promise<string> {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName: file.name,
      fileData: base64Data,
      folder: folder
    })
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Local server upload failed with status ${response.status}: ${errText}`);
  }
  const result = await response.json();
  if (result.url) {
    return result.url;
  }
  throw new Error("Local server did not return file URL");
}

export async function uploadFileToFirebase(
  file: File,
  folder: string = "uploads",
  onProgress?: (status: string) => void
): Promise<string> {
  onProgress?.("Mengompres & memverifikasi berkas...");
  
  // Step 1: Auto-compress images and optimize assets
  let finalFile: File | Blob = file;
  try {
    const compressionResult = await autoCompressFile(file, folder);
    finalFile = compressionResult.file;
    if (compressionResult.compressed) {
      console.log(`[Storage Upload] ${compressionResult.message}`);
    }
  } catch (compressErr) {
    console.warn("Auto-compression skipped:", compressErr);
  }

  const cleanFileName = finalFile instanceof File 
    ? finalFile.name.replace(/[^a-zA-Z0-9_.-]/g, "_") 
    : file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");

  const mimeType = finalFile.type || file.type || "application/octet-stream";

  onProgress?.("Mengunggah berkas ke Firebase Storage...");

  // Step 2: Try backend upload endpoint (/api/upload) first.
  // The Express server uses Node.js to upload directly to Firebase Storage with full credentials.
  try {
    const rawBase64 = await fileToBase64(finalFile);
    const backendUrl = await uploadFileToLocalServer(
      finalFile instanceof File ? finalFile : file, 
      rawBase64,
      folder
    );
    console.log(`[Storage Upload] Successfully uploaded ${file.name} via backend:`, backendUrl);
    onProgress?.("Unggahan berhasil disimpan!");
    return backendUrl;
  } catch (backendErr) {
    console.warn("[Storage Upload] Backend upload endpoint had an issue, attempting direct Firebase Storage client SDK:", backendErr);
  }

  // Step 3: Direct client-side Firebase Storage SDK upload fallback
  try {
    const path = `${folder}/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, path);
    const metadata = {
      contentType: mimeType,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout uploading to Firebase Storage.")), 15000);
    });
    
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, finalFile, metadata);
      return await getDownloadURL(snapshot.ref);
    })();

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    console.log(`[Storage Upload] Successfully uploaded ${file.name} via direct client Firebase Storage:`, result);
    onProgress?.("Unggahan berhasil disimpan ke Firebase!");
    return result;
  } catch (error: any) {
    console.warn(`[Storage Upload] Direct client Firebase Storage upload failed (${error?.message || error}). Applying persistent zero-loss fallback...`);
    
    // Step 4: Final fallback: Return Base64 Data URL so user never loses their slides/PDF/content
    try {
      if (file.type.startsWith('image/')) {
        const smallFile = await compressForBase64(file, folder);
        return await fileToBase64(smallFile);
      }
      return await fileToBase64(finalFile);
    } catch (base64Err) {
      console.error("Base64 fallback failed:", base64Err);
      throw new Error(`Gagal memproses berkas ${file.name}: ${error?.message || "Koneksi storage terputus"}`);
    }
  }
}

// Placeholder the server substitutes for embedded base64 photos it strips out of
// /api/state responses (see optimizedLogs in server.ts) to keep that payload small.
export const STRIPPED_PHOTO_PLACEHOLDER = "[FOTO_TERSIMPAN]";

/**
 * Resolves a log entry's real attendance photo URL for display. `photoUrl` as seen
 * in systemState.logs may be the stripped placeholder (or empty, for logs older than
 * the server's in-memory cap) rather than the actual image - in that case, fetch the
 * real photoUrl on demand from the dedicated single-log endpoint. Returns null if no
 * photo is available.
 */
export async function resolveAttendancePhotoUrl(logId: string | undefined, photoUrl: string | undefined): Promise<string | null> {
  if (photoUrl && photoUrl !== STRIPPED_PHOTO_PLACEHOLDER) return photoUrl;
  if (!logId) return null;
  try {
    const res = await fetch(`/api/logs/${encodeURIComponent(logId)}/photo`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.photoUrl || null;
  } catch (e) {
    console.error("Gagal mengambil foto bukti presensi:", e);
    return null;
  }
}

/**
 * Helper to convert Base64 Data URL to a native Blob object
 */
export function dataURLtoBlob(dataurl: string): Blob | null {
  try {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error("Error parsing base64 to blob", err);
    return null;
  }
}

/**
 * Transforms document/PDF URLs into embeddable format for iframes or object elements.
 * Handles Google Drive links, Google Docs Viewer (when forced), data URLs, and direct links.
 */
export function getEmbeddablePdfUrl(url: string | null | undefined, forceGoogleDocs = false): string {
  if (!url) return "";
  
  const trimmed = url.trim();

  // If it's a data URL, let's convert it to a Blob URL!
  if (trimmed.startsWith('data:')) {
    const blob = dataURLtoBlob(trimmed);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return trimmed;
  }

  // 1. Google Slides/Docs/Sheets links -> their own native embed endpoints.
  // These render far more reliably than routing through the generic gview
  // proxy below (which frequently hits a Google sign-in wall for anything
  // it can't freely crawl) - Slides/Docs/Sheets embeds honor the viewer's
  // own Google sign-in session instead.
  const slidesMatch = trimmed.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9-_]+)/);
  if (slidesMatch && slidesMatch[1]) {
    return `https://docs.google.com/presentation/d/${slidesMatch[1]}/embed`;
  }
  const docsMatch = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (docsMatch && docsMatch[1]) {
    return `https://docs.google.com/document/d/${docsMatch[1]}/preview`;
  }
  const sheetsMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetsMatch && sheetsMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/preview`;
  }

  // Google Drive file links -> replace view with preview embed URL. Covers
  // both the "/file/d/<id>/..." format and the classic "?id=<id>" sharing
  // link format (e.g. drive.google.com/open?id=<id>).
  if (trimmed.includes('drive.google.com')) {
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
  }

  // 2. Blob URLs can be embedded natively
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 3. Google Docs Viewer embed URL check if forced
  if (forceGoogleDocs && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
    if (!trimmed.includes('docs.google.com/gview')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(trimmed)}&embedded=true`;
    }
    return trimmed;
  }

  // 4. Default: Return direct URL so standard browser PDF viewer engine (PDFium/built-in) renders natively
  return trimmed;
}

/**
 * Helper to download any file URL (Base64 data URL, blob, local server path, Firebase storage, or external link) reliably.
 */
export async function downloadFile(url: string, defaultFilename?: string): Promise<void> {
  if (!url) {
    alert("URL file tidak valid atau berkas tidak tersedia.");
    return;
  }

  // 1. Base64 or Blob URLs
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    const a = document.createElement("a");
    a.href = url;
    a.download = defaultFilename || "dokumen_unduhan";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Determine a filename from the URL if not provided
  let fileName = defaultFilename;
  if (!fileName) {
    try {
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;
      const extracted = pathname.split("/").pop();
      if (extracted && extracted.length > 2) {
        fileName = decodeURIComponent(extracted).replace(/^\d+_\d+_/, "").replace(/^\d+_/, "");
      }
    } catch {
      fileName = "dokumen_unduhan";
    }
  }
  if (!fileName) fileName = "dokumen_unduhan";

  // 2. Fetch file as Blob to bypass browser opening tab / CORS download blocking
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("HTTP error " + response.status);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return;
  } catch (err) {
    console.warn("Direct blob fetch failed, falling back to direct anchor download:", err);
  }

  // 3. Fallback: Open in new tab or trigger a link with download attribute
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Generates an instant, zero-latency offline SVG data URI avatar.
 * Eliminates 3rd-party CDN blockages/failures on mobile/restricted networks.
 */
export function createSvgAvatar(name: string = "User", customBg?: string): string {
  const cleanName = (name || "User").trim();
  const initials = cleanName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("") || "U";

  // Deterministic color palette
  const colors = [
    { bg: "#4f46e5", text: "#ffffff" }, // indigo
    { bg: "#2563eb", text: "#ffffff" }, // blue
    { bg: "#0d9488", text: "#ffffff" }, // teal
    { bg: "#059669", text: "#ffffff" }, // emerald
    { bg: "#d97706", text: "#ffffff" }, // amber
    { bg: "#e11d48", text: "#ffffff" }, // rose
    { bg: "#7c3aed", text: "#ffffff" }, // violet
    { bg: "#0891b2", text: "#ffffff" }, // cyan
  ];
  
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = customBg ? { bg: customBg, text: "#ffffff" } : colors[Math.abs(hash) % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" fill="${color.bg}" rx="64"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="bold" fill="${color.text}" letter-spacing="1">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Cleans document/photo URLs by stripping any "filename|" prefix, trimming whitespace,
 * and handling undefined/null values safely.
 */
export function cleanDocUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  let str = rawUrl.trim();
  if (str.includes("|")) {
    const parts = str.split("|");
    // If format is "filename|https://...", take the URL part (everything after the first pipe)
    str = parts.slice(1).join("|").trim() || parts[0].trim();
  }
  return str;
}

export interface ParsedMedia {
  raw: string;
  url: string;
  filename: string;
  isBiometricOnly: boolean;
  isGoogleDrive: boolean;
  isPdf: boolean;
  isImage: boolean;
  googleDriveEmbedUrl?: string;
  googleDriveThumbnailUrl?: string;
}

/**
 * Robust parser for attendance photos and uploaded documents.
 * Handles pipes ("filename|url"), base64, Google Drive, PDFs, and biometric markers.
 */
export function parseMediaInfo(rawUrl?: string | null, defaultTitle = "Dokumen / Foto"): ParsedMedia {
  if (!rawUrl || rawUrl.trim() === "" || rawUrl === "NONE" || rawUrl === "pasfoto_default.jpg") {
    return {
      raw: "",
      url: "",
      filename: defaultTitle,
      isBiometricOnly: false,
      isGoogleDrive: false,
      isPdf: false,
      isImage: false,
    };
  }

  const trimmed = rawUrl.trim();

  // Biometric only status check
  if (trimmed === "REGISTERED_OK" || trimmed.startsWith("REGISTERED_")) {
    return {
      raw: trimmed,
      url: "",
      filename: "Biometrik Wajah Terdaftar",
      isBiometricOnly: true,
      isGoogleDrive: false,
      isPdf: false,
      isImage: false,
    };
  }

  let filename = defaultTitle;
  let cleanUrl = trimmed;

  if (trimmed.includes("|")) {
    const parts = trimmed.split("|");
    filename = parts[0].trim() || defaultTitle;
    cleanUrl = parts.slice(1).join("|").trim();
  }

  let isGoogleDrive = false;
  let googleDriveEmbedUrl: string | undefined = undefined;
  let googleDriveThumbnailUrl: string | undefined = undefined;

  if (cleanUrl.includes("drive.google.com") || cleanUrl.includes("docs.google.com")) {
    isGoogleDrive = true;
    const fileIdMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      googleDriveEmbedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      googleDriveThumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
    }
  }

  const isPdf =
    cleanUrl.startsWith("data:application/pdf") ||
    cleanUrl.toLowerCase().includes(".pdf") ||
    filename.toLowerCase().endsWith(".pdf") ||
    cleanUrl.includes("application/pdf");

  const isImage =
    !isPdf &&
    (cleanUrl.startsWith("data:image/") ||
      cleanUrl.startsWith("blob:") ||
      /\.(jpe?g|png|webp|gif|svg|bmp)(\?.*)?$/i.test(cleanUrl) ||
      cleanUrl.includes("firebasestorage.googleapis.com") ||
      cleanUrl.includes("googleusercontent.com") ||
      Boolean(googleDriveThumbnailUrl) ||
      cleanUrl.startsWith("/uploads/"));

  return {
    raw: trimmed,
    url: cleanUrl,
    filename,
    isBiometricOnly: false,
    isGoogleDrive,
    isPdf,
    isImage,
    googleDriveEmbedUrl,
    googleDriveThumbnailUrl,
  };
}

/**
 * Ensures photo URLs (profile pictures, docFoto) render safely without broken image icons.
 */
export function getSafePhotoUrl(rawPhotoUrl?: string, defaultName: string = 'User'): string {
  if (!rawPhotoUrl || rawPhotoUrl === 'NONE' || rawPhotoUrl === 'pasfoto_default.jpg' || rawPhotoUrl === '[BERKAS_TERSIMPAN]' || rawPhotoUrl === '[FOTO_TERSIMPAN]' || rawPhotoUrl === '[BUKTI_TERSIMPAN]' || rawPhotoUrl.trim() === '') {
    return createSvgAvatar(defaultName);
  }
  let str = rawPhotoUrl.trim();
  if (str.includes('|')) {
    const parts = str.split('|');
    str = parts.slice(1).join('|').trim() || parts[0].trim();
  }
  if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/') || str.startsWith('blob:')) {
    return str;
  }
  return createSvgAvatar(defaultName);
}

/**
 * Safe image onError handler to gracefully fallback to SVG Avatar or default logo
 */
export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackNameOrUrl: string = "User") {
  const target = e.currentTarget;
  if (!target) return;
  if (fallbackNameOrUrl.startsWith("/") || fallbackNameOrUrl.startsWith("data:") || fallbackNameOrUrl.startsWith("http")) {
    if (target.src !== fallbackNameOrUrl) {
      target.src = fallbackNameOrUrl;
    }
  } else {
    target.src = createSvgAvatar(fallbackNameOrUrl);
  }
}


