import { put, list, del } from "@vercel/blob";

/**
 * The ONLY module that imports `@vercel/blob` directly. Every other module
 * accesses storage exclusively through `content-store`.
 *
 * Public Vercel Blob URLs are fronted by a CDN that caches by URL for at
 * least a minute (often much longer), so overwriting a single stable
 * pathname (e.g. `content.json`) makes reads-after-write unreliable —
 * exactly the consistency `saveContent` needs when merging one editor's
 * partial update onto the latest document. Instead, every save writes a new,
 * uniquely-named blob under this prefix; reads list the prefix (a metadata
 * call, not CDN-cached) and fetch the newest one — a URL never seen before,
 * so it can't be served from cache.
 */
const CONTENT_PREFIX = "content-versions/";

/**
 * Overwrites the logical `content.json` document by writing a new
 * timestamped blob and deleting all older versions.
 * MUST only be called from `saveContent` in `app/admin/actions.ts`.
 */
export async function writeContentBlob(document: unknown): Promise<void> {
  const pathname = `${CONTENT_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;

  const written = await put(pathname, JSON.stringify(document), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  const { blobs } = await list({ prefix: CONTENT_PREFIX, limit: 1000 });
  const stale = blobs.filter((b) => b.url !== written.url).map((b) => b.url);
  if (stale.length > 0) {
    await del(stale);
  }
}

/**
 * Reads the raw `content.json` document from Blob.
 * Returns `null` when it doesn't exist yet (first run, before any save) —
 * `getContent()` relies on this to know when to fall back to schema defaults.
 * Also returns `null` when the stored body isn't valid JSON (e.g. a corrupted
 * or partially-written blob): a malformed document is just as "unusable" as a
 * missing one, and `getContent()` must never throw on either. Any other
 * failure (network, auth, etc.) propagates to the caller.
 */
export async function readContentBlob(): Promise<unknown | null> {
  const { blobs } = await list({ prefix: CONTENT_PREFIX, limit: 1000 });
  if (blobs.length === 0) {
    return null;
  }

  const latest = blobs.reduce((a, b) => (a.uploadedAt > b.uploadedAt ? a : b));

  const response = await fetch(latest.url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
