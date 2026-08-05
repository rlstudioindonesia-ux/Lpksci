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
 * Automatically compresses image files to a lightweight JPEG format
 * with a customizable maximum dimension and 70% quality.
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
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Return compressed Blob with original name or new JPEG extension safely
                const lastDotIdx = file.name.lastIndexOf('.');
                const nameWithoutExt = lastDotIdx !== -1 ? file.name.substring(0, lastDotIdx) : file.name;
                const newName = `${nameWithoutExt || 'image'}.jpg`;
                const compressedFile = new File([blob], newName, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(`[Compression] Reduced image from ${file.size} bytes to ${compressedFile.size} bytes (maxDim: ${maxDim}).`);
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.7 // 70% quality compression
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
 * Compresses an image to a very small size suitable for Base64 storage in Firestore (max 5KB - 25KB).
 */
export async function compressForBase64(file: File, folder: string): Promise<Blob | File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }
  // For Base64, we want small size to prevent Firestore 1MB document size limits
  // profile_pictures or customization logos: maxDim 180px, quality 45% -> around 4KB - 8KB
  // payments or registrations: maxDim 500px, quality 50% -> around 15KB - 30KB
  let maxDim = 500;
  let quality = 0.60;
  if (folder === "profile_pictures") {
    maxDim = 180;
    quality = 0.45;
  } else if (folder === "customization" || folder === "galeri") {
    // High-resolution for banners, slideshows, and gallery
    maxDim = 800;
    quality = 0.60;
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
                console.log(`[Base64 Fallback Compression] Reduced image size to ${compressedFile.size} bytes (maxDim: ${maxDim}, quality: ${quality}).`);
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
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
 * Uploads a file/image to Firebase Storage with automatic compression.
 * If Firebase Storage is not active, fails fast (with a timeout) and
 * falls back to uploading to the local Express server (/api/upload).
 * 
 * @param file File object to upload
 * @param folder Target folder inside storage (e.g., 'registrations', 'payments', 'profile_pictures')
 * @returns Promise<string> Public download URL or local file path URL
 */
async function uploadFileToLocalServer(file: File, base64Data: string): Promise<string> {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName: file.name,
      fileData: base64Data
    })
  });
  if (!response.ok) {
    throw new Error("Local server upload failed");
  }
  const result = await response.json();
  if (result.url) {
    return result.url;
  }
  throw new Error("Local server did not return file URL");
}

export async function uploadFileToFirebase(file: File, folder: string): Promise<string> {
  // Bypassing Firebase Storage and Local Server entirely for images to ensure persistence via Firestore Base64
  if (file.type.startsWith('image/')) {
    try {
      const smallFile = await compressForBase64(file, folder);
      const base64Data = await fileToBase64(smallFile);
      return base64Data;
    } catch (e) {
      console.error("Base64 compression failed:", e);
      throw e;
    }
  }

  // Step 1: Compress if it's an image. Use small dimension for profile pictures to support fast load & Base64 size limits.
  let finalFile: File | Blob = file;
  try {
    const maxDim = folder === "profile_pictures" ? 250 : 1200;
    finalFile = await compressImageIfNeeded(file, maxDim);
  } catch (compressErr) {
    console.warn("Image compression failed, uploading original file:", compressErr);
  }

  // Step 2: Use a sanitized timestamped path to prevent filename collisions
  const cleanFileName = finalFile instanceof File ? finalFile.name.replace(/[^a-zA-Z0-9_.-]/g, "_") : file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const path = `${folder}/${Date.now()}_${cleanFileName}`;
  const storageRef = ref(storage, path);
  
  // Create a timeout promise to prevent infinite retry loops if Storage is not activated in console.
  // Using 15 seconds to allow slower mobile/home connections to upload larger files.
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout: Firebase Storage bucket is inactive or not fully configured.")), 15000);
  });
  
  const uploadPromise = (async () => {
    const snapshot = await uploadBytes(storageRef, finalFile);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  })();
  
  try {
    // Attempt Firebase Storage upload with a fast timeout race
    const result = await Promise.race([uploadPromise, timeoutPromise]);
    console.log(`Successfully uploaded ${file.name} to Firebase Storage:`, result);
    return result;
  } catch (error: any) {
    console.warn(`Firebase Storage upload failed/timed out (${error.message || error}). Falling back to local server storage...`);
    // Fallback to local server upload so we don't save huge Base64 strings inside Firestore documents
    try {
      const rawBase64 = await fileToBase64(file);
      
      const localUrl = await uploadFileToLocalServer(file, rawBase64);
      console.log("Successfully uploaded file to local server:", localUrl);
      return localUrl;
    } catch (fallbackError) {
      console.error("Local server upload failed as well. Last resort: Base64 for images.", fallbackError);
      if (file.type.startsWith('image/')) {
        try {
          const smallFile = await compressForBase64(file, folder);
          const base64Data = await fileToBase64(smallFile);
          return base64Data;
        } catch (e) {
          throw error;
        }
      }
      throw error;
    }
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

  // 1. Google Drive URLs -> replace view with preview embed URL
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
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

