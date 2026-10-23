/**
 * Lost-update guard for LMS classes and site customization.
 *
 * Every chapter open/close (Sensei) and class edit (Admin) used to send the
 * WHOLE lmsClasses list plus the WHOLE customization object from the device's
 * copy, which can be ~25s old. The server replaced its data with it, so:
 *  - two Sensei opening chapters in different classes at about the same time:
 *    the first one's chapter got closed again;
 *  - a Sensei opening a chapter right after an Admin edited the landing page:
 *    the Admin's edit was reverted.
 * The client now sends only what it changed relative to its copy, and the
 * server applies that onto its current data.
 */

const norm = (v: any) => String(v ?? "").trim().toLowerCase();
const classKey = (c: any) => norm(c?.id || c?.name);
const same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

export interface ClassListDiff {
  changed: any[];
  /** ids and names (normalised) of classes removed by the client */
  deletedKeys: string[];
}

export function diffClassList(base: any[] | null | undefined, next: any[] | null | undefined): ClassListDiff {
  const baseList = Array.isArray(base) ? base : [];
  const nextList = Array.isArray(next) ? next : [];
  const nextKeys = new Set(nextList.map(classKey));
  const nextNames = new Set(nextList.map((c) => norm(c?.name)));

  const changed = nextList.filter((c) => {
    const b = baseList.find((x) => classKey(x) === classKey(c)) || baseList.find((x) => norm(x?.name) && norm(x?.name) === norm(c?.name));
    return !b || !same(b, c);
  });

  const deletedKeys: string[] = [];
  baseList.forEach((b) => {
    if (nextKeys.has(classKey(b)) || (norm(b?.name) && nextNames.has(norm(b?.name)))) return;
    if (norm(b?.id)) deletedKeys.push(norm(b.id));
    if (norm(b?.name)) deletedKeys.push(norm(b.name));
  });

  return { changed, deletedKeys };
}

export function applyClassListDiff(serverList: any[] | null | undefined, diff: ClassListDiff): any[] {
  const deleted = new Set(diff.deletedKeys || []);
  const result = (Array.isArray(serverList) ? serverList : []).filter(
    (c) => !deleted.has(norm(c?.id)) && !deleted.has(norm(c?.name)),
  );
  (diff.changed || []).forEach((c) => {
    let idx = result.findIndex((x) => classKey(x) === classKey(c));
    if (idx === -1) idx = result.findIndex((x) => norm(x?.name) && norm(x?.name) === norm(c?.name));
    if (idx === -1) result.push(c);
    else result[idx] = c;
  });
  return result;
}

/** Top-level keys of `next` whose value differs from `base` (skipping `skipKeys`). */
export function diffShallowObject(base: any, next: any, skipKeys: string[] = []): Record<string, any> {
  const out: Record<string, any> = {};
  if (!next || typeof next !== "object") return out;
  for (const key of Object.keys(next)) {
    if (skipKeys.includes(key)) continue;
    if (!base || !same(base[key], next[key])) out[key] = next[key];
  }
  return out;
}
