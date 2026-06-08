import { contentSchema, type ContentDocument } from "@/lib/content-schema";
import { readContentBlob } from "@/lib/blob";

/**
 * The ONLY module that reads/writes the logical `content.json` document.
 * Wraps `blob.ts` and validates every read against the shared schema,
 * filling defaults for missing/older-version fields so the public page
 * always has something complete to render.
 */
export async function getContent(): Promise<ContentDocument> {
  const raw = await readContentBlob();

  if (raw === null) {
    return contentSchema.parse({});
  }

  const parsed = contentSchema.safeParse(raw);
  if (parsed.success) {
    // Every field carries a Zod `.default()`, so safeParse already fills in
    // missing/older-version fields here — no extra merge step needed.
    return parsed.data;
  }

  // Genuinely malformed document (e.g. a field has the wrong type). Unlike
  // the future saveContent — which must reject invalid input loudly — reads
  // must always degrade gracefully so the public page still renders something.
  return contentSchema.parse({});
}
