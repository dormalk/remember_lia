import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 500_000; // enough to cover <head> on virtually any page

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X"
        ? parseInt(entity.slice(2), 16)
        : parseInt(entity.slice(1), 10);
      if (Number.isNaN(code)) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return ENTITY_MAP[entity] ?? match;
  });
}

/** Extracts every `<meta ...>` tag's attributes into a name/property → content map. */
function extractMetaTags(html: string): Map<string, string> {
  const result = new Map<string, string>();
  const metaTagRe = /<meta\b[^>]*>/gi;
  const attrRe = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

  for (const tagMatch of html.matchAll(metaTagRe)) {
    const tag = tagMatch[0];
    const attrs: Record<string, string> = {};
    for (const attrMatch of tag.matchAll(attrRe)) {
      const key = attrMatch[1].toLowerCase();
      attrs[key] = attrMatch[2] ?? attrMatch[3] ?? "";
    }
    const key = attrs.property ?? attrs.name;
    if (key && typeof attrs.content === "string") {
      result.set(key.toLowerCase(), attrs.content);
    }
  }

  return result;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  return decodeEntities(match[1]).trim().replace(/\s+/g, " ");
}

function isAllowedUrl(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
}

export async function POST(request: NextRequest) {
  // Auth check — proxy.ts already blocks unauthenticated requests, this is defense-in-depth
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const rawUrl = (body as { url?: unknown })?.url;
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return NextResponse.json({ error: "כתובת קישור חסרה" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return NextResponse.json({ error: "כתובת קישור לא תקינה" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: "כתובת קישור לא תקינה" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
        Accept: "text/html",
      },
    });
  } catch {
    return NextResponse.json({ error: "לא ניתן היה לטעון את הדף" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || !response.body) {
    return NextResponse.json({ error: "לא ניתן היה לטעון את הדף" }, { status: 502 });
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html")) {
    return NextResponse.json({ error: "הקישור אינו מצביע על דף אינטרנט" }, { status: 400 });
  }

  // Read only enough of the body to cover <head>, then bail out.
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  let bytesRead = 0;
  try {
    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const meta = extractMetaTags(html);
  const title = meta.get("og:title") || extractTitleTag(html) || "";
  const sourceName = meta.get("og:site_name") || url.hostname.replace(/^www\./, "");
  const imageUrl = meta.get("og:image") || meta.get("twitter:image") || "";

  let resolvedImageUrl = "";
  if (imageUrl) {
    try {
      resolvedImageUrl = new URL(imageUrl, url).toString();
    } catch {
      resolvedImageUrl = "";
    }
  }

  return NextResponse.json({
    title: decodeEntities(title),
    sourceName: decodeEntities(sourceName),
    imageUrl: resolvedImageUrl,
  });
}
