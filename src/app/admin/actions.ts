"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { contentSchema, type ContentDocument } from "@/lib/content-schema";
import { sanitizeRichText } from "@/lib/sanitize";
import { writeContentBlob } from "@/lib/blob";

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}

export type SaveResult = { success: true } | { success: false; error: string };

// Strip any URL whose scheme is not http/https/tel/mailto — blocks javascript: stored-XSS.
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const { protocol } = new URL(trimmed);
    return ["http:", "https:", "tel:", "mailto:"].includes(protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

/**
 * The ONLY function that writes to content.json.
 * Validates, sanitizes, persists, and revalidates the public page.
 */
export async function saveContent(document: ContentDocument): Promise<SaveResult> {
  // Defense-in-depth auth check (proxy.ts already blocks unauthenticated requests)
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return { success: false, error: "לא מורשה" };
  }

  // Sanitize all inputs before schema validation
  const sanitized: ContentDocument = {
    ...document,
    story: sanitizeRichText(document.story),
    articles: document.articles.map((a) => ({ ...a, url: sanitizeUrl(a.url) })),
    social: {
      whatsapp: sanitizeUrl(document.social.whatsapp),
      instagram: sanitizeUrl(document.social.instagram),
      facebook: sanitizeUrl(document.social.facebook),
    },
    contact: {
      ...document.contact,
      link: sanitizeUrl(document.contact.link),
    },
  };

  // Validate entire document against shared Zod schema
  const parsed = contentSchema.safeParse(sanitized);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  // Persist and bust the ISR cache
  await writeContentBlob(parsed.data);
  revalidatePath("/");

  return { success: true };
}
