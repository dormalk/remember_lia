"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveContent, type SaveResult } from "@/app/admin/actions";
import { ImageUploadField } from "./ImageUploadField";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { ContentDocument, SliderImage } from "@/lib/content-schema";

type SliderEntry = SliderImage & {
  pendingFile: File | null;
  previewUrl: string | null;
};

type Status = "idle" | "saving" | "success" | "error";

function newEntry(): SliderEntry {
  return { imageUrl: "", caption: "", pendingFile: null, previewUrl: null };
}

export function SliderEditor({ content }: { content: ContentDocument }) {
  const router = useRouter();
  const [entries, setEntries] = useState<SliderEntry[]>(() =>
    content.slider.map((img) => ({
      ...img,
      pendingFile: null,
      previewUrl: null,
    })),
  );
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const isLoading = status === "saving";
  useUnsavedChangesWarning(isDirty);

  function updateEntry(index: number, patch: Partial<SliderEntry>) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    );
    setStatus("idle");
    setErrorMessage(null);
    setIsDirty(true);
  }

  function addEntry() {
    setEntries((prev) => [...prev, newEntry()]);
    setStatus("idle");
    setErrorMessage(null);
    setIsDirty(true);
  }

  function removeEntry(index: number) {
    const entry = entries[index];
    if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setStatus("idle");
    setErrorMessage(null);
    setIsDirty(true);
  }

  function moveEntry(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= entries.length) return;
    setEntries((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setStatus("idle");
    setErrorMessage(null);
    setIsDirty(true);
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);

    const resolvedSlider: SliderImage[] = [];

    for (const entry of entries) {
      let imageUrl = entry.imageUrl;

      if (entry.pendingFile) {
        const formData = new FormData();
        formData.append("file", entry.pendingFile);

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
            (json as { error?: string }).error ?? "שגיאה בהעלאת תמונה",
          );
          setStatus("error");
          return;
        }

        const { url } = (await uploadRes.json()) as { url: string };
        imageUrl = url;
        if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      }

      resolvedSlider.push({ imageUrl, caption: entry.caption });
    }

    // Update local state to reflect committed URLs
    setEntries(
      resolvedSlider.map((img) => ({
        ...img,
        pendingFile: null,
        previewUrl: null,
      })),
    );

    const result: SaveResult = await saveContent({
      ...content,
      // Drop any entry that never had an image assigned
      slider: resolvedSlider.filter((img) => img.imageUrl),
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

  return (
    <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-6">
      <h2 className="mb-5 text-lg font-semibold">גלריית תמונות</h2>
      <div className="flex flex-col gap-6">
        {entries.length === 0 ? (
          <p className="text-sm text-foreground/50">אין תמונות עדיין</p>
        ) : (
          entries.map((entry, index) => (
            <div
              key={index}
              className="rounded-xl border border-foreground/10 bg-background p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground/60">
                  תמונה {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveEntry(index, "up")}
                    disabled={index === 0 || isLoading}
                    aria-label="הזז למעלה"
                    className="rounded p-1 text-foreground/50 transition hover:text-foreground disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveEntry(index, "down")}
                    disabled={index === entries.length - 1 || isLoading}
                    aria-label="הזז למטה"
                    className="rounded p-1 text-foreground/50 transition hover:text-foreground disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    disabled={isLoading}
                    aria-label="מחק תמונה"
                    className="rounded p-1 text-red-500 transition hover:text-red-700 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <ImageUploadField
                label="תמונה"
                currentUrl={entry.imageUrl}
                previewUrl={entry.previewUrl}
                disabled={isLoading}
                onFileReady={(file, preview) =>
                  updateEntry(index, { pendingFile: file, previewUrl: preview })
                }
                onClear={() =>
                  updateEntry(index, {
                    imageUrl: "",
                    pendingFile: null,
                    previewUrl: null,
                  })
                }
              />
              <div className="mt-3 flex flex-col gap-1.5">
                <label
                  htmlFor={`caption-${index}`}
                  className="text-sm font-medium"
                >
                  כיתוב (אופציונלי)
                </label>
                <input
                  id={`caption-${index}`}
                  type="text"
                  value={entry.caption}
                  onChange={(e) => updateEntry(index, { caption: e.target.value })}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
                />
              </div>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={addEntry}
          disabled={isLoading}
          className="w-full rounded-lg border border-dashed border-foreground/30 px-4 py-3 text-sm text-foreground/60 transition hover:border-foreground/50 hover:text-foreground disabled:opacity-50"
        >
          + הוסף תמונה
        </button>

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
          {isLoading ? "שומר..." : "שמור"}
        </button>
      </div>
    </section>
  );
}
