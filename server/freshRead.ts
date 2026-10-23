import { getEntityFromFirestore } from "../src/db/firebase-adapter.ts";

/**
 * Read-before-write for data that handlers rewrite as a whole (23-10-2026).
 *
 * Every Cloud Run instance keeps its own copy of the data in memory. Agenda,
 * LMS lessons, the gallery and the site settings were changed on that copy and
 * then written back completely, so a change made a moment earlier on another
 * instance (not yet synced) was silently undone. These helpers refresh the
 * record from Firestore right before the change is applied. On any error or
 * timeout the in-memory copy is used, as before.
 */

const FRESH_READ_TIMEOUT_MS = 2500;

async function readFresh(collection: string, id: string): Promise<any | null> {
  try {
    return await Promise.race([
      getEntityFromFirestore(collection, id),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), FRESH_READ_TIMEOUT_MS)),
    ]);
  } catch (e) {
    return null;
  }
}

/** Replaces one item of `state[key]` with its latest Firestore version. */
export async function refreshListItem(state: any, key: string, collection: string, id: unknown): Promise<void> {
  if (!id || !Array.isArray(state[key])) return;
  const fresh = await readFresh(collection, String(id));
  if (!fresh) return;
  const record = { ...fresh, id: fresh.id || id };
  const idx = state[key].findIndex((x: any) => x && x.id === id);
  if (idx !== -1) state[key][idx] = record;
}

/** Latest site settings and class list (gallery is refreshed separately). */
export async function refreshCustomization(state: any): Promise<void> {
  const [cust, classes] = await Promise.all([readFresh("system", "customization"), readFresh("system", "lmsClasses")]);
  if (cust && typeof cust === "object") {
    const keep: any = {};
    if (state.customization?.gallery !== undefined) keep.gallery = state.customization.gallery;
    if (state.customization?.lmsClasses !== undefined) keep.lmsClasses = state.customization.lmsClasses;
    state.customization = { ...(state.customization || {}), ...cust, ...keep };
  }
  const list = Array.isArray(classes?.classes) ? classes.classes : null;
  if (list && list.length > 0) {
    state.lmsClasses = list;
    if (!state.customization) state.customization = {};
    state.customization.lmsClasses = list;
  }
}

/** Latest gallery list (including an intentionally emptied gallery). */
export async function refreshGalleries(state: any): Promise<void> {
  const g = await readFresh("system", "galleries");
  if (!g) return;
  const list = Array.isArray(g.data) ? g.data : Array.isArray(g.galleries) ? g.galleries : Array.isArray(g.gallery) ? g.gallery : null;
  if (!list) return;
  if (list.length > 0 || g.cleared === true) {
    state.galleries = list;
    state.galleriesCleared = list.length === 0;
  }
}
