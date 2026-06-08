import { get } from "@vercel/blob";

/**
 * The ONLY module that imports `@vercel/blob` directly. Every other module
 * accesses storage exclusively through `content-store`.
 *
 * `content.json` always lives at this single, stable pathname so the future
 * `saveContent` can overwrite it in place (never a randomly-suffixed one).
 */
export const CONTENT_PATHNAME = "content.json";

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
  const result = await get(CONTENT_PATHNAME, { access: "public" });
  if (!result || !result.stream) {
    return null;
  }
  const text = await new Response(result.stream).text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
