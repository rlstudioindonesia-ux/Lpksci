/**
 * Video Helper Utility
 * Automatically converts YouTube, Vimeo, and Google Drive links
 * into valid embeddable URLs that work inside <iframe> without "refused to connect" errors.
 */

export function formatVideoEmbedUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (!trimmed) return "";

  // Strip wrapping quotes or brackets: "<url>", "'url'", '"url"'
  trimmed = trimmed.replace(/^[<"']+|[>"']+$/g, "").trim();

  // 1. If user accidentally pasted the full HTML <iframe> code from YouTube's share modal
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const targetUrl = iframeSrcMatch ? iframeSrcMatch[1].trim() : trimmed;

  // 2. YouTube URLs
  // Handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID
  // - or bare 11-character video ID
  const isYouTube = /(?:youtube(?:-nocookie)?\.com|youtu\.be)/i.test(targetUrl) || /^[a-zA-Z0-9_-]{11}$/.test(targetUrl);
  if (isYouTube) {
    let videoId = "";
    let startSeconds = "";
    let playlistId = "";

    // If bare 11-character ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(targetUrl)) {
      videoId = targetUrl;
    }

    // Extract start/time parameter (e.g. t=1m30s, t=90, start=90)
    const timeMatch = targetUrl.match(/[?&](?:t|start)=([0-9a-zA-Z]+)/i);
    if (timeMatch) {
      const tVal = timeMatch[1];
      if (tVal.includes("m") || tVal.includes("s") || tVal.includes("h")) {
        let totalSec = 0;
        const h = tVal.match(/(\d+)h/i);
        const m = tVal.match(/(\d+)m/i);
        const s = tVal.match(/(\d+)s/i);
        if (h) totalSec += parseInt(h[1], 10) * 3600;
        if (m) totalSec += parseInt(m[1], 10) * 60;
        if (s) totalSec += parseInt(s[1], 10);
        if (totalSec > 0) startSeconds = String(totalSec);
      } else if (/^\d+$/.test(tVal)) {
        startSeconds = tVal;
      }
    }

    // Extract playlist parameter (e.g. list=PLxxx)
    const listMatch = targetUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
    if (listMatch) {
      playlistId = listMatch[1];
    }

    // Pattern 1: youtu.be/VIDEO_ID
    if (!videoId) {
      const youtuBeMatch = targetUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
      if (youtuBeMatch) {
        videoId = youtuBeMatch[1];
      }
    }

    // Pattern 2: youtube.com/shorts/VIDEO_ID
    if (!videoId) {
      const shortsMatch = targetUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
      if (shortsMatch) {
        videoId = shortsMatch[1];
      }
    }

    // Pattern 3: youtube.com/live/VIDEO_ID
    if (!videoId) {
      const liveMatch = targetUrl.match(/\/live\/([a-zA-Z0-9_-]{11})/i);
      if (liveMatch) {
        videoId = liveMatch[1];
      }
    }

    // Pattern 4: youtube.com/embed/VIDEO_ID
    if (!videoId) {
      const embedMatch = targetUrl.match(/\/embed\/([a-zA-Z0-9_-]{11})/i);
      if (embedMatch) {
        videoId = embedMatch[1];
      }
    }

    // Pattern 5: youtube.com/v/VIDEO_ID
    if (!videoId) {
      const vMatch = targetUrl.match(/\/v\/([a-zA-Z0-9_-]{11})/i);
      if (vMatch) {
        videoId = vMatch[1];
      }
    }

    // Pattern 6: youtube.com/watch?v=VIDEO_ID or &v=VIDEO_ID
    if (!videoId) {
      const watchMatch = targetUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
      if (watchMatch) {
        videoId = watchMatch[1];
      }
    }

    // Pattern 7: direct 11-char ID in pathname if path is only /VIDEO_ID
    if (!videoId) {
      try {
        const parsed = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
        const path = parsed.pathname.replace(/^\//, "").split("/")[0];
        if (path && /^[a-zA-Z0-9_-]{11}$/.test(path)) {
          videoId = path;
        }
      } catch (e) {}
    }

    if (videoId) {
      const params = new URLSearchParams();
      params.set("rel", "0");
      params.set("modestbranding", "1");
      params.set("enablejsapi", "1");
      if (startSeconds) params.set("start", startSeconds);
      if (playlistId) params.set("list", playlistId);

      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }

    if (playlistId) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0`;
    }
  }

  // 3. Vimeo URLs
  // https://vimeo.com/12345678 or https://player.vimeo.com/video/12345678
  const vimeoMatch = targetUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // 4. Google Drive Video Link
  if (targetUrl.includes("drive.google.com")) {
    const fileIdMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
  }

  return targetUrl;
}

/**
 * Returns the original direct web URL for YouTube / Vimeo / etc.,
 * so that users can open it directly in a new tab if iframe embedding is blocked.
 */
export function getDirectVideoUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  trimmed = trimmed.replace(/^[<"']+|[>"']+$/g, "").trim();

  // If iframe src was pasted
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch) {
    trimmed = iframeSrcMatch[1];
  }

  // If it's an embed URL or youtu.be, convert it to a friendly watch URL
  const embedMatch = trimmed.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (embedMatch) {
    return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/watch?v=${trimmed}`;
  }

  return trimmed;
}

/**
 * Checks if a string is a recognizable YouTube or video streaming URL
 */
export function isYouTubeOrStreamingUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  return /(?:youtube(?:-nocookie)?\.com|youtu\.be|vimeo\.com|drive\.google\.com)/i.test(url);
}
