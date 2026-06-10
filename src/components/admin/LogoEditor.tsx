"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveContent, type SaveResult } from "@/app/admin/actions";
import { ImageUploadField } from "./ImageUploadField";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { ContentDocument } from "@/lib/content-schema";

type Status = "idle" | "uploading" | "saving" | "success" | "error";

export function LogoEditor({ content }: { content: ContentDocument }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(content.logo.imageUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(content.logo.title);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const isLoading = status === "uploading" || status === "saving";
  useUnsavedChangesWarning(isDirty);

  function handleFileReady(file: File, preview: string) {
    setPendingFile(file);
    setPreviewUrl(preview);
    setStatus("idle");
    setErrorMessage(null);
    setIsDirty(true);
  }

  function handleClear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setImageUrl("");
    setStatus("idle");
    setErrorMessage(null);
    setIsDirty(true);
  }

  async function handleSave() {
    setErrorMessage(null);

    let finalUrl = imageUrl;

    if (pendingFile) {
      setStatus("uploading");
      const formData = new FormData();
      formData.append("file", pendingFile);

      let uploadRes: Response;
      try {
        uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
      } catch {
        setErrorMessage("שגיאה בחיבור — בדוק את החיבור לאינטרנט ונסה שוב");
        setStatus("error");
        return;
      }

      if (!uploadRes.ok) {
        const json = await uploadRes.json().catch(() => ({}));
        setErrorMessage(
          (json as { error?: string }).error ?? "שגיאה בהעלאת התמונה",
        );
        setStatus("error");
        return;
      }

      const { url } = (await uploadRes.json()) as { url: string };
      finalUrl = url;
      setImageUrl(url);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(null);
      setPreviewUrl(null);
    }

    setStatus("saving");
    const result: SaveResult = await saveContent({
      ...content,
      logo: { imageUrl: finalUrl, title },
    });

    if (result.success) {
      setStatus("success");
      setIsDirty(false);
      router.refresh(); // Re-fetch server component so all editors get fresh content
    } else {
      setErrorMessage(result.error);
      setStatus("error");
    }
  }

  function buttonLabel() {
    if (status === "uploading") return "מעלה תמונה...";
    if (status === "saving") return "שומר...";
    return "שמור";
  }

  return (
    <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-6">
      <h2 className="mb-5 text-lg font-semibold">לוגו</h2>
      <div className="flex flex-col gap-5">
        <ImageUploadField
          label="תמונת לוגו"
          currentUrl={imageUrl}
          previewUrl={previewUrl}
          disabled={isLoading}
          onFileReady={handleFileReady}
          onClear={handleClear}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="logo-title" className="text-sm font-medium">
            כותרת (אופציונלי)
          </label>
          <input
            id="logo-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            disabled={isLoading}
            className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
          />
        </div>
        {errorMessage ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5">
            <p className="text-sm text-red-600">{errorMessage}</p>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              נסה שוב
            </button>
          </div>
        ) : null}
        {status === "success" ? (
          <p className="text-sm text-green-700">נשמר בהצלחה ✓</p>
        ) : null}
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="w-full rounded-lg bg-foreground px-4 py-3 text-base font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {buttonLabel()}
        </button>
      </div>
    </section>
  );
}
