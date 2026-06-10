"use client";

import { useState } from "react";
import type { Article } from "@/lib/content-schema";

interface ArticlesEditorProps {
  articles: Article[];
  onChange: (articles: Article[]) => void;
  disabled?: boolean;
}

function newArticle(): Article {
  return { title: "", sourceName: "", url: "" };
}

export function ArticlesEditor({ articles, onChange, disabled }: ArticlesEditorProps) {
  const [entries, setEntries] = useState<Article[]>(articles);

  function update(next: Article[]) {
    setEntries(next);
    onChange(next);
  }

  function updateEntry(index: number, patch: Partial<Article>) {
    update(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function addEntry() {
    update([...entries, newArticle()]);
  }

  function removeEntry(index: number) {
    update(entries.filter((_, i) => i !== index));
  }

  function moveEntry(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= entries.length) return;
    const next = [...entries];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.length === 0 ? (
        <p className="text-sm text-foreground/50">אין כתבות עדיין</p>
      ) : (
        entries.map((entry, index) => (
          <div
            key={index}
            className="rounded-xl border border-foreground/10 bg-background p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground/60">כתבה {index + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveEntry(index, "up")}
                  disabled={index === 0 || disabled}
                  aria-label="הזז למעלה"
                  className="rounded p-1 text-foreground/50 transition hover:text-foreground disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveEntry(index, "down")}
                  disabled={index === entries.length - 1 || disabled}
                  aria-label="הזז למטה"
                  className="rounded p-1 text-foreground/50 transition hover:text-foreground disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  disabled={disabled}
                  aria-label="מחק כתבה"
                  className="rounded p-1 text-red-500 transition hover:text-red-700 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`article-title-${index}`} className="text-sm font-medium">
                  כותרת
                </label>
                <input
                  id={`article-title-${index}`}
                  type="text"
                  value={entry.title}
                  onChange={(e) => updateEntry(index, { title: e.target.value })}
                  disabled={disabled}
                  placeholder="כותרת הכתבה"
                  className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`article-source-${index}`} className="text-sm font-medium">
                  מקור
                </label>
                <input
                  id={`article-source-${index}`}
                  type="text"
                  value={entry.sourceName}
                  onChange={(e) => updateEntry(index, { sourceName: e.target.value })}
                  disabled={disabled}
                  placeholder='למשל: "ynet", "הארץ"'
                  className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`article-url-${index}`} className="text-sm font-medium">
                  קישור
                </label>
                <input
                  id={`article-url-${index}`}
                  type="url"
                  value={entry.url}
                  onChange={(e) => updateEntry(index, { url: e.target.value })}
                  disabled={disabled}
                  placeholder="https://..."
                  dir="ltr"
                  className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={addEntry}
        disabled={disabled}
        className="w-full rounded-lg border border-dashed border-foreground/30 px-4 py-3 text-sm text-foreground/60 transition hover:border-foreground/50 hover:text-foreground disabled:opacity-50"
      >
        + הוסף כתבה
      </button>
    </div>
  );
}
