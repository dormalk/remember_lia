"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveContent, type SaveResult } from "@/app/admin/actions";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { RichTextEditor } from "./RichTextEditor";
import { ArticlesEditor } from "./ArticlesEditor";
import { SocialLinksEditor } from "./SocialLinksEditor";
import { ContactEditor } from "./ContactEditor";
import type { ContentDocument } from "@/lib/content-schema";

type Status = "idle" | "saving" | "success" | "error";

export function ContentEditorForm({ content }: { content: ContentDocument }) {
  const router = useRouter();
  const [doc, setDoc] = useState<ContentDocument>(content);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const isSaving = status === "saving";
  useUnsavedChangesWarning(isDirty);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);

    const result: SaveResult = await saveContent({
      story: doc.story,
      articles: doc.articles,
      social: doc.social,
      contact: doc.contact,
    });

    if (result.success) {
      setStatus("success");
      setIsDirty(false);
      router.refresh();
    } else {
      setErrorMessage(result.error);
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-6">
        <h2 className="mb-5 text-lg font-semibold">סיפור</h2>
        <RichTextEditor
          story={doc.story}
          onChange={(html) => {
            setDoc((prev) => ({ ...prev, story: html }));
            setStatus("idle");
            setErrorMessage(null);
            setIsDirty(true);
          }}
          disabled={isSaving}
        />
      </section>

      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-6">
        <h2 className="mb-5 text-lg font-semibold">כתבות</h2>
        <ArticlesEditor
          articles={doc.articles}
          onChange={(articles) => {
            setDoc((prev) => ({ ...prev, articles }));
            setStatus("idle");
            setErrorMessage(null);
            setIsDirty(true);
          }}
          disabled={isSaving}
        />
      </section>

      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-6">
        <h2 className="mb-5 text-lg font-semibold">קישורים חברתיים</h2>
        <SocialLinksEditor
          social={doc.social}
          onChange={(social) => {
            setDoc((prev) => ({ ...prev, social }));
            setStatus("idle");
            setErrorMessage(null);
            setIsDirty(true);
          }}
          disabled={isSaving}
        />
      </section>

      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-6">
        <h2 className="mb-5 text-lg font-semibold">יצירת קשר</h2>
        <ContactEditor
          contact={doc.contact}
          onChange={(contact) => {
            setDoc((prev) => ({ ...prev, contact }));
            setStatus("idle");
            setErrorMessage(null);
            setIsDirty(true);
          }}
          disabled={isSaving}
        />
      </section>

      {errorMessage ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5">
          <p className="text-sm text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
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
        disabled={isSaving}
        className="w-full rounded-lg bg-foreground px-4 py-3 text-base font-medium text-background transition hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? "שומר..." : "שמור הכל"}
      </button>
    </div>
  );
}
