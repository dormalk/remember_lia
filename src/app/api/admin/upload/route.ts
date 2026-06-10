import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function POST(request: NextRequest) {
  // Auth check — proxy.ts already blocks unauthenticated requests, this is defense-in-depth
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "סוג קובץ לא נתמך — יש להשתמש ב-JPEG, PNG, WebP, GIF, או AVIF" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "הקובץ גדול מדי — גודל מקסימלי 5 MB" },
      { status: 400 },
    );
  }

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true, // prevents filename collisions across uploads
  });

  return NextResponse.json({ url: blob.url });
}
