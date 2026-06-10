"use client";

import type { ContactInfo } from "@/lib/content-schema";

interface ContactEditorProps {
  contact: ContactInfo;
  onChange: (contact: ContactInfo) => void;
  disabled?: boolean;
}

export function ContactEditor({ contact, onChange, disabled }: ContactEditorProps) {
  function update(key: keyof ContactInfo, value: string) {
    onChange({ ...contact, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-name" className="text-sm font-medium">
          שם איש קשר
        </label>
        <input
          id="contact-name"
          type="text"
          value={contact.name}
          onChange={(e) => update("name", e.target.value)}
          disabled={disabled}
          placeholder='למשל: "עמותת צדק לליה"'
          className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-phone" className="text-sm font-medium">
          טלפון
        </label>
        <input
          id="contact-phone"
          type="tel"
          value={contact.phone}
          onChange={(e) => update("phone", e.target.value)}
          disabled={disabled}
          placeholder="050-0000000"
          dir="ltr"
          className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-email" className="text-sm font-medium">
          {`דוא"ל`}
        </label>
        <input
          id="contact-email"
          type="email"
          value={contact.email}
          onChange={(e) => update("email", e.target.value)}
          disabled={disabled}
          placeholder="example@email.com"
          dir="ltr"
          className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-link" className="text-sm font-medium">
          קישור נוסף (אופציונלי)
        </label>
        <input
          id="contact-link"
          type="url"
          value={contact.link}
          onChange={(e) => update("link", e.target.value)}
          disabled={disabled}
          placeholder="https://..."
          dir="ltr"
          className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
        />
      </div>
    </div>
  );
}
