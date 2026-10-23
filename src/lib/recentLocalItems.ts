/**
 * Background refetches of /api/state used to re-append EVERY local lesson/quiz
 * missing from the server response ("never lose recently added items"). That
 * also resurrected items another sensei had deleted or replaced: a student's
 * open app kept showing removed quiz questions until a full page reload.
 * Now only items this device itself saved within the last few minutes (which
 * the server may not include yet) are kept.
 */
export const RECENT_LOCAL_ITEM_WINDOW_MS = 2 * 60 * 1000;

export function mergeRecentLocalItems<T extends { id?: string }>(
  serverList: T[],
  localList: T[] | null | undefined,
  recentLocalIds: Map<string, number>,
  now: number = Date.now(),
  windowMs: number = RECENT_LOCAL_ITEM_WINDOW_MS,
): T[] {
  if (!Array.isArray(localList) || localList.length === 0) return serverList;
  const serverIds = new Set(serverList.map((item) => item && item.id));
  const keep = localList.filter((item) => {
    if (!item || !item.id || serverIds.has(item.id)) return false;
    const savedAt = recentLocalIds.get(item.id);
    return savedAt !== undefined && now - savedAt <= windowMs;
  });
  return keep.length > 0 ? [...serverList, ...keep] : serverList;
}
