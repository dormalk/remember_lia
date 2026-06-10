"use client";

import type { SocialLinks } from "@/lib/content-schema";

interface SocialLinksEditorProps {
  social: SocialLinks;
  onChange: (social: SocialLinks) => void;
  disabled?: boolean;
}

const FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://chat.whatsapp.com/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/groups/..." },
];

export function SocialLinksEditor({ social, onChange, disabled }: SocialLinksEditorProps) {
  function update(key: keyof SocialLinks, value: string) {
    onChange({ ...social, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      {FIELDS.map(({ key, label, placeholder }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label htmlFor={`social-${key}`} className="text-sm font-medium">
            {label}
          </label>
          <input
            id={`social-${key}`}
            type="url"
            value={social[key]}
            onChange={(e) => update(key, e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            dir="ltr"
            className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
          />
        </div>
      ))}
    </div>
  );
}
