"use client";

import type { ShareSettings } from "@/lib/content-schema";

interface ShareEditorProps {
  share: ShareSettings;
  onChange: (share: ShareSettings) => void;
  disabled?: boolean;
}

export function ShareEditor({ share, onChange, disabled }: ShareEditorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="share-text" className="text-sm font-medium">
        טקסט לשיתוף
      </label>
      <textarea
        id="share-text"
        value={share.text}
        onChange={(e) => onChange({ ...share, text: e.target.value })}
        disabled={disabled}
        placeholder="טקסט שיופיע כברירת מחדל בעת שיתוף העמוד ברשתות החברתיות"
        rows={3}
        className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
      />
    </div>
  );
}
