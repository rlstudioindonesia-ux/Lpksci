/**
 * LPK SCI Notification & Audio Chime Utility
 * Handles Web Audio API synth chime, audio file fallback,
 * Firestore real-time broadcast distribution, and outside-APK system notifications.
 */

import { doc, setDoc, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebaseClient";
import { isStudentAlumni } from "./alumniStatus";
import { findStudentForUser } from "./recordMatching";

export interface BroadcastNotificationItem {
  id: string;
  title: string;
  body: string;
  type?: "job_order" | "jadwal_harian" | "general" | string;
  url?: string;
  createdAt: number;
  timestamp: string;
  targetAudience?: "Semua" | "Siswa" | "Alumni" | string;
  jobId?: string;
  jobType?: string;
  targetStudentIds?: string[];
}

/**
 * Sound notification completely removed as requested.
 * Notification is purely visual & device-native haptic vibration.
 */
export function unlockAudio() {
  // Silent no-op
}

export function playNotificationSound() {
  // Silent no-op: audio chime has been completely removed per user request
}

/**
 * Detect if running inside an Android APK / WebView environment
 */
export function isInsideAndroidApk(): boolean {
  if (typeof window === "undefined") return false;
  // 1. Explicit native bridge injected by Android Studio WebView
  if ((window as any).Android || (window as any).JSBridge || (window as any).AndroidBridge) {
    return true;
  }
  // 2. User agent indicator for Android WebView (wv) or Android standalone PWA / TWA
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isWebView = /wv|\.0\.0\.0/i.test(ua) || (isAndroid && /Version\/[0-9.]+/i.test(ua));
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
  return isAndroid && (isWebView || isStandalone);
}

/**
 * Get comprehensive notification environment status
 */
export function getNotificationEnvironmentStatus(): {
  permission: NotificationPermission;
  isSupported: boolean;
  isApkBridgeConnected: boolean;
  isInsideApk: boolean;
  canVibrate: boolean;
} {
  const isSupported = typeof window !== "undefined" && "Notification" in window;
  const permission: NotificationPermission = isSupported ? Notification.permission : "denied";
  const isApkBridgeConnected = typeof window !== "undefined" && Boolean(
    ((window as any).Android && typeof (window as any).Android.showNotification === "function") ||
    ((window as any).JSBridge && typeof (window as any).JSBridge.showNotification === "function") ||
    ((window as any).AndroidBridge && typeof (window as any).AndroidBridge.showNotification === "function")
  );
  const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;
  const isInsideApk = isInsideAndroidApk();

  return {
    permission,
    isSupported,
    isApkBridgeConnected,
    isInsideApk,
    canVibrate
  };
}

/**
 * Request OS & Browser Notification Permissions.
 * Also delegates to Android bridge if available.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined") {
    return "denied";
  }

  // If running in Android APK with native permission interface, request it natively as well
  try {
    const androidObj = (window as any).Android || (window as any).JSBridge;
    if (androidObj && typeof androidObj.requestNotificationPermission === "function") {
      androidObj.requestNotificationPermission();
    }
  } catch (e) {
    console.warn("Android native permission request call error:", e);
  }

  if (!("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  try {
    let result: NotificationPermission = Notification.permission;
    // Support both modern Promise-based and legacy callback-based requestPermission
    const promise = Notification.requestPermission((perm) => {
      if (perm) result = perm;
    });
    if (promise && typeof promise.then === "function") {
      const awaited = await promise;
      if (awaited) result = awaited;
    }
    return result || Notification.permission;
  } catch (err) {
    console.warn("Notification request permission error:", err);
    return Notification.permission;
  }
}

/**
 * Show system notification outside the APK / outside active browser tab.
 * Dispatches to Android native bridge, Web Notification API, and Service Worker.
 */
export function showOutsideApkNotification(title: string, body: string, options?: { url?: string; id?: string }) {
  const notifId = options?.id || `notif_${Date.now()}`;
  const targetUrl = options?.url || "/";

  // 1. Android APK WebView native bridge (Supports multiple method signatures across Android Studio builds)
  try {
    const win = window as any;
    if (win.Android) {
      if (typeof win.Android.showNotification === "function") {
        try {
          win.Android.showNotification(title, body, targetUrl, notifId);
        } catch {
          win.Android.showNotification(title, body);
        }
      }
      if (typeof win.Android.postMessage === "function") {
        try {
          win.Android.postMessage(JSON.stringify({
            type: "NOTIFICATION",
            title,
            body,
            url: targetUrl,
            id: notifId
          }));
        } catch (_) {}
      }
    }
    if (win.JSBridge && typeof win.JSBridge.showNotification === "function") {
      try {
        win.JSBridge.showNotification(title, body, targetUrl, notifId);
      } catch {
        win.JSBridge.showNotification(title, body);
      }
    }
    if (win.AndroidBridge && typeof win.AndroidBridge.showNotification === "function") {
      try {
        win.AndroidBridge.showNotification(title, body, targetUrl, notifId);
      } catch {
        win.AndroidBridge.showNotification(title, body);
      }
    }
    if (win.ReactNativeWebView && typeof win.ReactNativeWebView.postMessage === "function") {
      win.ReactNativeWebView.postMessage(JSON.stringify({
        type: "NOTIFICATION",
        title,
        body,
        url: targetUrl,
        id: notifId
      }));
    }
  } catch (e) {
    console.warn("Android native bridge notification error:", e);
  }

  // 2. Device Hardware Haptic Vibration (Noticeable double buzz on phone)
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([250, 100, 250]);
    }
  } catch (e) {}

  // 3. System Notification outside the app (Device notification tray & Lock screen)
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    const notifOptions = {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      vibrate: [250, 100, 250],
      tag: notifId,
      renotify: true,
      data: {
        url: targetUrl,
        notifId
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          if (reg && typeof reg.showNotification === "function") {
            return reg.showNotification(title, notifOptions);
          }
        })
        .catch(() => {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && typeof reg.showNotification === "function") {
              reg.showNotification(title, notifOptions).catch(() => {});
            }
          }).catch(() => {});
        });
    } else {
      try {
        new Notification(title, notifOptions);
      } catch (_) {}
    }
  }
}

