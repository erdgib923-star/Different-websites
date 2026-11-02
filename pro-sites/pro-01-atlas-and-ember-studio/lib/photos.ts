'use client';
/**
 * Photo manifest loader. Real photos are optional: list them in
 * public/assets/images/photos.json as { "slot-name": "file.jpg" } and every
 * <Media slot="slot-name"> picks them up at runtime (no rebuild needed for the static export).
 */
let manifest: Promise<Record<string, string>> | null = null;

export function getPhotoManifest() {
  if (!manifest) {
    manifest = fetch('/assets/images/photos.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return manifest;
}
