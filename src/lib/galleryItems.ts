/**
 * Gallery photos to show (23-10-2026). When the admin deletes every photo, the
 * gallery must stay empty; it used to fall back to the built-in sample photos
 * (on the server after each delete/restart and again in every screen).
 * `cleared` is set by the server once the admin emptied the gallery.
 */
export function pickGalleryItems<T>(
  galleries: T[] | null | undefined,
  customizationGallery: T[] | null | undefined,
  cleared: boolean | null | undefined,
  defaults: T[],
): T[] {
  if (Array.isArray(galleries) && galleries.length > 0) return galleries;
  if (cleared) return [];
  if (Array.isArray(customizationGallery) && customizationGallery.length > 0) return customizationGallery;
  return defaults;
}