/**
 * Trigger an immediate test notification to verify mobile / APK notification receipt.
 */
export async function testDeviceNotification(): Promise<{
  success: boolean;
  status: ReturnType<typeof getNotificationEnvironmentStatus>;
  message: string;
}> {
  // Request permission if not yet decided
  const perm = await requestNotificationPermission();
  const envStatus = getNotificationEnvironmentStatus();

  const testTitle = "🔔 Tes Notifikasi LPK SCI Pati";
  const testBody = "Notifikasi HP berhasil aktif! Anda akan menerima update jadwal, materi, dan job order secara real-time.";

  showOutsideApkNotification(testTitle, testBody, {
    url: "/?tab=notifikasi",
    id: `test_${Date.now()}`
  });

  return {
    success: perm === "granted" || envStatus.isApkBridgeConnected,
    status: envStatus,
    message: perm === "granted" || envStatus.isApkBridgeConnected
      ? "Notifikasi berhasil dikirim ke perangkat Anda!"
      : "Izin notifikasi belum diaktifkan di browser/HP Anda. Silakan klik Izinkan Notifikasi."
  };
}

/**
 * Send a broadcast notification to all registered accounts across all devices.
 * Writes to Firestore collection `broadcast_notifications` and notifies backend server.
 */
export async function sendBroadcastNotification(
  title: string,
  body: string,
  options?: {
    type?: "job_order" | "jadwal_harian" | "general" | string;
    url?: string;
    id?: string;
    targetAudience?: "Semua" | "Siswa" | "Alumni" | string;
    jobId?: string;
    jobType?: string;
    targetStudentIds?: string[];
  }
) {
  // Trigger outside notification immediately for creator
  showOutsideApkNotification(title, body, options);

  const notifItem: BroadcastNotificationItem = {
    id: options?.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    body,
    type: options?.type || "general",
    url: options?.url || "/",
    createdAt: Date.now(),
    timestamp: new Date().toISOString(),
    targetAudience: options?.targetAudience || "Semua",
    jobId: options?.jobId,
    jobType: options?.jobType,
    targetStudentIds: options?.targetStudentIds
  };

  // Mark on this device so we don't alert twice
  markNotificationAsSeen(notifItem.id);

  // 1. Write to Firestore `broadcast_notifications` so all registered client devices receive it in real-time
  try {
    await setDoc(doc(db, "broadcast_notifications", notifItem.id), notifItem);
  } catch (err) {
    console.warn("Error publishing to Firestore broadcast_notifications:", err);
  }

  // 2. Dual-channel: send to server endpoint
  try {
    await fetch("/api/broadcast-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notifItem)
    });
  } catch (err) {
    console.warn("Error publishing to /api/broadcast-notification:", err);
  }
}

const SEEN_NOTIF_KEY = "lpk_seen_broadcast_notifications";
const READ_NOTIF_KEY = "lpk_read_broadcast_notifications";
const USER_SEEN_JOB_PREFIX = "lpk_seen_jobs_for_user_";

export function getUserSeenJobOrderIds(userKey: string): Set<string> {
  if (!userKey) return new Set();
  try {
    const raw = localStorage.getItem(`${USER_SEEN_JOB_PREFIX}${userKey}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

export function markJobOrderAsSeenByUser(jobId: string, userKey: string) {
  if (!jobId || !userKey) return;
  try {
    const set = getUserSeenJobOrderIds(userKey);
    set.add(jobId);
    const trimmed = Array.from(set).slice(-100);
    localStorage.setItem(`${USER_SEEN_JOB_PREFIX}${userKey}`, JSON.stringify(trimmed));
  } catch (e) {}
}

/**
 * Checks if a broadcast notification is meant for a specific user (Alumni vs Siswa vs Staff).
 */
export function isNotificationRelevantForUser(
  item: BroadcastNotificationItem,
  user?: any,
  activeStudents?: any[]
): boolean {
  if (!item) return false;
  // If no user is logged in yet:
  if (!user) {
    return !item.targetAudience || item.targetAudience === "Semua";
  }

  const role = user.role || "";
  // Staff & Admin monitor all notifications
  if (["Admin", "Admin Super", "Admin Biasa", "VVIP", "Pengajar"].includes(role)) {
    return true;
  }

  // Targeted specifically to student IDs (e.g. Job recommendations)
  if (item.targetStudentIds && item.targetStudentIds.length > 0) {
    const studentId = user.studentId;
    const matchedStudent = findStudentForUser(activeStudents, user);
    const resolvedId = studentId || matchedStudent?.id;
    if (resolvedId && item.targetStudentIds.includes(resolvedId)) {
      return true;
    }
    return false;
  }

  // Non-job notifications (schedules, general news) are visible to everyone
  if (item.type !== "job_order") {
    return true;
  }

  // Check whether user is Alumni vs Siswa
  const studentObj = findStudentForUser(activeStudents, user);
  const isAlumni = role === "Alumni" || isStudentAlumni(studentObj);
  const isSiswa = (role === "Siswa" || !role) && !isAlumni;

  const target = item.targetAudience || "Semua";
  if (target === "Alumni") {
    return isAlumni;
  }
  if (target === "Siswa") {
    return isSiswa;
  }
  return isAlumni || isSiswa;
}

/**
 * Triggers upon login or session start to check if there are active Job Orders
 * matching the user's role (Alumni vs Siswa) that have not been seen yet.
 * Plays the sound chime immediately and displays the notification toast.
 */
export function checkAndNotifyJobOrdersOnLogin(
  user: any,
  systemState: any,
  onNotify?: (item: BroadcastNotificationItem) => void
): boolean {
  if (!user) return false;

  const role = user.role || "";
  // Do not show applicant alerts to staff
  if (["Admin", "Admin Super", "Admin Biasa", "VVIP", "Pengajar"].includes(role)) {
    return false;
  }

  const activeStudents = systemState?.activeStudents || [];
  const studentObj = findStudentForUser(activeStudents, user);
  const isAlumni = role === "Alumni" || isStudentAlumni(studentObj);
  const isSiswa = (role === "Siswa" || !role) && !isAlumni;

  if (!isAlumni && !isSiswa) return false;

  const userKey = (user.username || user.studentId || user.email || user.name || "user").toLowerCase().trim();
  const seenJobs = getUserSeenJobOrderIds(userKey);

  const jobOrders: any[] = (systemState?.jobOrders || []).filter((j: any) => {
    if (!j) return false;
    const isRecommended = studentObj && j.recommendations?.includes(studentObj.id);
    return j.status === "Aktif" || isRecommended;
  });

  if (jobOrders.length === 0) return false;

  // Find relevant unread jobs
  const unreadRelevantJobs = jobOrders.filter((job) => {
    if (seenJobs.has(job.id)) return false;

    // Direct recommendation overrides audience filter
    const isRecommended = studentObj && job.recommendations?.includes(studentObj.id);
    if (isRecommended) return true;

    // Match audience
    const target = job.targetAudience || "Semua";
    if (isAlumni) {
      if (target === "Alumni" || target === "Semua") return true;
      if (!job.targetAudience && (job.jobType === "Tokutei ginou" || job.jobType === "Engineering")) return true;
      return false;
    }
    if (isSiswa) {
      if (target === "Siswa" || target === "Semua") return true;
      if (!job.targetAudience && (job.jobType === "Ginou jisshusei" || job.jobType === "Ryugakusei" || job.jobType === "Tokutei ginou")) return true;
      return false;
    }
    return false;
  });

  if (unreadRelevantJobs.length === 0) return false;

  // Pick the highest priority (recommendation first, then most recent)
  const sortedJobs = [...unreadRelevantJobs].sort((a, b) => {
    const aRec = studentObj && a.recommendations?.includes(studentObj.id) ? 1 : 0;
    const bRec = studentObj && b.recommendations?.includes(studentObj.id) ? 1 : 0;
    return bRec - aRec;
  });

  const featuredJob = sortedJobs[0];
  const isRecommended = studentObj && featuredJob.recommendations?.includes(studentObj.id);

  // Mark this job as seen by this user so we don't alert on every click
  markJobOrderAsSeenByUser(featuredJob.id, userKey);

  const totalCount = sortedJobs.length;
  let title = "";
  let body = "";

  if (isRecommended) {
    title = `🎯 Rekomendasi Job Order Khusus: ${featuredJob.occupation || "Peluang Kerja"}`;
    body = `Halo ${user.name || "Siswa"}, Anda direkomendasikan secara resmi untuk lowongan: ${featuredJob.occupation} di ${featuredJob.partnerName} (${featuredJob.location})!`;
  } else if (isAlumni) {
    title = totalCount > 1
      ? `💼 ${totalCount} Job Order Baru untuk Alumni LPK SCI`
      : `💼 Job Order Baru untuk Alumni: ${featuredJob.occupation || "Peluang Kerja"}`;
    body = `Lowongan Tokutei Ginou / Karir Jepang: ${featuredJob.occupation} di ${featuredJob.partnerName} (${featuredJob.location}) - Gaji ${featuredJob.salary || "Standar Jepang"}. Buka sekarang untuk detail & mendaftar!`;
  } else {
    title = totalCount > 1
      ? `💼 ${totalCount} Job Order Baru untuk Siswa LPK SCI`
      : `💼 Job Order Baru untuk Siswa: ${featuredJob.occupation || "Peluang Kerja"}`;
    body = `Lowongan resmi untuk Siswa LPK SCI: ${featuredJob.occupation} di ${featuredJob.partnerName} (${featuredJob.location}) - Gaji ${featuredJob.salary || "Standar Jepang"}. Buka sekarang untuk detail & mendaftar!`;
  }

  const notifItem: BroadcastNotificationItem = {
    id: `job_alert_${featuredJob.id}_${userKey}`,
    title,
    body,
    type: "job_order",
    url: "/?tab=jobs",
    createdAt: Date.now(),
    timestamp: new Date().toISOString(),
    targetAudience: isAlumni ? "Alumni" : "Siswa",
    jobId: featuredJob.id
  };

  // 1. Dispatch outside notification directly to user phone
  showOutsideApkNotification(title, body, { url: "/?tab=jobs", id: notifItem.id });

  // 2. Mark unread tracking (silent, no audio)
  startUnreadNotificationChime(notifItem);

  // 3. Optional listener callback
  if (onNotify) {
    onNotify(notifItem);
  }

  return true;
}

export function getSeenNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_NOTIF_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

export function markNotificationAsSeen(id: string) {
  try {
    const seen = getSeenNotificationIds();
    seen.add(id);
    const trimmed = Array.from(seen).slice(-100);
    localStorage.setItem(SEEN_NOTIF_KEY, JSON.stringify(trimmed));
  } catch (e) {}
}

export function getReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_NOTIF_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

export function isNotificationRead(id: string): boolean {
  if (!id) return true;
  return getReadNotificationIds().has(id);
}

// Active unread notifications tracking (silent)
const pendingUnreadNotifs = new Map<string, BroadcastNotificationItem>();

/**
 * Stops all unread notification tracking immediately (silent).
 */
export function stopAllNotificationChimes() {
  pendingUnreadNotifs.clear();
}

/**
 * Marks a specific notification as opened/read.
 */
export function markNotificationAsRead(id: string) {
  if (!id) return;
  try {
    const readSet = getReadNotificationIds();
    readSet.add(id);
    const trimmed = Array.from(readSet).slice(-100);
    localStorage.setItem(READ_NOTIF_KEY, JSON.stringify(trimmed));
  } catch (e) {}

  pendingUnreadNotifs.delete(id);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lpk:notification-read", { detail: { id } }));
  }
}

/**
 * Marks all pending notifications as opened/read.
 */
export function markAllNotificationsAsRead() {
  try {
    const readSet = getReadNotificationIds();
    pendingUnreadNotifs.forEach((_, id) => readSet.add(id));
    const trimmed = Array.from(readSet).slice(-100);
    localStorage.setItem(READ_NOTIF_KEY, JSON.stringify(trimmed));
  } catch (e) {}
  pendingUnreadNotifs.clear();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lpk:notification-read-all"));
  }
}

/**
 * Records unread notification and triggers a single gentle haptic buzz (if device supports vibration).
 * NO repetitive chime or audio sounds are played.
 */
export function startUnreadNotificationChime(item: BroadcastNotificationItem) {
  if (!item || !item.id) return;
  if (isNotificationRead(item.id)) return;

  pendingUnreadNotifs.set(item.id, item);

  // Single gentle device vibration, zero audio sound
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (_) {}
  }
}

// Listen for service worker notification clicks to silence sound
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "NOTIFICATION_OPENED") {
      if (event.data.id) {
        markNotificationAsRead(event.data.id);
      } else {
        markAllNotificationsAsRead();
      }
      stopAllNotificationChimes();
    }
  });
}

/**
 * Starts listening for broadcast notifications (Job Orders, Daily Schedules).
 * Keeps alert sound active until the notification is opened / read by user.
 */
export function startBroadcastNotificationListener(
  onNotificationReceived?: (notif: BroadcastNotificationItem) => void,
  getUserContext?: () => { user: any; activeStudents?: any[] }
): () => void {
  if (typeof window === "undefined") return () => {};

  const sessionStartTime = Date.now();
  let isInitialLoad = true;

  const handleIncomingNotification = (item: BroadcastNotificationItem) => {
    if (!item || !item.id) return;

    // Verify audience relevance for current user (Alumni vs Siswa vs Staff)
    if (getUserContext) {
      try {
        const ctx = getUserContext();
        if (ctx && !isNotificationRelevantForUser(item, ctx.user, ctx.activeStudents)) {
          return;
        }
      } catch (_) {}
    }

    const seen = getSeenNotificationIds();
    if (seen.has(item.id)) return;

    // Check age: alert if created after session started or within last 3 minutes
    const isRecent = item.createdAt && (item.createdAt >= sessionStartTime - 180000);

    markNotificationAsSeen(item.id);

    if (isRecent && !isNotificationRead(item.id)) {
      // Trigger outside-APK notification banner
      showOutsideApkNotification(item.title, item.body, { url: item.url, id: item.id });

      // Start repeating chime until user opens/reads the notification
      startUnreadNotificationChime(item);

      if (onNotificationReceived) {
        onNotificationReceived(item);
      }
    }
  };

  // 1. Real-time Firestore Listener
  let unsubscribeFirestore = () => {};
  try {
    const q = query(
      collection(db, "broadcast_notifications"),
      orderBy("createdAt", "desc"),
      limit(15)
    );

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const changes = snapshot.docChanges();
        if (isInitialLoad) {
          // On initial load, check if there is any unread recent notification from last 20 minutes
          const recentThreshold = Date.now() - (20 * 60 * 1000);
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data() as BroadcastNotificationItem;
            if (data?.id) {
              if (getUserContext) {
                try {
                  const ctx = getUserContext();
                  if (ctx && !isNotificationRelevantForUser(data, ctx.user, ctx.activeStudents)) {
                    return;
                  }
                } catch (_) {}
              }
              markNotificationAsSeen(data.id);
              if (data.createdAt && data.createdAt >= recentThreshold && !isNotificationRead(data.id)) {
                // If unread, start repeating chime and alert toast
                startUnreadNotificationChime(data);
                if (onNotificationReceived) {
                  onNotificationReceived(data);
                }
              }
            }
          });
          isInitialLoad = false;
          return;
        }

        changes.forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data() as BroadcastNotificationItem;
            handleIncomingNotification(data);
          }
        });
      },
      (error) => {
        console.warn("Firestore broadcast listener error, falling back to polling:", error);
      }
    );
  } catch (err) {
    console.warn("Failed to attach Firestore snapshot listener:", err);
  }

  // 2. Fallback polling every 25 seconds
  const pollInterval = setInterval(async () => {
    try {
      const res = await fetch("/api/broadcast-notifications");
      if (res.ok) {
        const data = await res.json();
        const list: BroadcastNotificationItem[] = data.notifications || [];
        list.forEach((item) => handleIncomingNotification(item));
      }
    } catch (e) {}
  }, 25000);

  return () => {
    unsubscribeFirestore();
    clearInterval(pollInterval);
    stopAllNotificationChimes();
  };
}
